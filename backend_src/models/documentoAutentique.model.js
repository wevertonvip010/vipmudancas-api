const mongoose = require('mongoose');

const documentoAutentiqueSchema = new mongoose.Schema({
  // Identificação do documento
  autentiqueId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  
  uuid: {
    type: String,
    required: true,
    unique: true
  },
  
  // Dados do documento
  nome: {
    type: String,
    required: true,
    trim: true
  },
  
  tipo: {
    type: String,
    enum: ['CONTRATO', 'ORCAMENTO', 'TERMO', 'OUTROS'],
    default: 'CONTRATO'
  },
  
  status: {
    type: String,
    enum: ['PENDING', 'SIGNED', 'REFUSED', 'EXPIRED', 'CANCELLED'],
    default: 'PENDING'
  },
  
  // Links e arquivos
  linkVisualizacao: {
    type: String,
    trim: true
  },
  
  linkDownload: {
    type: String,
    trim: true
  },
  
  arquivoOriginal: {
    nome: String,
    caminho: String,
    tamanho: Number
  },
  
  // Relacionamentos
  clienteId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cliente',
    index: true
  },
  
  orcamentoId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Orcamento',
    index: true
  },
  
  contratoId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Contrato',
    index: true
  },
  
  // Signatários
  signatarios: [{
    nome: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true
    },
    telefone: {
      type: String,
      trim: true
    },
    acao: {
      type: String,
      enum: ['SIGN', 'APPROVE', 'ACKNOWLEDGE'],
      default: 'SIGN'
    },
    status: {
      type: String,
      enum: ['PENDING', 'SIGNED', 'REFUSED', 'VIEWED'],
      default: 'PENDING'
    },
    assinadoEm: {
      type: Date
    },
    ip: {
      type: String
    },
    localizacao: {
      type: String
    }
  }],
  
  // Configurações
  configuracoes: {
    frequenciaLembrete: {
      type: Number,
      default: 3
    },
    prazoVencimento: {
      type: Date
    },
    fechamentoAutomatico: {
      type: Boolean,
      default: true
    },
    sequencial: {
      type: Boolean,
      default: false
    }
  },
  
  // Histórico de eventos
  eventos: [{
    tipo: {
      type: String,
      enum: ['CREATED', 'SENT', 'VIEWED', 'SIGNED', 'REFUSED', 'EXPIRED', 'CANCELLED', 'COMPLETED'],
      required: true
    },
    descricao: {
      type: String,
      required: true
    },
    usuario: {
      nome: String,
      email: String
    },
    dataHora: {
      type: Date,
      default: Date.now
    },
    metadados: {
      type: mongoose.Schema.Types.Mixed
    }
  }],
  
  // Datas importantes
  criadoEm: {
    type: Date,
    default: Date.now
  },
  
  enviadoEm: {
    type: Date
  },
  
  finalizadoEm: {
    type: Date
  },
  
  venceEm: {
    type: Date
  },
  
  // Metadados
  criadoPor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  observacoes: {
    type: String,
    trim: true
  },
  
  tags: [{
    type: String,
    trim: true
  }]
  
}, {
  timestamps: true,
  collection: 'documentos_autentique'
});

// Índices compostos para otimização
documentoAutentiqueSchema.index({ clienteId: 1, status: 1 });
documentoAutentiqueSchema.index({ criadoEm: -1 });
documentoAutentiqueSchema.index({ status: 1, venceEm: 1 });
documentoAutentiqueSchema.index({ 'signatarios.email': 1 });

// Middleware para atualizar eventos
documentoAutentiqueSchema.pre('save', function(next) {
  if (this.isModified('status') && !this.isNew) {
    this.eventos.push({
      tipo: this.status === 'SIGNED' ? 'COMPLETED' : this.status,
      descricao: `Status alterado para ${this.status}`,
      dataHora: new Date()
    });
  }
  next();
});

// Métodos do schema
documentoAutentiqueSchema.methods.adicionarEvento = function(tipo, descricao, usuario = null, metadados = null) {
  this.eventos.push({
    tipo,
    descricao,
    usuario,
    metadados,
    dataHora: new Date()
  });
  return this.save();
};

documentoAutentiqueSchema.methods.atualizarStatus = function(novoStatus, usuario = null) {
  const statusAnterior = this.status;
  this.status = novoStatus;
  
  if (novoStatus === 'SIGNED') {
    this.finalizadoEm = new Date();
  }
  
  return this.adicionarEvento(
    novoStatus,
    `Status alterado de ${statusAnterior} para ${novoStatus}`,
    usuario
  );
};

documentoAutentiqueSchema.methods.atualizarSignatario = function(email, dadosAtualizacao) {
  const signatario = this.signatarios.find(s => s.email === email);
  if (signatario) {
    Object.assign(signatario, dadosAtualizacao);
    if (dadosAtualizacao.status === 'SIGNED') {
      signatario.assinadoEm = new Date();
    }
  }
  return this.save();
};

// Métodos estáticos
documentoAutentiqueSchema.statics.buscarPorCliente = function(clienteId, status = null) {
  const filtro = { clienteId };
  if (status) filtro.status = status;
  
  return this.find(filtro)
    .populate('clienteId', 'nome email telefone')
    .populate('criadoPor', 'nome email')
    .sort({ criadoEm: -1 });
};

documentoAutentiqueSchema.statics.buscarVencendoEm = function(dias = 3) {
  const dataLimite = new Date();
  dataLimite.setDate(dataLimite.getDate() + dias);
  
  return this.find({
    status: 'PENDING',
    venceEm: { $lte: dataLimite, $gte: new Date() }
  }).populate('clienteId', 'nome email telefone');
};

documentoAutentiqueSchema.statics.estatisticas = function(filtros = {}) {
  const pipeline = [
    { $match: filtros },
    {
      $group: {
        _id: '$status',
        total: { $sum: 1 },
        documentos: { $push: '$$ROOT' }
      }
    }
  ];
  
  return this.aggregate(pipeline);
};

// Virtual para URL completa de visualização
documentoAutentiqueSchema.virtual('urlVisualizacao').get(function() {
  return this.linkVisualizacao ? `https://app.autentique.com.br/documento/${this.linkVisualizacao}` : null;
});

// Configurar virtuals no JSON
documentoAutentiqueSchema.set('toJSON', { virtuals: true });
documentoAutentiqueSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('DocumentoAutentique', documentoAutentiqueSchema);

