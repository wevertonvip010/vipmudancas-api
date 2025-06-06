const mongoose = require('mongoose');

const avaliacaoSchema = new mongoose.Schema({
  // Identificação
  clienteId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: true
  },
  contratoId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Contract',
    required: true
  },
  vendedorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Dados da avaliação
  nota: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comentario: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  
  // Avaliações específicas
  avaliacaoDetalhada: {
    pontualidade: {
      type: Number,
      min: 1,
      max: 5
    },
    cuidadoItens: {
      type: Number,
      min: 1,
      max: 5
    },
    atendimento: {
      type: Number,
      min: 1,
      max: 5
    },
    limpeza: {
      type: Number,
      min: 1,
      max: 5
    },
    precoJusto: {
      type: Number,
      min: 1,
      max: 5
    }
  },
  
  // Dados do cliente
  nomeCliente: {
    type: String,
    required: true,
    trim: true
  },
  emailCliente: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  telefoneCliente: {
    type: String,
    trim: true
  },
  
  // Controle de acesso
  tokenAvaliacao: {
    type: String,
    required: true,
    unique: true
  },
  linkAvaliacao: {
    type: String,
    required: true
  },
  
  // Status e controle
  status: {
    type: String,
    enum: ['pendente', 'respondida', 'expirada'],
    default: 'pendente'
  },
  dataEnvio: {
    type: Date,
    default: Date.now
  },
  dataResposta: Date,
  dataExpiracao: {
    type: Date,
    default: function() {
      // Expira em 30 dias
      const data = new Date();
      data.setDate(data.getDate() + 30);
      return data;
    }
  },
  
  // Dados técnicos
  ipResposta: String,
  userAgentResposta: String,
  
  // Recomendação
  recomendaria: {
    type: Boolean,
    default: null
  },
  motivoNaoRecomendacao: {
    type: String,
    trim: true
  },
  
  // Dados da mudança
  dadosMudanca: {
    dataServico: Date,
    enderecoOrigem: String,
    enderecoDestino: String,
    valorServico: Number,
    tipoServico: String
  },
  
  // Controle interno
  publicada: {
    type: Boolean,
    default: false
  },
  moderada: {
    type: Boolean,
    default: false
  },
  moderadoPor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  motivoModeração: String,
  
  // Resposta da empresa
  respostaEmpresa: {
    texto: String,
    data: Date,
    usuario: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }
}, {
  timestamps: true
});

// Índices para otimização
avaliacaoSchema.index({ clienteId: 1 });
avaliacaoSchema.index({ contratoId: 1 });
avaliacaoSchema.index({ vendedorId: 1 });
avaliacaoSchema.index({ tokenAvaliacao: 1 });
avaliacaoSchema.index({ status: 1 });
avaliacaoSchema.index({ nota: 1 });
avaliacaoSchema.index({ dataEnvio: -1 });
avaliacaoSchema.index({ dataExpiracao: 1 });

// Método para gerar token único
avaliacaoSchema.statics.gerarToken = function() {
  const crypto = require('crypto');
  return crypto.randomBytes(32).toString('hex');
};

// Método para gerar link de avaliação
avaliacaoSchema.methods.gerarLink = function() {
  const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  this.linkAvaliacao = `${baseUrl}/avaliacao/${this.tokenAvaliacao}`;
  return this.linkAvaliacao;
};

// Método para verificar se está expirada
avaliacaoSchema.methods.estaExpirada = function() {
  return new Date() > this.dataExpiracao;
};

// Método para calcular nota média
avaliacaoSchema.methods.calcularNotaMedia = function() {
  const avaliacoes = this.avaliacaoDetalhada;
  if (!avaliacoes) return this.nota;
  
  const notas = Object.values(avaliacoes).filter(nota => nota !== null && nota !== undefined);
  if (notas.length === 0) return this.nota;
  
  const soma = notas.reduce((acc, nota) => acc + nota, 0);
  return Math.round((soma / notas.length) * 10) / 10;
};

// Método para responder avaliação
avaliacaoSchema.methods.responder = function(dadosResposta, ip, userAgent) {
  this.nota = dadosResposta.nota;
  this.comentario = dadosResposta.comentario || '';
  this.avaliacaoDetalhada = dadosResposta.avaliacaoDetalhada || {};
  this.recomendaria = dadosResposta.recomendaria;
  this.motivoNaoRecomendacao = dadosResposta.motivoNaoRecomendacao || '';
  
  this.status = 'respondida';
  this.dataResposta = new Date();
  this.ipResposta = ip;
  this.userAgentResposta = userAgent;
  
  return this.save();
};

// Método estático para obter estatísticas por vendedor
avaliacaoSchema.statics.obterEstatisticasVendedor = function(vendedorId, periodo = 30) {
  const dataInicio = new Date();
  dataInicio.setDate(dataInicio.getDate() - periodo);
  
  return this.aggregate([
    {
      $match: {
        vendedorId: new mongoose.Types.ObjectId(vendedorId),
        status: 'respondida',
        dataResposta: { $gte: dataInicio }
      }
    },
    {
      $group: {
        _id: null,
        totalAvaliacoes: { $sum: 1 },
        notaMedia: { $avg: '$nota' },
        notaMaxima: { $max: '$nota' },
        notaMinima: { $min: '$nota' },
        recomendacoes: {
          $sum: { $cond: [{ $eq: ['$recomendaria', true] }, 1, 0] }
        },
        avaliacoes5Estrelas: {
          $sum: { $cond: [{ $eq: ['$nota', 5] }, 1, 0] }
        },
        avaliacoes4Estrelas: {
          $sum: { $cond: [{ $eq: ['$nota', 4] }, 1, 0] }
        },
        avaliacoes3Estrelas: {
          $sum: { $cond: [{ $eq: ['$nota', 3] }, 1, 0] }
        },
        avaliacoes2Estrelas: {
          $sum: { $cond: [{ $eq: ['$nota', 2] }, 1, 0] }
        },
        avaliacoes1Estrela: {
          $sum: { $cond: [{ $eq: ['$nota', 1] }, 1, 0] }
        }
      }
    }
  ]);
};

// Método estático para obter estatísticas gerais
avaliacaoSchema.statics.obterEstatisticasGerais = function(periodo = 30) {
  const dataInicio = new Date();
  dataInicio.setDate(dataInicio.getDate() - periodo);
  
  return this.aggregate([
    {
      $match: {
        status: 'respondida',
        dataResposta: { $gte: dataInicio }
      }
    },
    {
      $group: {
        _id: null,
        totalAvaliacoes: { $sum: 1 },
        notaMedia: { $avg: '$nota' },
        taxaResposta: {
          $avg: {
            $cond: [{ $eq: ['$status', 'respondida'] }, 1, 0]
          }
        },
        taxaRecomendacao: {
          $avg: {
            $cond: [{ $eq: ['$recomendaria', true] }, 1, 0]
          }
        }
      }
    }
  ]);
};

// Método estático para obter ranking de vendedores
avaliacaoSchema.statics.obterRankingVendedores = function(periodo = 30, limite = 10) {
  const dataInicio = new Date();
  dataInicio.setDate(dataInicio.getDate() - periodo);
  
  return this.aggregate([
    {
      $match: {
        status: 'respondida',
        dataResposta: { $gte: dataInicio }
      }
    },
    {
      $group: {
        _id: '$vendedorId',
        totalAvaliacoes: { $sum: 1 },
        notaMedia: { $avg: '$nota' },
        recomendacoes: {
          $sum: { $cond: [{ $eq: ['$recomendaria', true] }, 1, 0] }
        }
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'vendedor'
      }
    },
    {
      $unwind: '$vendedor'
    },
    {
      $sort: { notaMedia: -1, totalAvaliacoes: -1 }
    },
    {
      $limit: limite
    }
  ]);
};

// Middleware para atualizar status expirado
avaliacaoSchema.pre('find', function() {
  this.where({
    $or: [
      { status: { $ne: 'expirada' } },
      { dataExpiracao: { $gt: new Date() } }
    ]
  });
});

// Método para expirar avaliações antigas
avaliacaoSchema.statics.expirarAvaliacoes = function() {
  return this.updateMany(
    {
      status: 'pendente',
      dataExpiracao: { $lt: new Date() }
    },
    {
      $set: { status: 'expirada' }
    }
  );
};

module.exports = mongoose.model('Avaliacao', avaliacaoSchema);

