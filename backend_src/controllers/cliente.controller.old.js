const Cliente = require('../models/cliente.model');
const ClienteDocumento = require('../models/clienteDocumento.model');
const ClienteHistorico = require('../models/clienteHistorico.model');
const clienteHistoricoController = require('./clienteHistorico.controller');
const mongoose = require('mongoose');

// Listar todos os clientes
exports.getAllClientes = async (req, res) => {
  try {
    const clientes = await Cliente.find({ ativo: true });
    res.json(clientes);
  } catch (error) {
    console.error('Erro ao listar clientes:', error);
    res.status(500).json({ message: 'Erro ao listar clientes.' });
  }
};

// Obter cliente por ID
exports.getClienteById = async (req, res) => {
  try {
    const cliente = await Cliente.findById(req.params.id);
    if (!cliente) {
      return res.status(404).json({ message: 'Cliente não encontrado.' });
    }
    res.json(cliente);
  } catch (error) {
    console.error('Erro ao buscar cliente:', error);
    res.status(500).json({ message: 'Erro ao buscar cliente.' });
  }
};

// Obter perfil completo do cliente (incluindo documentos e histórico)
exports.getClientePerfilCompleto = async (req, res) => {
  try {
    const clienteId = req.params.id;
    
    // Buscar cliente com documentos e histórico
    const cliente = await Cliente.findById(clienteId)
      .populate({
        path: 'documentos',
        options: { sort: { dataCriacao: -1 }, limit: 20 }
      })
      .populate({
        path: 'historico',
        options: { sort: { dataCriacao: -1 }, limit: 20 },
        populate: { path: 'criadoPor', select: 'nome email' }
      });
    
    if (!cliente) {
      return res.status(404).json({ message: 'Cliente não encontrado.' });
    }
    
    // Contar documentos por tipo
    const documentosPorTipo = await ClienteDocumento.aggregate([
      { $match: { cliente: mongoose.Types.ObjectId(clienteId), ativo: true } },
      { $group: { _id: '$tipo', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    // Contar eventos por tipo
    const eventosPorTipo = await ClienteHistorico.aggregate([
      { $match: { cliente: mongoose.Types.ObjectId(clienteId) } },
      { $group: { _id: '$tipo', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    // Buscar estatísticas adicionais
    const totalDocumentos = await ClienteDocumento.countDocuments({ 
      cliente: clienteId, 
      ativo: true 
    });
    
    const totalEventos = await ClienteHistorico.countDocuments({ 
      cliente: clienteId 
    });
    
    // Retornar perfil completo
    res.json({
      cliente,
      estatisticas: {
        documentos: {
          total: totalDocumentos,
          porTipo: documentosPorTipo
        },
        historico: {
          total: totalEventos,
          porTipo: eventosPorTipo
        }
      }
    });
  } catch (error) {
    console.error('Erro ao buscar perfil completo do cliente:', error);
    res.status(500).json({ message: 'Erro ao buscar perfil completo do cliente.' });
  }
};

// Criar novo cliente
exports.createCliente = async (req, res) => {
  try {
    const { 
      nome, 
      email, 
      telefone, 
      cpfCnpj, 
      endereco,
      dataNascimento,
      estadoCivil,
      profissao,
      contatosAdicionais,
      preferencias,
      classificacao,
      segmento,
      documentosVerificados,
      observacoes 
    } = req.body;

    // Verificar se o cliente já existe com o mesmo email ou CPF/CNPJ
    const clienteExists = await Cliente.findOne({ 
      $or: [
        { email },
        { cpfCnpj: cpfCnpj && cpfCnpj.trim() !== '' ? cpfCnpj : null }
      ]
    });
    
    if (clienteExists) {
      return res.status(400).json({ message: 'Cliente já cadastrado com este e-mail ou CPF/CNPJ.' });
    }

    // Criar novo cliente
    const cliente = new Cliente({
      nome,
      email,
      telefone,
      cpfCnpj,
      endereco,
      dataNascimento,
      estadoCivil,
      profissao,
      contatosAdicionais,
      preferencias,
      classificacao,
      segmento,
      documentosVerificados,
      observacoes,
      dataCadastro: Date.now(),
      ultimaAtualizacao: Date.now()
    });

    // Salvar cliente no banco de dados
    await cliente.save();
    
    // Registrar evento no histórico
    await clienteHistoricoController.registrarEvento(
      cliente._id,
      'cadastro',
      'Cliente cadastrado',
      `Cliente ${nome} foi cadastrado no sistema`,
      null,
      null,
      req.user.id
    );

    res.status(201).json({
      message: 'Cliente cadastrado com sucesso',
      cliente
    });
  } catch (error) {
    console.error('Erro ao criar cliente:', error);
    res.status(500).json({ message: 'Erro ao cadastrar cliente.' });
  }
};

// Atualizar cliente
exports.updateCliente = async (req, res) => {
  try {
    const { 
      nome, 
      email, 
      telefone, 
      cpfCnpj, 
      endereco,
      dataNascimento,
      estadoCivil,
      profissao,
      contatosAdicionais,
      preferencias,
      classificacao,
      segmento,
      documentosVerificados,
      observacoes 
    } = req.body;
    
    // Verificar se o cliente existe
    const cliente = await Cliente.findById(req.params.id);
    if (!cliente) {
      return res.status(404).json({ message: 'Cliente não encontrado.' });
    }
    
    // Verificar se o email já está em uso por outro cliente
    if (email !== cliente.email) {
      const emailExists = await Cliente.findOne({ email });
      if (emailExists) {
        return res.status(400).json({ message: 'Este e-mail já está em uso por outro cliente.' });
      }
    }
    
    // Verificar se o CPF/CNPJ já está em uso por outro cliente
    if (cpfCnpj && cpfCnpj !== cliente.cpfCnpj) {
      const cpfCnpjExists = await Cliente.findOne({ cpfCnpj });
      if (cpfCnpjExists) {
        return res.status(400).json({ message: 'Este CPF/CNPJ já está em uso por outro cliente.' });
      }
    }
    
    // Coletar alterações para o histórico
    const alteracoes = [];
    if (nome !== cliente.nome) alteracoes.push(`Nome alterado de "${cliente.nome}" para "${nome}"`);
    if (email !== cliente.email) alteracoes.push(`Email alterado de "${cliente.email}" para "${email}"`);
    if (telefone !== cliente.telefone) alteracoes.push(`Telefone alterado de "${cliente.telefone}" para "${telefone}"`);
    if (cpfCnpj !== cliente.cpfCnpj) alteracoes.push(`CPF/CNPJ alterado de "${cliente.cpfCnpj}" para "${cpfCnpj}"`);
    if (endereco && JSON.stringify(endereco) !== JSON.stringify(cliente.endereco)) alteracoes.push('Endereço atualizado');
    if (observacoes !== cliente.observacoes) alteracoes.push('Observações atualizadas');
    
    // Atualizar dados do cliente
    cliente.nome = nome || cliente.nome;
    cliente.email = email || cliente.email;
    cliente.telefone = telefone || cliente.telefone;
    cliente.cpfCnpj = cpfCnpj || cliente.cpfCnpj;
    
    if (endereco) {
      cliente.endereco = {
        ...cliente.endereco,
        ...endereco
      };
    }
    
    // Atualizar campos adicionais
    if (dataNascimento) cliente.dataNascimento = dataNascimento;
    if (estadoCivil) cliente.estadoCivil = estadoCivil;
    if (profissao) cliente.profissao = profissao;
    if (contatosAdicionais) cliente.contatosAdicionais = contatosAdicionais;
    if (preferencias) cliente.preferencias = preferencias;
    if (classificacao) cliente.classificacao = classificacao;
    if (segmento) cliente.segmento = segmento;
    if (documentosVerificados) cliente.documentosVerificados = documentosVerificados;
    
    cliente.observacoes = observacoes !== undefined ? observacoes : cliente.observacoes;
    cliente.ultimaAtualizacao = Date.now();
    
    await cliente.save();
    
    // Registrar evento no histórico se houver alterações
    if (alteracoes.length > 0) {
      await clienteHistoricoController.registrarEvento(
        cliente._id,
        'atualizacao',
        'Dados do cliente atualizados',
        alteracoes.join('\n'),
        null,
        null,
        req.user.id
      );
    }
    
    res.json({
      message: 'Cliente atualizado com sucesso',
      cliente
    });
  } catch (error) {
    console.error('Erro ao atualizar cliente:', error);
    res.status(500).json({ message: 'Erro ao atualizar cliente.' });
  }
};

// Desativar cliente
exports.deactivateCliente = async (req, res) => {
  try {
    const cliente = await Cliente.findById(req.params.id);
    if (!cliente) {
      return res.status(404).json({ message: 'Cliente não encontrado.' });
    }
    
    cliente.ativo = false;
    cliente.ultimaAtualizacao = Date.now();
    
    await cliente.save();
    
    // Registrar evento no histórico
    await clienteHistoricoController.registrarEvento(
      cliente._id,
      'atualizacao',
      'Cliente desativado',
      `Cliente ${cliente.nome} foi desativado no sistema`,
      null,
      null,
      req.user.id
    );
    
    res.json({ message: 'Cliente desativado com sucesso.' });
  } catch (error) {
    console.error('Erro ao desativar cliente:', error);
    res.status(500).json({ message: 'Erro ao desativar cliente.' });
  }
};

// Buscar clientes por nome, email ou telefone
exports.searchClientes = async (req, res) => {
  try {
    const { termo } = req.query;
    
    if (!termo) {
      return res.status(400).json({ message: 'Termo de busca não fornecido.' });
    }
    
    const clientes = await Cliente.find({
      $and: [
        { ativo: true },
        {
          $or: [
            { nome: { $regex: termo, $options: 'i' } },
            { email: { $regex: termo, $options: 'i' } },
            { telefone: { $regex: termo, $options: 'i' } },
            { cpfCnpj: { $regex: termo, $options: 'i' } }
          ]
        }
      ]
    });
    
    res.json(clientes);
  } catch (error) {
    console.error('Erro ao buscar clientes:', error);
    res.status(500).json({ message: 'Erro ao buscar clientes.' });
  }
};
