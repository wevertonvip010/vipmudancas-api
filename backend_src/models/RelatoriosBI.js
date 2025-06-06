const mongoose = require('mongoose');

// Modelo para Dashboards
const dashboardSchema = new mongoose.Schema({
  codigo: {
    type: String,
    required: true,
    unique: true
  },
  nome: {
    type: String,
    required: true
  },
  descricao: String,
  tipo: {
    type: String,
    enum: ['executivo', 'financeiro', 'vendas', 'operacional', 'estoque', 'producao', 'personalizado'],
    required: true
  },
  componentes: [{
    tipo: {
      type: String,
      enum: ['grafico', 'tabela', 'indicador', 'lista', 'mapa', 'calendario'],
      required: true
    },
    titulo: String,
    subtitulo: String,
    posicao: {
      linha: Number,
      coluna: Number,
      largura: Number,
      altura: Number
    },
    configuracao: {
      tipo_grafico: String,
      fonte_dados: String,
      campos: [String],
      filtros: mongoose.Schema.Types.Mixed,
      ordenacao: String,
      limite: Number,
      cores: [String],
      formato_numero: String,
      periodo: String,
      atualizacao_automatica: Boolean,
      intervalo_atualizacao: Number
    },
    permissoes: {
      papeis: [String],
      usuarios: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuario'
      }]
    }
  }],
  filtros_globais: [{
    campo: String,
    tipo: String,
    valor_padrao: mongoose.Schema.Types.Mixed,
    obrigatorio: Boolean
  }],
  permissoes: {
    papeis: [String],
    usuarios: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Usuario'
    }]
  },
  configuracoes: {
    atualizacao_automatica: {
      type: Boolean,
      default: true
    },
    intervalo_atualizacao: {
      type: Number,
      default: 300
    },
    tema: {
      type: String,
      default: 'claro'
    },
    layout: String
  },
  padrao_para: [String],
  ativo: {
    type: Boolean,
    default: true
  },
  criado_por: {
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

// Modelo para Relatórios
const relatorioSchema = new mongoose.Schema({
  codigo: {
    type: String,
    required: true,
    unique: true
  },
  nome: {
    type: String,
    required: true
  },
  descricao: String,
  categoria: {
    type: String,
    enum: ['financeiro', 'vendas', 'estoque', 'producao', 'operacional', 'administrativo', 'personalizado'],
    required: true
  },
  tipo: {
    type: String,
    enum: ['tabular', 'grafico', 'misto', 'detalhado', 'resumido'],
    default: 'tabular'
  },
  fonte_dados: {
    colecao: String,
    consulta: mongoose.Schema.Types.Mixed,
    campos: [String],
    joins: [{
      colecao: String,
      campo_local: String,
      campo_externo: String,
      tipo: String
    }]
  },
  parametros: [{
    nome: String,
    descricao: String,
    tipo: {
      type: String,
      enum: ['texto', 'numero', 'data', 'booleano', 'selecao', 'multiselecao'],
      required: true
    },
    obrigatorio: Boolean,
    valor_padrao: mongoose.Schema.Types.Mixed,
    opcoes: [mongoose.Schema.Types.Mixed]
  }],
  colunas: [{
    campo: String,
    titulo: String,
    tipo: String,
    formato: String,
    largura: String,
    alinhamento: String,
    visivel: Boolean,
    ordenavel: Boolean,
    agrupavel: Boolean,
    totalizavel: Boolean
  }],
  filtros: [{
    campo: String,
    operador: String,
    valor: mongoose.Schema.Types.Mixed
  }],
  ordenacao: [{
    campo: String,
    direcao: {
      type: String,
      enum: ['asc', 'desc'],
      default: 'asc'
    }
  }],
  agrupamento: [{
    campo: String,
    funcao: {
      type: String,
      enum: ['count', 'sum', 'avg', 'min', 'max'],
      default: 'count'
    }
  }],
  graficos: [{
    tipo: {
      type: String,
      enum: ['barra', 'linha', 'pizza', 'area', 'dispersao', 'radar', 'gauge'],
      required: true
    },
    titulo: String,
    eixo_x: String,
    eixo_y: String,
    series: [String],
    cores: [String],
    legenda: Boolean,
    empilhado: Boolean
  }],
  formatos_exportacao: [{
    type: String,
    enum: ['pdf', 'excel', 'csv', 'html', 'json'],
    default: ['pdf', 'excel']
  }],
  agendamento: {
    ativo: {
      type: Boolean,
      default: false
    },
    frequencia: {
      type: String,
      enum: ['diario', 'semanal', 'mensal', 'trimestral', 'anual']
    },
    dia_semana: Number,
    dia_mes: Number,
    hora: Number,
    minuto: Number,
    proxima_execucao: Date,
    destinatarios: [String],
    formato: String,
    assunto: String,
    mensagem: String
  },
  permissoes: {
    papeis: [String],
    usuarios: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Usuario'
    }]
  },
  ativo: {
    type: Boolean,
    default: true
  },
  criado_por: {
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

// Modelo para KPIs (Indicadores-Chave de Desempenho)
const kpiSchema = new mongoose.Schema({
  codigo: {
    type: String,
    required: true,
    unique: true
  },
  nome: {
    type: String,
    required: true
  },
  descricao: String,
  categoria: {
    type: String,
    enum: ['financeiro', 'vendas', 'estoque', 'producao', 'operacional', 'administrativo'],
    required: true
  },
  unidade: {
    type: String,
    enum: ['valor', 'percentual', 'quantidade', 'tempo', 'indice'],
    required: true
  },
  formula: {
    descricao: String,
    calculo: String,
    variaveis: [{
      nome: String,
      fonte: String,
      campo: String,
      filtro: mongoose.Schema.Types.Mixed
    }]
  },
  metas: [{
    periodo: {
      inicio: Date,
      fim: Date
    },
    valor: Number,
    minimo: Number,
    satisfatorio: Number,
    excelente: Number
  }],
  tendencia: {
    type: String,
    enum: ['maior_melhor', 'menor_melhor', 'faixa_ideal'],
    required: true
  },
  visualizacao: {
    tipo: {
      type: String,
      enum: ['numero', 'gauge', 'barra_progresso', 'semaforo', 'tendencia'],
      default: 'numero'
    },
    cores: {
      baixo: String,
      medio: String,
      alto: String
    },
    formato: String,
    casas_decimais: Number,
    mostrar_variacao: Boolean,
    mostrar_meta: Boolean
  },
  frequencia_calculo: {
    type: String,
    enum: ['tempo_real', 'horaria', 'diaria', 'semanal', 'mensal', 'trimestral', 'anual'],
    default: 'diaria'
  },
  historico: [{
    data: Date,
    valor: Number,
    meta: Number,
    variacao: Number
  }],
  alertas: [{
    condicao: {
      type: String,
      enum: ['acima', 'abaixo', 'igual', 'entre', 'fora'],
      required: true
    },
    valor: mongoose.Schema.Types.Mixed,
    valor2: mongoose.Schema.Types.Mixed,
    mensagem: String,
    destinatarios: [String],
    canais: [{
      type: String,
      enum: ['email', 'sms', 'notificacao', 'whatsapp'],
      default: ['email', 'notificacao']
    }],
    ativo: Boolean
  }],
  permissoes: {
    papeis: [String],
    usuarios: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Usuario'
    }]
  },
  ativo: {
    type: Boolean,
    default: true
  },
  criado_por: {
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

// Modelo para Análises Avançadas
const analiseAvancadaSchema = new mongoose.Schema({
  codigo: {
    type: String,
    required: true,
    unique: true
  },
  nome: {
    type: String,
    required: true
  },
  descricao: String,
  tipo: {
    type: String,
    enum: ['previsao', 'segmentacao', 'correlacao', 'tendencia', 'anomalia', 'personalizada'],
    required: true
  },
  fonte_dados: {
    colecoes: [String],
    periodo: {
      inicio: Date,
      fim: Date
    },
    filtros: mongoose.Schema.Types.Mixed,
    campos: [String]
  },
  configuracao: {
    algoritmo: String,
    parametros: mongoose.Schema.Types.Mixed,
    pre_processamento: [String],
    validacao: String,
    metricas: [String]
  },
  resultados: {
    data_execucao: Date,
    metricas: mongoose.Schema.Types.Mixed,
    dados: mongoose.Schema.Types.Mixed,
    interpretacao: String
  },
  visualizacoes: [{
    tipo: {
      type: String,
      enum: ['grafico', 'tabela', 'mapa', 'texto'],
      required: true
    },
    titulo: String,
    configuracao: mongoose.Schema.Types.Mixed
  }],
  agendamento: {
    ativo: {
      type: Boolean,
      default: false
    },
    frequencia: {
      type: String,
      enum: ['diario', 'semanal', 'mensal', 'sob_demanda'],
      default: 'sob_demanda'
    },
    proxima_execucao: Date
  },
  permissoes: {
    papeis: [String],
    usuarios: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Usuario'
    }]
  },
  ativo: {
    type: Boolean,
    default: true
  },
  criado_por: {
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

const Dashboard = mongoose.model('Dashboard', dashboardSchema);
const Relatorio = mongoose.model('Relatorio', relatorioSchema);
const KPI = mongoose.model('KPI', kpiSchema);
const AnaliseAvancada = mongoose.model('AnaliseAvancada', analiseAvancadaSchema);

module.exports = {
  Dashboard,
  Relatorio,
  KPI,
  AnaliseAvancada
};
