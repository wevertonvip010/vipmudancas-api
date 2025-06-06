const mongoose = require('mongoose');

const boletoSchema = new mongoose.Schema({
  contratoStorage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ContratoStorage',
    required: true
  },
  cliente: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cliente',
    required: true
  },
  coraId: {
    type: String
  },
  valor: {
    type: Number,
    required: true
  },
  dataEmissao: {
    type: Date,
    default: Date.now
  },
  dataVencimento: {
    type: Date,
    required: true
  },
  dataPagamento: {
    type: Date
  },
  status: {
    type: String,
    enum: ['emitido', 'pago', 'vencido', 'cancelado'],
    default: 'emitido'
  },
  linkBoleto: {
    type: String
  },
  codigoBarras: {
    type: String
  },
  linhaDigitavel: {
    type: String
  },
  referencia: {
    type: String,
    required: true // Ex: "Aluguel Box 101 - Abril/2025"
  },
  tentativasEmissao: {
    type: Number,
    default: 0
  },
  ultimoErro: {
    type: String
  },
  metadados: {
    type: Object
  }
}, { timestamps: true });

module.exports = mongoose.model('Boleto', boletoSchema);
