import jwt from 'jsonwebtoken';
import ModelUser from '../models/ModelUser.js';

/**
 * Middleware de Proteção de Rotas
 * Verifica o Token JWT e anexa o usuário à requisição (req.user)
 */
export const protect = async (req, res, next) => {
  let token;

  // 1. Verifica se o token existe no Header Authorization
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Extrai o token da string "Bearer [TOKEN]"
      token = req.headers.authorization.split(' ')[1];

      // 2. Decodifica o token usando a chave secreta
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // 3. Busca o usuário no banco (sem a senha)
      // Usamos .findById(decoded.id) pois o ID foi gravado no payload na criação do token
      req.user = await ModelUser.findById(decoded.id).select('-password');

      // 4. Segurança extra: Se o usuário não existir mais no banco
      if (!req.user) {
        return res.status(401).json({ message: 'Usuário não encontrado no sistema.' });
      }

      next();
    } catch (error) {
      console.error("Erro na verificação do JWT:", error);
      return res.status(401).json({ message: 'Não autorizado, token inválido ou expirado.' });
    }
  }

  // 5. Se não houver token no cabeçalho
  if (!token) {
    return res.status(401).json({ message: 'Não autorizado, nenhum token fornecido.' });
  }
};

// Exportação padrão para permitir importação flexível (ex: import auth from...)
export default protect;