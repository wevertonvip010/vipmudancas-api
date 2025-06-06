const ClienteHistorico = require('../models/clienteHistorico.model');
const Cliente = require('../models/cliente.model');

// Adicionar evento ao histórico do cliente
exports.addHistorico = async (req, res) => {
  try {
    const { clienteId } = req.params;
    const { tipo, titulo, descricao, referencia, metadados } = req.body;
    
    // Verificar se o cliente existe
    const cliente = await Cliente.findById(clienteId);
    if (!cliente) {
      return res.status(404).json({ message: 'Cliente não encontrado.' });
    }
    
    // Criar novo evento no histórico
    const historico = new ClienteHistorico({
      cliente: clienteId,
      tipo: tipo || 'outro',
      titulo,
      descricao,
      referencia: referencia ? JSON.parse(referencia) : undefined,
      metadados: metadados ? JSON.parse(metadados) : undefined,
      criadoPor: req.user.id
    });
    
    // Salvar evento no histórico
    await historico.save();
    
    // Atualizar última interação do cliente
    cliente.ultimaInteracao = {
      data: Date.now(),
      tipo: tipo || 'outro',
      descricao: titulo
    };
    cliente.ultimaAtualizacao = Date.now();
    await cliente.save();
    
    res.status(201).json({
      message: 'Evento adicionado ao histórico com sucesso',
      historico
    });
  } catch (error) {
    console.error('Erro ao adicionar evento ao histórico:', error);
    res.status(500).json({ message: 'Erro ao adicionar evento ao histórico.' });
  }
};

// Listar histórico do cliente
exports.getHistorico = async (req, res) => {
  try {
    const { clienteId } = req.params;
    const { tipo, startDate, endDate, limit } = req.query;
    
    // Verificar se o cliente existe
    const cliente = await Cliente.findById(clienteId);
    if (!cliente) {
      return res.status(404).json({ message: 'Cliente não encontrado.' });
    }
    
    // Construir filtro
    const filtro = { cliente: clienteId };
    
    if (tipo) {
      filtro.tipo = tipo;
    }
    
    if (startDate || endDate) {
      filtro.dataCriacao = {};
      
      if (startDate) {
        filtro.dataCriacao.$gte = new Date(startDate);
      }
      
      if (endDate) {
        filtro.dataCriacao.$lte = new Date(endDate);
      }
    }
    
    // Definir limite de resultados
    const limitValue = limit ? parseInt(limit) : 50;
    
    // Buscar histórico
    const historico = await ClienteHistorico.find(filtro)
      .sort({ dataCriacao: -1 })
      .limit(limitValue)
      .populate('criadoPor', 'nome email');
    
    res.json(historico);
  } catch (error) {
    console.error('Erro ao listar histórico:', error);
    res.status(500).json({ message: 'Erro ao listar histórico.' });
  }
};

// Obter evento do histórico por ID
exports.getHistoricoById = async (req, res) => {
  try {
    const { historicoId } = req.params;
    
    const historico = await ClienteHistorico.findById(historicoId)
      .populate('criadoPor', 'nome email');
    
    if (!historico) {
      return res.status(404).json({ message: 'Evento do histórico não encontrado.' });
    }
    
    res.json(historico);
  } catch (error) {
    console.error('Erro ao buscar evento do histórico:', error);
    res.status(500).json({ message: 'Erro ao buscar evento do histórico.' });
  }
};

// Buscar histórico por termo
exports.searchHistorico = async (req, res) => {
  try {
    const { clienteId } = req.params;
    const { termo } = req.query;
    
    if (!termo) {
      return res.status(400).json({ message: 'Termo de busca não fornecido.' });
    }
    
    const historico = await ClienteHistorico.find({
      cliente: clienteId,
      $or: [
        { titulo: { $regex: termo, $options: 'i' } },
        { descricao: { $regex: termo, $options: 'i' } }
      ]
    }).sort({ dataCriacao: -1 });
    
    res.json(historico);
  } catch (error) {
    console.error('Erro ao buscar histórico:', error);
    res.status(500).json({ message: 'Erro ao buscar histórico.' });
  }
};

// Obter resumo do histórico do cliente
exports.getHistoricoResumo = async (req, res) => {
  try {
    const { clienteId } = req.params;
    
    // Verificar se o cliente existe
    const cliente = await Cliente.findById(clienteId);
    if (!cliente) {
      return res.status(404).json({ message: 'Cliente não encontrado.' });
    }
    
    // Contar eventos por tipo
    const contagemPorTipo = await ClienteHistorico.aggregate([
      { $match: { cliente: mongoose.Types.ObjectId(clienteId) } },
      { $group: { _id: '$tipo', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    // Obter eventos mais recentes
    const eventosRecentes = await ClienteHistorico.find({ cliente: clienteId })
      .sort({ dataCriacao: -1 })
      .limit(5)
      .populate('criadoPor', 'nome email');
    
    // Obter primeiro evento (primeiro contato)
    const primeiroEvento = await ClienteHistorico.findOne({ cliente: clienteId })
      .sort({ dataCriacao: 1 })
      .populate('criadoPor', 'nome email');
    
    res.json({
      contagemPorTipo,
      eventosRecentes,
      primeiroEvento,
      totalEventos: await ClienteHistorico.countDocuments({ cliente: clienteId })
    });
  } catch (error) {
    console.error('Erro ao obter resumo do histórico:', error);
    res.status(500).json({ message: 'Erro ao obter resumo do histórico.' });
  }
};

// Função utilitária para registrar eventos automaticamente
exports.registrarEvento = async (clienteId, tipo, titulo, descricao, referencia, metadados, userId) => {
  try {
    // Verificar se o cliente existe
    const cliente = await Cliente.findById(clienteId);
    if (!cliente) {
      console.error('Cliente não encontrado ao registrar evento automático');
      return null;
    }
    
    // Criar novo evento no histórico
    const historico = new ClienteHistorico({
      cliente: clienteId,
      tipo: tipo || 'outro',
      titulo,
      descricao,
      referencia,
      metadados,
      criadoPor: userId
    });
    
    // Salvar evento no histórico
    await historico.save();
    
    // Atualizar última interação do cliente
    cliente.ultimaInteracao = {
      data: Date.now(),
      tipo: tipo || 'outro',
      descricao: titulo
    };
    cliente.ultimaAtualizacao = Date.now();
    await cliente.save();
    
    return historico;
  } catch (error) {
    console.error('Erro ao registrar evento automático:', error);
    return null;
  }
};
