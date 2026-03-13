import ModelUser from '../models/ModelUser.js';
import jwt from 'jsonwebtoken';

// Função auxiliar para gerar o Token JWT
const generateToken = (id) => {
  // O token expira em 30 dias. O JWT_SECRET precisa estar no seu arquivo .env
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// @desc    Registrar um novo usuário
// @route   POST /api/users/register
export const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Verifica se o usuário já existe no banco
    const userExists = await ModelUser.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'Usuário já cadastrado com este email.' });
    }

    // Cria o usuário (a senha será criptografada automaticamente pelo ModelUser)
    const user = await ModelUser.create({
      name,
      email,
      password,
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        token: generateToken(user._id),
      });
    } else {
      res.status(400).json({ message: 'Dados de usuário inválidos.' });
    }
  } catch (error) {
    res.status(500).json({ message: `Erro no servidor: ${error.message}` });
  }
};

// @desc    Autenticar usuário e pegar token (Login)
// @route   POST /api/users/login
export const authUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Busca o usuário pelo email
    const user = await ModelUser.findOne({ email });

    // Verifica se o usuário existe e se a senha bate (usando o método do ModelUser)
    if (user && (await user.matchPassword(password))) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: 'Email ou senha inválidos.' });
    }
  } catch (error) {
    res.status(500).json({ message: `Erro no servidor: ${error.message}` });
  }
};