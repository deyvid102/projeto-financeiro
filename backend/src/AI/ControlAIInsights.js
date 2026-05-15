import Groq from "groq-sdk";
import dotenv from "dotenv";
import Transaction from "../models/ModelTransaction.js";
import Goal from "../models/ModelGoal.js";
import ShoppingCart from "../models/ModelShoppingCart.js";
import ModelRecurrence from "../models/ModelRecurrence.js";
import Investment from "../models/ModelInvestment.js";

dotenv.config();

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export const getFinancialAiReport = async (req, res) => {
  try {
    const userId = req.user.id;

    // Busca de dados baseada nos seus Schemas de Metas, Transações e Recorrências
    const [transactions, goals, wishlist, recurrences, investments] = await Promise.all([
      Transaction.find({ user: userId }).sort({ date: -1 }).limit(100),
      Goal.find({ user: userId, status: 'ativo' }), //
      ShoppingCart.find({ user: userId, itemStatus: 'pending' }), //
      ModelRecurrence.find({ user: userId, isActive: true }), //
      Investment.find({ user: userId, status: 'em andamento' }) //
    ]);

    // --- KPIs para o Prompt ---
    const receitas = transactions.filter(t => t.type === 'entrada').reduce((acc, t) => acc + t.amount, 0); //
    const gastosTotal = transactions.filter(t => t.type === 'saida').reduce((acc, t) => acc + t.amount, 0); //
    const custosFixos = recurrences.filter(r => r.type === 'saida').reduce((acc, r) => acc + r.amount, 0); //
    const saldoLivre = receitas - gastosTotal;
    
    const summary = {
      balanco: {
        receitas,
        gastosTotal,
        saldoLivre,
        taxaPoupanca: receitas > 0 ? ((saldoLivre / receitas) * 100).toFixed(1) + "%" : "0%"
      },
      // Usa o virtual 'progress' do ModelGoal para a IA
      metas: goals.map(g => ({ nome: g.name, progresso: g.progress })), 
      wishlistCount: wishlist.length
    };

    const completion = await groq.chat.completions.create({
  messages: [
    {
      role: "system",
      content: `Você é um Auditor Financeiro de Elite. Analise os dados fornecidos e gere um JSON estrito.
      
      DIRETRIZ DE EQUILÍBRIO (50% Retrospectiva / 50% Plano de Ação):
      O campo "conselhoCurto" deve ter no máximo 5 linhas e seguir rigorosamente esta estrutura:
      - Linhas 1 e 2 (O que passou): Um diagnóstico real sobre o volume de movimentações recentes e o comportamento do fluxo de caixa atual. Se houver poucas transações, pontue que o histórico ainda está em estágio embrionário.
      - Linha 3 (Ponto de virada): A transição lógica de causa e efeito.
      - Linhas 4 e 5 (Como melhorar): Ação direta, prática e técnica sobre qual deve ser o primeiro ou o próximo passo estrutural no ecossistema (ex: provisionamento de metas ou blindagem de custos fixos).

      Estrutura exata do JSON esperado:
      {
        "conselhoCurto": "Texto de até 5 linhas dividindo perfeitamente o comportamento passado e a estratégia de melhoria.",
        "eficienciaRetencao": 65,
        "alertas": ["Alerta analítico curto"],
        "estrategias": [{ "acao": "Ação de otimização", "impacto": 10 }]
      }`
    },
    {
      role: "user",
      content: `DADOS ANALÍTICOS:
      Volume de Transações: ${transactions.length} registros encontrados.
      Receitas Consolidadas: R$ ${summary.balanco.receitas}
      Gastos Totais: R$ ${summary.balanco.gastosTotal}
      Saldo Livre Disponível: R$ ${summary.balanco.saldoLivre}
      Taxa de Poupança Atual: ${summary.balanco.taxaPoupanca}
      Metas Mapeadas: ${summary.metas.map(m => `${m.nome}(${m.progresso})`).join(", ")}`
    }
  ],
  model: "llama-3.3-70b-versatile",
  response_format: { type: "json_object" },
  temperature: 0.1, // Mantém a IA focada na estrutura sem inventar variações
});

  // Convertemos a string JSON da IA em objeto antes de mandar para o front
  const aiData = JSON.parse(completion.choices[0]?.message?.content || "{}");

  res.json({ 
    insight: aiData, // Agora repassa um objeto estruturado
    dataProcessed: new Date() 
  });

  } catch (error) {
    res.status(500).json({ insight: "Falha técnica no processamento de dados." });
  }
};