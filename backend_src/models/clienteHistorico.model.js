const mongoose = require('mongoose');

const clienteHistoricoSchema = new mongoose.Schema({
  cliente: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cliente',
    required: true
  },
  tipo: {
    type: String,
    required: true,
    enum: ['visita', 'orcamento', 'contrato', 'ordem_servico', 'pagamento', 'storage', 'documento', 'atualizacao', 'outro'],
    default: 'outro'
  },
  titulo: {
    type: String,
    required: true,
    trim: true
  },
  descricao: {
    type: String,
    trim: true
  },
  // Referência para outros documentos do sistema
  referencia: {
    tipo: {
      type: String,
      enum: ['visita', 'orcamento', 'contrato', 'ordem_servico', 'financeiro', 'storage', 'documento', 'outro'],
      default: 'outro'
    },
    id: {
      type: mongoose.Schema.Types.ObjectId
    }
  },
  // Metadados adicionais em formato flexível
  metadados: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  },
  dataCriacao: {
    type: Date,
    default: Date.now
  },
  criadoPor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Índices para melhorar a performance de consultas
clienteHistoricoSchema.index({ cliente: 1, dataCriacao: -1 });
clienteHistoricoSchema.index({ tipo: 1 });
clienteHistoricoSchema.index({ 'referencia.tipo': 1, 'referencia.id': 1 });

const ClienteHistorico = mongoose.model('ClienteHistorico', clienteHistoricoSchema);

module.exports = ClienteHistorico;
