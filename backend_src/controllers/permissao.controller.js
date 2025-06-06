const Role = require('../models/role.model');
const Permissao = require('../models/permissao.model');

class PermissaoController {
  
  /**
   * Listar todas as permissões
   * GET /api/permissoes
   */
  async listarPermissoes(req, res) {
    try {
      const { categoria, nivel, ativa = true } = req.query;
      
      const filtros = {};
      if (categoria) filtros.categoria = categoria;
      if (nivel) filtros.nivel = nivel;
      if (ativa !== undefined) filtros.ativa = ativa === 'true';
      
      const permissoes = await Permissao.find(filtros)
        .sort({ categoria: 1, nivel: 1, nome: 1 });
      
      // Agrupar por categoria
      const permissoesPorCategoria = permissoes.reduce((acc, permissao) => {
        if (!acc[permissao.categoria]) {
          acc[permissao.categoria] = [];
        }
        acc[permissao.categoria].push(permissao);
        return acc;
      }, {});
      
      return res.status(200).json({
        sucesso: true,
        dados: {
          permissoes,
          permissoesPorCategoria,
          total: permissoes.length,
          categorias: Object.keys(permissoesPorCategoria)
        }
      });
      
    } catch (error) {
      console.error('❌ Erro ao listar permissões:', error);
      
      return res.status(500).json({
        sucesso: false,
        erro: 'Erro interno do servidor',
        detalhes: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
  
  /**
   * Listar todos os roles
   * GET /api/roles
   */
  async listarRoles(req, res) {
    try {
      const { ativo = true, incluirPermissoes = true } = req.query;
      
      const filtros = {};
      if (ativo !== undefined) filtros.ativo = ativo === 'true';
      
      let query = Role.find(filtros).sort({ nivel: 1, nome: 1 });
      
      if (incluirPermissoes === 'true') {
        query = query.populate('permissoes', 'nome descricao categoria nivel');
      }
      
      const roles = await query;
      
      return res.status(200).json({
        sucesso: true,
        dados: {
          roles: roles.map(role => ({
            id: role._id,
            nome: role.nome,
            displayName: role.displayName,
            descricao: role.descricao,
            cor: role.cor,
            icone: role.icone,
            nivel: role.nivel,
            ativo: role.ativo,
            sistema: role.sistema,
            configuracoes: role.configuracoes,
            permissoes: role.permissoes,
            criadoEm: role.criadoEm
          })),
          total: roles.length
        }
      });
      
    } catch (error) {
      console.error('❌ Erro ao listar roles:', error);
      
      return res.status(500).json({
        sucesso: false,
        erro: 'Erro interno do servidor',
        detalhes: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
  
  /**
   * Criar novo role
   * POST /api/roles
   */
  async criarRole(req, res) {
    try {
      const {
        nome,
        displayName,
        descricao,
        cor,
        icone,
        permissoes,
        configuracoes,
        nivel
      } = req.body;
      
      // Validações básicas
      if (!nome || !displayName || !descricao || !nivel) {
        return res.status(400).json({
          sucesso: false,
          erro: 'Nome, displayName, descrição e nível são obrigatórios'
        });
      }
      
      // Verificar se o nome já existe
      const roleExistente = await Role.findOne({ nome: nome.toLowerCase() });
      if (roleExistente) {
        return res.status(400).json({
          sucesso: false,
          erro: 'Já existe um role com este nome'
        });
      }
      
      // Verificar se as permissões existem
      if (permissoes && permissoes.length > 0) {
        const permissoesValidas = await Permissao.find({
          _id: { $in: permissoes },
          ativa: true
        });
        
        if (permissoesValidas.length !== permissoes.length) {
          return res.status(400).json({
            sucesso: false,
            erro: 'Uma ou mais permissões são inválidas'
          });
        }
      }
      
      const novoRole = new Role({
        nome: nome.toLowerCase(),
        displayName,
        descricao,
        cor: cor || '#6B7280',
        icone: icone || 'user',
        permissoes: permissoes || [],
        configuracoes: configuracoes || {},
        nivel,
        criadoPor: req.user.id
      });
      
      await novoRole.save();
      
      // Buscar role criado com permissões populadas
      const roleCompleto = await Role.findById(novoRole._id)
        .populate('permissoes', 'nome descricao categoria nivel');
      
      return res.status(201).json({
        sucesso: true,
        dados: {
          role: roleCompleto,
          mensagem: 'Role criado com sucesso'
        }
      });
      
    } catch (error) {
      console.error('❌ Erro ao criar role:', error);
      
      return res.status(500).json({
        sucesso: false,
        erro: 'Erro interno do servidor',
        detalhes: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
  
  /**
   * Atualizar role
   * PUT /api/roles/:id
   */
  async atualizarRole(req, res) {
    try {
      const { id } = req.params;
      const {
        displayName,
        descricao,
        cor,
        icone,
        permissoes,
        configuracoes,
        nivel,
        ativo
      } = req.body;
      
      const role = await Role.findById(id);
      
      if (!role) {
        return res.status(404).json({
          sucesso: false,
          erro: 'Role não encontrado'
        });
      }
      
      // Verificar se é role de sistema
      if (role.sistema && req.user.role !== 'admin') {
        return res.status(403).json({
          sucesso: false,
          erro: 'Roles de sistema só podem ser editados por administradores'
        });
      }
      
      // Verificar se as permissões existem
      if (permissoes && permissoes.length > 0) {
        const permissoesValidas = await Permissao.find({
          _id: { $in: permissoes },
          ativa: true
        });
        
        if (permissoesValidas.length !== permissoes.length) {
          return res.status(400).json({
            sucesso: false,
            erro: 'Uma ou mais permissões são inválidas'
          });
        }
      }
      
      // Atualizar campos
      if (displayName) role.displayName = displayName;
      if (descricao) role.descricao = descricao;
      if (cor) role.cor = cor;
      if (icone) role.icone = icone;
      if (permissoes) role.permissoes = permissoes;
      if (configuracoes) role.configuracoes = { ...role.configuracoes, ...configuracoes };
      if (nivel) role.nivel = nivel;
      if (ativo !== undefined) role.ativo = ativo;
      
      await role.save();
      
      // Buscar role atualizado com permissões populadas
      const roleAtualizado = await Role.findById(role._id)
        .populate('permissoes', 'nome descricao categoria nivel');
      
      return res.status(200).json({
        sucesso: true,
        dados: {
          role: roleAtualizado,
          mensagem: 'Role atualizado com sucesso'
        }
      });
      
    } catch (error) {
      console.error('❌ Erro ao atualizar role:', error);
      
      return res.status(500).json({
        sucesso: false,
        erro: 'Erro interno do servidor',
        detalhes: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
  
  /**
   * Excluir role
   * DELETE /api/roles/:id
   */
  async excluirRole(req, res) {
    try {
      const { id } = req.params;
      
      const role = await Role.findById(id);
      
      if (!role) {
        return res.status(404).json({
          sucesso: false,
          erro: 'Role não encontrado'
        });
      }
      
      // Verificar se é role de sistema
      if (role.sistema) {
        return res.status(403).json({
          sucesso: false,
          erro: 'Roles de sistema não podem ser excluídos'
        });
      }
      
      // Verificar se há usuários usando este role
      const User = require('../models/User');
      const usuariosComRole = await User.countDocuments({ role: id });
      
      if (usuariosComRole > 0) {
        return res.status(400).json({
          sucesso: false,
          erro: `Não é possível excluir o role. ${usuariosComRole} usuário(s) ainda estão usando este role`
        });
      }
      
      await Role.findByIdAndDelete(id);
      
      return res.status(200).json({
        sucesso: true,
        dados: {
          mensagem: 'Role excluído com sucesso'
        }
      });
      
    } catch (error) {
      console.error('❌ Erro ao excluir role:', error);
      
      return res.status(500).json({
        sucesso: false,
        erro: 'Erro interno do servidor',
        detalhes: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
  
  /**
   * Obter permissões do usuário atual
   * GET /api/permissoes/minhas
   */
  async minhasPermissoes(req, res) {
    try {
      const userId = req.user.id;
      const User = require('../models/User');
      
      const usuario = await User.findById(userId)
        .populate({
          path: 'role',
          populate: {
            path: 'permissoes',
            select: 'nome descricao categoria nivel acoes'
          }
        });
      
      if (!usuario) {
        return res.status(404).json({
          sucesso: false,
          erro: 'Usuário não encontrado'
        });
      }
      
      const permissoes = usuario.role?.permissoes || [];
      const configuracoes = usuario.role?.configuracoes || {};
      
      return res.status(200).json({
        sucesso: true,
        dados: {
          usuario: {
            id: usuario._id,
            nome: usuario.nome,
            email: usuario.email,
            role: usuario.role?.nome || 'user'
          },
          role: {
            nome: usuario.role?.nome,
            displayName: usuario.role?.displayName,
            nivel: usuario.role?.nivel,
            configuracoes
          },
          permissoes: permissoes.map(p => ({
            nome: p.nome,
            descricao: p.descricao,
            categoria: p.categoria,
            nivel: p.nivel,
            acoes: p.acoes
          })),
          modulosVisiveis: configuracoes.modulosVisiveis || [],
          limitacoes: configuracoes.limitacoes || {}
        }
      });
      
    } catch (error) {
      console.error('❌ Erro ao buscar permissões do usuário:', error);
      
      return res.status(500).json({
        sucesso: false,
        erro: 'Erro interno do servidor',
        detalhes: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
  
  /**
   * Inicializar permissões e roles básicos
   * POST /api/permissoes/inicializar
   */
  async inicializarSistema(req, res) {
    try {
      // Apenas admin pode inicializar
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          sucesso: false,
          erro: 'Apenas administradores podem inicializar o sistema'
        });
      }
      
      // Criar permissões básicas
      await Permissao.criarPermissoesBasicas();
      
      // Criar roles básicos
      await Role.criarRolesBasicos();
      
      return res.status(200).json({
        sucesso: true,
        dados: {
          mensagem: 'Sistema de permissões inicializado com sucesso'
        }
      });
      
    } catch (error) {
      console.error('❌ Erro ao inicializar sistema:', error);
      
      return res.status(500).json({
        sucesso: false,
        erro: 'Erro interno do servidor',
        detalhes: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
}

module.exports = new PermissaoController();

