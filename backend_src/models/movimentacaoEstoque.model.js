const mongoose = require('mongoose');

const movimentacaoEstoqueSchema = new mongoose.Schema({
  materialId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Material',
    required: true
  },
  tipoMovimentacao: {
    type: String,
    enum: ['entrada', 'saída'],
    required: true
  },
  quantidade: {
    type: Number,
    required: true,
    min: 1
  },
  ordemServicoId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'OrdemServico'
  },
  responsavelId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  observacao: {
    type: String,
    trim: true
  },
  data: {
    type: Date,
    default: Date.now,
    required: true
  }
}, {
  timestamps: true
});

const MovimentacaoEstoque = mongoose.model('MovimentacaoEstoque', movimentacaoEstoqueSchema);

module.exports = MovimentacaoEstoque;
