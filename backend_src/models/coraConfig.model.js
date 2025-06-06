const mongoose = require('mongoose');

const coraConfigSchema = new mongoose.Schema({
  apiKey: {
    type: String,
    required: true
  },
  secretKey: {
    type: String,
    required: true
  },
  ambiente: {
    type: String,
    enum: ['sandbox', 'producao'],
    default: 'sandbox'
  },
  contaBancaria: {
    id: String,
    nome: String,
    banco: String,
    agencia: String,
    conta: String
  },
  configuracaoBoleto: {
    diasVencimento: {
      type: Number,
      default: 5
    },
    juros: {
      type: Number,
      default: 1 // 1% ao mês
    },
    multa: {
      type: Number,
      default: 2 // 2% do valor
    },
    instrucoes: [String]
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

module.exports = mongoose.model('CoraConfig', coraConfigSchema);
