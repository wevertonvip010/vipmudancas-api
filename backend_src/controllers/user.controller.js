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
    
    res.status(200).json({
      sucesso: true,
      dados: users,
      erro: null
    });
  } catch (error) {
    console.error('Erro ao listar usuários:', error);
    res.status(500).json({ 
      sucesso: false, 
      dados: null, 
      erro: 'Erro ao listar usuários.' 
    });
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
      return res.status(404).json({ 
        sucesso: false, 
        dados: null, 
        erro: 'Usuário não encontrado.' 
      });
    }
    
    res.status(200).json({
      sucesso: true,
      dados: user,
      erro: null
    });
  } catch (error) {
    console.error('Erro ao obter usuário:', error);
    res.status(500).json({ 
      sucesso: false, 
      dados: null, 
      erro: 'Erro ao obter usuário.' 
    });
  }
};

// Criar novo usuário
exports.createUser = async (req, res) => {
  try {
    const { nome, email, senha, cargo, perfil, telefone, roles, permissoesAdicionais } = req.body;

    // Verificar se o usuário já existe
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ 
        sucesso: false, 
        dados: null, 
        erro: 'Usuário já cadastrado com este e-mail.' 
      });
    }

    // Criar novo usuário
    const user = new User({
      nome,
      email,
      senha,
      cargo,
      perfil,
      telefone,
      roles,
      permissoesAdicionais
    });

    await user.save();

    // Buscar usuário criado com populações
    const newUser = await User.findById(user._id)
      .select('-senha')
      .populate('roles')
      .populate('permissoesAdicionais');

    res.status(201).json({
      sucesso: true,
      dados: newUser,
      erro: null
    });
  } catch (error) {
    console.error('Erro ao criar usuário:', error);
    res.status(500).json({ 
      sucesso: false, 
      dados: null, 
      erro: 'Erro ao criar usuário.' 
    });
  }
};

// Atualizar usuário
exports.updateUser = async (req, res) => {
  try {
    const { nome, email, cargo, perfil, telefone, roles, permissoesAdicionais, ativo } = req.body;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { nome, email, cargo, perfil, telefone, roles, permissoesAdicionais, ativo },
      { new: true, runValidators: true }
    )
    .select('-senha')
    .populate('roles')
    .populate('permissoesAdicionais');

    if (!user) {
      return res.status(404).json({ 
        sucesso: false, 
        dados: null, 
        erro: 'Usuário não encontrado.' 
      });
    }

    res.status(200).json({
      sucesso: true,
      dados: user,
      erro: null
    });
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
    res.status(500).json({ 
      sucesso: false, 
      dados: null, 
      erro: 'Erro ao atualizar usuário.' 
    });
  }
};

// Deletar usuário
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return res.status(404).json({ 
        sucesso: false, 
        dados: null, 
        erro: 'Usuário não encontrado.' 
      });
    }

    res.status(200).json({
      sucesso: true,
      dados: { message: 'Usuário deletado com sucesso.' },
      erro: null
    });
  } catch (error) {
    console.error('Erro ao deletar usuário:', error);
    res.status(500).json({ 
      sucesso: false, 
      dados: null, 
      erro: 'Erro ao deletar usuário.' 
    });
  }
};

// Alterar senha do usuário
exports.changePassword = async (req, res) => {
  try {
    const { senhaAtual, novaSenha } = req.body;
    const userId = req.params.id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ 
        sucesso: false, 
        dados: null, 
        erro: 'Usuário não encontrado.' 
      });
    }

    // Verificar senha atual
    const isPasswordValid = await user.comparePassword(senhaAtual);
    if (!isPasswordValid) {
      return res.status(400).json({ 
        sucesso: false, 
        dados: null, 
        erro: 'Senha atual incorreta.' 
      });
    }

    // Atualizar senha
    user.senha = novaSenha;
    await user.save();

    res.status(200).json({
      sucesso: true,
      dados: { message: 'Senha alterada com sucesso.' },
      erro: null
    });
  } catch (error) {
    console.error('Erro ao alterar senha:', error);
    res.status(500).json({ 
      sucesso: false, 
      dados: null, 
      erro: 'Erro ao alterar senha.' 
    });
  }
};

