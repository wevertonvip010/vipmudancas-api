const User = require('../models/user.model');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Registrar um novo usuário
exports.register = async (req, res) => {
  try {
    const { nome, email, senha, cargo, perfil, telefone } = req.body;

    // Verificar se o usuário já existe
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'Usuário já cadastrado com este e-mail.' });
    }

    // Criar novo usuário
    const user = new User({
      nome,
      email,
      senha,
      cargo,
      perfil,
      telefone
    });

    // Salvar usuário no banco de dados
    await user.save();

    // Gerar token JWT
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'sistema_mudancas_secret',
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'Usuário cadastrado com sucesso',
      token,
      user: {
        id: user._id,
        nome: user.nome,
        email: user.email,
        cargo: user.cargo,
        perfil: user.perfil
      }
    });
  } catch (error) {
    console.error('Erro ao registrar usuário:', error);
    res.status(500).json({ message: 'Erro ao cadastrar usuário.' });
  }
};

// Login de usuário
exports.login = async (req, res) => {
  try {
    const { email, senha } = req.body;

    // Verificar se o usuário existe
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Credenciais inválidas.' });
    }

    // Verificar se o usuário está ativo
    if (!user.ativo) {
      return res.status(401).json({ message: 'Usuário desativado. Contate o administrador.' });
    }

    // Verificar senha
    const isMatch = await user.compararSenha(senha);
    if (!isMatch) {
      return res.status(401).json({ message: 'Credenciais inválidas.' });
    }

    // Atualizar último acesso
    user.ultimoAcesso = Date.now();
    await user.save();

    // Gerar token JWT
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'sistema_mudancas_secret',
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Login realizado com sucesso',
      token,
      user: {
        id: user._id,
        nome: user.nome,
        email: user.email,
        cargo: user.cargo,
        perfil: user.perfil
      }
    });
  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({ message: 'Erro ao realizar login.' });
  }
};

// Obter perfil do usuário atual
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-senha');
    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado.' });
    }
    
    res.json(user);
  } catch (error) {
    console.error('Erro ao obter perfil:', error);
    res.status(500).json({ message: 'Erro ao obter perfil do usuário.' });
  }
};

// Atualizar senha
exports.updatePassword = async (req, res) => {
  try {
    const { senhaAtual, novaSenha } = req.body;
    
    // Buscar usuário
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado.' });
    }
    
    // Verificar senha atual
    const isMatch = await user.compararSenha(senhaAtual);
    if (!isMatch) {
      return res.status(401).json({ message: 'Senha atual incorreta.' });
    }
    
    // Atualizar senha
    user.senha = novaSenha;
    await user.save();
    
    res.json({ message: 'Senha atualizada com sucesso.' });
  } catch (error) {
    console.error('Erro ao atualizar senha:', error);
    res.status(500).json({ message: 'Erro ao atualizar senha.' });
  }
};
