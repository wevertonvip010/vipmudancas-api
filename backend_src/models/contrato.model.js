const mongoose = require('mongoose');

const contratoSchema = new mongoose.Schema({
  orcamentoId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Orcamento',
    required: true
  },
  clienteId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cliente',
    required: true
  },
  responsavelId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  ordemServicoId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'OrdemServico'
  },
  // CAMPO ATUALIZADO PARA NUMERAÇÃO AUTOMÁTICA
  numeroContrato: {
    type: String,
    required: true,
    unique: true,
    comment: 'Número automático no formato 0001/2025'
  },
  // Campo mantido para compatibilidade
  numero: {
    type: String,
    required: true,
    unique: true
  },
  dataAssinatura: {
    type: Date,
    required: true
  },
  dataInicio: {
    type: Date,
    required: true
  },
  dataTermino: {
    type: Date,
    required: true
  },
  valorTotal: {
    type: Number,
    required: true,
    min: 0
  },
  formaPagamento: {
    type: String,
    required: true,
    trim: true
  },
  condicoesPagamento: {
    type: String,
    required: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['ativo', 'concluído', 'cancelado'],
    default: 'ativo'
  },
  termos: {
    type: String,
    required: true
  },
  observacoes: {
    type: String,
    trim: true
  },
  // NOVOS CAMPOS PARA AUTOMAÇÃO DE DOCUMENTOS
  documentos: {
    contratoGerado: {
      type: Boolean,
      default: false
    },
    ordemServicoGerada: {
      type: Boolean,
      default: false
    },
    reciboGerado: {
      type: Boolean,
      default: false
    },
    pastaClienteCriada: {
      type: Boolean,
      default: false
    },
    caminhoDocumentos: {
      type: String,
      comment: 'Caminho da pasta com documentos do cliente'
    }
  },
  dataCriacao: {
    type: Date,
    default: Date.now
  },
  ultimaAtualizacao: {
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
}, {
  timestamps: true
});

// Middleware para gerar número automático antes de salvar
contratoSchema.pre('save', async function(next) {
  if (this.isNew && !this.numeroContrato) {
    try {
      const NumeracaoContrato = require('./numeracaoContrato.model');
      this.numeroContrato = await NumeracaoContrato.obterProximoNumero();
      
      // Manter compatibilidade com campo numero
      if (!this.numero) {
        this.numero = this.numeroContrato;
      }
    } catch (error) {
      return next(error);
    }
  }
  
  this.ultimaAtualizacao = Date.now();
  next();
});

// Método para verificar se o contrato está assinado
contratoSchema.methods.isAssinado = function() {
  return this.autentique && this.autentique.status === 'assinado';
};

// Método para verificar se o contrato está pendente de assinatura
contratoSchema.methods.isPendenteAssinatura = function() {
  return this.autentique && this.autentique.status === 'pendente';
};

// Método para verificar se todos os documentos foram gerados
contratoSchema.methods.todosDocumentosGerados = function() {
  return this.documentos.contratoGerado && 
         this.documentos.ordemServicoGerada && 
         this.documentos.reciboGerado && 
         this.documentos.pastaClienteCriada;
};

// Método para obter caminho da pasta do cliente
contratoSchema.methods.obterCaminhoDocumentos = function() {
  if (!this.documentos.caminhoDocumentos) {
    // Gerar caminho baseado no número do contrato e nome do cliente
    const nomeCliente = this.clienteId.nome ? this.clienteId.nome.replace(/[^a-zA-Z0-9]/g, '_') : 'cliente';
    this.documentos.caminhoDocumentos = `uploads/clientes/${nomeCliente}_${this.numeroContrato}`;
  }
  return this.documentos.caminhoDocumentos;
};

// Índices para melhorar a performance
contratoSchema.index({ numeroContrato: 1 }, { unique: true });
contratoSchema.index({ numero: 1 }, { unique: true });
contratoSchema.index({ clienteId: 1 });
contratoSchema.index({ ordemServicoId: 1 }, { unique: true, sparse: true });
contratoSchema.index({ 'autentique.documentId': 1 }, { sparse: true });

const Contrato = mongoose.model('Contrato', contratoSchema);

module.exports = Contrato;

