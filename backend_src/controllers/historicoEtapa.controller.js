const HistoricoEtapa = require('../models/historicoEtapa.model');
const Cliente = require('../models/cliente.model');
const Orcamento = require('../models/orcamento.model');
const Contrato = require('../models/contrato.model');

// Criar nova etapa no histórico do cliente
exports.criarEtapa = async (req, res) => {
  try {
    const {
      clienteId,
      etapaAtual,
      observacoes,
      detalhesEtapa
    } = req.body;

    // Verificar se o cliente existe
    const cliente = await Cliente.findById(clienteId);
    if (!cliente) {
      return res.status(404).json({
        sucesso: false,
        dados: null,
        erro: 'Cliente não encontrado.'
      });
    }

    // Verificar se pode avançar para a etapa solicitada
    if (!cliente.podeAvancarPara(etapaAtual)) {
      return res.status(400).json({
        sucesso: false,
        dados: null,
        erro: `Não é possível avançar de ${cliente.statusAtual} para ${etapaAtual}.`
      });
    }

    // Criar nova etapa
    const novaEtapa = await HistoricoEtapa.criarEtapa({
      clienteId,
      etapaAtual,
      responsavelId: req.user.id,
      observacoes,
      detalhesEtapa: detalhesEtapa || {}
    });

    // Recarregar com populate
    const etapaCompleta = await HistoricoEtapa.findById(novaEtapa._id)
      .populate('clienteId', 'nome email')
      .populate('responsavelId', 'nome cargo')
      .populate('detalhesEtapa.orcamentoId', 'numero valorFinal')
      .populate('detalhesEtapa.contratoId', 'numeroContrato valorTotal');

    res.status(201).json({
      sucesso: true,
      dados: {
        message: 'Etapa criada com sucesso',
        etapa: etapaCompleta,
        statusAnterior: cliente.statusAtual,
        statusAtual: etapaAtual
      },
      erro: null
    });
  } catch (error) {
    console.error('Erro ao criar etapa:', error);
    res.status(500).json({
      sucesso: false,
      dados: null,
      erro: 'Erro ao criar etapa no histórico.'
    });
  }
};

// Obter histórico completo de um cliente
exports.getHistoricoCliente = async (req, res) => {
  try {
    const { clienteId } = req.params;

    // Verificar se o cliente existe
    const cliente = await Cliente.findById(clienteId);
    if (!cliente) {
      return res.status(404).json({
        sucesso: false,
        dados: null,
        erro: 'Cliente não encontrado.'
      });
    }

    // Obter histórico completo
    const historico = await HistoricoEtapa.obterHistoricoCliente(clienteId);

    // Calcular estatísticas do cliente
    const estatisticas = {
      totalEtapas: historico.length,
      tempoMedioEtapa: 0,
      etapaAtual: cliente.statusAtual,
      dataInicioJornada: historico.length > 0 ? historico[0].dataTransicao : cliente.dataCadastro,
      tempoTotalJornada: 0
    };

    if (historico.length > 1) {
      const tempoTotal = new Date(historico[historico.length - 1].dataTransicao) - 
                        new Date(historico[0].dataTransicao);
      estatisticas.tempoTotalJornada = Math.ceil(tempoTotal / (1000 * 60 * 60 * 24)); // dias
      estatisticas.tempoMedioEtapa = Math.ceil(estatisticas.tempoTotalJornada / historico.length);
    }

    res.status(200).json({
      sucesso: true,
      dados: {
        cliente: {
          id: cliente._id,
          nome: cliente.nome,
          email: cliente.email,
          statusAtual: cliente.statusAtual,
          descricaoStatus: cliente.obterDescricaoStatus(),
          corStatus: cliente.obterCorStatus()
        },
        historico,
        estatisticas
      },
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

// Atualizar status do cliente (método simplificado)
exports.atualizarStatusCliente = async (req, res) => {
  try {
    const { clienteId } = req.params;
    const {
      novoStatus,
      observacoes,
      detalhesEtapa
    } = req.body;

    // Buscar cliente
    const cliente = await Cliente.findById(clienteId);
    if (!cliente) {
      return res.status(404).json({
        sucesso: false,
        dados: null,
        erro: 'Cliente não encontrado.'
      });
    }

    // Atualizar status usando método do model
    await cliente.atualizarStatus(novoStatus, {
      responsavelId: req.user.id,
      observacoes,
      detalhesEtapa
    });

    // Recarregar cliente atualizado
    const clienteAtualizado = await Cliente.findById(clienteId);

    res.status(200).json({
      sucesso: true,
      dados: {
        message: 'Status do cliente atualizado com sucesso',
        cliente: clienteAtualizado,
        statusAnterior: cliente.statusAtual,
        statusAtual: novoStatus
      },
      erro: null
    });
  } catch (error) {
    console.error('Erro ao atualizar status do cliente:', error);
    res.status(500).json({
      sucesso: false,
      dados: null,
      erro: error.message || 'Erro ao atualizar status do cliente.'
    });
  }
};

// Obter estatísticas de conversão geral
exports.getEstatisticasConversao = async (req, res) => {
  try {
    const {
      dataInicio,
      dataFim,
      responsavelId,
      origemLead
    } = req.query;

    // Construir filtros
    const filtros = {};
    if (dataInicio) filtros.dataInicio = new Date(dataInicio);
    if (dataFim) filtros.dataFim = new Date(dataFim);
    if (responsavelId) filtros.responsavelId = responsavelId;

    // Obter estatísticas de conversão
    const estatisticasEtapas = await HistoricoEtapa.obterEstatisticasConversao(filtros);

    // Obter estatísticas de clientes por status
    const estatisticasClientes = await Cliente.aggregate([
      {
        $match: {
          ativo: true,
          ...(origemLead && { origemLead })
        }
      },
      {
        $group: {
          _id: '$statusAtual',
          total: { $sum: 1 },
          origens: { $push: '$origemLead' }
        }
      }
    ]);

    // Calcular taxa de conversão
    const totalLeads = estatisticasClientes.reduce((acc, item) => acc + item.total, 0);
    const contratosFechados = estatisticasClientes.find(item => item._id === 'contrato_fechado')?.total || 0;
    const taxaConversao = totalLeads > 0 ? ((contratosFechados / totalLeads) * 100).toFixed(2) : 0;

    // Obter top motivos de não fechamento
    const motivosNaoFechamento = await HistoricoEtapa.aggregate([
      {
        $match: {
          etapaAtual: 'cliente_nao_fechou',
          'detalhesEtapa.motivoNaoFechamento': { $exists: true }
        }
      },
      {
        $group: {
          _id: '$detalhesEtapa.motivoNaoFechamento',
          total: { $sum: 1 }
        }
      },
      {
        $sort: { total: -1 }
      },
      {
        $limit: 5
      }
    ]);

    res.status(200).json({
      sucesso: true,
      dados: {
        resumo: {
          totalLeads,
          contratosFechados,
          taxaConversao: `${taxaConversao}%`,
          clientesAtivos: totalLeads - (estatisticasClientes.find(item => item._id === 'cliente_nao_fechou')?.total || 0)
        },
        estatisticasEtapas,
        estatisticasClientes,
        motivosNaoFechamento,
        periodo: {
          inicio: dataInicio || 'Início dos registros',
          fim: dataFim || 'Hoje'
        }
      },
      erro: null
    });
  } catch (error) {
    console.error('Erro ao obter estatísticas de conversão:', error);
    res.status(500).json({
      sucesso: false,
      dados: null,
      erro: 'Erro ao obter estatísticas de conversão.'
    });
  }
};

// Obter clientes por etapa (para dashboard Kanban)
exports.getClientesPorEtapa = async (req, res) => {
  try {
    const { etapa, limite = 50 } = req.query;

    const filtro = { ativo: true };
    if (etapa) filtro.statusAtual = etapa;

    const clientes = await Cliente.find(filtro)
      .select('nome email telefone statusAtual dataCadastro ultimaAtualizacao origemLead')
      .sort({ ultimaAtualizacao: -1 })
      .limit(parseInt(limite));

    // Agrupar por etapa se não foi especificada uma etapa
    let resultado;
    if (!etapa) {
      resultado = clientes.reduce((acc, cliente) => {
        const etapaAtual = cliente.statusAtual;
        if (!acc[etapaAtual]) {
          acc[etapaAtual] = [];
        }
        acc[etapaAtual].push({
          ...cliente.toObject(),
          descricaoStatus: cliente.obterDescricaoStatus(),
          corStatus: cliente.obterCorStatus()
        });
        return acc;
      }, {});
    } else {
      resultado = clientes.map(cliente => ({
        ...cliente.toObject(),
        descricaoStatus: cliente.obterDescricaoStatus(),
        corStatus: cliente.obterCorStatus()
      }));
    }

    res.status(200).json({
      sucesso: true,
      dados: resultado,
      erro: null
    });
  } catch (error) {
    console.error('Erro ao obter clientes por etapa:', error);
    res.status(500).json({
      sucesso: false,
      dados: null,
      erro: 'Erro ao obter clientes por etapa.'
    });
  }
};

// Marcar orçamento como não fechado com justificativa
exports.marcarOrcamentoNaoFechado = async (req, res) => {
  try {
    const { orcamentoId } = req.params;
    const {
      motivoNaoFechamento,
      justificativaNaoFechamento,
      observacoes
    } = req.body;

    // Buscar orçamento
    const orcamento = await Orcamento.findById(orcamentoId)
      .populate('clienteId');

    if (!orcamento) {
      return res.status(404).json({
        sucesso: false,
        dados: null,
        erro: 'Orçamento não encontrado.'
      });
    }

    // Atualizar orçamento
    orcamento.status = 'rejeitado';
    orcamento.motivoRejeicao = motivoNaoFechamento;
    orcamento.justificativaRejeicao = justificativaNaoFechamento;
    await orcamento.save();

    // Atualizar status do cliente
    await orcamento.clienteId.atualizarStatus('cliente_nao_fechou', {
      responsavelId: req.user.id,
      observacoes,
      detalhesEtapa: {
        orcamentoId,
        valorOrcamento: orcamento.valorFinal,
        motivoNaoFechamento,
        justificativaNaoFechamento
      }
    });

    res.status(200).json({
      sucesso: true,
      dados: {
        message: 'Orçamento marcado como não fechado',
        orcamento,
        motivoNaoFechamento,
        justificativaNaoFechamento
      },
      erro: null
    });
  } catch (error) {
    console.error('Erro ao marcar orçamento como não fechado:', error);
    res.status(500).json({
      sucesso: false,
      dados: null,
      erro: 'Erro ao marcar orçamento como não fechado.'
    });
  }
};

