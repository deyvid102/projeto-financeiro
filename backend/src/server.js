import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import cors from "cors";
import cron from "node-cron";

// 1. Importações de Lógica e Models
import { processDailyRecurrences } from "./cron/ProcessRecurrence.js";
import ModelInvestment from "./models/ModelInvestment.js";

// 2. Importações das Rotas
import routeUser from "./routes/RouteUser.js";
import routeTransaction from "./routes/RouteTransaction.js";
import routeInvestment from "./routes/RouteInvestment.js";
import routeCategory from "./routes/RouteCategory.js"; 
import routeGoal from "./routes/RouteGoal.js";
import routeRecurrence from "./routes/RouteRecurrence.js";
import routeCard from "./routes/RouteCard.js";
import ShoppingCart from "./routes/RouteShoppingCart.js";
// NOVO: Importação das rotas de anúncios inteligentes
import routeShop from "./shop/ShopRoutes.js"; 

dotenv.config();

const app = express();

// O Render injeta a variável PORT automaticamente. 
const PORT = process.env.PORT || 5000;

// --- MIDDLEWARES ---
app.use(cors());
app.use(express.json());

// --- DEFINIÇÃO DAS ROTAS ---
app.use('/api/users', routeUser);
app.use('/api/transactions', routeTransaction);
app.use('/api/investments', routeInvestment);
app.use('/api/categories', routeCategory);
app.use('/api/goals', routeGoal);
app.use('/api/recurrences', routeRecurrence);
app.use('/api/cards', routeCard);
app.use('/api/cart', ShoppingCart);
// NOVO: Registro da rota do módulo shop
app.use('/api/shop', routeShop); 

app.get("/", (req, res) => {
  res.send("Servidor do financeMAX rodando corretamente no Render!");
});

// --- CONFIGURAÇÃO DOS CRON JOBS ---
const startCronJobs = () => {
  // RECORRÊNCIAS: Todo dia à meia-noite
  cron.schedule('0 0 * * *', async () => {
    console.log("[CRON] Iniciando processamento de recorrências diárias...");
    try {
      await processDailyRecurrences();
    } catch (err) {
      console.error("[CRON] Erro em recorrências:", err.message);
    }
  });

  // INVESTIMENTOS: A cada 30 minutos
  cron.schedule('*/30 * * * *', async () => {
    console.log("[CRON] Verificando ativos para atualização de mercado...");
    try {
      const activeInvestments = await ModelInvestment.find({ status: 'em andamento' });
      const tickers = [...new Set(activeInvestments
        .filter(inv => ['acoes', 'fiis', 'criptomoedas'].includes(inv.type?.toLowerCase()))
        .map(inv => inv.ticker)
      )].filter(Boolean);

      if (tickers.length > 0) {
        console.log(`[CRON] ${tickers.length} tickers identificados para sync.`);
      }
    } catch (err) {
      console.error("[CRON] Erro ao buscar investimentos no cron:", err.message);
    }
  });
};

// --- CONEXÃO COM O BANCO E INICIALIZAÇÃO ---
const startServer = async () => {
  try {
    const uri = process.env.MONGO_URI;
    
    if (!uri) {
      console.error("❌ Erro: Variável MONGO_URI não encontrada no Environment.");
      process.exit(1); 
    }

    await mongoose.connect(uri);
    console.log('✅ Conectado ao MongoDB com sucesso!');

    startCronJobs();

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`🚀 Servidor financeMAX rodando na porta: ${PORT}`);
    });

  } catch (error) {
    console.error('❌ Erro ao inicializar servidor:', error.message);
    process.exit(1);
  }
};

startServer();