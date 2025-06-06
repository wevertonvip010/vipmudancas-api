const mongoose = require('mongoose');

const ordemServicoSchema = new mongoose.Schema({
  googleEventId: {
    type: String,
    default: null
  },
  contratoId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Contrato',
    required: true
  },
  clienteId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cliente',
    required: true
  },
  responsavelId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  numero: {
    type: String,
    required: true,
    unique: true
  },
  dataAgendamento: {
    type: Date,
    required: true
  },
  horarioInicio: {
    type: String,
    required: true
  },
  horarioFim: {
    type: String,
    required: true
  },
  enderecoOrigem: {
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
  enderecoDestino: {
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
  equipe: [{
    funcionarioId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    funcao: {
      type: String,
      required: true,
      trim: true
    }
  }],
  materiais: [{
    materialId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Material',
      required: true
    },
    quantidade: {
      type: Number,
      required: true,
      min: 1
    }
  }],
  veiculoId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Veiculo'
  },
  status: {
    type: String,
    enum: ['agendada', 'em andamento', 'concluída', 'cancelada'],
    default: 'agendada'
  },
  observacoes: {
    type: String,
    trim: true
  },
  checklistPre: [{
    item: {
      type: String,
      required: true
    },
    concluido: {
      type: Boolean,
      default: false
    },
    observacao: {
      type: String,
      trim: true
    }
  }],
  checklistPos: [{
    item: {
      type: String,
      required: true
    },
    concluido: {
      type: Boolean,
      default: false
    },
    observacao: {
      type: String,
      trim: true
    }
  }],
  dataCriacao: {
    type: Date,
    default: Date.now
  },
  ultimaAtualizacao: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

const OrdemServico = mongoose.model('OrdemServico', ordemServicoSchema);

module.exports = OrdemServico;
