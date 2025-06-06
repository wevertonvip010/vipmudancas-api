const mongoose = require('mongoose');

const gamificacaoSchema = new mongoose.Schema({
  vendedorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  nomeVendedor: {
    type: String,
    required: true
  },
  pontuacaoTotal: {
    type: Number,
    default: 0
  },
  pontuacaoSemanal: {
    type: Number,
    default: 0
  },
  pontuacaoMensal: {
    type: Number,
    default: 0
  },
  estatisticas: {
    propostasEnviadas: {
      type: Number,
      default: 0
    },
    contratosFechados: {
      type: Number,
      default: 0
    },
    avaliacoes4Plus: {
      type: Number,
      default: 0
    },
    mediaAvaliacoes: {
      type: Number,
      default: 0
    }
  },
  conquistas: [{
    tipo: {
      type: String,
      enum: ['vendedor_semana', 'recorde_vendas', 'maior_satisfacao', 'meta_mensal', 'primeiro_contrato']
    },
    data: {
      type: Date,
      default: Date.now
    },
    descricao: String
  }],
  historico: [{
    data: {
      type: Date,
      default: Date.now
    },
    acao: {
      type: String,
      enum: ['proposta_enviada', 'contrato_fechado', 'avaliacao_recebida']
    },
    pontos: Number,
    detalhes: String
  }],
  semanaAtual: {
    type: String,
    default: function() {
      const now = new Date();
      const year = now.getFullYear();
      const week = Math.ceil((now.getTime() - new Date(year, 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000));
      return `${year}-W${week}`;
    }
  },
  mesAtual: {
    type: String,
    default: function() {
      const now = new Date();
      return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    }
  },
  ultimaAtualizacao: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Índices para otimização
gamificacaoSchema.index({ vendedorId: 1 });
gamificacaoSchema.index({ pontuacaoTotal: -1 });
gamificacaoSchema.index({ pontuacaoSemanal: -1 });
gamificacaoSchema.index({ semanaAtual: 1 });
gamificacaoSchema.index({ mesAtual: 1 });

// Método para adicionar pontos
gamificacaoSchema.methods.adicionarPontos = function(acao, pontos, detalhes = '') {
  this.pontuacaoTotal += pontos;
  this.pontuacaoSemanal += pontos;
  this.pontuacaoMensal += pontos;
  
  // Atualizar estatísticas
  switch(acao) {
    case 'proposta_enviada':
      this.estatisticas.propostasEnviadas += 1;
      break;
    case 'contrato_fechado':
      this.estatisticas.contratosFechados += 1;
      break;
    case 'avaliacao_recebida':
      this.estatisticas.avaliacoes4Plus += 1;
      break;
  }
  
  // Adicionar ao histórico
  this.historico.push({
    acao,
    pontos,
    detalhes
  });
  
  this.ultimaAtualizacao = new Date();
  
  return this.save();
};

// Método para resetar pontuação semanal
gamificacaoSchema.methods.resetarSemanal = function() {
  this.pontuacaoSemanal = 0;
  const now = new Date();
  const year = now.getFullYear();
  const week = Math.ceil((now.getTime() - new Date(year, 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000));
  this.semanaAtual = `${year}-W${week}`;
  
  return this.save();
};

// Método para resetar pontuação mensal
gamificacaoSchema.methods.resetarMensal = function() {
  this.pontuacaoMensal = 0;
  const now = new Date();
  this.mesAtual = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  
  return this.save();
};

// Método para adicionar conquista
gamificacaoSchema.methods.adicionarConquista = function(tipo, descricao) {
  // Verificar se já possui esta conquista
  const conquistaExistente = this.conquistas.find(c => c.tipo === tipo);
  
  if (!conquistaExistente) {
    this.conquistas.push({
      tipo,
      descricao
    });
    
    return this.save();
  }
  
  return Promise.resolve(this);
};

// Método estático para obter ranking
gamificacaoSchema.statics.obterRanking = function(tipo = 'semanal', limite = 10) {
  const campoOrdenacao = tipo === 'mensal' ? 'pontuacaoMensal' : 
                        tipo === 'total' ? 'pontuacaoTotal' : 'pontuacaoSemanal';
  
  return this.find({})
    .sort({ [campoOrdenacao]: -1 })
    .limit(limite)
    .populate('vendedorId', 'nome email')
    .exec();
};

// Método estático para obter estatísticas gerais
gamificacaoSchema.statics.obterEstatisticasGerais = function() {
  return this.aggregate([
    {
      $group: {
        _id: null,
        totalVendedores: { $sum: 1 },
        totalPropostas: { $sum: '$estatisticas.propostasEnviadas' },
        totalContratos: { $sum: '$estatisticas.contratosFechados' },
        totalAvaliacoes: { $sum: '$estatisticas.avaliacoes4Plus' },
        mediaPontuacao: { $avg: '$pontuacaoTotal' }
      }
    }
  ]);
};

module.exports = mongoose.model('Gamificacao', gamificacaoSchema);

