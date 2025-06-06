const mongoose = require('mongoose');

const financeiroSchema = new mongoose.Schema({
  tipo: {
    type: String,
    enum: ['receita', 'despesa'],
    required: true
  },
  negocio: {
    type: String,
    enum: ['mudancas', 'storage'],
    required: true,
    default: 'mudancas'
  },
  categoria: {
    type: String,
    required: true,
    trim: true
  },
  descricao: {
    type: String,
    required: true,
    trim: true
  },
  valor: {
    type: Number,
    required: true,
    min: 0
  },
  dataVencimento: {
    type: Date,
    required: true
  },
  dataPagamento: {
    type: Date
  },
  formaPagamento: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['pendente', 'pago', 'atrasado', 'cancelado'],
    default: 'pendente'
  },
  contratoId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Contrato'
  },
  contratoStorageId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ContratoStorage'
  },
  ordemServicoId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'OrdemServico'
  },
  boletoId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Boleto'
  },
  comprovante: {
    type: String
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

// Índices para melhorar a performance das consultas
financeiroSchema.index({ negocio: 1, tipo: 1 });
financeiroSchema.index({ dataVencimento: 1 });
financeiroSchema.index({ status: 1 });
financeiroSchema.index({ contratoId: 1 });
financeiroSchema.index({ contratoStorageId: 1 });

const Financeiro = mongoose.model('Financeiro', financeiroSchema);

module.exports = Financeiro;
