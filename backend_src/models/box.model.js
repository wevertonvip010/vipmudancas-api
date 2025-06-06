const mongoose = require('mongoose');

const boxSchema = new mongoose.Schema({
  numero: {
    type: String,
    required: true,
    unique: true
  },
  altura: {
    type: Number,
    required: true
  },
  largura: {
    type: Number,
    required: true
  },
  profundidade: {
    type: Number,
    required: true
  },
  metragemQuadrada: {
    type: Number,
    required: true
  },
  valorPorMetroQuadrado: {
    type: Number,
    required: true,
    min: 30,
    max: 50
  },
  valorTotal: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['disponível', 'ocupado', 'em manutenção', 'reservado'],
    default: 'disponível'
  },
  localizacao: {
    bloco: String,
    andar: String,
    corredor: String
  },
  observacoes: String,
  criadoEm: {
    type: Date,
    default: Date.now
  },
  atualizadoEm: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Middleware para calcular automaticamente a metragem quadrada e o valor total
boxSchema.pre('save', function(next) {
  this.metragemQuadrada = (this.largura * this.profundidade).toFixed(2);
  this.valorTotal = (this.metragemQuadrada * this.valorPorMetroQuadrado).toFixed(2);
  next();
});

module.exports = mongoose.model('Box', boxSchema);
