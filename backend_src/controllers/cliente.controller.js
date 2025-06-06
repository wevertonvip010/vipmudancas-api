const Cliente = require('../models/cliente.model');
const ClienteDocumento = require('../models/clienteDocumento.model');
const ClienteHistorico = require('../models/clienteHistorico.model');
const clienteHistoricoController = require('./clienteHistorico.controller');
const mongoose = require('mongoose');

// Listar todos os clientes
exports.getAllClientes = async (req, res) => {
  try {
    const clientes = await Cliente.find({ ativo: true }).sort({ nome: 1 });
    
    res.status(200).json({
      sucesso: true,
      dados: clientes,
      erro: null
    });
  } catch (error) {
    console.error('Erro ao listar clientes:', error);
    res.status(500).json({ 
      sucesso: false, 
      dados: null, 
      erro: 'Erro ao listar clientes.' 
    });
  }
};

// Obter cliente por ID
exports.getClienteById = async (req, res) => {
  try {
    const cliente = await Cliente.findById(req.params.id);
    
    if (!cliente) {
      return res.status(404).json({ 
        sucesso: false, 
        dados: null, 
        erro: 'Cliente não encontrado.' 
      });
    }
    
    res.status(200).json({
      sucesso: true,
      dados: cliente,
      erro: null
    });
  } catch (error) {
    console.error('Erro ao buscar cliente:', error);
    res.status(500).json({ 
      sucesso: false, 
      dados: null, 
      erro: 'Erro ao buscar cliente.' 
    });
  }
};

// Criar novo cliente
exports.createCliente = async (req, res) => {
  try {
    const clienteData = req.body;
    
    // Verificar se já existe cliente com o mesmo email ou telefone
    const clienteExistente = await Cliente.findOne({
      $or: [
        { email: clienteData.email },
        { telefone: clienteData.telefone }
      ]
    });

    if (clienteExistente) {
      return res.status(400).json({ 
        sucesso: false, 
        dados: null, 
        erro: 'Cliente já cadastrado com este email ou telefone.' 
      });
    }

    const cliente = new Cliente(clienteData);
    await cliente.save();

    // Registrar no histórico
    await clienteHistoricoController.registrarHistorico(
      cliente._id,
      'CRIACAO',
      'Cliente criado no sistema',
      req.user?.id
    );

    res.status(201).json({
      sucesso: true,
      dados: cliente,
      erro: null
    });
  } catch (error) {
    console.error('Erro ao criar cliente:', error);
    res.status(500).json({ 
      sucesso: false, 
      dados: null, 
      erro: 'Erro ao criar cliente.' 
    });
  }
};

// Atualizar cliente
exports.updateCliente = async (req, res) => {
  try {
    const clienteId = req.params.id;
    const updateData = req.body;

    const cliente = await Cliente.findByIdAndUpdate(
      clienteId,
      updateData,
      { new: true, runValidators: true }
    );

    if (!cliente) {
      return res.status(404).json({ 
        sucesso: false, 
        dados: null, 
        erro: 'Cliente não encontrado.' 
      });
    }

    // Registrar no histórico
    await clienteHistoricoController.registrarHistorico(
      clienteId,
      'ATUALIZACAO',
      'Dados do cliente atualizados',
      req.user?.id
    );

    res.status(200).json({
      sucesso: true,
      dados: cliente,
      erro: null
    });
  } catch (error) {
    console.error('Erro ao atualizar cliente:', error);
    res.status(500).json({ 
      sucesso: false, 
      dados: null, 
      erro: 'Erro ao atualizar cliente.' 
    });
  }
};

// Deletar cliente (soft delete)
exports.deleteCliente = async (req, res) => {
  try {
    const clienteId = req.params.id;

    const cliente = await Cliente.findByIdAndUpdate(
      clienteId,
      { ativo: false },
      { new: true }
    );

    if (!cliente) {
      return res.status(404).json({ 
        sucesso: false, 
        dados: null, 
        erro: 'Cliente não encontrado.' 
      });
    }

    // Registrar no histórico
    await clienteHistoricoController.registrarHistorico(
      clienteId,
      'EXCLUSAO',
      'Cliente desativado',
      req.user?.id
    );

    res.status(200).json({
      sucesso: true,
      dados: { message: 'Cliente desativado com sucesso.' },
      erro: null
    });
  } catch (error) {
    console.error('Erro ao deletar cliente:', error);
    res.status(500).json({ 
      sucesso: false, 
      dados: null, 
      erro: 'Erro ao deletar cliente.' 
    });
  }
};

// Buscar clientes por filtros
exports.searchClientes = async (req, res) => {
  try {
    const { nome, email, telefone, cidade, status } = req.query;
    const filtros = { ativo: true };

    if (nome) {
      filtros.nome = { $regex: nome, $options: 'i' };
    }
    if (email) {
      filtros.email = { $regex: email, $options: 'i' };
    }
    if (telefone) {
      filtros.telefone = { $regex: telefone, $options: 'i' };
    }
    if (cidade) {
      filtros['endereco.cidade'] = { $regex: cidade, $options: 'i' };
    }
    if (status) {
      filtros.status = status;
    }

    const clientes = await Cliente.find(filtros).sort({ nome: 1 });

    res.status(200).json({
      sucesso: true,
      dados: clientes,
      erro: null
    });
  } catch (error) {
    console.error('Erro ao buscar clientes:', error);
    res.status(500).json({ 
      sucesso: false, 
      dados: null, 
      erro: 'Erro ao buscar clientes.' 
    });
  }
};

// Obter histórico do cliente
exports.getClienteHistorico = async (req, res) => {
  try {
    const clienteId = req.params.id;

    const historico = await ClienteHistorico.find({ clienteId })
      .populate('usuarioId', 'nome')
      .sort({ dataHora: -1 });

    res.status(200).json({
      sucesso: true,
      dados: historico,
      erro: null
    });
  } catch (error) {
    console.error('Erro ao obter histórico do cliente:', error);
    res.status(500).json({ 
      sucesso: false, 
      dados: null, 
      erro: 'Erro ao obter histórico do cliente.' 
    });
  }
};

