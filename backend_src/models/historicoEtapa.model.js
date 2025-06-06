const mongoose = require('mongoose');

// Schema para histórico de etapas do cliente
const historicoEtapaSchema = new mongoose.Schema({
  clienteId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cliente',
    required: true
  },
  etapaAnterior: {
    type: String,
    enum: ['lead_captado', 'orcamento_enviado', 'cliente_negociacao', 'contrato_fechado', 'cliente_nao_fechou'],
    default: null
  },
  etapaAtual: {
    type: String,
    enum: ['lead_captado', 'orcamento_enviado', 'cliente_negociacao', 'contrato_fechado', 'cliente_nao_fechou'],
    required: true
  },
  dataTransicao: {
    type: Date,
    default: Date.now,
    required: true
  },
  responsavelId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  observacoes: {
    type: String,
    trim: true
  },
  // Campos específicos para cada etapa
  detalhesEtapa: {
    // Para orcamento_enviado
    orcamentoId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Orcamento'
    },
    valorOrcamento: Number,
    
    // Para contrato_fechado
    contratoId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Contrato'
    },
    numeroContrato: String,
    valorContrato: Number,
    
    // Para cliente_nao_fechou
    motivoNaoFechamento: {
      type: String,
      enum: [
        'cliente_achou_caro',
        'mudanca_cancelada', 
        'contratou_concorrente',
        'nao_respondeu_contato',
        'prazo_inadequado',
        'servico_nao_atende',
        'outros'
      ]
    },
    justificativaNaoFechamento: String,
    
    // Para lead_captado
    origemLead: {
      type: String,
      enum: ['site', 'whatsapp', 'indicacao', 'google', 'facebook', 'outros']
    },
    
    // Para cliente_negociacao
    tentativasContato: Number,
    ultimoContato: Date,
    proximoFollowUp: Date
  },
  // Dados automáticos
  ipOrigem: String,
  userAgent: String,
  sistemaOrigem: {
    type: String,
    default: 'vip_mudancas_sistema'
  }
}, {
  timestamps: true
});

// Índices para melhorar performance
historicoEtapaSchema.index({ clienteId: 1, dataTransicao: -1 });
historicoEtapaSchema.index({ etapaAtual: 1 });
historicoEtapaSchema.index({ responsavelId: 1 });
historicoEtapaSchema.index({ 'detalhesEtapa.orcamentoId': 1 });
historicoEtapaSchema.index({ 'detalhesEtapa.contratoId': 1 });

// Método estático para criar nova etapa
historicoEtapaSchema.statics.criarEtapa = async function(dadosEtapa) {
  try {
    // Buscar última etapa do cliente
    const ultimaEtapa = await this.findOne({ 
      clienteId: dadosEtapa.clienteId 
    }).sort({ dataTransicao: -1 });

    // Criar nova etapa
    const novaEtapa = new this({
      ...dadosEtapa,
      etapaAnterior: ultimaEtapa ? ultimaEtapa.etapaAtual : null,
      dataTransicao: Date.now()
    });

    await novaEtapa.save();

    // Atualizar status do cliente
    const Cliente = require('./cliente.model');
    await Cliente.findByIdAndUpdate(dadosEtapa.clienteId, {
      statusAtual: dadosEtapa.etapaAtual,
      ultimaAtualizacao: Date.now()
    });

    return novaEtapa;
  } catch (error) {
    throw new Error(`Erro ao criar etapa: ${error.message}`);
  }
};

// Método estático para obter histórico completo do cliente
historicoEtapaSchema.statics.obterHistoricoCliente = async function(clienteId) {
  return await this.find({ clienteId })
    .populate('responsavelId', 'nome cargo')
    .populate('detalhesEtapa.orcamentoId', 'numero valorFinal')
    .populate('detalhesEtapa.contratoId', 'numeroContrato valorTotal')
    .sort({ dataTransicao: 1 });
};

// Método estático para obter estatísticas de conversão
historicoEtapaSchema.statics.obterEstatisticasConversao = async function(filtros = {}) {
  const pipeline = [
    {
      $match: {
        ...filtros,
        dataTransicao: {
          $gte: filtros.dataInicio || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          $lte: filtros.dataFim || new Date()
        }
      }
    },
    {
      $group: {
        _id: '$etapaAtual',
        total: { $sum: 1 },
        valorMedio: { $avg: '$detalhesEtapa.valorOrcamento' }
      }
    }
  ];

  return await this.aggregate(pipeline);
};

// Método para verificar se pode avançar para próxima etapa
historicoEtapaSchema.methods.podeAvancarPara = function(proximaEtapa) {
  const fluxoPermitido = {
    'lead_captado': ['orcamento_enviado', 'cliente_nao_fechou'],
    'orcamento_enviado': ['cliente_negociacao', 'contrato_fechado', 'cliente_nao_fechou'],
    'cliente_negociacao': ['contrato_fechado', 'cliente_nao_fechou'],
    'contrato_fechado': [], // Estado final
    'cliente_nao_fechou': [] // Estado final
  };

  return fluxoPermitido[this.etapaAtual]?.includes(proximaEtapa) || false;
};

// Método para obter descrição amigável da etapa
historicoEtapaSchema.methods.obterDescricaoEtapa = function() {
  const descricoes = {
    'lead_captado': 'Lead Captado',
    'orcamento_enviado': 'Orçamento Enviado',
    'cliente_negociacao': 'Cliente em Negociação',
    'contrato_fechado': 'Contrato Fechado',
    'cliente_nao_fechou': 'Cliente Não Fechou'
  };

  return descricoes[this.etapaAtual] || 'Etapa Desconhecida';
};

// Método para obter cor da etapa (para interface)
historicoEtapaSchema.methods.obterCorEtapa = function() {
  const cores = {
    'lead_captado': '#3B82F6', // Azul
    'orcamento_enviado': '#F59E0B', // Amarelo
    'cliente_negociacao': '#8B5CF6', // Roxo
    'contrato_fechado': '#10B981', // Verde
    'cliente_nao_fechou': '#EF4444' // Vermelho
  };

  return cores[this.etapaAtual] || '#6B7280';
};

const HistoricoEtapa = mongoose.model('HistoricoEtapa', historicoEtapaSchema);

module.exports = HistoricoEtapa;

