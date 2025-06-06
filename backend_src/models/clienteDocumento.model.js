const mongoose = require('mongoose');

const clienteDocumentoSchema = new mongoose.Schema({
  cliente: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cliente',
    required: true
  },
  nome: {
    type: String,
    required: true,
    trim: true
  },
  tipo: {
    type: String,
    required: true,
    enum: ['recibo', 'nota_fiscal', 'contrato', 'ordem_servico', 'foto', 'identidade', 'comprovante_residencia', 'outro'],
    default: 'outro'
  },
  descricao: {
    type: String,
    trim: true
  },
  caminhoArquivo: {
    type: String,
    required: true
  },
  tamanhoArquivo: {
    type: Number,
    required: true
  },
  tipoArquivo: {
    type: String,
    required: true
  },
  referencia: {
    // Referência opcional para outros documentos do sistema (ex: ID de uma ordem de serviço)
    tipo: {
      type: String,
      enum: ['ordem_servico', 'orcamento', 'contrato', 'visita', 'financeiro', 'storage', 'outro'],
      default: 'outro'
    },
    id: {
      type: mongoose.Schema.Types.ObjectId,
      required: function() {
        return this.referencia && this.referencia.tipo !== 'outro';
      }
    },
    descricao: {
      type: String,
      trim: true
    }
  },
  dataCriacao: {
    type: Date,
    default: Date.now
  },
  criadoPor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  ativo: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Índices para melhorar a performance de consultas
clienteDocumentoSchema.index({ cliente: 1 });
clienteDocumentoSchema.index({ tipo: 1 });
clienteDocumentoSchema.index({ 'referencia.tipo': 1, 'referencia.id': 1 });

const ClienteDocumento = mongoose.model('ClienteDocumento', clienteDocumentoSchema);

module.exports = ClienteDocumento;
