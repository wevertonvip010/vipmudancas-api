const mongoose = require('mongoose');

// Schema para controlar a numeração sequencial de contratos
const numeracaoContratoSchema = new mongoose.Schema({
  ano: {
    type: Number,
    required: true,
    unique: true
  },
  ultimoNumero: {
    type: Number,
    default: 0,
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

// Método estático para obter próximo número de contrato
numeracaoContratoSchema.statics.obterProximoNumero = async function() {
  const anoAtual = new Date().getFullYear();
  
  // Buscar ou criar registro para o ano atual
  let numeracao = await this.findOne({ ano: anoAtual });
  
  if (!numeracao) {
    // Criar novo registro para o ano
    numeracao = new this({
      ano: anoAtual,
      ultimoNumero: 1
    });
  } else {
    // Incrementar número
    numeracao.ultimoNumero += 1;
    numeracao.ultimaAtualizacao = Date.now();
  }
  
  await numeracao.save();
  
  // Formatar número: 0001/2025
  const numeroFormatado = String(numeracao.ultimoNumero).padStart(4, '0');
  return `${numeroFormatado}/${anoAtual}`;
};

// Método estático para verificar se número já existe
numeracaoContratoSchema.statics.verificarNumeroExiste = async function(numeroContrato) {
  const Contrato = require('./contrato.model');
  const contratoExistente = await Contrato.findOne({ numeroContrato });
  return !!contratoExistente;
};

// Método estático para resetar numeração (apenas para admin)
numeracaoContratoSchema.statics.resetarNumeracao = async function(ano) {
  const numeracao = await this.findOne({ ano });
  if (numeracao) {
    numeracao.ultimoNumero = 0;
    numeracao.ultimaAtualizacao = Date.now();
    await numeracao.save();
    return true;
  }
  return false;
};

const NumeracaoContrato = mongoose.model('NumeracaoContrato', numeracaoContratoSchema);

module.exports = NumeracaoContrato;

