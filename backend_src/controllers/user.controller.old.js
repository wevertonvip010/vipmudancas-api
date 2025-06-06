const User = require('../models/user.model');
const Role = require('../models/role.model');
const Permission = require('../models/permission.model');

// Listar todos os usuários com suas funções e permissões
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select('-senha')
      .populate('roles')
      .populate('permissoesAdicionais')
      .sort({ nome: 1 });
    
    res.json(users);
  } catch (error) {
    console.error('Erro ao listar usuários:', error);
    res.status(500).json({ message: 'Erro ao listar usuários.' });
  }
};

// Obter usuário por ID
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-senha')
      .populate('roles')
      .populate('permissoesAdicionais');
    
    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado.' });
    }
    
    res.json(user);
  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    res.status(500).json({ message: 'Erro ao buscar usuário.' });
  }
};

// Criar novo usuário
exports.createUser = async (req, res) => {
  try {
    const { nome, email, senha, cargo, perfil, roles, permissoesAdicionais, telefone } = req.body;
    
    // Verificar se o usuário já existe
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Já existe um usuário com este e-mail.' });
    }
    
    // Verificar se todas as roles existem
    if (roles && roles.length > 0) {
      const roleCount = await Role.countDocuments({
        _id: { $in: roles }
      });
      
      if (roleCount !== roles.length) {
        return res.status(400).json({ message: 'Uma ou mais funções não existem.' });
      }
    }
    
    // Verificar se todas as permissões adicionais existem
    if (permissoesAdicionais && permissoesAdicionais.length > 0) {
      const permissionCount = await Permission.countDocuments({
        _id: { $in: permissoesAdicionais }
      });
      
      if (permissionCount !== permissoesAdicionais.length) {
        return res.status(400).json({ message: 'Uma ou mais permissões adicionais não existem.' });
      }
    }
    
    const user = new User({
      nome,
      email,
      senha,
      cargo,
      perfil,
      roles: roles || [],
      permissoesAdicionais: permissoesAdicionais || [],
      telefone
    });
    
    await user.save();
    
    // Remover a senha da resposta
    const userResponse = user.toObject();
    delete userResponse.senha;
    
    res.status(201).json({
      message: 'Usuário criado com sucesso',
      user: userResponse
    });
  } catch (error) {
    console.error('Erro ao criar usuário:', error);
    res.status(500).json({ message: 'Erro ao criar usuário.' });
  }
};

// Atualizar usuário
exports.updateUser = async (req, res) => {
  try {
    const { nome, email, cargo, perfil, roles, permissoesAdicionais, telefone, ativo } = req.body;
    
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado.' });
    }
    
    // Verificar se o novo e-mail já existe em outro usuário
    if (email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: 'Já existe um usuário com este e-mail.' });
      }
    }
    
    // Verificar se todas as roles existem
    if (roles && roles.length > 0) {
      const roleCount = await Role.countDocuments({
        _id: { $in: roles }
      });
      
      if (roleCount !== roles.length) {
        return res.status(400).json({ message: 'Uma ou mais funções não existem.' });
      }
    }
    
    // Verificar se todas as permissões adicionais existem
    if (permissoesAdicionais && permissoesAdicionais.length > 0) {
      const permissionCount = await Permission.countDocuments({
        _id: { $in: permissoesAdicionais }
      });
      
      if (permissionCount !== permissoesAdicionais.length) {
        return res.status(400).json({ message: 'Uma ou mais permissões adicionais não existem.' });
      }
    }
    
    user.nome = nome || user.nome;
    user.email = email || user.email;
    user.cargo = cargo || user.cargo;
    user.perfil = perfil || user.perfil;
    if (roles) user.roles = roles;
    if (permissoesAdicionais) user.permissoesAdicionais = permissoesAdicionais;
    user.telefone = telefone || user.telefone;
    user.ativo = ativo !== undefined ? ativo : user.ativo;
    
    await user.save();
    
    // Remover a senha da resposta
    const userResponse = user.toObject();
    delete userResponse.senha;
    
    res.json({
      message: 'Usuário atualizado com sucesso',
      user: userResponse
    });
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
    res.status(500).json({ message: 'Erro ao atualizar usuário.' });
  }
};

// Atualizar senha do usuário
exports.updateUserPassword = async (req, res) => {
  try {
    const { senha } = req.body;
    
    if (!senha) {
      return res.status(400).json({ message: 'Senha é obrigatória.' });
    }
    
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado.' });
    }
    
    user.senha = senha;
    await user.save();
    
    res.json({ message: 'Senha atualizada com sucesso' });
  } catch (error) {
    console.error('Erro ao atualizar senha:', error);
    res.status(500).json({ message: 'Erro ao atualizar senha.' });
  }
};

// Adicionar função ao usuário
exports.addRoleToUser = async (req, res) => {
  try {
    const { userId, roleId } = req.params;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado.' });
    }
    
    const role = await Role.findById(roleId);
    if (!role) {
      return res.status(404).json({ message: 'Função não encontrada.' });
    }
    
    // Verificar se o usuário já tem esta função
    if (user.roles.includes(roleId)) {
      return res.status(400).json({ message: 'O usuário já possui esta função.' });
    }
    
    user.roles.push(roleId);
    await user.save();
    
    res.json({
      message: 'Função adicionada ao usuário com sucesso',
      user: {
        _id: user._id,
        nome: user.nome,
        email: user.email,
        roles: user.roles
      }
    });
  } catch (error) {
    console.error('Erro ao adicionar função ao usuário:', error);
    res.status(500).json({ message: 'Erro ao adicionar função ao usuário.' });
  }
};

// Remover função do usuário
exports.removeRoleFromUser = async (req, res) => {
  try {
    const { userId, roleId } = req.params;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado.' });
    }
    
    // Verificar se o usuário tem esta função
    if (!user.roles.includes(roleId)) {
      return res.status(400).json({ message: 'O usuário não possui esta função.' });
    }
    
    user.roles = user.roles.filter(r => r.toString() !== roleId);
    await user.save();
    
    res.json({
      message: 'Função removida do usuário com sucesso',
      user: {
        _id: user._id,
        nome: user.nome,
        email: user.email,
        roles: user.roles
      }
    });
  } catch (error) {
    console.error('Erro ao remover função do usuário:', error);
    res.status(500).json({ message: 'Erro ao remover função do usuário.' });
  }
};

// Adicionar permissão adicional ao usuário
exports.addPermissionToUser = async (req, res) => {
  try {
    const { userId, permissionId } = req.params;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado.' });
    }
    
    const permission = await Permission.findById(permissionId);
    if (!permission) {
      return res.status(404).json({ message: 'Permissão não encontrada.' });
    }
    
    // Verificar se o usuário já tem esta permissão
    if (user.permissoesAdicionais.includes(permissionId)) {
      return res.status(400).json({ message: 'O usuário já possui esta permissão adicional.' });
    }
    
    user.permissoesAdicionais.push(permissionId);
    await user.save();
    
    res.json({
      message: 'Permissão adicional adicionada ao usuário com sucesso',
      user: {
        _id: user._id,
        nome: user.nome,
        email: user.email,
        permissoesAdicionais: user.permissoesAdicionais
      }
    });
  } catch (error) {
    console.error('Erro ao adicionar permissão ao usuário:', error);
    res.status(500).json({ message: 'Erro ao adicionar permissão ao usuário.' });
  }
};

// Remover permissão adicional do usuário
exports.removePermissionFromUser = async (req, res) => {
  try {
    const { userId, permissionId } = req.params;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado.' });
    }
    
    // Verificar se o usuário tem esta permissão
    if (!user.permissoesAdicionais.includes(permissionId)) {
      return res.status(400).json({ message: 'O usuário não possui esta permissão adicional.' });
    }
    
    user.permissoesAdicionais = user.permissoesAdicionais.filter(p => p.toString() !== permissionId);
    await user.save();
    
    res.json({
      message: 'Permissão adicional removida do usuário com sucesso',
      user: {
        _id: user._id,
        nome: user.nome,
        email: user.email,
        permissoesAdicionais: user.permissoesAdicionais
      }
    });
  } catch (error) {
    console.error('Erro ao remover permissão do usuário:', error);
    res.status(500).json({ message: 'Erro ao remover permissão do usuário.' });
  }
};

// Obter todas as permissões do usuário
exports.getUserPermissions = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .populate({
        path: 'roles',
        populate: {
          path: 'permissoes'
        }
      })
      .populate('permissoesAdicionais');
    
    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado.' });
    }
    
    // Obter todas as permissões do usuário
    const permissions = await user.getAllPermissions();
    
    // Buscar detalhes completos das permissões
    const permissionDetails = await Permission.find({
      codigo: { $in: permissions }
    });
    
    // Agrupar permissões por módulo
    const permissionsByModule = permissionDetails.reduce((acc, permission) => {
      if (!acc[permission.modulo]) {
        acc[permission.modulo] = [];
      }
      acc[permission.modulo].push(permission);
      return acc;
    }, {});
    
    res.json({
      user: {
        _id: user._id,
        nome: user.nome,
        email: user.email
      },
      permissions: permissions,
      permissionDetails: permissionDetails,
      permissionsByModule: permissionsByModule
    });
  } catch (error) {
    console.error('Erro ao obter permissões do usuário:', error);
    res.status(500).json({ message: 'Erro ao obter permissões do usuário.' });
  }
};
