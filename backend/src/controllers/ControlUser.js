import ModelUser from '../models/ModelUser.js';
import jwt from 'jsonwebtoken';
import { sendVerificationEmail, sendResetPasswordEmail } from '../services/EmailService.js';
import { OAuth2Client } from 'google-auth-library';

const TEST_EMAILS = [
  'starter@financemax.com',
  'pro@financemax.com',
  'max@financemax.com',
];
const VERIFY_INTERVAL_MS = 30 * 24 * 60 * 60 * 1000; // 30 dias

// Initialize Google OAuth2Client
const googleClientId = process.env.GOOGLE_CLIENT_ID;
let client;

if (googleClientId) {
  client = new OAuth2Client(googleClientId);
}

// Função auxiliar para gerar o Token JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

const isTestEmail = (email) => {
  return TEST_EMAILS.includes(email?.toLowerCase());
};

const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const sendVerificationCode = async (user) => {
  const newCode = generateVerificationCode();
  user.verificationCode = newCode;
  user.verificationCodeExpires = Date.now() + 10 * 60 * 1000;
  user.lastVerificationSentAt = Date.now();
  user.isVerified = false;
  await user.save();
  await sendVerificationEmail(user.email, newCode);
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
        const newCode = generateVerificationCode();
        userExists.verificationCode = newCode;
        userExists.verificationCodeExpires = Date.now() + 10 * 60 * 1000;
        userExists.lastVerificationSentAt = Date.now();
        await userExists.save();
        await sendVerificationEmail(email, newCode);
        return res.status(200).json({ message: 'Código de verificação reenviado ao e-mail.' });
      }
      return res.status(400).json({ message: 'Usuário já cadastrado com este email.' });
    }

    // Gera código de 6 dígitos
    const verificationCode = generateVerificationCode();
    const verificationCodeExpires = Date.now() + 10 * 60 * 1000; // 10 minutos

    const user = await ModelUser.create({
      name,
      email,
      password,
      verificationCode,
      verificationCodeExpires,
      lastVerificationSentAt: Date.now(),
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
    user.verificationConfirmedAt = Date.now();
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
      if (isTestEmail(email)) {
        return res.json({
          _id: user._id,
          name: user.name,
          email: user.email,
          token: generateToken(user._id),
        });
      }

      if (!user.isVerified) {
        await sendVerificationCode(user);
        // Usamos 403 para evitar loops de interceptores que tentam renovar token em 401
        return res.status(403).json({
          message: 'E-mail não verificado. Enviamos um código ao seu e-mail para confirmação.',
        });
      }

      const verificationAge = user.verificationConfirmedAt
        ? Date.now() - new Date(user.verificationConfirmedAt).getTime()
        : VERIFY_INTERVAL_MS + 1;

      if (verificationAge >= VERIFY_INTERVAL_MS) {
        await sendVerificationCode(user);
        return res.status(403).json({
          message: 'Sua verificação expirou. Enviamos um novo código ao seu e-mail.',
        });
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

// @desc    Autenticar usuário com Google
// @route   POST /api/users/google-login
export const googleAuthUser = async (req, res) => {
  try {
    const { idToken } = req.body;

    if (!client) {
      return res.status(500).json({ message: 'Configuração do Google Login ausente no servidor.' });
    }

    if (!idToken) {
      return res.status(400).json({ message: 'Token de autenticação Google não fornecido.' });
    }

    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();

    const { email, name } = payload; // Google também fornece 'picture' para avatar

    let user = await ModelUser.findOne({ email });

    if (user) {
      // Usuário existe, atualiza o nome se necessário e garante que está verificado
      if (user.name !== name) {
        user.name = name;
      }
      if (!user.isVerified) {
        user.isVerified = true;
        user.verificationConfirmedAt = Date.now();
        user.verificationCode = undefined;
        user.verificationCodeExpires = undefined;
      }
      await user.save();
    } else {
      // Usuário não existe, cria um novo
      // Para login com Google, podemos gerar uma senha fictícia ou marcar como login social
      const randomPassword = Math.random().toString(36).slice(-8); // Gera uma string aleatória de 8 caracteres
      user = await ModelUser.create({
        name,
        email,
        password: randomPassword, // Será hashed pelo hook pre-save
        isVerified: true,
        verificationConfirmedAt: Date.now(),
        // Não é necessário verificationCode ou expires para login social
      });
    }

    if (user) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        token: generateToken(user._id),
      });
    } else {
      res.status(400).json({ message: 'Não foi possível autenticar com Google.' });
    }
  } catch (error) {
    console.error('Erro na autenticação Google:', error);
    res.status(500).json({ message: `Erro na autenticação Google: ${error.message}` });
  }
};

// @desc    Solicitar reset de senha
// @route   POST /api/users/forgot-password
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await ModelUser.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'Este e-mail não está cadastrado em nosso sistema.' });
    }

    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    user.resetPasswordCode = resetCode;
    user.resetPasswordExpires = Date.now() + 10 * 60 * 1000;
    await user.save();

    await sendResetPasswordEmail(email, resetCode);
    res.json({ message: 'Código de recuperação enviado ao e-mail.' });
  } catch (error) {
    console.error('DETALHE DO ERRO NO FORGOT-PASSWORD:', error);
    res.status(500).json({ message: error.message || `Erro no servidor: ${error.message}` });
  }
};

// @desc    Validar código de reset antes de mudar senha
// @route   POST /api/users/validate-reset-code
export const validateResetCode = async (req, res) => {
  try {
    const { email, code } = req.body;
    const user = await ModelUser.findOne({
      email,
      resetPasswordCode: code,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Código inválido ou expirado.' });
    }

    res.status(200).json({ message: 'Código válido.' });
  } catch (error) {
    res.status(500).json({ message: `Erro ao validar código: ${error.message}` });
  }
};

// @desc    Resetar senha usando código
// @route   POST /api/users/reset-password
export const resetPassword = async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ message: 'A senha deve ter pelo menos 6 caracteres.' });
    }

    const user = await ModelUser.findOne({
      email,
      resetPasswordCode: code,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Código inválido ou expirado.' });
    }

    user.password = newPassword;
    user.resetPasswordCode = undefined;
    user.resetPasswordExpires = undefined;
    // Se o usuário conseguiu resetar a senha, ele provou posse do e-mail
    user.isVerified = true; 
    await user.save();

    res.json({ message: 'Senha atualizada com sucesso! Você já pode fazer login.' });
  } catch (error) {
    res.status(500).json({ message: `Erro: ${error.message}` });
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