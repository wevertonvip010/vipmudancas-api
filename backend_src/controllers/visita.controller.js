const Visita = require('../models/visita.model');
const Cliente = require('../models/cliente.model');

// Listar todas as visitas
exports.getAllVisitas = async (req, res) => {
  try {
    const visitas = await Visita.find()
      .populate('clienteId', 'nome email telefone')
      .populate('responsavelId', 'nome cargo');
    
    res.json(visitas);
  } catch (error) {
    console.error('Erro ao listar visitas:', error);
    res.status(500).json({ message: 'Erro ao listar visitas.' });
  }
};

// Obter visita por ID
exports.getVisitaById = async (req, res) => {
  try {
    const visita = await Visita.findById(req.params.id)
      .populate('clienteId', 'nome email telefone')
      .populate('responsavelId', 'nome cargo');
    
    if (!visita) {
      return res.status(404).json({ message: 'Visita não encontrada.' });
    }
    
    res.json(visita);
  } catch (error) {
    console.error('Erro ao buscar visita:', error);
    res.status(500).json({ message: 'Erro ao buscar visita.' });
  }
};

// Criar nova visita
exports.createVisita = async (req, res) => {
  try {
    const { 
      clienteId, 
      dataAgendamento, 
      horario, 
      enderecoOrigem, 
      enderecoDestino, 
      observacoes 
    } = req.body;

    // Verificar se o cliente existe
    const cliente = await Cliente.findById(clienteId);
    if (!cliente) {
      return res.status(404).json({ message: 'Cliente não encontrado.' });
    }

    // Criar nova visita
    const visita = new Visita({
      clienteId,
      responsavelId: req.userId,
      dataAgendamento,
      horario,
      enderecoOrigem,
      enderecoDestino,
      observacoes,
      status: 'agendada',
      dataCriacao: Date.now(),
      ultimaAtualizacao: Date.now()
    });

    // Salvar visita no banco de dados
    await visita.save();

    res.status(201).json({
      message: 'Visita agendada com sucesso',
      visita
    });
  } catch (error) {
    console.error('Erro ao agendar visita:', error);
    res.status(500).json({ message: 'Erro ao agendar visita.' });
  }
};

// Atualizar visita
exports.updateVisita = async (req, res) => {
  try {
    const { 
      dataAgendamento, 
      horario, 
      enderecoOrigem, 
      enderecoDestino, 
      status, 
      observacoes 
    } = req.body;
    
    // Verificar se a visita existe
    const visita = await Visita.findById(req.params.id);
    if (!visita) {
      return res.status(404).json({ message: 'Visita não encontrada.' });
    }
    
    // Atualizar dados da visita
    if (dataAgendamento) visita.dataAgendamento = dataAgendamento;
    if (horario) visita.horario = horario;
    if (enderecoOrigem) visita.enderecoOrigem = enderecoOrigem;
    if (enderecoDestino) visita.enderecoDestino = enderecoDestino;
    if (status) visita.status = status;
    if (observacoes !== undefined) visita.observacoes = observacoes;
    
    visita.ultimaAtualizacao = Date.now();
    
    await visita.save();
    
    res.json({
      message: 'Visita atualizada com sucesso',
      visita
    });
  } catch (error) {
    console.error('Erro ao atualizar visita:', error);
    res.status(500).json({ message: 'Erro ao atualizar visita.' });
  }
};

// Cancelar visita
exports.cancelVisita = async (req, res) => {
  try {
    const visita = await Visita.findById(req.params.id);
    if (!visita) {
      return res.status(404).json({ message: 'Visita não encontrada.' });
    }
    
    // Verificar se a visita já foi realizada
    if (visita.status === 'realizada') {
      return res.status(400).json({ message: 'Não é possível cancelar uma visita já realizada.' });
    }
    
    visita.status = 'cancelada';
    visita.ultimaAtualizacao = Date.now();
    
    await visita.save();
    
    res.json({ message: 'Visita cancelada com sucesso.' });
  } catch (error) {
    console.error('Erro ao cancelar visita:', error);
    res.status(500).json({ message: 'Erro ao cancelar visita.' });
  }
};

// Marcar visita como realizada
exports.completeVisita = async (req, res) => {
  try {
    const visita = await Visita.findById(req.params.id);
    if (!visita) {
      return res.status(404).json({ message: 'Visita não encontrada.' });
    }
    
    // Verificar se a visita já foi cancelada
    if (visita.status === 'cancelada') {
      return res.status(400).json({ message: 'Não é possível marcar como realizada uma visita cancelada.' });
    }
    
    visita.status = 'realizada';
    visita.ultimaAtualizacao = Date.now();
    
    await visita.save();
    
    res.json({ message: 'Visita marcada como realizada com sucesso.' });
  } catch (error) {
    console.error('Erro ao marcar visita como realizada:', error);
    res.status(500).json({ message: 'Erro ao marcar visita como realizada.' });
  }
};

// Buscar visitas por cliente
exports.getVisitasByCliente = async (req, res) => {
  try {
    const { clienteId } = req.params;
    
    // Verificar se o cliente existe
    const cliente = await Cliente.findById(clienteId);
    if (!cliente) {
      return res.status(404).json({ message: 'Cliente não encontrado.' });
    }
    
    const visitas = await Visita.find({ clienteId })
      .populate('responsavelId', 'nome cargo')
      .sort({ dataAgendamento: -1 });
    
    res.json(visitas);
  } catch (error) {
    console.error('Erro ao buscar visitas do cliente:', error);
    res.status(500).json({ message: 'Erro ao buscar visitas do cliente.' });
  }
};

// Buscar visitas por período
exports.getVisitasByPeriodo = async (req, res) => {
  try {
    const { dataInicio, dataFim } = req.query;
    
    if (!dataInicio || !dataFim) {
      return res.status(400).json({ message: 'Data de início e fim são obrigatórias.' });
    }
    
    const visitas = await Visita.find({
      dataAgendamento: {
        $gte: new Date(dataInicio),
        $lte: new Date(dataFim)
      }
    })
    .populate('clienteId', 'nome email telefone')
    .populate('responsavelId', 'nome cargo')
    .sort({ dataAgendamento: 1 });
    
    res.json(visitas);
  } catch (error) {
    console.error('Erro ao buscar visitas por período:', error);
    res.status(500).json({ message: 'Erro ao buscar visitas por período.' });
  }
};
