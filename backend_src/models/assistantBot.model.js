const mongoose = require('mongoose');

const assistantBotSchema = new mongoose.Schema({
  nome: {
    type: String,
    required: true,
    default: 'VIP Assistant',
    trim: true
  },
  ativo: {
    type: Boolean,
    default: true
  },
  configuracoes: {
    // Configurações gerais do assistente
    respostasAutomaticas: {
      type: Boolean,
      default: true
    },
    notificacoesProativas: {
      type: Boolean,
      default: true
    },
    frequenciaAnalise: {
      type: String,
      enum: ['diaria', 'semanal', 'mensal', 'emTempo'],
      default: 'emTempo'
    },
    limiarAlerta: {
      type: Number,
      default: 80 // Percentual para disparar alertas
    }
  },
  departamentos: [{
    nome: {
      type: String,
      required: true,
      trim: true
    },
    ativo: {
      type: Boolean,
      default: true
    },
    // Configurações específicas para cada departamento
    configuracoes: {
      type: Map,
      of: mongoose.Schema.Types.Mixed
    },
    // Base de conhecimento específica do departamento
    baseConhecimento: [{
      tipo: {
        type: String,
        enum: ['objecao', 'procedimento', 'dica', 'script', 'faq'],
        required: true
      },
      titulo: {
        type: String,
        required: true,
        trim: true
      },
      conteudo: {
        type: String,
        required: true
      },
      tags: [String],
      contexto: {
        type: String,
        trim: true
      },
      dataCriacao: {
        type: Date,
        default: Date.now
      },
      ultimaAtualizacao: {
        type: Date,
        default: Date.now
      },
      criadoPor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    }]
  }],
  // Histórico de interações para melhorar as respostas futuras
  historicoInteracoes: [{
    usuario: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    departamento: {
      type: String,
      required: true,
      trim: true
    },
    consulta: {
      type: String,
      required: true
    },
    resposta: {
      type: String,
      required: true
    },
    avaliacao: {
      util: {
        type: Boolean,
        default: null
      },
      comentario: {
        type: String,
        trim: true
      }
    },
    data: {
      type: Date,
      default: Date.now
    },
    contexto: {
      modulo: String,
      acao: String,
      dadosContexto: mongoose.Schema.Types.Mixed
    }
  }],
  // Estatísticas de uso para análise e melhoria
  estatisticas: {
    totalConsultas: {
      type: Number,
      default: 0
    },
    consultasPorDepartamento: {
      type: Map,
      of: Number,
      default: {}
    },
    avaliacoesPositivas: {
      type: Number,
      default: 0
    },
    avaliacoesNegativas: {
      type: Number,
      default: 0
    },
    topConsultas: [{
      consulta: String,
      contagem: Number
    }]
  },
  ultimaAtualizacao: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

const AssistantBot = mongoose.model('AssistantBot', assistantBotSchema);

module.exports = AssistantBot;
