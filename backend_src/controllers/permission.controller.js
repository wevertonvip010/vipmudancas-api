const Permission = require('../models/permission.model');
const Role = require('../models/role.model');
const User = require('../models/user.model');

// Listar todas as permissões
exports.getAllPermissions = async (req, res) => {
  try {
    const permissions = await Permission.find().sort({ modulo: 1, nome: 1 });
    res.json(permissions);
  } catch (error) {
    console.error('Erro ao listar permissões:', error);
    res.status(500).json({ message: 'Erro ao listar permissões.' });
  }
};

// Obter permissão por ID
exports.getPermissionById = async (req, res) => {
  try {
    const permission = await Permission.findById(req.params.id);
    
    if (!permission) {
      return res.status(404).json({ message: 'Permissão não encontrada.' });
    }
    
    res.json(permission);
  } catch (error) {
    console.error('Erro ao buscar permissão:', error);
    res.status(500).json({ message: 'Erro ao buscar permissão.' });
  }
};

// Criar nova permissão
exports.createPermission = async (req, res) => {
  try {
    const { nome, descricao, modulo, codigo } = req.body;
    
    // Verificar se já existe permissão com o mesmo código
    const existingPermission = await Permission.findOne({ codigo });
    if (existingPermission) {
      return res.status(400).json({ message: 'Já existe uma permissão com este código.' });
    }
    
    const permission = new Permission({
      nome,
      descricao,
      modulo,
      codigo
    });
    
    await permission.save();
    
    res.status(201).json({
      message: 'Permissão criada com sucesso',
      permission
    });
  } catch (error) {
    console.error('Erro ao criar permissão:', error);
    res.status(500).json({ message: 'Erro ao criar permissão.' });
  }
};

// Atualizar permissão
exports.updatePermission = async (req, res) => {
  try {
    const { nome, descricao, modulo, codigo, ativo } = req.body;
    
    const permission = await Permission.findById(req.params.id);
    if (!permission) {
      return res.status(404).json({ message: 'Permissão não encontrada.' });
    }
    
    // Verificar se o novo código já existe em outra permissão
    if (codigo !== permission.codigo) {
      const existingPermission = await Permission.findOne({ codigo });
      if (existingPermission) {
        return res.status(400).json({ message: 'Já existe uma permissão com este código.' });
      }
    }
    
    permission.nome = nome || permission.nome;
    permission.descricao = descricao || permission.descricao;
    permission.modulo = modulo || permission.modulo;
    permission.codigo = codigo || permission.codigo;
    permission.ativo = ativo !== undefined ? ativo : permission.ativo;
    
    await permission.save();
    
    res.json({
      message: 'Permissão atualizada com sucesso',
      permission
    });
  } catch (error) {
    console.error('Erro ao atualizar permissão:', error);
    res.status(500).json({ message: 'Erro ao atualizar permissão.' });
  }
};

// Excluir permissão
exports.deletePermission = async (req, res) => {
  try {
    const permission = await Permission.findById(req.params.id);
    if (!permission) {
      return res.status(404).json({ message: 'Permissão não encontrada.' });
    }
    
    // Verificar se a permissão está sendo usada em alguma role
    const rolesUsingPermission = await Role.find({ permissoes: permission._id });
    if (rolesUsingPermission.length > 0) {
      return res.status(400).json({ 
        message: 'Esta permissão está sendo usada em uma ou mais funções e não pode ser excluída.',
        roles: rolesUsingPermission.map(r => r.nome)
      });
    }
    
    // Verificar se a permissão está sendo usada por algum usuário
    const usersWithPermission = await User.find({ permissoesAdicionais: permission._id });
    if (usersWithPermission.length > 0) {
      return res.status(400).json({ 
        message: 'Esta permissão está sendo usada por um ou mais usuários e não pode ser excluída.',
        users: usersWithPermission.map(u => u.nome)
      });
    }
    
    await Permission.findByIdAndDelete(req.params.id);
    
    res.json({ message: 'Permissão excluída com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir permissão:', error);
    res.status(500).json({ message: 'Erro ao excluir permissão.' });
  }
};

// Listar permissões por módulo
exports.getPermissionsByModule = async (req, res) => {
  try {
    const { modulo } = req.params;
    
    const permissions = await Permission.find({ modulo }).sort({ nome: 1 });
    
    res.json(permissions);
  } catch (error) {
    console.error('Erro ao listar permissões por módulo:', error);
    res.status(500).json({ message: 'Erro ao listar permissões por módulo.' });
  }
};

// Listar todos os módulos disponíveis
exports.getAllModules = async (req, res) => {
  try {
    const modules = await Permission.distinct('modulo');
    res.json(modules);
  } catch (error) {
    console.error('Erro ao listar módulos:', error);
    res.status(500).json({ message: 'Erro ao listar módulos.' });
  }
};
