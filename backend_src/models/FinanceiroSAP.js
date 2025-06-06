const mongoose = require('mongoose');

// Modelo para Plano de Contas
const planoContasSchema = new mongoose.Schema({
  codigo: {
    type: String,
    required: true,
    unique: true
  },
  descricao: {
    type: String,
    required: true
  },
  tipo: {
    type: String,
    enum: ['ativo', 'passivo', 'receita', 'despesa', 'patrimonio'],
    required: true
  },
  nivel: {
    type: Number,
    required: true
  },
  contaPai: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PlanoConta'
  },
  ativo: {
    type: Boolean,
    default: true
  },
  criado_em: {
    type: Date,
    default: Date.now
  },
  atualizado_em: {
    type: Date,
    default: Date.now
  }
});

// Modelo para Lançamentos Contábeis
const lancamentoContabilSchema = new mongoose.Schema({
  numero: {
    type: String,
    required: true,
    unique: true
  },
  data: {
    type: Date,
    required: true
  },
  tipo: {
    type: String,
    enum: ['debito', 'credito', 'transferencia'],
    required: true
  },
  valor: {
    type: Number,
    required: true
  },
  contaDebito: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PlanoConta',
    required: true
  },
  contaCredito: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PlanoConta',
    required: true
  },
  historico: {
    type: String,
    required: true
  },
  documento: {
    type: String
  },
  transacao_relacionada: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'transacao_tipo'
  },
  transacao_tipo: {
    type: String,
    enum: ['Contrato', 'OrdemServico', 'Compra', 'Despesa']
  },
  usuario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true
  },
  estornado: {
    type: Boolean,
    default: false
  },
  lancamento_estorno: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LancamentoContabil'
  },
  criado_em: {
    type: Date,
    default: Date.now
  },
  atualizado_em: {
    type: Date,
    default: Date.now
  }
});

// Modelo para Conciliação Bancária
const conciliacaoBancariaSchema = new mongoose.Schema({
  conta_bancaria: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ContaBancaria',
    required: true
  },
  data_inicio: {
    type: Date,
    required: true
  },
  data_fim: {
    type: Date,
    required: true
  },
  saldo_inicial: {
    type: Number,
    required: true
  },
  saldo_final: {
    type: Number,
    required: true
  },
  saldo_extrato: {
    type: Number,
    required: true
  },
  diferenca: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['em_andamento', 'concluida', 'com_divergencia'],
    default: 'em_andamento'
  },
  itens_conciliados: [{
    lancamento: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'LancamentoContabil'
    },
    item_extrato: {
      data: Date,
      descricao: String,
      valor: Number,
      tipo: {
        type: String,
        enum: ['credito', 'debito']
      }
    },
    conciliado: {
      type: Boolean,
      default: false
    },
    data_conciliacao: Date,
    observacao: String
  }],
  arquivo_extrato: {
    type: String
  },
  usuario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true
  },
  criado_em: {
    type: Date,
    default: Date.now
  },
  atualizado_em: {
    type: Date,
    default: Date.now
  }
});

// Modelo para Contas Bancárias
const contaBancariaSchema = new mongoose.Schema({
  nome: {
    type: String,
    required: true
  },
  banco: {
    type: String,
    required: true
  },
  agencia: {
    type: String,
    required: true
  },
  conta: {
    type: String,
    required: true
  },
  tipo: {
    type: String,
    enum: ['corrente', 'poupanca', 'investimento'],
    required: true
  },
  saldo_atual: {
    type: Number,
    default: 0
  },
  data_ultimo_saldo: {
    type: Date,
    default: Date.now
  },
  integracao_bancaria: {
    ativa: {
      type: Boolean,
      default: false
    },
    tipo_integracao: {
      type: String,
      enum: ['ofx', 'api_direta', 'manual'],
      default: 'manual'
    },
    credenciais: {
      token: String,
      usuario: String,
      senha: String,
      certificado: String
    },
    ultima_sincronizacao: Date
  },
  ativo: {
    type: Boolean,
    default: true
  },
  criado_em: {
    type: Date,
    default: Date.now
  },
  atualizado_em: {
    type: Date,
    default: Date.now
  }
});

// Modelo para Fluxo de Caixa
const fluxoCaixaSchema = new mongoose.Schema({
  data_inicio: {
    type: Date,
    required: true
  },
  data_fim: {
    type: Date,
    required: true
  },
  saldo_inicial: {
    type: Number,
    required: true
  },
  saldo_final: {
    type: Number
  },
  entradas: [{
    data: Date,
    descricao: String,
    valor: Number,
    categoria: String,
    realizado: Boolean,
    origem: {
      tipo: String,
      id: mongoose.Schema.Types.ObjectId
    }
  }],
  saidas: [{
    data: Date,
    descricao: String,
    valor: Number,
    categoria: String,
    realizado: Boolean,
    origem: {
      tipo: String,
      id: mongoose.Schema.Types.ObjectId
    }
  }],
  projecao: [{
    data: Date,
    saldo_projetado: Number
  }],
  usuario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true
  },
  criado_em: {
    type: Date,
    default: Date.now
  },
  atualizado_em: {
    type: Date,
    default: Date.now
  }
});

// Modelo para Relatórios Financeiros
const relatorioFinanceiroSchema = new mongoose.Schema({
  tipo: {
    type: String,
    enum: ['dre', 'balanco', 'fluxo_caixa', 'aging', 'personalizado'],
    required: true
  },
  nome: {
    type: String,
    required: true
  },
  periodo: {
    data_inicio: {
      type: Date,
      required: true
    },
    data_fim: {
      type: Date,
      required: true
    }
  },
  parametros: {
    type: mongoose.Schema.Types.Mixed
  },
  resultado: {
    type: mongoose.Schema.Types.Mixed
  },
  formato: {
    type: String,
    enum: ['pdf', 'excel', 'html', 'json'],
    default: 'pdf'
  },
  arquivo_gerado: {
    type: String
  },
  agendamento: {
    ativo: {
      type: Boolean,
      default: false
    },
    frequencia: {
      type: String,
      enum: ['diario', 'semanal', 'mensal', 'trimestral', 'anual']
    },
    proxima_execucao: Date,
    destinatarios: [String]
  },
  usuario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true
  },
  criado_em: {
    type: Date,
    default: Date.now
  },
  atualizado_em: {
    type: Date,
    default: Date.now
  }
});

const PlanoConta = mongoose.model('PlanoConta', planoContasSchema);
const LancamentoContabil = mongoose.model('LancamentoContabil', lancamentoContabilSchema);
const ConciliacaoBancaria = mongoose.model('ConciliacaoBancaria', conciliacaoBancariaSchema);
const ContaBancaria = mongoose.model('ContaBancaria', contaBancariaSchema);
const FluxoCaixa = mongoose.model('FluxoCaixa', fluxoCaixaSchema);
const RelatorioFinanceiro = mongoose.model('RelatorioFinanceiro', relatorioFinanceiroSchema);

module.exports = {
  PlanoConta,
  LancamentoContabil,
  ConciliacaoBancaria,
  ContaBancaria,
  FluxoCaixa,
  RelatorioFinanceiro
};
