const mongoose = require('mongoose');

// Modelo para Configurações de Mobilidade
const configuracaoMobilidadeSchema = new mongoose.Schema({
  usuario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true
  },
  dispositivos: [{
    tipo: {
      type: String,
      enum: ['smartphone', 'tablet', 'notebook', 'desktop', 'outro'],
      required: true
    },
    sistema_operacional: {
      type: String,
      enum: ['android', 'ios', 'windows', 'macos', 'linux', 'outro'],
      required: true
    },
    identificador: String,
    nome: String,
    modelo: String,
    ultima_sincronizacao: Date,
    token_notificacao: String,
    status: {
      type: String,
      enum: ['ativo', 'inativo', 'bloqueado'],
      default: 'ativo'
    }
  }],
  preferencias: {
    notificacoes: {
      push: Boolean,
      email: Boolean,
      sms: Boolean,
      whatsapp: Boolean
    },
    sincronizacao: {
      automatica: Boolean,
      intervalo: Number,
      apenas_wifi: Boolean,
      dados_offline: [String]
    },
    interface: {
      tema: {
        type: String,
        enum: ['claro', 'escuro', 'sistema'],
        default: 'sistema'
      },
      tamanho_fonte: {
        type: String,
        enum: ['pequeno', 'medio', 'grande', 'extra_grande'],
        default: 'medio'
      },
      modo_compacto: Boolean,
      dashboard_inicial: String
    }
  },
  permissoes_offline: [String],
  modulos_habilitados: [String],
  limites: {
    armazenamento_offline: Number,
    registros_por_consulta: Number,
    dias_historico: Number
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

// Modelo para Notificações
const notificacaoSchema = new mongoose.Schema({
  usuario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true
  },
  titulo: {
    type: String,
    required: true
  },
  mensagem: {
    type: String,
    required: true
  },
  tipo: {
    type: String,
    enum: ['informacao', 'alerta', 'erro', 'sucesso', 'acao_necessaria'],
    default: 'informacao'
  },
  prioridade: {
    type: String,
    enum: ['baixa', 'normal', 'alta', 'urgente'],
    default: 'normal'
  },
  data_criacao: {
    type: Date,
    default: Date.now
  },
  data_expiracao: Date,
  lida: {
    type: Boolean,
    default: false
  },
  data_leitura: Date,
  acao: {
    tipo: {
      type: String,
      enum: ['link', 'rota', 'api', 'nenhuma'],
      default: 'nenhuma'
    },
    valor: String,
    parametros: mongoose.Schema.Types.Mixed
  },
  origem: {
    modulo: String,
    entidade: String,
    id_entidade: mongoose.Schema.Types.ObjectId
  },
  canais_enviados: [{
    canal: {
      type: String,
      enum: ['app', 'email', 'sms', 'whatsapp'],
      required: true
    },
    data_envio: Date,
    status: {
      type: String,
      enum: ['enviado', 'entregue', 'falha', 'pendente'],
      default: 'pendente'
    },
    detalhes: String
  }],
  metadados: mongoose.Schema.Types.Mixed
});

// Modelo para Sincronização Offline
const sincronizacaoOfflineSchema = new mongoose.Schema({
  usuario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true
  },
  dispositivo: {
    identificador: String,
    tipo: String,
    sistema_operacional: String
  },
  ultima_sincronizacao: {
    type: Date,
    default: Date.now
  },
  entidades: [{
    nome: {
      type: String,
      required: true
    },
    ultima_atualizacao: Date,
    registros_sincronizados: Number,
    hash_verificacao: String,
    status: {
      type: String,
      enum: ['sucesso', 'parcial', 'falha', 'pendente'],
      default: 'pendente'
    },
    detalhes: String
  }],
  operacoes_pendentes: [{
    entidade: String,
    operacao: {
      type: String,
      enum: ['criar', 'atualizar', 'excluir'],
      required: true
    },
    id_local: String,
    id_servidor: mongoose.Schema.Types.ObjectId,
    dados: mongoose.Schema.Types.Mixed,
    timestamp_local: Date,
    status: {
      type: String,
      enum: ['pendente', 'enviado', 'conflito', 'sucesso', 'falha'],
      default: 'pendente'
    },
    resolucao_conflito: {
      estrategia: {
        type: String,
        enum: ['servidor', 'cliente', 'mesclagem', 'manual'],
        default: 'servidor'
      },
      resolvido: Boolean,
      dados_resolucao: mongoose.Schema.Types.Mixed
    }
  }],
  status_geral: {
    type: String,
    enum: ['completo', 'parcial', 'falha', 'em_andamento'],
    default: 'em_andamento'
  },
  tamanho_dados: Number,
  tempo_sincronizacao: Number,
  log: [{
    timestamp: Date,
    nivel: String,
    mensagem: String,
    detalhes: mongoose.Schema.Types.Mixed
  }]
});

// Modelo para Configurações de Aplicativo Móvel
const configuracaoAppSchema = new mongoose.Schema({
  versao: {
    type: String,
    required: true
  },
  versao_minima_requerida: String,
  atualizacao_obrigatoria: Boolean,
  url_atualizacao: {
    android: String,
    ios: String
  },
  configuracoes_globais: {
    timeout_requisicoes: Number,
    intervalo_sincronizacao: Number,
    max_tamanho_cache: Number,
    max_dias_offline: Number,
    compressao_dados: Boolean
  },
  recursos_habilitados: {
    camera: Boolean,
    gps: Boolean,
    notificacoes: Boolean,
    biometria: Boolean,
    nfc: Boolean,
    codigo_barras: Boolean
  },
  modulos_disponiveis: [{
    codigo: String,
    nome: String,
    icone: String,
    ordem: Number,
    ativo: Boolean,
    requer_permissao: String
  }],
  telas_personalizadas: [{
    codigo: String,
    titulo: String,
    componentes: mongoose.Schema.Types.Mixed,
    permissoes: [String]
  }],
  mensagens_sistema: [{
    codigo: String,
    texto: String,
    tipo: String
  }],
  ativo: {
    type: Boolean,
    default: true
  },
  data_atualizacao: {
    type: Date,
    default: Date.now
  }
});

const ConfiguracaoMobilidade = mongoose.model('ConfiguracaoMobilidade', configuracaoMobilidadeSchema);
const Notificacao = mongoose.model('Notificacao', notificacaoSchema);
const SincronizacaoOffline = mongoose.model('SincronizacaoOffline', sincronizacaoOfflineSchema);
const ConfiguracaoApp = mongoose.model('ConfiguracaoApp', configuracaoAppSchema);

module.exports = {
  ConfiguracaoMobilidade,
  Notificacao,
  SincronizacaoOffline,
  ConfiguracaoApp
};
