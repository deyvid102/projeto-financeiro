import Groq from "groq-sdk";
import dotenv from "dotenv";
import Transaction from "../models/ModelTransaction.js";
import Goal from "../models/ModelGoal.js";
import ShoppingCart from "../models/ModelShoppingCart.js";
import ModelRecurrence from "../models/ModelRecurrence.js";
import Investment from "../models/ModelInvestment.js";

dotenv.config();

// Load GROQ API keys from env and prepare rotation
const apiKeys = [
  process.env.GROQ_API_KEY,
  process.env.GROQ_API_KEY2,
  process.env.GROQ_API_KEY3,
  process.env.GROQ_API_KEY4,
  process.env.GROQ_API_KEY5
].filter(Boolean);

let currentKeyIndex = 0;

const rotateKey = () => {
  if (!apiKeys.length) return null;
  currentKeyIndex = (currentKeyIndex + 1) % apiKeys.length;
  return apiKeys[currentKeyIndex];
};

const getCurrentKey = () => apiKeys[currentKeyIndex] || null;

const extractRetryAfter = (err) => {
  try {
    const hdrs = err?.headers || err?.response?.headers || null;
    if (!hdrs) return null;
    const raw = typeof hdrs.get === 'function' ? hdrs.get('retry-after') : (hdrs['retry-after'] || hdrs['Retry-After'] || hdrs['retry_after']);
    const n = raw ? parseInt(String(raw), 10) : null;
    return Number.isFinite(n) ? n : null;
  } catch (e) {
    return null;
  }
};

const REQUEST_INTERVAL_MS = 2 * 60 * 1000; // 2 minutes per user
const lastRequestByUser = new Map();

const checkAndSetUserThrottle = (userId) => {
  const now = Date.now();
  const last = lastRequestByUser.get(userId) || 0;
  const diff = now - last;
  if (diff < REQUEST_INTERVAL_MS) {
    return Math.ceil((REQUEST_INTERVAL_MS - diff) / 1000);
  }
  lastRequestByUser.set(userId, now);
  return 0;
};

const callModel = async (messages, options = {}) => {
  if (!apiKeys.length) throw new Error('No GROQ API keys configured');
  let lastErr = null;
  // try each key until success
  for (let attempt = 0; attempt < apiKeys.length; attempt++) {
    const key = getCurrentKey();
    const client = new Groq({ apiKey: key });
    try {
      console.log(`[GROQ] Trying key index ${currentKeyIndex}`);
      const completion = await client.chat.completions.create({ messages, ...options });
      return completion;
    } catch (err) {
      lastErr = err;
      const retryAfter = extractRetryAfter(err);
      console.warn(`[GROQ] Key index ${currentKeyIndex} failed:`, err?.message || err, 'retryAfter', retryAfter);
      // rotate to next key and try again on rate-limit
      if (err?.status === 429 || err?.error?.error?.code === 'rate_limit_exceeded') {
        rotateKey();
        continue;
      }
      // other errors: rethrow
      throw err;
    }
  }
  // if all keys failed, throw last error
  throw lastErr;
};

const gatherUserData = async (userId) => {
  console.log("\n=================== INICIANDO VARREDURA DA CONTA ===================");
  console.log("Buscando dados para o ID de Usuário:", userId);

  // Varredura em paralelo trazendo os dados do banco
  const [transactions, goals, wishlist, recurrences, investments] = await Promise.all([
    Transaction.find({ user: userId }).sort({ date: -1 }).lean(),
    Goal.find({ user: userId, status: 'ativo' }).lean(),
    ShoppingCart.find({ user: userId, itemStatus: 'pending' }).lean(),
    ModelRecurrence.find({ user: userId, isActive: true }).lean(),
    Investment.find({ user: userId, status: 'em andamento' }).lean()
  ]);

  const extratoCronologico = transactions.slice(0, 30).map(t => {
    const dataFormatada = new Date(t.date).toLocaleDateString('pt-BR');
    return `[${dataFormatada}] ${t.title} (${t.category}) - R$ ${(Number(t.amount) || 0).toFixed(2)} (${t.type})`;
  }).join("\n") || "Sem histórico recente.";

  console.log(`-> Transações encontradas: ${transactions.length}`);

  // 1. Cálculos Globais de Fluxo de Caixa
  const receitas = transactions
    .filter(t => t && t.type === 'entrada')
    .reduce((acc, t) => acc + (Number(t.amount) || 0), 0);

  const gastosTotal = transactions
    .filter(t => t && t.type === 'saida')
    .reduce((acc, t) => acc + (Number(t.amount) || 0), 0);

  const custosFixos = recurrences
    .reduce((acc, r) => acc + (Number(r.amount) || 0), 0);

  const totalInvestido = investments
    .reduce((acc, i) => acc + (Number(i.amountInvested) || 0), 0);

  const saldoLivre = receitas - gastosTotal;
  const taxaPoupanca = receitas > 0 ? ((saldoLivre / receitas) * 100).toFixed(1) + "%" : "0%";

  // 2. NOVA FEATURE: Detalhar gastos por categoria para responder perguntas específicas!
  const gastosPorCategoria = {};
  const entradasPorCategoria = {};

  transactions.forEach(t => {
    if (!t.category) return;
    const catNome = t.category.toLowerCase().trim();
    const valor = Number(t.amount) || 0;

    if (t.type === 'saida') {
      gastosPorCategoria[catNome] = (gastosPorCategoria[catNome] || 0) + valor;
    } else if (t.type === 'entrada') {
      entradasPorCategoria[catNome] = (entradasPorCategoria[catNome] || 0) + valor;
    }
  });

  // 3. Detalhar nomes dos itens da Wishlist e Investimentos para dar contexto de texto à IA
  const itensWishlist = wishlist.map(w => `${w.itemName || "Item"} (R$ ${(w.estimatedPrice || 0).toFixed(2)})`);
  const nomesInvestimentos = investments.map(i => `${i.name || "Ativo"} (R$ ${(i.amountInvested || 0).toFixed(2)})`);

  // 4. Mapeamento de Metas calculando progresso manualmente (Mongoose Virtuals bypass)
  const metasMapeadas = goals.map(g => {
    const target = Number(g.targetAmount) || 0;
    const current = Number(g.currentAmount) || 0;
    const progressoCalculado = target > 0 ? Math.min(Math.round((current / target) * 100), 100) : 0;
    
    return {
      nome: g.name || "Meta sem nome",
      progresso: progressoCalculado,
      restante: Math.max(target - current, 0).toFixed(2)
    };
  });

  const resumoGeral = {
    extratoCronologico,
    volumeTransacoes: transactions.length,
    balanco: {
      receitas: receitas.toFixed(2),
      gastosTotal: gastosTotal.toFixed(2),
      saldoLivre: saldoLivre.toFixed(2),
      custosFixos: custosFixos.toFixed(2),
      totalInvestido: totalInvestido.toFixed(2),
      taxaPoupanca
    },
    detalhes: {
      gastosPorCategoria,
      entradasPorCategoria,
      itensWishlist,
      nomesInvestimentos
    },
    metas: metasMapeadas,
    wishlistCount: wishlist.length
  };

  console.log("MÉTRICAS CATEGORIZADAS:", JSON.stringify(resumoGeral.detalhes.gastosPorCategoria, null, 2));
  console.log("===================================================================\n");

  return resumoGeral;
};

// GET /api/ai/report
export const getFinancialAiReport = async (req, res) => {
  try {
    const userId = req.user.id;

    // 1. Aplica o Throttle de 2 minutos por usuário
    const waitSeconds = checkAndSetUserThrottle(userId);
    if (waitSeconds > 0) {
      return res.status(429).json({ 
        error: `Limite de requisições excedido. Tente novamente em ${waitSeconds} segundos.` 
      });
    }

    const summary = await gatherUserData(userId);

    const messages = [
      { 
        role: 'system', 
        content: `Você é o Auditor Financeiro do FinanceMax. Analise os dados e retorne um relatório JSON estrito com esta estrutura:
        {
          "conselhoCurto": "texto curto e impactante",
          "eficienciaRetencao": número de 0 a 100,
          "alertas": ["string"],
          "pontosPositivos": ["string"],
          "pontosNegativos": ["string"],
          "maioresGastos": [{"categoria": "string", "valor": "string formatada"}],
          "estrategias": [{"acao": "string", "impacto": número}]
        }`
      },
      { 
        role: 'user', 
        content: `DADOS DO USUÁRIO:
        - Transações: ${summary.volumeTransacoes}
        - Receitas: R$ ${summary.balanco.receitas}
        - Gastos: R$ ${summary.balanco.gastosTotal}
        - Saldo Livre: R$ ${summary.balanco.saldoLivre}
        - Taxa Poupança: ${summary.taxaPoupanca}
        - Investimentos: R$ ${summary.balanco.totalInvestido}
        - Custos Fixos: R$ ${summary.balanco.custosFixos}
        - Gastos por Categoria: ${JSON.stringify(summary.detalhes.gastosPorCategoria)}
        - Metas: ${JSON.stringify(summary.metas)}`
      }
    ];

    try {
      // 2. Utiliza callModel que rotaciona chaves automaticamente
      const completion = await callModel(messages, { 
        model: 'llama-3.3-70b-versatile', 
        response_format: { type: 'json_object' }, 
        temperature: 0.15 
      });

      console.log('[AI REPORT] Completion raw response:', JSON.stringify(completion, null, 2));
      const aiText = completion.choices?.[0]?.message?.content || '{}';
      console.log('[AI REPORT] Raw message content:', aiText);
      const aiData = JSON.parse(aiText || '{}');
      return res.json({ insight: aiData });
    } catch (err) {
      console.error('[AI REPORT] Error calling model:', err);
      const retryAfter = extractRetryAfter(err);
      if (err?.status === 429 || err?.error?.error?.code === 'rate_limit_exceeded') {
        console.warn('[AI REPORT] Rate limit detected — returning local fallback. Retry-After:', retryAfter);
        const fallback = createFallbackReport(summary);
        return res.status(200).json({ insight: fallback, fallback: true, note: 'Service rate-limited, returned local fallback.', retryAfterSeconds: retryAfter });
      }
      throw err;
    }

  } catch (error) {
    console.error('Erro no Relatório IA:', error);
    res.status(500).json({ error: 'Erro interno ao gerar inteligência financeira.' });
  }
};

// POST /api/ai/ask
export const askFinancialAi = async (req, res) => {
  const dataAtual = new Date().toLocaleDateString('pt-BR');

  try {
    const userId = req.user.id;
    const { question } = req.body;

    // Throttle de 2 minutos
    const waitSeconds = checkAndSetUserThrottle(userId);
    if (waitSeconds > 0) {
      return res.status(429).json({ 
        error: `Por favor, aguarde ${waitSeconds} segundos para enviar outra pergunta.` 
      });
    }

    console.log(`[CHAT IA] Nova pergunta recebida: "${question}"`);

    if (!question || !question.trim()) {
      return res.status(400).json({ error: 'A pergunta financeira não pode estar vazia.' });
    }

    const summary = await gatherUserData(userId);

    const stringGastosCat = Object.entries(summary.detalhes.gastosPorCategoria || {})
      .map(([cat, val]) => `- ${cat}: R$ ${val.toFixed(2)}`)
      .join('\n') || 'Nenhum gasto categorizado.';

    const stringEntradasCat = Object.entries(summary.detalhes.entradasPorCategoria || {})
      .map(([cat, val]) => `- ${cat}: R$ ${val.toFixed(2)}`)
      .join('\n') || 'Nenhuma entrada categorizada.';

    const messages = [
      {
        role: 'system',
        content: `Você é o Mentor Financeiro Exclusivo do ecossistema FinanceMax. Responda de forma concisa e exata, formatando valores financeiros em Markdown.`
      },
      {
        role: 'user',
        content: `MÉTRICAS: Receitas R$ ${summary.balanco.receitas}, Gastos R$ ${summary.balanco.gastosTotal}, Saldo R$ ${summary.balanco.saldoLivre}\n\nPergunta: ${question}\n\nDespesas por categoria:\n${stringGastosCat}`
      }
    ];

    try {
      const completion = await callModel(messages, { 
        model: 'llama-3.3-70b-versatile', 
        temperature: 0.15 
      });
      console.log('[CHAT IA] Completion raw response:', JSON.stringify(completion, null, 2));
      const answer = completion.choices?.[0]?.message?.content || 'Não consegui processar a varredura da sua conta neste instante. Tente novamente.';
      console.log('[CHAT IA] Resposta processada:', answer);
      return res.json({ answer });
    } catch (err) {
      console.error('[CHAT IA] Error calling model:', err);
      const retryAfterChat = extractRetryAfter(err);
      if (err?.status === 429 || err?.error?.error?.code === 'rate_limit_exceeded') {
        console.warn('[CHAT IA] Rate limit detected — returning fallback answer. Retry-After:', retryAfterChat);
        const topCat = Object.entries(summary.detalhes.gastosPorCategoria || {}).sort((a,b) => b[1]-a[1])[0];
        const topCatText = topCat ? `${topCat[0]} (R$ ${Number(topCat[1]).toFixed(2)})` : 'nenhuma categoria relevante';
        const fallbackAnswer = `Fallback IA: com base nas últimas ${summary.volumeTransacoes} transações, seu saldo livre é R$ ${summary.balanco.saldoLivre}. Maior gasto: ${topCatText}. Recomendação inicial: reveja despesas em ${topCatText}.`;
        return res.status(200).json({ answer: fallbackAnswer, fallback: true, retryAfterSeconds: retryAfterChat });
      }
      throw err;
    }

  } catch (error) {
    console.error('Erro na consulta do Chat IA:', error);
    res.status(500).json({ error: 'O motor de inteligência artificial encontrou uma instabilidade temporária.' });
  }
};

const createFallbackReport = (summary) => {
  const bal = summary.balanco || {};
  const maiorCategoria = Object.entries(summary.detalhes.gastosPorCategoria || {}).sort((a,b) => b[1]-a[1])[0];
  const maiorGasto = maiorCategoria ? { categoria: maiorCategoria[0], valor: `R$ ${Number(maiorCategoria[1] || 0).toFixed(2)}` } : { categoria: 'Nenhuma', valor: 'R$ 0,00' };

  const saldoLivre = Number(bal.saldoLivre || 0);
  const receitas = Number(bal.receitas || 0) || 0;
  const eficienciaRetencao = receitas > 0 ? Math.round((saldoLivre / receitas) * 100) : 0;

  const conselhoCurto = receitas <= 0
    ? 'Receitas insuficientes para análise detalhada; priorize aumento de entradas e revisão de recorrências.'
    : `Saldo livre de R$ ${Number(saldoLivre).toFixed(2)} — considere revisar as categorias com maior gasto e reduzir despesas variantes.`;

  return {
    conselhoCurto,
    eficienciaRetencao,
    alertas: (saldoLivre < 0) ? ['Fluxo de caixa negativo: reveja saídas imediatas.'] : [],
    pontosPositivos: (Number(bal.totalInvestido || 0) > 0) ? ['Há alocação em investimentos, boa sinalização de reserva.'] : [],
    pontosNegativos: (saldoLivre < 0) ? ['Saldo livre negativo'] : [],
    maioresGastos: [maiorGasto],
    estrategias: [{ acao: 'Reavaliar assinaturas e custos fixos', impacto: 10 }],
    _fallback: true
  };
};

// POST /api/ai/strategy-audit
export const analyzeStrategyStructure = async (req, res) => {
  try {
    const userId = req.user.id;
    const { board } = req.body;

    if (!board || !Array.isArray(board)) {
      return res.status(400).json({ error: 'Board inválido. Envie um array de cards.' });
    }

    const simplified = board.map(card => ({
      id: card._id || card.id,
      title: card.title,
      position: card.position,
      childCount: (card.childCards || []).length,
      connections: (card.connectedTo || []).map(c => ({
        targetId: c.targetId?._id || c.targetId,
        type: c.type,
        amount: Number(c.amount) || 0
      }))
    }));

    const prompt = `Analise esta estrutura UML de estratégia composta por ${simplified.length} cards. Retorne um JSON com recomendações claras sobre organização, conflitos de tipo (vermelho/verde) e sugestões de agrupamento.`;

    try {
      const messages = [
        { 
          role: 'system', 
          content: `Você é um auditor de arquitetura UML especializado em modelagem financeira.
          RESPONDA EXCLUSIVAMENTE NO FORMATO JSON ABAIXO:
          {
            "summary": "string",
            "recommendations": [{"acao": "string", "impacto": número, "cardId": "string"}],
            "structuralChanges": [{"cardId": "string", "issue": "string", "suggestion": "string"}]
          }`
        },
        { role: 'user', content: `${prompt}\nEstrutura: ${JSON.stringify(simplified).slice(0,2000)}` }
      ];
      const completion = await callModel(messages, {
        model: 'llama-3.3-70b-versatile',
        response_format: { type: 'json_object' },
        temperature: 0.1
      });

      console.log('[AI AUDIT] Completion raw response:', JSON.stringify(completion, null, 2));
      const auditText = completion.choices?.[0]?.message?.content || '{}';
      console.log('[AI AUDIT] Raw message content:', auditText);
      const aiData = JSON.parse(auditText || '{}');
      console.log('[AI AUDIT] Parsed audit data:', JSON.stringify(aiData, null, 2));
      return res.json({ insight: aiData });
    } catch (err) {
      console.error('[AI AUDIT] Error calling model:', err);
      if (err?.status === 429 || err?.error?.error?.code === 'rate_limit_exceeded') {
        const retryAfterAudit = extractRetryAfter(err);
        console.warn('[AI AUDIT] Rate limit detected — returning structural fallback. Retry-After:', retryAfterAudit);

        // Simple local structural analysis fallback
        const degrees = {};
        simplified.forEach(c => { degrees[c.id] = (degrees[c.id] || 0) + (c.connections || []).length; });
        const maxCard = Object.entries(degrees).sort((a,b) => b[1]-a[1])[0];
        const recommendations = [];
        if (maxCard && maxCard[1] > 4) recommendations.push({ acao: 'Dividir card com muitas conexões', impacto: 20, cardId: maxCard[0] });
        // detect conflicting connection types per card
        const structuralChanges = [];
        simplified.forEach(c => {
          const types = Array.from(new Set((c.connections || []).map(x => x.type)));
          if (types.includes('red-line') && types.includes('green-line')) {
            structuralChanges.push({ cardId: c.id, issue: 'Conexões opostas (vermelha e verde)', suggestion: 'Rever modelo e usar agrupamento ou separar responsabilidades' });
          }
        });

        return res.status(200).json({
          summary: `Análise rápida local: ${simplified.length} cards, card mais conectado: ${maxCard ? maxCard[0] : 'nenhum'}`,
          recommendations,
          structuralChanges,
          _fallback: true,
          retryAfterSeconds: retryAfterAudit
        });
      }
      throw err;
    }

  } catch (error) {
    console.error('Erro na auditoria de estratégia IA:', error);
    res.status(500).json({ error: 'Erro interno ao auditar estrutura.' });
  }
};