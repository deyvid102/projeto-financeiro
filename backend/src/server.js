import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import cors from "cors";
import cron from "node-cron";

// Importação da Lógica do Cron
import { processDailyRecurrences } from "./cron/ProcessRecurrence.js";
// IMPORTANTE: Importe a função de sincronização que criamos no controller ou service
import MarketPrice from "./models/ModelMarketPrice.js";
import ModelInvestment from "./models/ModelInvestment.js";
// Se você moveu a lógica de sync para um service, importe de lá. 
// Caso contrário, você pode exportar a função syncMarketPrices do seu controller.

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json());

// Conexão com o banco
const connectDB = async () => {
  try {
    const uri = process.env.MONGO_URI;
    if (!uri) {
      console.error("❌ erro: MONGO_URI não encontrada no arquivo .env");
      return;
    }
    await mongoose.connect(uri);
    console.log('✅ conectado ao mongoDB com sucesso!');
    
    // Inicia os agendadores de tarefas APÓS conectar ao banco
    startCronJobs();
    
  } catch (error) {
    console.error('❌ erro ao conectar com mongoDB:', error.message);
  }
};

// Configuração dos Agendamentos (Cron)
const startCronJobs = () => {
  // 1. RECORRÊNCIAS: Roda todos os dias à meia-noite (00:00)
  cron.schedule('0 0 * * *', async () => {
    console.log("[CRON] Iniciando processamento de recorrências diárias...");
    await processDailyRecurrences();
  });

  // 2. INVESTIMENTOS: Atualiza preços de mercado a cada 30 minutos
  // Isso garante que o cache da tabela MarketPrice nunca fique muito defasado
  cron.schedule('*/30 * * * *', async () => {
    console.log("[CRON] Atualizando cotações de mercado (Ações/Criptos)...");
    try {
      // Busca todos os tickers ativos no sistema para atualizar de uma vez
      const activeInvestments = await ModelInvestment.find({ status: 'em andamento' });
      const tickers = [...new Set(activeInvestments
        .filter(inv => ['acoes', 'fiis', 'criptomoedas'].includes(inv.type?.toLowerCase()))
        .map(inv => inv.ticker)
      )].filter(Boolean);

      if (tickers.length > 0) {
        // Aqui chamamos a lógica de sincronização. 
        // Se ela estiver no controller, você precisará importá-la.
        // syncMarketPrices(tickers, activeInvestments);
        console.log(`[CRON] ${tickers.length} tickers enviados para atualização.`);
      }
    } catch (err) {
      console.error("[CRON] Erro ao atualizar mercado:", err.message);
    }
  });
};

connectDB();

// Definição dos Endpoints (Rotas)
import routeUser from "./routes/RouteUser.js";
import routeTransaction from "./routes/RouteTransaction.js";
import routeInvestment from "./routes/RouteInvestment.js";
import routeCategory from "./routes/RouteCategory.js"; 
import routeGoal from "./routes/RouteGoal.js";
import routeRecurrence from "./routes/RouteRecurrence.js";

app.use('/api/users', routeUser);
app.use('/api/transactions', routeTransaction);
app.use('/api/investments', routeInvestment);
app.use('/api/categories', routeCategory);
app.use('/api/goals', routeGoal);
app.use('/api/recurrences', routeRecurrence);

// Rota de teste
app.get("/", (req, res) => {
  res.send("Servidor do financeMAX rodando corretamente!");
});

app.listen(PORT, () => {
  console.log(`🚀 servidor rodando em: http://localhost:${PORT}`);
});