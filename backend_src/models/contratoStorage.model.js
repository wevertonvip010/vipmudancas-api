const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ContratoStorageSchema = new Schema({
  cliente: {
    type: Schema.Types.ObjectId,
    ref: 'Cliente',
    required: true
  },
  box: {
    type: Schema.Types.ObjectId,
    ref: 'Box',
    required: true
  },
  ordemServicoId: {
    type: Schema.Types.ObjectId,
    ref: 'OrdemServico'
  },
  numero: {
    type: String,
    required: true,
    unique: true
  },
  dataInicio: {
    type: Date,
    required: true
  },
  dataFim: {
    type: Date
  },
  valorMensal: {
    type: Number,
    required: true
  },
  diaPagamento: {
    type: Number,
    required: true,
    min: 1,
    max: 28
  },
  status: {
    type: String,
    enum: ['ativo', 'encerrado', 'inadimplente', 'pendente'],
    default: 'pendente'
  },
  observacoes: String,
  criadoPor: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  criadoEm: {
    type: Date,
    default: Date.now
  },
  atualizadoEm: {
    type: Date,
    default: Date.now
  },
  // Campos para integração com Autentique
  autentique: {
    documentId: String,
    status: {
      type: String,
      enum: ['pendente', 'assinado', 'rejeitado'],
      default: 'pendente'
    },
    dataCriacao: Date,
    ultimaAtualizacao: Date,
    linkAssinatura: String
  }
});

// Middleware para atualizar o campo atualizadoEm antes de salvar
ContratoStorageSchema.pre('save', function(next) {
  this.atualizadoEm = new Date();
  next();
});

// Método para verificar se o contrato está assinado
ContratoStorageSchema.methods.isAssinado = function() {
  return this.autentique && this.autentique.status === 'assinado';
};

// Método para verificar se o contrato está pendente de assinatura
ContratoStorageSchema.methods.isPendenteAssinatura = function() {
  return this.autentique && this.autentique.status === 'pendente';
};

// Índices para melhorar a performance
ContratoStorageSchema.index({ numero: 1 }, { unique: true });
ContratoStorageSchema.index({ cliente: 1 });
ContratoStorageSchema.index({ box: 1 });
ContratoStorageSchema.index({ ordemServicoId: 1 }, { unique: true, sparse: true });
ContratoStorageSchema.index({ 'autentique.documentId': 1 }, { sparse: true });

module.exports = mongoose.model('ContratoStorage', ContratoStorageSchema);
