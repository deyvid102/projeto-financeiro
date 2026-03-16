import jwt from 'jsonwebtoken';
import ModelUser from '../models/ModelUser.js';

export const protect = async (req, res, next) => {
  let token;

  // Verifica se o token veio no Header Authorization: Bearer [TOKEN]
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];

      // Decodifica o token usando a chave secreta do seu .env
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Busca o usuário no banco (sem a senha) e anexa à requisição
      // Importante: no seu ModelGoal e ControlGoal usamos req.user.id
      req.user = await ModelUser.findById(decoded.id).select('-password');

      next();
    } catch (error) {
      console.error(error);
      res.status(401).json({ message: 'Não autorizado, token inválido.' });
    }
  }

  if (!token) {
    res.status(401).json({ message: 'Não autorizado, sem token.' });
  }
};

// ADICIONE ESTA LINHA PARA RESOLVER O ERRO DE IMPORTAÇÃO
export default protect;