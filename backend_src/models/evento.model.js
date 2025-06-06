const mongoose = require('mongoose');

const eventoSchema = new mongoose.Schema({
  titulo: {
    type: String,
    required: true,
    trim: true
  },
  descricao: {
    type: String,
    trim: true
  },
  data: {
    type: Date,
    required: true
  },
  setor: {
    type: String,
    enum: ['visita', 'mudanca', 'financeiro', 'estoque', 'storage', 'outro'],
    default: 'outro'
  },
  responsavel: {
    type: String,
    trim: true
  },
  prioridade: {
    type: String,
    enum: ['baixa', 'normal', 'alta', 'urgente'],
    default: 'normal'
  },
  criadoPor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
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

const Evento = mongoose.model('Evento', eventoSchema);

module.exports = Evento;
