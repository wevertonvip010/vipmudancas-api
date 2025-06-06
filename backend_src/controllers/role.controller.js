const Role = require('../models/role.model');
const Permission = require('../models/permission.model');
const User = require('../models/user.model');

// Listar todos os papéis
exports.getAllRoles = async (req, res) => {
  try {
    const roles = await Role.find()
      .populate('permissoes')
      .sort({ nome: 1 });
    
    res.json(roles);
  } catch (error) {
    console.error('Erro ao listar papéis:', error);
    res.status(500).json({ message: 'Erro ao listar papéis.' });
  }
};

// Obter papel por ID
exports.getRoleById = async (req, res) => {
  try {
    const role = await Role.findById(req.params.id)
      .populate('permissoes');
    
    if (!role) {
      return res.status(404).json({ message: 'Papel não encontrado.' });
    }
    
    res.json(role);
  } catch (error) {
    console.error('Erro ao buscar papel:', error);
    res.status(500).json({ message: 'Erro ao buscar papel.' });
  }
};

// Criar novo papel
exports.createRole = async (req, res) => {
  try {
    const { nome, descricao, permissoes } = req.body;
    
    // Verificar se já existe papel com o mesmo nome
    const existingRole = await Role.findOne({ nome });
    if (existingRole) {
      return res.status(400).json({ message: 'Já existe um papel com este nome.' });
    }
    
    // Verificar se todas as permissões existem
    if (permissoes && permissoes.length > 0) {
      const permissionCount = await Permission.countDocuments({
        _id: { $in: permissoes }
      });
      
      if (permissionCount !== permissoes.length) {
        return res.status(400).json({ message: 'Uma ou mais permissões não existem.' });
      }
    }
    
    const role = new Role({
      nome,
      descricao,
      permissoes: permissoes || []
    });
    
    await role.save();
    
    res.status(201).json({
      message: 'Papel criado com sucesso',
      role
    });
  } catch (error) {
    console.error('Erro ao criar papel:', error);
    res.status(500).json({ message: 'Erro ao criar papel.' });
  }
};

// Atualizar papel
exports.updateRole = async (req, res) => {
  try {
    const { nome, descricao, permissoes, ativo } = req.body;
    
    const role = await Role.findById(req.params.id);
    if (!role) {
      return res.status(404).json({ message: 'Papel não encontrado.' });
    }
    
    // Verificar se o novo nome já existe em outro papel
    if (nome !== role.nome) {
      const existingRole = await Role.findOne({ nome });
      if (existingRole) {
        return res.status(400).json({ message: 'Já existe um papel com este nome.' });
      }
    }
    
    // Verificar se todas as permissões existem
    if (permissoes && permissoes.length > 0) {
      const permissionCount = await Permission.countDocuments({
        _id: { $in: permissoes }
      });
      
      if (permissionCount !== permissoes.length) {
        return res.status(400).json({ message: 'Uma ou mais permissões não existem.' });
      }
    }
    
    role.nome = nome || role.nome;
    role.descricao = descricao || role.descricao;
    if (permissoes) role.permissoes = permissoes;
    role.ativo = ativo !== undefined ? ativo : role.ativo;
    
    await role.save();
    
    res.json({
      message: 'Papel atualizado com sucesso',
      role
    });
  } catch (error) {
    console.error('Erro ao atualizar papel:', error);
    res.status(500).json({ message: 'Erro ao atualizar papel.' });
  }
};

// Excluir papel
exports.deleteRole = async (req, res) => {
  try {
    const role = await Role.findById(req.params.id);
    if (!role) {
      return res.status(404).json({ message: 'Papel não encontrado.' });
    }
    
    // Verificar se o papel está sendo usado por algum usuário
    const usersWithRole = await User.find({ roles: role._id });
    if (usersWithRole.length > 0) {
      return res.status(400).json({ 
        message: 'Este papel está sendo usado por um ou mais usuários e não pode ser excluído.',
        users: usersWithRole.map(u => u.nome)
      });
    }
    
    await Role.findByIdAndDelete(req.params.id);
    
    res.json({ message: 'Papel excluído com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir papel:', error);
    res.status(500).json({ message: 'Erro ao excluir papel.' });
  }
};

// Adicionar permissão ao papel
exports.addPermissionToRole = async (req, res) => {
  try {
    const { roleId, permissionId } = req.params;
    
    const role = await Role.findById(roleId);
    if (!role) {
      return res.status(404).json({ message: 'Papel não encontrado.' });
    }
    
    const permission = await Permission.findById(permissionId);
    if (!permission) {
      return res.status(404).json({ message: 'Permissão não encontrada.' });
    }
    
    // Verificar se a permissão já está no papel
    if (role.permissoes.includes(permissionId)) {
      return res.status(400).json({ message: 'Esta permissão já está associada a este papel.' });
    }
    
    role.permissoes.push(permissionId);
    await role.save();
    
    res.json({
      message: 'Permissão adicionada ao papel com sucesso',
      role
    });
  } catch (error) {
    console.error('Erro ao adicionar permissão ao papel:', error);
    res.status(500).json({ message: 'Erro ao adicionar permissão ao papel.' });
  }
};

// Remover permissão do papel
exports.removePermissionFromRole = async (req, res) => {
  try {
    const { roleId, permissionId } = req.params;
    
    const role = await Role.findById(roleId);
    if (!role) {
      return res.status(404).json({ message: 'Papel não encontrado.' });
    }
    
    // Verificar se a permissão está no papel
    if (!role.permissoes.includes(permissionId)) {
      return res.status(400).json({ message: 'Esta permissão não está associada a este papel.' });
    }
    
    role.permissoes = role.permissoes.filter(p => p.toString() !== permissionId);
    await role.save();
    
    res.json({
      message: 'Permissão removida do papel com sucesso',
      role
    });
  } catch (error) {
    console.error('Erro ao remover permissão do papel:', error);
    res.status(500).json({ message: 'Erro ao remover permissão do papel.' });
  }
};
