const mongoose = require('mongoose');

// Modelo para Planejamento de Materiais (MRP)
const mrpSchema = new mongoose.Schema({
  codigo: {
    type: String,
    required: true,
    unique: true
  },
  descricao: {
    type: String,
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
  responsavel: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true
  },
  status: {
    type: String,
    enum: ['planejamento', 'em_execucao', 'concluido', 'cancelado'],
    default: 'planejamento'
  },
  parametros: {
    considerar_previsao_vendas: {
      type: Boolean,
      default: true
    },
    considerar_estoque_seguranca: {
      type: Boolean,
      default: true
    },
    considerar_pedidos_pendentes: {
      type: Boolean,
      default: true
    },
    considerar_ordens_producao: {
      type: Boolean,
      default: true
    },
    horizonte_planejamento: {
      type: Number,
      default: 30
    },
    intervalo_calculo: {
      type: String,
      enum: ['diario', 'semanal', 'quinzenal', 'mensal'],
      default: 'semanal'
    }
  },
  materiais: [{
    material: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Material',
      required: true
    },
    estoque_atual: Number,
    estoque_seguranca: Number,
    ponto_pedido: Number,
    lead_time: Number,
    demanda_prevista: Number,
    quantidade_necessaria: Number,
    quantidade_sugerida: Number,
    data_necessidade: Date,
    fornecedores_sugeridos: [{
      fornecedor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Fornecedor'
      },
      preco: Number,
      prazo_entrega: Number
    }],
    acao_sugerida: {
      type: String,
      enum: ['comprar', 'produzir', 'transferir', 'nenhuma'],
      default: 'nenhuma'
    },
    prioridade: {
      type: String,
      enum: ['baixa', 'media', 'alta', 'critica'],
      default: 'media'
    },
    observacoes: String
  }],
  requisicoes_geradas: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RequisicaoCompra'
  }],
  ordens_producao_geradas: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'OrdemProducao'
  }],
  historico_execucao: [{
    data: Date,
    usuario: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Usuario'
    },
    acao: String,
    detalhes: String
  }],
  observacoes: String,
  criado_em: {
    type: Date,
    default: Date.now
  },
  atualizado_em: {
    type: Date,
    default: Date.now
  }
});

// Modelo para Lista de Materiais (BOM - Bill of Materials)
const listaMateriaisSchema = new mongoose.Schema({
  codigo: {
    type: String,
    required: true,
    unique: true
  },
  descricao: {
    type: String,
    required: true
  },
  produto_final: {
    material: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Material',
      required: true
    },
    quantidade: {
      type: Number,
      required: true,
      default: 1
    },
    unidade: String
  },
  componentes: [{
    material: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Material',
      required: true
    },
    quantidade: {
      type: Number,
      required: true
    },
    unidade: String,
    etapa: Number,
    obrigatorio: {
      type: Boolean,
      default: true
    },
    alternativo: {
      type: Boolean,
      default: false
    },
    material_alternativo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Material'
    },
    observacoes: String
  }],
  instrucoes_montagem: String,
  tempo_producao: {
    preparacao: Number,
    execucao: Number,
    finalizacao: Number,
    unidade_tempo: {
      type: String,
      enum: ['minutos', 'horas', 'dias'],
      default: 'minutos'
    }
  },
  recursos_necessarios: [{
    tipo: {
      type: String,
      enum: ['maquina', 'ferramenta', 'pessoa', 'espaco'],
      required: true
    },
    descricao: String,
    quantidade: Number,
    tempo_utilizacao: Number,
    etapa: Number
  }],
  versao: {
    type: String,
    default: '1.0'
  },
  ativo: {
    type: Boolean,
    default: true
  },
  responsavel: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true
  },
  aprovado_por: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario'
  },
  data_aprovacao: Date,
  anexos: [{
    nome: String,
    arquivo: String,
    tipo: String
  }],
  observacoes: String,
  criado_em: {
    type: Date,
    default: Date.now
  },
  atualizado_em: {
    type: Date,
    default: Date.now
  }
});

// Modelo para Ordens de Produção
const ordemProducaoSchema = new mongoose.Schema({
  numero: {
    type: String,
    required: true,
    unique: true
  },
  lista_materiais: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ListaMateriais',
    required: true
  },
  produto: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Material',
    required: true
  },
  quantidade: {
    type: Number,
    required: true
  },
  unidade: String,
  data_emissao: {
    type: Date,
    default: Date.now,
    required: true
  },
  data_inicio_planejada: {
    type: Date,
    required: true
  },
  data_fim_planejada: {
    type: Date,
    required: true
  },
  data_inicio_real: Date,
  data_fim_real: Date,
  prioridade: {
    type: String,
    enum: ['baixa', 'normal', 'alta', 'urgente'],
    default: 'normal'
  },
  status: {
    type: String,
    enum: ['planejada', 'liberada', 'em_producao', 'pausada', 'concluida', 'cancelada'],
    default: 'planejada'
  },
  historico_status: [{
    status: String,
    data: Date,
    usuario: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Usuario'
    },
    observacao: String
  }],
  componentes_requisitados: [{
    material: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Material'
    },
    quantidade_necessaria: Number,
    quantidade_separada: Number,
    lotes: [{
      lote: String,
      quantidade: Number
    }],
    status: {
      type: String,
      enum: ['pendente', 'parcial', 'completo'],
      default: 'pendente'
    },
    data_separacao: Date,
    responsavel_separacao: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Usuario'
    }
  }],
  etapas_producao: [{
    numero: Number,
    descricao: String,
    tempo_estimado: Number,
    tempo_real: Number,
    data_inicio: Date,
    data_fim: Date,
    responsavel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Usuario'
    },
    status: {
      type: String,
      enum: ['pendente', 'em_andamento', 'concluida', 'cancelada'],
      default: 'pendente'
    },
    observacoes: String
  }],
  produto_acabado: {
    quantidade_produzida: Number,
    quantidade_aprovada: Number,
    quantidade_rejeitada: Number,
    lotes_gerados: [{
      lote: String,
      quantidade: Number,
      data_producao: Date,
      validade: Date
    }],
    data_entrada_estoque: Date,
    responsavel_qualidade: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Usuario'
    }
  },
  custos: {
    materiais: Number,
    mao_de_obra: Number,
    indiretos: Number,
    total: Number
  },
  pedido_venda: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PedidoVenda'
  },
  ordem_servico: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'OrdemServico'
  },
  mrp: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MRP'
  },
  anexos: [{
    nome: String,
    arquivo: String,
    tipo: String
  }],
  observacoes: String,
  responsavel: {
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

const MRP = mongoose.model('MRP', mrpSchema);
const ListaMateriais = mongoose.model('ListaMateriais', listaMateriaisSchema);
const OrdemProducao = mongoose.model('OrdemProducao', ordemProducaoSchema);

module.exports = {
  MRP,
  ListaMateriais,
  OrdemProducao
};
