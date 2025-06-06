const mongoose = require('mongoose');

const materialSchema = new mongoose.Schema({
  codigo: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  nome: {
    type: String,
    required: true,
    trim: true
  },
  descricao: {
    type: String,
    trim: true
  },
  categoria: {
    type: String,
    required: true,
    trim: true
  },
  unidadeMedida: {
    type: String,
    required: true,
    trim: true
  },
  quantidadeEstoque: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  },
  estoqueMinimo: {
    type: Number,
    required: true,
    default: 1,
    min: 0
  },
  valorUnitario: {
    type: Number,
    required: true,
    min: 0
  },
  fornecedor: {
    type: String,
    trim: true
  },
  localizacao: {
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
  },
  ativo: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

const Material = mongoose.model('Material', materialSchema);

module.exports = Material;
