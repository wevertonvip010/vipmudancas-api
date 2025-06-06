const mongoose = require('mongoose');

const leadSiteSchema = new mongoose.Schema({
  // Dados pessoais
  nome: {
    type: String,
    required: true,
    trim: true
  },
  telefone: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  
  // Dados da mudança
  tipoImovel: {
    type: String,
    enum: ['casa', 'apartamento', 'comercial', 'escritorio'],
    required: true
  },
  volumeItens: {
    type: String,
    enum: ['baixo', 'medio', 'alto'],
    required: true
  },
  andarOrigem: {
    type: Number,
    default: 0
  },
  andarDestino: {
    type: Number,
    default: 0
  },
  necessitaIcamento: {
    type: Boolean,
    default: false
  },
  dataMudanca: {
    type: Date,
    required: true
  },
  
  // Localização
  bairroOrigem: {
    type: String,
    required: true,
    trim: true
  },
  cidadeOrigem: {
    type: String,
    default: 'São Paulo',
    trim: true
  },
  bairroDestino: {
    type: String,
    required: true,
    trim: true
  },
  cidadeDestino: {
    type: String,
    default: 'São Paulo',
    trim: true
  },
  
  // Estimativa automática
  estimativaValor: {
    type: Number,
    required: true
  },
  detalhesEstimativa: {
    valorBase: Number,
    acrescimoVolume: Number,
    acrescimoAndares: Number,
    acrescimoIcamento: Number,
    valorFinal: Number
  },
  
  // Status e acompanhamento
  status: {
    type: String,
    enum: ['novo', 'contatado', 'orcamento_enviado', 'negociacao', 'fechado', 'perdido'],
    default: 'novo'
  },
  prioridade: {
    type: String,
    enum: ['baixa', 'media', 'alta', 'urgente'],
    default: 'media'
  },
  vendedorResponsavel: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  
  // Dados de origem
  origemCaptura: {
    type: String,
    default: 'site_formulario'
  },
  ipOrigem: String,
  userAgent: String,
  urlOrigem: String,
  
  // Observações e histórico
  observacoes: {
    type: String,
    default: ''
  },
  historico: [{
    data: {
      type: Date,
      default: Date.now
    },
    acao: String,
    usuario: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    detalhes: String
  }],
  
  // Dados de conversão
  dataConversao: Date,
  valorConversao: Number,
  motivoPerdido: String,
  
  // Campos de controle
  ativo: {
    type: Boolean,
    default: true
  },
  dataUltimoContato: Date,
  proximoContato: Date
}, {
  timestamps: true
});

// Índices para otimização
leadSiteSchema.index({ email: 1 });
leadSiteSchema.index({ telefone: 1 });
leadSiteSchema.index({ status: 1 });
leadSiteSchema.index({ dataMudanca: 1 });
leadSiteSchema.index({ vendedorResponsavel: 1 });
leadSiteSchema.index({ createdAt: -1 });

// Método para calcular estimativa
leadSiteSchema.statics.calcularEstimativa = function(dados) {
  let valorBase = 0;
  
  // Valor base por tipo de imóvel
  switch(dados.tipoImovel) {
    case 'casa':
      valorBase = 800;
      break;
    case 'apartamento':
      valorBase = 1200;
      break;
    case 'comercial':
      valorBase = 1500;
      break;
    case 'escritorio':
      valorBase = 1000;
      break;
    default:
      valorBase = 1000;
  }
  
  let acrescimoVolume = 0;
  // Acréscimo por volume
  switch(dados.volumeItens) {
    case 'baixo':
      acrescimoVolume = 0;
      break;
    case 'medio':
      acrescimoVolume = valorBase * 0.3; // +30%
      break;
    case 'alto':
      acrescimoVolume = valorBase * 0.6; // +60%
      break;
  }
  
  // Acréscimo por andares
  const totalAndares = (dados.andarOrigem || 0) + (dados.andarDestino || 0);
  const acrescimoAndares = totalAndares * 150;
  
  // Acréscimo por içamento
  const acrescimoIcamento = dados.necessitaIcamento ? 300 : 0;
  
  const valorFinal = valorBase + acrescimoVolume + acrescimoAndares + acrescimoIcamento;
  
  return {
    valorBase,
    acrescimoVolume,
    acrescimoAndares,
    acrescimoIcamento,
    valorFinal: Math.round(valorFinal)
  };
};

// Método para adicionar ao histórico
leadSiteSchema.methods.adicionarHistorico = function(acao, usuario, detalhes = '') {
  this.historico.push({
    acao,
    usuario,
    detalhes
  });
  
  return this.save();
};

// Método para atualizar status
leadSiteSchema.methods.atualizarStatus = function(novoStatus, usuario, observacao = '') {
  const statusAnterior = this.status;
  this.status = novoStatus;
  
  // Adicionar ao histórico
  this.historico.push({
    acao: 'status_alterado',
    usuario,
    detalhes: `Status alterado de "${statusAnterior}" para "${novoStatus}". ${observacao}`
  });
  
  // Atualizar data de último contato se necessário
  if (['contatado', 'orcamento_enviado', 'negociacao'].includes(novoStatus)) {
    this.dataUltimoContato = new Date();
  }
  
  // Marcar conversão se fechado
  if (novoStatus === 'fechado' && !this.dataConversao) {
    this.dataConversao = new Date();
  }
  
  return this.save();
};

// Método para atribuir vendedor
leadSiteSchema.methods.atribuirVendedor = function(vendedorId, usuario) {
  this.vendedorResponsavel = vendedorId;
  
  this.historico.push({
    acao: 'vendedor_atribuido',
    usuario,
    detalhes: `Lead atribuído ao vendedor ${vendedorId}`
  });
  
  return this.save();
};

// Método estático para obter leads por vendedor
leadSiteSchema.statics.obterPorVendedor = function(vendedorId, status = null) {
  const filtro = { vendedorResponsavel: vendedorId, ativo: true };
  
  if (status) {
    filtro.status = status;
  }
  
  return this.find(filtro)
    .sort({ createdAt: -1 })
    .populate('vendedorResponsavel', 'nome email');
};

// Método estático para obter estatísticas
leadSiteSchema.statics.obterEstatisticas = function(periodo = 30) {
  const dataInicio = new Date();
  dataInicio.setDate(dataInicio.getDate() - periodo);
  
  return this.aggregate([
    {
      $match: {
        createdAt: { $gte: dataInicio }
      }
    },
    {
      $group: {
        _id: '$status',
        total: { $sum: 1 },
        valorMedio: { $avg: '$estimativaValor' }
      }
    }
  ]);
};

module.exports = mongoose.model('LeadSite', leadSiteSchema);

