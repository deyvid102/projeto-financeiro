import Groq from "groq-sdk";
import dotenv from "dotenv";
import Transaction from "../models/ModelTransaction.js";
import Goal from "../models/ModelGoal.js";
import ShoppingCart from "../models/ModelShoppingCart.js";
import ModelRecurrence from "../models/ModelRecurrence.js";
import Investment from "../models/ModelInvestment.js";

dotenv.config();

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

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
    const summary = await gatherUserData(userId);

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `Você é o Auditor Financeiro Avançado integrado ao sistema FinanceMax.
          Sua missão é gerar uma análise criteriosa e estrita obrigatoriamente no formato JSON fornecido.
          
          DIRETRIZ DE EQUILÍBRIO DO CONSELHO (50% Retrospectiva / 50% Plano de Ação):
          O campo "conselhoCurto" deve resumir com precisão técnica in até 5 linhas:
          - Linhas 1 e 2: Diagnóstico claro sobre a relação entre as Receitas Consolidadas e os Gastos Totais baseando-se no volume de transações.
          - Linha 3: O ponto de virada ou maior vulnerabilidade identificada.
          - Linhas 4 e 5: Uma recomendação prática imediata de otimização.

          Formato de retorno JSON obrigatório:
          {
            "conselhoCurto": "Texto analítico contendo o balanço entre histórico recente e plano de ação futuro.",
            "eficienciaRetencao": 70,
            "alertas": ["Alerta analítico curto de risco/gargalo"],
            "pontosPositivos": ["Elogio técnico baseado na capacidade de retenção ou investimentos"],
            "pontosNegativos": ["Vulnerabilidade identificada no fluxo de caixa"],
            "maioresGastos": [
               { "categoria": "Nome da Categoria que mais gastou", "valor": "R$ 0,00" }
            ],
            "estrategias": [{ "acao": "Estratégia objetiva de correção", "impacto": 15 }]
          }`
        },
        {
          role: "user",
          content: `CONTEXTO EM TEMPO REAL DA CONTA DO USUÁRIO:
          - Volume Histórico: ${summary.volumeTransacoes} transações registradas.
          - Receitas Consolidadas: R$ ${summary.balanco.receitas}
          - Gastos Totais: R$ ${summary.balanco.gastosTotal}
          - Saldo Líquido Livre: R$ ${summary.balanco.saldoLivre}
          - Custos Fixos Mensais (Recorrências): R$ ${summary.balanco.custosFixos}
          - Alocação em Investimentos: R$ ${summary.balanco.totalInvestido}
          - Taxa de Poupança: ${summary.balanco.taxaPoupanca}
          - Caixinhas/Metas Ativas: ${summary.metas.map(m => `${m.nome} (${m.progresso}% concluído)`).join(", ") || "Nenhuma."}
          - Itens Pendentes na Wishlist: ${summary.wishlistCount} desejos.`
        }
      ],
      model: "llama-3.3-70b-versatile",
      response_format: { type: "json_object" },
      temperature: 0.15,
    });

    const aiData = JSON.parse(completion.choices[0]?.message?.content || "{}");
    res.json({ insight: aiData });

  } catch (error) {
    console.error("Erro no Relatório IA:", error);
    res.status(500).json({ error: "Erro interno ao gerar inteligência financeira." });
  }
};

// POST /api/ai/ask
export const askFinancialAi = async (req, res) => {
  const dataAtual = new Date().toLocaleDateString('pt-BR');
  
  try {
    const userId = req.user.id;
    const { question } = req.body;

    console.log(`[CHAT IA] Nova pergunta recebida: "${question}"`);

    if (!question || !question.trim()) {
      return res.status(400).json({ error: "A pergunta financeira não pode estar vazia." });
    }

    const summary = await gatherUserData(userId);

    // Converte os mapas de categorias em strings fáceis da IA ler no prompt
    const stringGastosCat = Object.entries(summary.detalhes.gastosPorCategoria)
      .map(([cat, val]) => `- ${cat}: R$ ${val.toFixed(2)}`)
      .join("\n") || "Nenhum gasto categorizado.";

    const stringEntradasCat = Object.entries(summary.detalhes.entradasPorCategoria)
      .map(([cat, val]) => `- ${cat}: R$ ${val.toFixed(2)}`)
      .join("\n") || "Nenhuma entrada categorizada.";

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `Você é o Mentor Financeiro Exclusivo do ecossistema FinanceMax.
          O usuário está conversando diretamente com você dentro do painel dele. 
          Use os dados detalhados e globais injetados no prompt para responder de forma ultra-personalizada e exata.
          
          DIRETRIZES FUNDAMENTAIS DE COMPORTAMENTO:
          - A data de hoje é: ${dataAtual}. Use esta data como referência absoluta para responder perguntas temporais (ex: "hoje", "ontem", "este mês", "mês passado", ou meses específicos como "janeiro").
          - O usuário pode perguntar sobre gastos específicos em categorias, produtos da lista de desejos ou investimentos. Use o mapeamento detalhado e o extrato cronológico fornecido abaixo para dar respostas com os valores e períodos exatos.
          - Se o usuário perguntar por uma categoria que não está listada nas despesas abaixo, responda amigavelmente informando que não encontrou nenhum registro recente associado àquele nome específico.
          - Nunca diga que os dados da conta "não foram informados" ou que não possui acesso ao banco de dados.
          - Formate os números financeiros usando Markdown (ex: **R$ 150,00**).
          - Resposta concisa e direta (máximo de 3 parágrafos).`
        },
        {
          role: "user",
          content: `MÉTRICAS DETALHADAS DO BANCO DE DADOS DO USUÁRIO:
          
          [CALENDÁRIO DO SISTEMA]
          * Data de Referência Atual: ${dataAtual}

          [EXTRATO CRONOLÓGICO RECENTE (ÚLTIMAS 30 MOVIMENTAÇÕES)]
          ${summary.extratoCronologico}

          [RESUMO GLOBAL]
          * Total de Movimentações: ${summary.volumeTransacoes}
          * Receitas Totais: R$ ${summary.balanco.receitas}
          * Gastos Totais Gerais: R$ ${summary.balanco.gastosTotal}
          * Saldo de Caixa Livre: R$ ${summary.balanco.saldoLivre}
          * Total Alocado em Investimentos: R$ ${summary.balanco.totalInvestido}
          * Capacidade de Poupança: ${summary.balanco.taxaPoupanca}

          [DETALHAMENTO DE DESPESAS POR CATEGORIA]
          ${stringGastosCat}

          [DETALHAMENTO DE ENTRADAS POR CATEGORIA]
          ${stringEntradasCat}

          [OUTROS COMPONENTES DO ECOSSISTEMA]
          * Caixinhas/Metas: ${summary.metas.map(m => `${m.nome} (${m.progresso}%, falta R$ ${m.restante})`).join(", ") || "Sem caixinhas ativas."}
          * Itens na Wishlist: ${summary.detalhes.itensWishlist.join(", ") || "Nenhum item pendente."}
          * Portfólio de Ativos: ${summary.detalhes.nomesInvestimentos.join(", ") || "Nenhum investimento ativo registrado."}

          PERGUNTA FORMULADA PELO USUÁRIO: "${question}"`
        }
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.15,
    });

    const answer = completion.choices[0]?.message?.content || "Não consegui processar a varredura da sua conta neste instante. Tente novamente.";
    
    console.log("[CHAT IA] Resposta rica enviada com sucesso para o Modal.");
    res.json({ answer });

  } catch (error) {
    console.error("Erro na consulta do Chat IA:", error);
    res.status(500).json({ error: "O motor de inteligência artificial encontrou uma instabilidade temporária." });
  }
};