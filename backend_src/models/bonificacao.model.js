const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const bonificacaoSchema = new Schema({
  funcionarioId: {
    type: Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true
  },
  ordemServicoId: {
    type: Schema.Types.ObjectId,
    ref: 'OrdemServico',
    required: true
  },
  clienteId: {
    type: Schema.Types.ObjectId,
    ref: 'Cliente',
    required: true
  },
  tipoAvaliacao: {
    type: String,
    enum: ['google', 'whatsapp', 'sistema'],
    required: true
  },
  pontuacao: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comentario: {
    type: String
  },
  valorBonificacao: {
    type: Number,
    required: true,
    min: 0
  },
  pago: {
    type: Boolean,
    default: false
  },
  dataPagamento: {
    type: Date
  },
  dataAvaliacao: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

module.exports = mongoose.model('Bonificacao', bonificacaoSchema);
