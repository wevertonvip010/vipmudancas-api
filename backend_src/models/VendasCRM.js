const mongoose = require('mongoose');

// Modelo para Oportunidades de Venda
const oportunidadeSchema = new mongoose.Schema({
  codigo: {
    type: String,
    required: true,
    unique: true
  },
  cliente: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cliente',
    required: true
  },
  titulo: {
    type: String,
    required: true
  },
  descricao: {
    type: String
  },
  valor_estimado: {
    type: Number,
    required: true
  },
  probabilidade: {
    type: Number,
    min: 0,
    max: 100,
    default: 50
  },
  origem: {
    type: String,
    enum: ['site', 'indicacao', 'marketing', 'ligacao', 'whatsapp', 'retorno', 'outro'],
    required: true
  },
  estagio: {
    type: String,
    enum: ['prospeccao', 'qualificacao', 'proposta', 'negociacao', 'fechamento', 'ganho', 'perdido'],
    default: 'prospeccao'
  },
  motivo_perda: {
    type: String
  },
  concorrentes: [{
    nome: String,
    proposta: Number,
    observacoes: String
  }],
  data_abertura: {
    type: Date,
    default: Date.now
  },
  data_fechamento_prevista: {
    type: Date,
    required: true
  },
  data_fechamento_real: {
    type: Date
  },
  responsavel: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true
  },
  equipe: [{
    usuario: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Usuario'
    },
    funcao: String
  }],
  tags: [String],
  atividades: [{
    tipo: {
      type: String,
      enum: ['ligacao', 'email', 'reuniao', 'visita', 'proposta', 'outro']
    },
    data: Date,
    descricao: String,
    resultado: String,
    usuario: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Usuario'
    }
  }],
  documentos: [{
    nome: String,
    tipo: String,
    arquivo: String,
    data_upload: Date,
    usuario: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Usuario'
    }
  }],
  orcamento_relacionado: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Orcamento'
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

// Modelo para Interações com Clientes (CRM)
const interacaoClienteSchema = new mongoose.Schema({
  cliente: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cliente',
    required: true
  },
  tipo: {
    type: String,
    enum: ['ligacao', 'email', 'whatsapp', 'visita', 'reuniao', 'atendimento', 'outro'],
    required: true
  },
  data_hora: {
    type: Date,
    default: Date.now,
    required: true
  },
  assunto: {
    type: String,
    required: true
  },
  descricao: {
    type: String,
    required: true
  },
  sentimento: {
    type: String,
    enum: ['positivo', 'neutro', 'negativo'],
    default: 'neutro'
  },
  canal: {
    type: String,
    enum: ['telefone', 'email', 'whatsapp', 'presencial', 'site', 'redes_sociais', 'outro'],
    required: true
  },
  responsavel: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true
  },
  oportunidade: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Oportunidade'
  },
  contrato: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Contrato'
  },
  ordem_servico: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'OrdemServico'
  },
  anexos: [{
    nome: String,
    arquivo: String,
    tipo: String
  }],
  tags: [String],
  prioridade: {
    type: String,
    enum: ['baixa', 'media', 'alta', 'urgente'],
    default: 'media'
  },
  status: {
    type: String,
    enum: ['aberto', 'em_andamento', 'aguardando_cliente', 'resolvido', 'fechado'],
    default: 'aberto'
  },
  tempo_resposta: {
    type: Number
  },
  tempo_resolucao: {
    type: Number
  },
  feedback_cliente: {
    avaliacao: {
      type: Number,
      min: 1,
      max: 5
    },
    comentario: String,
    data: Date
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

// Modelo para Campanhas de Marketing
const campanhaMarketingSchema = new mongoose.Schema({
  nome: {
    type: String,
    required: true
  },
  descricao: {
    type: String
  },
  tipo: {
    type: String,
    enum: ['email', 'sms', 'whatsapp', 'redes_sociais', 'google_ads', 'evento', 'outro'],
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
  publico_alvo: {
    segmento: String,
    filtros: mongoose.Schema.Types.Mixed
  },
  orcamento: {
    type: Number
  },
  status: {
    type: String,
    enum: ['planejada', 'em_andamento', 'pausada', 'concluida', 'cancelada'],
    default: 'planejada'
  },
  conteudo: {
    titulo: String,
    mensagem: String,
    imagens: [String],
    links: [String],
    template: String
  },
  metricas: {
    alcance: Number,
    impressoes: Number,
    cliques: Number,
    conversoes: Number,
    custo_por_lead: Number,
    roi: Number
  },
  leads_gerados: [{
    cliente: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Cliente'
    },
    data_conversao: Date,
    origem_especifica: String,
    valor_oportunidade: Number
  }],
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

// Modelo para Pedidos de Venda
const pedidoVendaSchema = new mongoose.Schema({
  numero: {
    type: String,
    required: true,
    unique: true
  },
  cliente: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cliente',
    required: true
  },
  data_pedido: {
    type: Date,
    default: Date.now,
    required: true
  },
  data_entrega_prevista: {
    type: Date,
    required: true
  },
  oportunidade: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Oportunidade'
  },
  orcamento: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Orcamento'
  },
  contrato: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Contrato'
  },
  itens: [{
    produto: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Material'
    },
    descricao: String,
    quantidade: Number,
    unidade: String,
    valor_unitario: Number,
    desconto: Number,
    valor_total: Number,
    impostos: Number,
    observacoes: String
  }],
  endereco_entrega: {
    rua: String,
    numero: String,
    complemento: String,
    bairro: String,
    cidade: String,
    estado: String,
    cep: String,
    pais: {
      type: String,
      default: 'Brasil'
    }
  },
  condicoes_pagamento: {
    forma: {
      type: String,
      enum: ['a_vista', 'parcelado', 'boleto', 'cartao', 'transferencia', 'outro'],
      required: true
    },
    parcelas: Number,
    entrada: Number,
    vencimentos: [Date]
  },
  valores: {
    subtotal: Number,
    desconto_total: Number,
    impostos_total: Number,
    frete: Number,
    total: Number
  },
  status: {
    type: String,
    enum: ['rascunho', 'aberto', 'aprovado', 'em_processamento', 'faturado', 'entregue', 'cancelado'],
    default: 'rascunho'
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
  observacoes: String,
  anexos: [{
    nome: String,
    arquivo: String,
    tipo: String
  }],
  vendedor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true
  },
  comissao: {
    percentual: Number,
    valor: Number,
    status: {
      type: String,
      enum: ['pendente', 'aprovada', 'paga', 'cancelada'],
      default: 'pendente'
    }
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

const Oportunidade = mongoose.model('Oportunidade', oportunidadeSchema);
const InteracaoCliente = mongoose.model('InteracaoCliente', interacaoClienteSchema);
const CampanhaMarketing = mongoose.model('CampanhaMarketing', campanhaMarketingSchema);
const PedidoVenda = mongoose.model('PedidoVenda', pedidoVendaSchema);

module.exports = {
  Oportunidade,
  InteracaoCliente,
  CampanhaMarketing,
  PedidoVenda
};
