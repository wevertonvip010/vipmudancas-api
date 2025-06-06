const mongoose = require('mongoose');

// Atualização do modelo de Cliente para incluir statusAtual e histórico de etapas
const clienteSchema = new mongoose.Schema({
  nome: {
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
  telefone: {
    type: String,
    required: true,
    trim: true
  },
  cpfCnpj: {
    type: String,
    trim: true
  },
  endereco: {
    rua: {
      type: String,
      required: true,
      trim: true
    },
    numero: {
      type: String,
      required: true,
      trim: true
    },
    complemento: {
      type: String,
      trim: true
    },
    bairro: {
      type: String,
      required: true,
      trim: true
    },
    cidade: {
      type: String,
      required: true,
      trim: true
    },
    estado: {
      type: String,
      required: true,
      trim: true
    },
    cep: {
      type: String,
      required: true,
      trim: true
    }
  },
  // NOVO CAMPO PARA HISTÓRICO DE ETAPAS
  statusAtual: {
    type: String,
    enum: ['lead_captado', 'orcamento_enviado', 'cliente_negociacao', 'contrato_fechado', 'cliente_nao_fechou'],
    default: 'lead_captado',
    required: true
  },
  // Campos adicionais para informações pessoais
  dataNascimento: {
    type: Date
  },
  estadoCivil: {
    type: String,
    enum: ['solteiro', 'casado', 'divorciado', 'viuvo', 'outro'],
    trim: true
  },
  profissao: {
    type: String,
    trim: true
  },
  // Contatos adicionais
  contatosAdicionais: [{
    nome: {
      type: String,
      trim: true
    },
    telefone: {
      type: String,
      trim: true
    },
    email: {
      type: String,
      trim: true,
      lowercase: true
    },
    relacao: {
      type: String,
      trim: true
    }
  }],
  // Preferências do cliente
  preferencias: {
    horarioContato: {
      type: String,
      trim: true
    },
    canalPreferido: {
      type: String,
      enum: ['email', 'telefone', 'whatsapp', 'outro'],
      default: 'whatsapp'
    },
    observacoesPreferencias: {
      type: String,
      trim: true
    }
  },
  // Campos para classificação e segmentação
  classificacao: {
    type: String,
    enum: ['lead', 'prospect', 'cliente', 'cliente_vip', 'inativo'],
    default: 'lead' // Alterado para lead por padrão
  },
  segmento: {
    type: String,
    enum: ['residencial', 'comercial', 'industrial', 'storage', 'outro'],
    default: 'residencial'
  },
  // NOVOS CAMPOS PARA ORIGEM E RASTREAMENTO
  origemLead: {
    type: String,
    enum: ['site', 'whatsapp', 'indicacao', 'google', 'facebook', 'outros'],
    default: 'site'
  },
  campanhaOrigem: {
    type: String,
    trim: true
  },
  // Campos para controle de documentos
  documentosVerificados: {
    identidade: {
      type: Boolean,
      default: false
    },
    cpfCnpj: {
      type: Boolean,
      default: false
    },
    comprovanteResidencia: {
      type: Boolean,
      default: false
    }
  },
  observacoes: {
    type: String,
    trim: true
  },
  dataCadastro: {
    type: Date,
    default: Date.now
  },
  ultimaAtualizacao: {
    type: Date,
    default: Date.now
  },
  ultimaInteracao: {
    data: {
      type: Date
    },
    tipo: {
      type: String,
      trim: true
    },
    descricao: {
      type: String,
      trim: true
    }
  },
  ativo: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  // Habilitar virtuals para facilitar a obtenção de documentos e histórico
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtuals para documentos e histórico
clienteSchema.virtual('documentos', {
  ref: 'ClienteDocumento',
  localField: '_id',
  foreignField: 'cliente'
});

clienteSchema.virtual('historicoEtapas', {
  ref: 'HistoricoEtapa',
  localField: '_id',
  foreignField: 'clienteId',
  options: { sort: { dataTransicao: -1 } }
});

// Middleware para atualizar ultimaAtualizacao
clienteSchema.pre('save', function(next) {
  this.ultimaAtualizacao = Date.now();
  next();
});

// Método para obter descrição do status atual
clienteSchema.methods.obterDescricaoStatus = function() {
  const descricoes = {
    'lead_captado': 'Lead Captado',
    'orcamento_enviado': 'Orçamento Enviado',
    'cliente_negociacao': 'Cliente em Negociação',
    'contrato_fechado': 'Contrato Fechado',
    'cliente_nao_fechou': 'Cliente Não Fechou'
  };

  return descricoes[this.statusAtual] || 'Status Desconhecido';
};

// Método para obter cor do status (para interface)
clienteSchema.methods.obterCorStatus = function() {
  const cores = {
    'lead_captado': '#3B82F6', // Azul
    'orcamento_enviado': '#F59E0B', // Amarelo
    'cliente_negociacao': '#8B5CF6', // Roxo
    'contrato_fechado': '#10B981', // Verde
    'cliente_nao_fechou': '#EF4444' // Vermelho
  };

  return cores[this.statusAtual] || '#6B7280';
};

// Método para verificar se pode avançar para próximo status
clienteSchema.methods.podeAvancarPara = function(proximoStatus) {
  const fluxoPermitido = {
    'lead_captado': ['orcamento_enviado', 'cliente_nao_fechou'],
    'orcamento_enviado': ['cliente_negociacao', 'contrato_fechado', 'cliente_nao_fechou'],
    'cliente_negociacao': ['contrato_fechado', 'cliente_nao_fechou'],
    'contrato_fechado': [], // Estado final
    'cliente_nao_fechou': [] // Estado final
  };

  return fluxoPermitido[this.statusAtual]?.includes(proximoStatus) || false;
};

// Método para atualizar status e criar histórico
clienteSchema.methods.atualizarStatus = async function(novoStatus, dadosEtapa = {}) {
  if (!this.podeAvancarPara(novoStatus)) {
    throw new Error(`Não é possível avançar de ${this.statusAtual} para ${novoStatus}`);
  }

  const HistoricoEtapa = require('./historicoEtapa.model');
  
  // Criar entrada no histórico
  await HistoricoEtapa.criarEtapa({
    clienteId: this._id,
    etapaAtual: novoStatus,
    responsavelId: dadosEtapa.responsavelId,
    observacoes: dadosEtapa.observacoes,
    detalhesEtapa: dadosEtapa.detalhesEtapa || {}
  });

  // Atualizar status do cliente
  this.statusAtual = novoStatus;
  this.ultimaAtualizacao = Date.now();
  
  // Atualizar classificação baseada no status
  if (novoStatus === 'contrato_fechado') {
    this.classificacao = 'cliente';
  } else if (novoStatus === 'cliente_nao_fechou') {
    this.classificacao = 'inativo';
  }

  await this.save();
  return this;
};

// Índices para melhorar a performance
clienteSchema.index({ email: 1 });
clienteSchema.index({ cpfCnpj: 1 });
clienteSchema.index({ nome: 'text', email: 'text', telefone: 'text', cpfCnpj: 'text' });
clienteSchema.index({ classificacao: 1 });
clienteSchema.index({ segmento: 1 });
clienteSchema.index({ statusAtual: 1 });
clienteSchema.index({ origemLead: 1 });
clienteSchema.index({ ativo: 1 });

const Cliente = mongoose.model('Cliente', clienteSchema);

module.exports = Cliente;

