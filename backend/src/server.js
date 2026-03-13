import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import cors from "cors";

// Importação das Rotas
import routeUser from "./routes/RouteUser.js";
import routeTransaction from "./routes/RouteTransaction.js";
import routeInvestment from "./routes/RouteInvestment.js";
import routeCategory from "./routes/RouteCategory.js"; 

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
  } catch (error) {
    console.error('❌ erro ao conectar com mongoDB:', error.message);
  }
};

connectDB();

// Definição dos Endpoints (Rotas)
app.use('/api/users', routeUser);
app.use('/api/transactions', routeTransaction);
app.use('/api/investments', routeInvestment);
app.use('/api/categories', routeCategory); // <-- Novo Endpoint registrado

// Rota de teste
app.get("/", (req, res) => {
  res.send("Servidor do Sistema Financeiro Pessoal rodando corretamente!");
});

app.listen(PORT, () => {
  console.log(`🚀 servidor rodando em: http://localhost:${PORT}`);
});