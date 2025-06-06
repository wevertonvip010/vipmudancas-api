const mongoose = require('mongoose');

const veiculoSchema = new mongoose.Schema({
  placa: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  modelo: {
    type: String,
    required: true,
    trim: true
  },
  marca: {
    type: String,
    required: true,
    trim: true
  },
  ano: {
    type: Number,
    required: true
  },
  capacidade: {
    type: String,
    required: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['disponível', 'em uso', 'em manutenção'],
    default: 'disponível'
  },
  ultimaManutencao: {
    type: Date
  },
  proximaManutencao: {
    type: Date
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
  },
  ativo: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

const Veiculo = mongoose.model('Veiculo', veiculoSchema);

module.exports = Veiculo;
