import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import cors from "cors";
import cron from "node-cron";

// Importação da Lógica do Cron
import { processDailyRecurrences } from "./cron/ProcessRecurrence.js";

// Importação das Rotas
import routeUser from "./routes/RouteUser.js";
import routeTransaction from "./routes/RouteTransaction.js";
import routeInvestment from "./routes/RouteInvestment.js";
import routeCategory from "./routes/RouteCategory.js"; 
import routeGoal from "./routes/RouteGoal.js";
import routeRecurrence from "./routes/RouteRecurrence.js";

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
    
    // Inicia o agendador de tarefas APÓS conectar ao banco
    startCronJobs();
    
  } catch (error) {
    console.error('❌ erro ao conectar com mongoDB:', error.message);
  }
};

// Configuração dos Agendamentos (Cron)
const startCronJobs = () => {
  // Roda todos os dias à meia-noite (00:00)
  // Padrão: 'minuto hora dia-do-mes mes dia-da-semana'
  cron.schedule('0 0 * * *', async () => {
    console.log("[CRON] Iniciando processamento de recorrências diárias...");
    await processDailyRecurrences();
  });

  // OPCIONAL: Se quiser testar agora, você pode descomentar a linha abaixo 
  // para rodar 10 segundos após o servidor iniciar:
  // setTimeout(() => processDailyRecurrences(), 10000);
};

connectDB();

// Definição dos Endpoints (Rotas)
app.use('/api/users', routeUser);
app.use('/api/transactions', routeTransaction);
app.use('/api/investments', routeInvestment);
app.use('/api/categories', routeCategory);
app.use('/api/goals', routeGoal);
app.use('/api/recurrences', routeRecurrence);

// Rota de teste
app.get("/", (req, res) => {
  res.send("Servidor do financeMAX (Sistema Financeiro) rodando corretamente!");
});

app.listen(PORT, () => {
  console.log(`🚀 servidor rodando em: http://localhost:${PORT}`);
});