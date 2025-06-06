const mongoose = require('mongoose');

// Modelo para Personalização e Integração
const personalizacaoSchema = new mongoose.Schema({
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
    enum: ['campo_personalizado', 'formulario_personalizado', 'fluxo_trabalho', 'integracao', 'script', 'regra_negocio'],
    required: true
  },
  entidade: {
    type: String,
    required: true
  },
  configuracao: mongoose.Schema.Types.Mixed,
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

// Modelo para Campos Personalizados
const campoPersonalizadoSchema = new mongoose.Schema({
  codigo: {
    type: String,
    required: true,
    unique: true
  },
  entidade: {
    type: String,
    required: true
  },
  nome: {
    type: String,
    required: true
  },
  rotulo: {
    type: String,
    required: true
  },
  tipo: {
    type: String,
    enum: ['texto', 'numero', 'data', 'booleano', 'selecao', 'multiselecao', 'arquivo', 'link', 'calculado'],
    required: true
  },
  obrigatorio: {
    type: Boolean,
    default: false
  },
  valor_padrao: mongoose.Schema.Types.Mixed,
  opcoes: [mongoose.Schema.Types.Mixed],
  validacao: {
    regex: String,
    min: Number,
    max: Number,
    mensagem_erro: String
  },
  formula: String,
  visibilidade: {
    papeis: [String],
    usuarios: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Usuario'
    }],
    condicional: {
      campo: String,
      operador: String,
      valor: mongoose.Schema.Types.Mixed
    }
  },
  apresentacao: {
    grupo: String,
    ordem: Number,
    estilo: String,
    dica: String,
    placeholder: String,
    largura: String
  },
  indexado: Boolean,
  pesquisavel: Boolean,
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

// Modelo para Fluxos de Trabalho
const fluxoTrabalhoSchema = new mongoose.Schema({
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
  entidade: {
    type: String,
    required: true
  },
  evento_disparo: {
    type: String,
    enum: ['criar', 'atualizar', 'excluir', 'status_alterado', 'campo_alterado', 'agendado', 'manual'],
    required: true
  },
  condicoes: [{
    campo: String,
    operador: String,
    valor: mongoose.Schema.Types.Mixed,
    logica: {
      type: String,
      enum: ['e', 'ou'],
      default: 'e'
    }
  }],
  acoes: [{
    tipo: {
      type: String,
      enum: ['atualizar_campo', 'criar_registro', 'enviar_email', 'enviar_notificacao', 'chamar_api', 'executar_script'],
      required: true
    },
    ordem: Number,
    configuracao: mongoose.Schema.Types.Mixed,
    condicional: Boolean,
    condicoes: [{
      campo: String,
      operador: String,
      valor: mongoose.Schema.Types.Mixed,
      logica: {
        type: String,
        enum: ['e', 'ou'],
        default: 'e'
      }
    }]
  }],
  aprovacoes: [{
    nivel: Number,
    tipo: {
      type: String,
      enum: ['usuario', 'papel', 'grupo', 'hierarquia'],
      default: 'usuario'
    },
    aprovadores: [mongoose.Schema.Types.Mixed],
    regra: {
      type: String,
      enum: ['qualquer_um', 'todos', 'maioria'],
      default: 'qualquer_um'
    },
    prazo: Number,
    acoes_aprovacao: [mongoose.Schema.Types.Mixed],
    acoes_rejeicao: [mongoose.Schema.Types.Mixed],
    acoes_timeout: [mongoose.Schema.Types.Mixed]
  }],
  agendamento: {
    ativo: Boolean,
    frequencia: {
      type: String,
      enum: ['minuto', 'hora', 'dia', 'semana', 'mes']
    },
    intervalo: Number,
    dias_semana: [Number],
    hora: Number,
    minuto: Number
  },
  prioridade: {
    type: Number,
    default: 10
  },
  ativo: {
    type: Boolean,
    default: true
  },
  log_execucoes: Boolean,
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

// Modelo para Integrações
const integracaoSchema = new mongoose.Schema({
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
    enum: ['api_rest', 'soap', 'banco_dados', 'arquivo', 'email', 'webhook', 'personalizado'],
    required: true
  },
  direcao: {
    type: String,
    enum: ['entrada', 'saida', 'bidirecional'],
    required: true
  },
  sistema_externo: {
    nome: String,
    url: String,
    logo: String
  },
  configuracao: {
    url: String,
    metodo: String,
    headers: mongoose.Schema.Types.Mixed,
    autenticacao: {
      tipo: {
        type: String,
        enum: ['nenhuma', 'basic', 'api_key', 'oauth', 'jwt', 'personalizada'],
        default: 'nenhuma'
      },
      credenciais: mongoose.Schema.Types.Mixed
    },
    parametros: [mongoose.Schema.Types.Mixed],
    corpo: mongoose.Schema.Types.Mixed,
    timeout: Number,
    retry: {
      tentativas: Number,
      intervalo: Number
    }
  },
  mapeamento: {
    entidade_origem: String,
    entidade_destino: String,
    campos: [{
      origem: String,
      destino: String,
      transformacao: String
    }],
    filtros: mongoose.Schema.Types.Mixed
  },
  agendamento: {
    ativo: Boolean,
    frequencia: {
      type: String,
      enum: ['minuto', 'hora', 'dia', 'semana', 'mes']
    },
    intervalo: Number,
    dias_semana: [Number],
    hora: Number,
    minuto: Number
  },
  eventos_disparo: [{
    entidade: String,
    evento: {
      type: String,
      enum: ['criar', 'atualizar', 'excluir', 'status_alterado', 'campo_alterado'],
      required: true
    },
    filtros: mongoose.Schema.Types.Mixed
  }],
  tratamento_erro: {
    acoes: [{
      tipo: {
        type: String,
        enum: ['retry', 'notificar', 'log', 'alternativa', 'ignorar'],
        default: 'log'
      },
      configuracao: mongoose.Schema.Types.Mixed
    }],
    destinatarios_notificacao: [String]
  },
  historico_execucoes: [{
    data_inicio: Date,
    data_fim: Date,
    status: {
      type: String,
      enum: ['sucesso', 'erro', 'parcial'],
      required: true
    },
    registros_processados: Number,
    registros_sucesso: Number,
    registros_erro: Number,
    detalhes: String,
    log: String
  }],
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

const Personalizacao = mongoose.model('Personalizacao', personalizacaoSchema);
const CampoPersonalizado = mongoose.model('CampoPersonalizado', campoPersonalizadoSchema);
const FluxoTrabalho = mongoose.model('FluxoTrabalho', fluxoTrabalhoSchema);
const Integracao = mongoose.model('Integracao', integracaoSchema);

module.exports = {
  Personalizacao,
  CampoPersonalizado,
  FluxoTrabalho,
  Integracao
};
