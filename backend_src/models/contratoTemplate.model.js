const mongoose = require('mongoose');

const contratoTemplateSchema = new mongoose.Schema({
  nome: {
    type: String,
    required: true,
    unique: true
  },
  tipo: {
    type: String,
    enum: ['storage', 'mudanca'],
    required: true
  },
  conteudo: {
    type: String,
    required: true
  },
  versao: {
    type: String,
    required: true
  },
  ativo: {
    type: Boolean,
    default: true
  },
  criadoEm: {
    type: Date,
    default: Date.now
  },
  atualizadoEm: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

module.exports = mongoose.model('ContratoTemplate', contratoTemplateSchema);
