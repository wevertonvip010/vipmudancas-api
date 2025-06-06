const jwt = require('jsonwebtoken');
const User = require('../models/User');

class AuthMiddleware {
  
  /**
   * Verificar token JWT
   */
  static verificarToken(req, res, next) {
    try {
      const authHeader = req.header('Authorization');
      
      if (!authHeader) {
        return res.status(401).json({
          sucesso: false,
          erro: 'Token de acesso requerido',
          codigo: 'TOKEN_REQUIRED'
        });
      }
      
      const token = authHeader.replace('Bearer ', '');
      
      if (!token) {
        return res.status(401).json({
          sucesso: false,
          erro: 'Formato de token inválido',
          codigo: 'INVALID_TOKEN_FORMAT'
        });
      }
      
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'sistema_mudancas_secret_key_super_segura_2024');
      
      // Verificar se o token não expirou
      if (decoded.exp && Date.now() >= decoded.exp * 1000) {
        return res.status(401).json({
          sucesso: false,
          erro: 'Token expirado',
          codigo: 'TOKEN_EXPIRED'
        });
      }
      
      req.user = {
        id: decoded.id || decoded.userId,
        email: decoded.email,
        nome: decoded.nome || decoded.name,
        role: decoded.role || 'user',
        permissions: decoded.permissions || [],
        iat: decoded.iat,
        exp: decoded.exp
      };
      
      next();
      
    } catch (error) {
      console.error('❌ Erro na verificação do token:', error.message);
      
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({
          sucesso: false,
          erro: 'Token inválido',
          codigo: 'INVALID_TOKEN'
        });
      }
      
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          sucesso: false,
          erro: 'Token expirado',
          codigo: 'TOKEN_EXPIRED'
        });
      }
      
      return res.status(500).json({
        sucesso: false,
        erro: 'Erro interno na autenticação',
        codigo: 'AUTH_ERROR'
      });
    }
  }
  
  /**
   * Verificar permissões por role
   * @param {Array} rolesPermitidas - Array de roles permitidas
   */
  static verificarPermissao(rolesPermitidas = []) {
    return (req, res, next) => {
      try {
        if (!req.user) {
          return res.status(401).json({
            sucesso: false,
            erro: 'Usuário não autenticado',
            codigo: 'USER_NOT_AUTHENTICATED'
          });
        }
        
        const userRole = req.user.role;
        
        // Admin sempre tem acesso
        if (userRole === 'admin') {
          return next();
        }
        
        // Verificar se o role do usuário está nas roles permitidas
        if (!rolesPermitidas.includes(userRole)) {
          return res.status(403).json({
            sucesso: false,
            erro: 'Acesso negado. Permissão insuficiente',
            codigo: 'INSUFFICIENT_PERMISSION',
            detalhes: {
              roleNecessaria: rolesPermitidas,
              roleAtual: userRole
            }
          });
        }
        
        next();
        
      } catch (error) {
        console.error('❌ Erro na verificação de permissão:', error.message);
        
        return res.status(500).json({
          sucesso: false,
          erro: 'Erro interno na verificação de permissões',
          codigo: 'PERMISSION_ERROR'
        });
      }
    };
  }
  
  /**
   * Verificar permissões específicas
   * @param {Array} permissoesNecessarias - Array de permissões específicas
   */
  static verificarPermissaoEspecifica(permissoesNecessarias = []) {
    return (req, res, next) => {
      try {
        if (!req.user) {
          return res.status(401).json({
            sucesso: false,
            erro: 'Usuário não autenticado',
            codigo: 'USER_NOT_AUTHENTICATED'
          });
        }
        
        const userPermissions = req.user.permissions || [];
        const userRole = req.user.role;
        
        // Admin sempre tem acesso
        if (userRole === 'admin') {
          return next();
        }
        
        // Verificar se o usuário tem todas as permissões necessárias
        const temPermissao = permissoesNecessarias.every(permissao => 
          userPermissions.includes(permissao)
        );
        
        if (!temPermissao) {
          return res.status(403).json({
            sucesso: false,
            erro: 'Acesso negado. Permissões específicas insuficientes',
            codigo: 'INSUFFICIENT_SPECIFIC_PERMISSION',
            detalhes: {
              permissoesNecessarias,
              permissoesUsuario: userPermissions
            }
          });
        }
        
        next();
        
      } catch (error) {
        console.error('❌ Erro na verificação de permissão específica:', error.message);
        
        return res.status(500).json({
          sucesso: false,
          erro: 'Erro interno na verificação de permissões',
          codigo: 'PERMISSION_ERROR'
        });
      }
    };
  }
  
  /**
   * Verificar se o usuário é proprietário do recurso
   * @param {String} campoProprietario - Campo que identifica o proprietário
   */
  static verificarProprietario(campoProprietario = 'criadoPor') {
    return (req, res, next) => {
      try {
        if (!req.user) {
          return res.status(401).json({
            sucesso: false,
            erro: 'Usuário não autenticado',
            codigo: 'USER_NOT_AUTHENTICATED'
          });
        }
        
        const userRole = req.user.role;
        const userId = req.user.id;
        
        // Admin sempre tem acesso
        if (userRole === 'admin') {
          return next();
        }
        
        // Verificar propriedade no body da requisição
        const proprietarioId = req.body[campoProprietario] || req.params.userId;
        
        if (proprietarioId && proprietarioId.toString() !== userId.toString()) {
          return res.status(403).json({
            sucesso: false,
            erro: 'Acesso negado. Você só pode acessar seus próprios recursos',
            codigo: 'RESOURCE_OWNERSHIP_REQUIRED'
          });
        }
        
        next();
        
      } catch (error) {
        console.error('❌ Erro na verificação de propriedade:', error.message);
        
        return res.status(500).json({
          sucesso: false,
          erro: 'Erro interno na verificação de propriedade',
          codigo: 'OWNERSHIP_ERROR'
        });
      }
    };
  }
  
  /**
   * Middleware opcional - não bloqueia se não houver token
   */
  static verificarTokenOpcional(req, res, next) {
    try {
      const authHeader = req.header('Authorization');
      
      if (!authHeader) {
        req.user = null;
        return next();
      }
      
      const token = authHeader.replace('Bearer ', '');
      
      if (!token) {
        req.user = null;
        return next();
      }
      
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'sistema_mudancas_secret_key_super_segura_2024');
      
      req.user = {
        id: decoded.id || decoded.userId,
        email: decoded.email,
        nome: decoded.nome || decoded.name,
        role: decoded.role || 'user',
        permissions: decoded.permissions || []
      };
      
      next();
      
    } catch (error) {
      // Em caso de erro, continua sem usuário autenticado
      req.user = null;
      next();
    }
  }
  
  /**
   * Verificar rate limiting por usuário
   * @param {Number} limite - Número máximo de requisições
   * @param {Number} janela - Janela de tempo em minutos
   */
  static rateLimitPorUsuario(limite = 100, janela = 15) {
    const requests = new Map();
    
    return (req, res, next) => {
      try {
        const userId = req.user?.id || req.ip;
        const agora = Date.now();
        const janelaMs = janela * 60 * 1000;
        
        if (!requests.has(userId)) {
          requests.set(userId, []);
        }
        
        const userRequests = requests.get(userId);
        
        // Remover requisições antigas
        const requestsRecentes = userRequests.filter(timestamp => 
          agora - timestamp < janelaMs
        );
        
        if (requestsRecentes.length >= limite) {
          return res.status(429).json({
            sucesso: false,
            erro: 'Muitas requisições. Tente novamente mais tarde',
            codigo: 'RATE_LIMIT_EXCEEDED',
            detalhes: {
              limite,
              janela: `${janela} minutos`,
              tentarNovamenteEm: Math.ceil((requestsRecentes[0] + janelaMs - agora) / 1000)
            }
          });
        }
        
        // Adicionar requisição atual
        requestsRecentes.push(agora);
        requests.set(userId, requestsRecentes);
        
        // Headers informativos
        res.set({
          'X-RateLimit-Limit': limite,
          'X-RateLimit-Remaining': limite - requestsRecentes.length,
          'X-RateLimit-Reset': new Date(agora + janelaMs).toISOString()
        });
        
        next();
        
      } catch (error) {
        console.error('❌ Erro no rate limiting:', error.message);
        next(); // Continua em caso de erro
      }
    };
  }
  
  /**
   * Verificar se o usuário está ativo
   */
  static async verificarUsuarioAtivo(req, res, next) {
    try {
      if (!req.user?.id) {
        return res.status(401).json({
          sucesso: false,
          erro: 'Usuário não identificado',
          codigo: 'USER_NOT_IDENTIFIED'
        });
      }
      
      const usuario = await User.findById(req.user.id).select('ativo bloqueado');
      
      if (!usuario) {
        return res.status(401).json({
          sucesso: false,
          erro: 'Usuário não encontrado',
          codigo: 'USER_NOT_FOUND'
        });
      }
      
      if (!usuario.ativo) {
        return res.status(403).json({
          sucesso: false,
          erro: 'Usuário inativo',
          codigo: 'USER_INACTIVE'
        });
      }
      
      if (usuario.bloqueado) {
        return res.status(403).json({
          sucesso: false,
          erro: 'Usuário bloqueado',
          codigo: 'USER_BLOCKED'
        });
      }
      
      next();
      
    } catch (error) {
      console.error('❌ Erro na verificação de usuário ativo:', error.message);
      
      return res.status(500).json({
        sucesso: false,
        erro: 'Erro interno na verificação de usuário',
        codigo: 'USER_CHECK_ERROR'
      });
    }
  }
}

// Manter compatibilidade com versão anterior
const auth = AuthMiddleware.verificarToken;

module.exports = {
  auth,
  verificarToken: AuthMiddleware.verificarToken,
  verificarPermissao: AuthMiddleware.verificarPermissao,
  verificarPermissaoEspecifica: AuthMiddleware.verificarPermissaoEspecifica,
  verificarProprietario: AuthMiddleware.verificarProprietario,
  verificarTokenOpcional: AuthMiddleware.verificarTokenOpcional,
  rateLimitPorUsuario: AuthMiddleware.rateLimitPorUsuario,
  verificarUsuarioAtivo: AuthMiddleware.verificarUsuarioAtivo
};

