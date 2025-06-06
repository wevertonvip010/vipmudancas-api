const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const configuracaoBonificacaoSchema = new Schema({
  valorPorEstrela: {
    type: Number,
    required: true,
    default: 5.00,
    min: 0
  },
  bonusEquipeCompleta: {
    type: Number,
    required: true,
    default: 20.00,
    min: 0
  },
  pontuacaoMinimaBonus: {
    type: Number,
    required: true,
    default: 4,
    min: 1,
    max: 5
  },
  bonusAvaliacao5Estrelas: {
    type: Number,
    required: true,
    default: 10.00,
    min: 0
  },
  metaMensalAvaliacoes: {
    type: Number,
    required: true,
    default: 10,
    min: 1
  },
  bonusMetaMensal: {
    type: Number,
    required: true,
    default: 50.00,
    min: 0
  },
  ativoGoogle: {
    type: Boolean,
    default: true
  },
  ativoWhatsApp: {
    type: Boolean,
    default: true
  },
  ativoSistema: {
    type: Boolean,
    default: true
  },
  mensagemSolicitacaoAvaliacao: {
    type: String,
    default: "Olá! Agradecemos por escolher nossa empresa para sua mudança. Gostaríamos de saber como foi sua experiência. Sua avaliação é muito importante para nós e ajuda nossa equipe a melhorar continuamente. Poderia nos avaliar de 1 a 5 estrelas? Muito obrigado!"
  },
  mensagemAgradecimento: {
    type: String,
    default: "Muito obrigado pela sua avaliação! Ficamos felizes em poder ajudar. Conte conosco para futuras mudanças!"
  },
  ultimaAtualizacao: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

module.exports = mongoose.model('ConfiguracaoBonificacao', configuracaoBonificacaoSchema);
