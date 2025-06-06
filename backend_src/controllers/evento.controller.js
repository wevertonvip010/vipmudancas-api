const Evento = require('../models/evento.model');
const User = require('../models/user.model');

// Listar todos os eventos
exports.getAllEventos = async (req, res) => {
  try {
    const { dataInicio, dataFim, setor } = req.query;
    
    // Construir filtro
    const filtro = {};
    
    if (dataInicio && dataFim) {
      filtro.data = {
        $gte: new Date(dataInicio),
        $lte: new Date(dataFim)
      };
    } else if (dataInicio) {
      filtro.data = { $gte: new Date(dataInicio) };
    } else if (dataFim) {
      filtro.data = { $lte: new Date(dataFim) };
    }
    
    if (setor) {
      filtro.setor = setor;
    }
    
    const eventos = await Evento.find(filtro)
      .sort({ data: 1 })
      .populate('criadoPor', 'nome email');
    
    res.json(eventos);
  } catch (error) {
    console.error('Erro ao listar eventos:', error);
    res.status(500).json({ message: 'Erro ao listar eventos.' });
  }
};

// Obter evento por ID
exports.getEventoById = async (req, res) => {
  try {
    const evento = await Evento.findById(req.params.id)
      .populate('criadoPor', 'nome email');
    
    if (!evento) {
      return res.status(404).json({ message: 'Evento não encontrado.' });
    }
    
    res.json(evento);
  } catch (error) {
    console.error('Erro ao buscar evento:', error);
    res.status(500).json({ message: 'Erro ao buscar evento.' });
  }
};

// Criar novo evento
exports.createEvento = async (req, res) => {
  try {
    const { titulo, descricao, data, setor, responsavel, prioridade } = req.body;
    
    if (!titulo || !data) {
      return res.status(400).json({ message: 'Título e data são obrigatórios.' });
    }
    
    const evento = new Evento({
      titulo,
      descricao,
      data: new Date(data),
      setor: setor || 'outro',
      responsavel,
      prioridade: prioridade || 'normal',
      criadoPor: req.userId
    });
    
    await evento.save();
    
    res.status(201).json({
      message: 'Evento criado com sucesso',
      evento
    });
  } catch (error) {
    console.error('Erro ao criar evento:', error);
    res.status(500).json({ message: 'Erro ao criar evento.' });
  }
};

// Atualizar evento
exports.updateEvento = async (req, res) => {
  try {
    const { titulo, descricao, data, setor, responsavel, prioridade } = req.body;
    
    const evento = await Evento.findById(req.params.id);
    if (!evento) {
      return res.status(404).json({ message: 'Evento não encontrado.' });
    }
    
    // Verificar se o usuário é o criador ou tem permissão de admin
    const isAdmin = await req.user.hasPermission('admin:edit_eventos');
    const isCreator = evento.criadoPor.toString() === req.userId;
    
    if (!isAdmin && !isCreator) {
      return res.status(403).json({ 
        message: 'Você não tem permissão para editar este evento.' 
      });
    }
    
    if (titulo) evento.titulo = titulo;
    if (descricao !== undefined) evento.descricao = descricao;
    if (data) evento.data = new Date(data);
    if (setor) evento.setor = setor;
    if (responsavel !== undefined) evento.responsavel = responsavel;
    if (prioridade) evento.prioridade = prioridade;
    
    evento.ultimaAtualizacao = Date.now();
    await evento.save();
    
    res.json({
      message: 'Evento atualizado com sucesso',
      evento
    });
  } catch (error) {
    console.error('Erro ao atualizar evento:', error);
    res.status(500).json({ message: 'Erro ao atualizar evento.' });
  }
};

// Excluir evento
exports.deleteEvento = async (req, res) => {
  try {
    const evento = await Evento.findById(req.params.id);
    if (!evento) {
      return res.status(404).json({ message: 'Evento não encontrado.' });
    }
    
    // Verificar se o usuário é o criador ou tem permissão de admin
    const isAdmin = await req.user.hasPermission('admin:delete_eventos');
    const isCreator = evento.criadoPor.toString() === req.userId;
    
    if (!isAdmin && !isCreator) {
      return res.status(403).json({ 
        message: 'Você não tem permissão para excluir este evento.' 
      });
    }
    
    await Evento.findByIdAndDelete(req.params.id);
    
    res.json({ message: 'Evento excluído com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir evento:', error);
    res.status(500).json({ message: 'Erro ao excluir evento.' });
  }
};

// Listar eventos por setor
exports.getEventosBySetor = async (req, res) => {
  try {
    const { setor } = req.params;
    
    const eventos = await Evento.find({ setor })
      .sort({ data: 1 })
      .populate('criadoPor', 'nome email');
    
    res.json(eventos);
  } catch (error) {
    console.error('Erro ao listar eventos por setor:', error);
    res.status(500).json({ message: 'Erro ao listar eventos por setor.' });
  }
};

// Listar eventos por intervalo de data
exports.getEventosByDateRange = async (req, res) => {
  try {
    const { dataInicio, dataFim } = req.params;
    
    if (!dataInicio || !dataFim) {
      return res.status(400).json({ 
        message: 'Data inicial e final são obrigatórias.' 
      });
    }
    
    const eventos = await Evento.find({
      data: {
        $gte: new Date(dataInicio),
        $lte: new Date(dataFim)
      }
    })
    .sort({ data: 1 })
    .populate('criadoPor', 'nome email');
    
    res.json(eventos);
  } catch (error) {
    console.error('Erro ao listar eventos por intervalo de data:', error);
    res.status(500).json({ message: 'Erro ao listar eventos por intervalo de data.' });
  }
};
