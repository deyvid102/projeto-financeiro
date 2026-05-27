import ModelUser from '../models/ModelUser.js';
import jwt from 'jsonwebtoken';
import { sendVerificationEmail } from '../services/EmailService.js';

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

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Preencha todos os campos.' });
    }

    const userExists = await ModelUser.findOne({ email });
    if (userExists) {
      // Se o usuário existe mas não está verificado, gera um novo código e reenvia o e-mail
      if (!userExists.isVerified) {
        const newCode = Math.floor(100000 + Math.random() * 900000).toString();
        userExists.verificationCode = newCode;
        userExists.verificationCodeExpires = Date.now() + 10 * 60 * 1000;
        await userExists.save();
        await sendVerificationEmail(email, newCode);
        return res.status(200).json({ message: 'Código de verificação reenviado ao e-mail.' });
      }
      return res.status(400).json({ message: 'Usuário já cadastrado com este email.' });
    }

    // Gera código de 6 dígitos
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const verificationCodeExpires = Date.now() + 10 * 60 * 1000; // 10 minutos

    const user = await ModelUser.create({
      name,
      email,
      password,
      verificationCode,
      verificationCodeExpires,
    });

    if (user) {
      await sendVerificationEmail(email, verificationCode);
      res.status(201).json({ message: 'Código enviado ao e-mail.' });
    } else {
      res.status(400).json({ message: 'Dados de usuário inválidos.' });
    }
  } catch (error) {
    res.status(500).json({ message: `Erro no servidor: ${error.message}` });
  }
};

// @desc    Verificar e-mail e ativar conta
// @route   POST /api/users/verify-email
export const verifyEmail = async (req, res) => {
  try {
    const { email, code } = req.body;
    const user = await ModelUser.findOne({ 
      email, 
      verificationCode: code,
      verificationCodeExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Código inválido ou expirado.' });
    }

    user.isVerified = true;
    user.verificationCode = undefined;
    user.verificationCodeExpires = undefined;
    await user.save();

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({ message: `Erro: ${error.message}` });
  }
};

// @desc    Autenticar usuário e pegar token (Login)
// @route   POST /api/users/login
export const authUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await ModelUser.findOne({ email });

    if (user && (await user.matchPassword(password))) {
      if (!user.isVerified) {
        return res.status(401).json({ message: 'E-mail não verificado.' });
      }
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