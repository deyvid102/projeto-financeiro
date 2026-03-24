import ModelUser from '../models/ModelUser.js';
import jwt from 'jsonwebtoken';

// Função auxiliar para gerar o Token JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// @desc    Registrar um novo usuário
// @route   POST /api/users/register
export const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const userExists = await ModelUser.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'Usuário já cadastrado com este email.' });
    }

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

    const user = await ModelUser.findOne({ email });

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

// @desc    Atualizar perfil do usuário
// @route   PUT /api/users/profile
// @access  Privado
export const updateUserProfile = async (req, res) => {
  try {
    // O req.user._id deve ser preenchido pelo seu middleware de autenticação (protect)
    const user = await ModelUser.findById(req.user._id);

    if (user) {
      // Atualiza o nome se enviado
      user.name = req.body.name || user.name;
      
      // Se houver tentativa de mudar a senha
      if (req.body.newPassword) {
        // 1. Verifica se a senha atual foi enviada para validar
        if (!req.body.currentPassword) {
          return res.status(400).json({ message: 'Informe a senha atual para confirmar a mudança.' });
        }

        // 2. Compara a senha atual usando o método do seu model
        const isMatch = await user.matchPassword(req.body.currentPassword);
        if (!isMatch) {
          return res.status(401).json({ message: 'Senha atual incorreta.' });
        }

        // 3. Define a nova senha (o middleware pre('save') do model fará o hash)
        user.password = req.body.newPassword;
      }

      const updatedUser = await user.save();

      res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        // Retornamos um novo token caso queira renovar a sessão
        token: generateToken(updatedUser._id), 
        message: 'Perfil atualizado com sucesso!'
      });
    } else {
      res.status(404).json({ message: 'Usuário não encontrado.' });
    }
  } catch (error) {
    res.status(500).json({ message: `Erro ao atualizar perfil: ${error.message}` });
  }
};