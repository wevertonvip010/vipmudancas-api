const mongoose = require('mongoose');

const leadSchema = new mongoose.Schema({
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
  origem: {
    type: String,
    required: true,
    trim: true
  },
  campanhaId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Marketing'
  },
  status: {
    type: String,
    enum: ['novo', 'contatado', 'qualificado', 'convertido', 'perdido'],
    default: 'novo'
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

const Lead = mongoose.model('Lead', leadSchema);

module.exports = Lead;
