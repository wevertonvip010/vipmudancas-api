const mongoose = require('mongoose');

const marketingSchema = new mongoose.Schema({
  tipo: {
    type: String,
    enum: ['campanha', 'lead', 'pesquisa'],
    required: true
  },
  nome: {
    type: String,
    required: true,
    trim: true
  },
  descricao: {
    type: String,
    required: true,
    trim: true
  },
  dataInicio: {
    type: Date,
    required: true
  },
  dataFim: {
    type: Date
  },
  status: {
    type: String,
    enum: ['planejada', 'ativa', 'concluída', 'cancelada'],
    default: 'planejada'
  },
  canal: {
    type: String,
    required: true,
    trim: true
  },
  custo: {
    type: Number,
    default: 0,
    min: 0
  },
  resultados: {
    alcance: {
      type: Number,
      default: 0
    },
    conversoes: {
      type: Number,
      default: 0
    },
    roi: {
      type: Number,
      default: 0
    }
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

const Marketing = mongoose.model('Marketing', marketingSchema);

module.exports = Marketing;
