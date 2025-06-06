const Marketing = require('../models/marketing.model');
const Lead = require('../models/lead.model');

// Listar todas as campanhas de marketing
exports.getAllMarketing = async (req, res) => {
  try {
    const marketing = await Marketing.find();
    res.json(marketing);
  } catch (error) {
    console.error('Erro ao listar campanhas de marketing:', error);
    res.status(500).json({ message: 'Erro ao listar campanhas de marketing.' });
  }
};

// Obter campanha de marketing por ID
exports.getMarketingById = async (req, res) => {
  try {
    const marketing = await Marketing.findById(req.params.id);
    if (!marketing) {
      return res.status(404).json({ message: 'Campanha de marketing não encontrada.' });
    }
    res.json(marketing);
  } catch (error) {
    console.error('Erro ao buscar campanha de marketing:', error);
    res.status(500).json({ message: 'Erro ao buscar campanha de marketing.' });
  }
};

// Criar nova campanha de marketing
exports.createMarketing = async (req, res) => {
  try {
    const { 
      tipo, 
      nome, 
      descricao, 
      dataInicio, 
      dataFim,
      status,
      canal,
      custo,
      resultados,
      observacoes
    } = req.body;

    // Verificar se o tipo é válido
    if (!['campanha', 'lead', 'pesquisa'].includes(tipo)) {
      return res.status(400).json({ message: 'Tipo inválido. Use "campanha", "lead" ou "pesquisa".' });
    }

    // Verificar se o status é válido
    if (!['planejada', 'ativa', 'concluída', 'cancelada'].includes(status)) {
      return res.status(400).json({ message: 'Status inválido.' });
    }

    // Criar nova campanha de marketing
    const marketing = new Marketing({
      tipo,
      nome,
      descricao,
      dataInicio,
      dataFim,
      status,
      canal,
      custo: custo || 0,
      resultados: resultados || {
        alcance: 0,
        conversoes: 0,
        roi: 0
      },
      observacoes,
      dataCriacao: Date.now(),
      ultimaAtualizacao: Date.now()
    });

    // Salvar campanha de marketing no banco de dados
    await marketing.save();

    res.status(201).json({
      message: 'Campanha de marketing criada com sucesso',
      marketing
    });
  } catch (error) {
    console.error('Erro ao criar campanha de marketing:', error);
    res.status(500).json({ message: 'Erro ao criar campanha de marketing.' });
  }
};

// Atualizar campanha de marketing
exports.updateMarketing = async (req, res) => {
  try {
    const { 
      nome, 
      descricao, 
      dataInicio, 
      dataFim,
      status,
      canal,
      custo,
      resultados,
      observacoes
    } = req.body;
    
    // Verificar se a campanha de marketing existe
    const marketing = await Marketing.findById(req.params.id);
    if (!marketing) {
      return res.status(404).json({ message: 'Campanha de marketing não encontrada.' });
    }
    
    // Verificar se o status é válido
    if (status && !['planejada', 'ativa', 'concluída', 'cancelada'].includes(status)) {
      return res.status(400).json({ message: 'Status inválido.' });
    }
    
    // Atualizar dados da campanha de marketing
    if (nome) marketing.nome = nome;
    if (descricao !== undefined) marketing.descricao = descricao;
    if (dataInicio) marketing.dataInicio = dataInicio;
    if (dataFim !== undefined) marketing.dataFim = dataFim;
    if (status) marketing.status = status;
    if (canal) marketing.canal = canal;
    if (custo !== undefined) marketing.custo = custo;
    if (resultados) {
      marketing.resultados = {
        ...marketing.resultados,
        ...resultados
      };
    }
    if (observacoes !== undefined) marketing.observacoes = observacoes;
    
    marketing.ultimaAtualizacao = Date.now();
    
    await marketing.save();
    
    res.json({
      message: 'Campanha de marketing atualizada com sucesso',
      marketing
    });
  } catch (error) {
    console.error('Erro ao atualizar campanha de marketing:', error);
    res.status(500).json({ message: 'Erro ao atualizar campanha de marketing.' });
  }
};

// Ativar campanha de marketing
exports.activateMarketing = async (req, res) => {
  try {
    // Verificar se a campanha de marketing existe
    const marketing = await Marketing.findById(req.params.id);
    if (!marketing) {
      return res.status(404).json({ message: 'Campanha de marketing não encontrada.' });
    }
    
    // Verificar se já está ativa
    if (marketing.status === 'ativa') {
      return res.status(400).json({ message: 'Campanha de marketing já está ativa.' });
    }
    
    // Verificar se está concluída ou cancelada
    if (marketing.status === 'concluída' || marketing.status === 'cancelada') {
      return res.status(400).json({ message: `Campanha de marketing ${marketing.status} não pode ser ativada.` });
    }
    
    marketing.status = 'ativa';
    marketing.ultimaAtualizacao = Date.now();
    
    await marketing.save();
    
    res.json({
      message: 'Campanha de marketing ativada com sucesso',
      marketing
    });
  } catch (error) {
    console.error('Erro ao ativar campanha de marketing:', error);
    res.status(500).json({ message: 'Erro ao ativar campanha de marketing.' });
  }
};

// Concluir campanha de marketing
exports.completeMarketing = async (req, res) => {
  try {
    const { resultados } = req.body;
    
    // Verificar se a campanha de marketing existe
    const marketing = await Marketing.findById(req.params.id);
    if (!marketing) {
      return res.status(404).json({ message: 'Campanha de marketing não encontrada.' });
    }
    
    // Verificar se já está concluída
    if (marketing.status === 'concluída') {
      return res.status(400).json({ message: 'Campanha de marketing já está concluída.' });
    }
    
    // Verificar se está cancelada
    if (marketing.status === 'cancelada') {
      return res.status(400).json({ message: 'Campanha de marketing cancelada não pode ser concluída.' });
    }
    
    marketing.status = 'concluída';
    if (resultados) {
      marketing.resultados = {
        ...marketing.resultados,
        ...resultados
      };
    }
    marketing.dataFim = marketing.dataFim || Date.now();
    marketing.ultimaAtualizacao = Date.now();
    
    await marketing.save();
    
    res.json({
      message: 'Campanha de marketing concluída com sucesso',
      marketing
    });
  } catch (error) {
    console.error('Erro ao concluir campanha de marketing:', error);
    res.status(500).json({ message: 'Erro ao concluir campanha de marketing.' });
  }
};

// Cancelar campanha de marketing
exports.cancelMarketing = async (req, res) => {
  try {
    const { motivoCancelamento } = req.body;
    
    // Verificar se a campanha de marketing existe
    const marketing = await Marketing.findById(req.params.id);
    if (!marketing) {
      return res.status(404).json({ message: 'Campanha de marketing não encontrada.' });
    }
    
    // Verificar se já está cancelada
    if (marketing.status === 'cancelada') {
      return res.status(400).json({ message: 'Campanha de marketing já está cancelada.' });
    }
    
    // Verificar se está concluída
    if (marketing.status === 'concluída') {
      return res.status(400).json({ message: 'Campanha de marketing concluída não pode ser cancelada.' });
    }
    
    marketing.status = 'cancelada';
    if (motivoCancelamento) {
      marketing.observacoes = marketing.observacoes 
        ? `${marketing.observacoes}\nMotivo do cancelamento: ${motivoCancelamento}`
        : `Motivo do cancelamento: ${motivoCancelamento}`;
    }
    marketing.ultimaAtualizacao = Date.now();
    
    await marketing.save();
    
    res.json({
      message: 'Campanha de marketing cancelada com sucesso',
      marketing
    });
  } catch (error) {
    console.error('Erro ao cancelar campanha de marketing:', error);
    res.status(500).json({ message: 'Erro ao cancelar campanha de marketing.' });
  }
};

// Listar todos os leads
exports.getAllLeads = async (req, res) => {
  try {
    const leads = await Lead.find()
      .populate('campanhaId', 'nome tipo');
    
    res.json(leads);
  } catch (error) {
    console.error('Erro ao listar leads:', error);
    res.status(500).json({ message: 'Erro ao listar leads.' });
  }
};

// Obter lead por ID
exports.getLeadById = async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id)
      .populate('campanhaId', 'nome tipo');
    
    if (!lead) {
      return res.status(404).json({ message: 'Lead não encontrado.' });
    }
    
    res.json(lead);
  } catch (error) {
    console.error('Erro ao buscar lead:', error);
    res.status(500).json({ message: 'Erro ao buscar lead.' });
  }
};

// Criar novo lead
exports.createLead = async (req, res) => {
  try {
    const { 
      nome, 
      email, 
      telefone, 
      origem, 
      campanhaId,
      status,
      observacoes
    } = req.body;

    // Verificar se o email já existe
    const leadExists = await Lead.findOne({ email });
    if (leadExists) {
      return res.status(400).json({ message: 'Já existe um lead com este e-mail.' });
    }

    // Verificar se a campanha existe, se fornecida
    if (campanhaId) {
      const campanha = await Marketing.findById(campanhaId);
      if (!campanha) {
        return res.status(404).json({ message: 'Campanha de marketing não encontrada.' });
      }
    }

    // Verificar se o status é válido
    if (status && !['novo', 'contatado', 'qualificado', 'convertido', 'perdido'].includes(status)) {
      return res.status(400).json({ message: 'Status inválido.' });
    }

    // Criar novo lead
    const lead = new Lead({
      nome,
      email,
      telefone,
      origem,
      campanhaId,
      status: status || 'novo',
      observacoes,
      dataCriacao: Date.now(),
      ultimaAtualizacao: Date.now()
    });

    // Salvar lead no banco de dados
    await lead.save();

    // Atualizar contagem de conversões na campanha, se fornecida
    if (campanhaId) {
      await Marketing.findByIdAndUpdate(campanhaId, {
        $inc: { 'resultados.conversoes': 1 }
      });
    }

    res.status(201).json({
      message: 'Lead criado com sucesso',
      lead
    });
  } catch (error) {
    console.error('Erro ao criar lead:', error);
    res.status(500).json({ message: 'Erro ao criar lead.' });
  }
};

// Atualizar lead
exports.updateLead = async (req, res) => {
  try {
    const { 
      nome, 
      email, 
      telefone, 
      origem, 
      campanhaId,
      status,
      observacoes
    } = req.body;
    
    // Verificar se o lead existe
    const lead = await Lead.findById(req.params.id);
    if (!lead) {
      return res.status(404).json({ message: 'Lead não encontrado.' });
    }
    
    // Verificar se o email já está em uso por outro lead
    if (email && email !== lead.email) {
      const emailExists = await Lead.findOne({ email });
      if (emailExists) {
        return res.status(400).json({ message: 'Este e-mail já está em uso por outro lead.' });
      }
    }
    
    // Verificar se a campanha existe, se fornecida
    if (campanhaId && campanhaId !== lead.campanhaId?.toString()) {
      const campanha = await Marketing.findById(campanhaId);
      if (!campanha) {
        return res.status(404).json({ message: 'Campanha de marketing não encontrada.' });
      }
    }
    
    // Verificar se o status é válido
    if (status && !['novo', 'contatado', 'qualificado', 'convertido', 'perdido'].includes(status)) {
      return res.status(400).json({ message: 'Status inválido.' });
    }
    
    // Atualizar dados do lead
    if (nome) lead.nome = nome;
    if (email) lead.email = email;
    if (telefone) lead.telefone = telefone;
    if (origem) lead.origem = origem;
    if (campanhaId) lead.campanhaId = campanhaId;
    if (status) lead.status = status;
    if (observacoes !== undefined) lead.observacoes = observacoes;
    
    lead.ultimaAtualizacao = Date.now();
    
    await lead.save();
    
    res.json({
      message: 'Lead atualizado com sucesso',
      lead
    });
  } catch (error) {
    console.error('Erro ao atualizar lead:', error);
    res.status(500).json({ message: 'Erro ao atualizar lead.' });
  }
};

// Atualizar status do lead
exports.updateLeadStatus = async (req, res) => {
  try {
    const { status, observacao } = req.body;
    
    if (!['novo', 'contatado', 'qualificado', 'convertido', 'perdido'].includes(status)) {
      return res.status(400).json({ message: 'Status inválido.' });
    }
    
    // Verificar se o lead existe
    const lead = await Lead.findById(req.params.id);
    if (!lead) {
      return res.status(404).json({ message: 'Lead não encontrado.' });
    }
    
    // Atualizar status do lead
    lead.status = status;
    if (observacao) {
      lead.observacoes = lead.observacoes 
        ? `${lead.observacoes}\n${new Date().toISOString().split('T')[0]} - ${status}: ${observacao}`
        : `${new Date().toISOString().split('T')[0]} - ${status}: ${observacao}`;
    }
    lead.ultimaAtualizacao = Date.now();
    
    await lead.save();
    
    res.json({
      message: 'Status do lead atualizado com sucesso',
      lead
    });
  } catch (error) {
    console.error('Erro ao atualizar status do lead:', error);
    res.status(500).json({ message: 'Erro ao atualizar status do lead.' });
  }
};

// Buscar leads por status
exports.getLeadsByStatus = async (req, res) => {
  try {
    const { status } = req.params;
    
    if (!['novo', 'contatado', 'qualificado', 'convertido', 'perdido'].includes(status)) {
      return res.status(400).json({ message: 'Status inválido.' });
    }
    
    const leads = await Lead.find({ status })
      .populate('campanhaId', 'nome tipo')
      .sort({ ultimaAtualizacao: -1 });
    
    res.json(leads);
  } catch (error) {
    console.error('Erro ao buscar leads por status:', error);
    res.status(500).json({ message: 'Erro ao buscar leads por status.' });
  }
};

// Buscar leads por campanha
exports.getLeadsByCampanha = async (req, res) => {
  try {
    const { campanhaId } = req.params;
    
    // Verificar se a campanha existe
    const campanha = await Marketing.findById(campanhaId);
    if (!campanha) {
      return res.status(404).json({ message: 'Campanha de marketing não encontrada.' });
    }
    
    const leads = await Lead.find({ campanhaId })
      .sort({ dataCriacao: -1 });
    
    res.json(leads);
  } catch (error) {
    console.error('Erro ao buscar leads por campanha:', error);
    res.status(500).json({ message: 'Erro ao buscar leads por campanha.' });
  }
};
