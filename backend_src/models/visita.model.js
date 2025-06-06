const mongoose = require('mongoose');

const visitaSchema = new mongoose.Schema({
  googleEventId: {
    type: String,
    default: null
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
  dataAgendamento: {
    type: Date,
    required: true
  },
  horario: {
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
  status: {
    type: String,
    enum: ['agendada', 'realizada', 'cancelada', 'reagendada'],
    default: 'agendada'
  },
  observacoes: {
    type: String,
    trim: true
  },
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

const Visita = mongoose.model('Visita', visitaSchema);

module.exports = Visita;
