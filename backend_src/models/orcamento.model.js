const mongoose = require('mongoose');

const orcamentoSchema = new mongoose.Schema({
  clienteId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cliente',
    required: true
  },
  visitaId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Visita'
  },
  responsavelId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  numero: {
    type: String,
    required: true,
    unique: true
  },
  data: {
    type: Date,
    default: Date.now,
    required: true
  },
  enderecoOrigem: {
    rua: {
      type: String,
      required: true,
      trim: true
    },
    numero: {
      type: String,
      required: true,
      trim: true
    },
    complemento: {
      type: String,
      trim: true
    },
    bairro: {
      type: String,
      required: true,
      trim: true
    },
    cidade: {
      type: String,
      required: true,
      trim: true
    },
    estado: {
      type: String,
      required: true,
      trim: true
    },
    cep: {
      type: String,
      required: true,
      trim: true
    }
  },
  enderecoDestino: {
    rua: {
      type: String,
      required: true,
      trim: true
    },
    numero: {
      type: String,
      required: true,
      trim: true
    },
    complemento: {
      type: String,
      trim: true
    },
    bairro: {
      type: String,
      required: true,
      trim: true
    },
    cidade: {
      type: String,
      required: true,
      trim: true
    },
    estado: {
      type: String,
      required: true,
      trim: true
    },
    cep: {
      type: String,
      required: true,
      trim: true
    }
  },
  itens: [{
    descricao: {
      type: String,
      required: true,
      trim: true
    },
    quantidade: {
      type: Number,
      required: true,
      min: 1
    },
    valorUnitario: {
      type: Number,
      required: true,
      min: 0
    },
    valorTotal: {
      type: Number,
      required: true,
      min: 0
    }
  }],
  valorTotal: {
    type: Number,
    required: true,
    min: 0
  },
  desconto: {
    type: Number,
    default: 0,
    min: 0
  },
  valorFinal: {
    type: Number,
    required: true,
    min: 0
  },
  // NOVOS CAMPOS PARA CÁLCULO DE COMISSÃO
  valorMudanca: {
    type: Number,
    required: true,
    min: 0,
    comment: 'Valor da mudança sem incluir seguro'
  },
  valorImovel: {
    type: Number,
    default: 0,
    min: 0,
    comment: 'Valor do imóvel para cálculo do seguro'
  },
  valorSeguro: {
    type: Number,
    default: 0,
    min: 0,
    comment: 'Valor do seguro (1% do valor do imóvel)'
  },
  percentualComissao: {
    type: Number,
    default: 0,
    min: 0,
    max: 100,
    comment: 'Percentual de comissão do vendedor'
  },
  valorComissao: {
    type: Number,
    default: 0,
    min: 0,
    comment: 'Valor da comissão calculado automaticamente'
  },
  // CAMPO PARA JUSTIFICATIVA QUANDO NÃO FECHADO
  justificativaNaoFechado: {
    type: String,
    trim: true,
    comment: 'Justificativa obrigatória quando orçamento não é fechado'
  },
  formaPagamento: {
    type: String,
    trim: true
  },
  condicoesPagamento: {
    type: String,
    trim: true
  },
  observacoes: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['pendente', 'aprovado', 'rejeitado', 'expirado', 'nao_fechado'],
    default: 'pendente'
  },
  dataValidade: {
    type: Date,
    required: true
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

// Middleware para calcular automaticamente o valor da comissão e seguro
orcamentoSchema.pre('save', function(next) {
  // Calcular valor do seguro (1% do valor do imóvel)
  if (this.valorImovel > 0) {
    this.valorSeguro = this.valorImovel * 0.01;
  }
  
  // Calcular valor da comissão (percentual sobre valor da mudança, SEM seguro)
  if (this.valorMudanca > 0 && this.percentualComissao > 0) {
    this.valorComissao = (this.valorMudanca * this.percentualComissao) / 100;
  }
  
  // Atualizar valor final (mudança + seguro - desconto)
  this.valorFinal = (this.valorMudanca + this.valorSeguro) - this.desconto;
  this.valorTotal = this.valorFinal;
  
  // Atualizar data de última modificação
  this.ultimaAtualizacao = Date.now();
  
  next();
});

// Validação customizada para justificativa quando não fechado
orcamentoSchema.pre('save', function(next) {
  if (this.status === 'nao_fechado' && !this.justificativaNaoFechado) {
    const error = new Error('Justificativa é obrigatória quando orçamento não é fechado');
    error.name = 'ValidationError';
    return next(error);
  }
  next();
});

const Orcamento = mongoose.model('Orcamento', orcamentoSchema);

module.exports = Orcamento;

