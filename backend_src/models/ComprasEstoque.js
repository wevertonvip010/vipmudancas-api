const mongoose = require('mongoose');

// Modelo para Fornecedores
const fornecedorSchema = new mongoose.Schema({
  codigo: {
    type: String,
    required: true,
    unique: true
  },
  nome: {
    type: String,
    required: true
  },
  razao_social: {
    type: String
  },
  tipo: {
    type: String,
    enum: ['pessoa_fisica', 'pessoa_juridica'],
    required: true
  },
  cpf_cnpj: {
    type: String,
    required: true,
    unique: true
  },
  inscricao_estadual: {
    type: String
  },
  endereco: {
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
  contatos: [{
    nome: String,
    cargo: String,
    telefone: String,
    email: String,
    principal: Boolean
  }],
  telefone: String,
  email: String,
  website: String,
  categoria: {
    type: String,
    enum: ['materiais', 'servicos', 'transportes', 'equipamentos', 'outro'],
    required: true
  },
  produtos_fornecidos: [{
    material: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Material'
    },
    codigo_fornecedor: String,
    preco_padrao: Number,
    prazo_entrega: Number,
    quantidade_minima: Number
  }],
  condicoes_pagamento: {
    prazo: Number,
    forma: String,
    desconto: Number
  },
  avaliacao: {
    pontuacao: {
      type: Number,
      min: 0,
      max: 5,
      default: 3
    },
    qualidade: {
      type: Number,
      min: 0,
      max: 5
    },
    prazo: {
      type: Number,
      min: 0,
      max: 5
    },
    preco: {
      type: Number,
      min: 0,
      max: 5
    },
    atendimento: {
      type: Number,
      min: 0,
      max: 5
    }
  },
  dados_bancarios: [{
    banco: String,
    agencia: String,
    conta: String,
    tipo_conta: String,
    titular: String,
    cpf_cnpj_titular: String,
    principal: Boolean
  }],
  documentos: [{
    tipo: String,
    nome: String,
    arquivo: String,
    data_upload: Date,
    validade: Date
  }],
  observacoes: String,
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

// Modelo para Ordens de Compra
const ordemCompraSchema = new mongoose.Schema({
  numero: {
    type: String,
    required: true,
    unique: true
  },
  fornecedor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Fornecedor',
    required: true
  },
  data_emissao: {
    type: Date,
    default: Date.now,
    required: true
  },
  data_entrega_prevista: {
    type: Date,
    required: true
  },
  requisicao: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RequisicaoCompra'
  },
  itens: [{
    material: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Material'
    },
    descricao: String,
    codigo_fornecedor: String,
    quantidade: Number,
    unidade: String,
    valor_unitario: Number,
    desconto: Number,
    valor_total: Number,
    impostos: Number,
    data_entrega: Date,
    observacoes: String,
    status: {
      type: String,
      enum: ['pendente', 'parcial', 'recebido', 'cancelado'],
      default: 'pendente'
    }
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
    enum: ['rascunho', 'aguardando_aprovacao', 'aprovado', 'enviado', 'parcialmente_recebido', 'recebido', 'cancelado'],
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
  aprovacao: {
    necessaria: {
      type: Boolean,
      default: true
    },
    nivel: {
      type: Number,
      default: 1
    },
    aprovadores: [{
      usuario: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuario'
      },
      nivel: Number,
      status: {
        type: String,
        enum: ['pendente', 'aprovado', 'rejeitado'],
        default: 'pendente'
      },
      data: Date,
      observacao: String
    }]
  },
  recebimentos: [{
    data: Date,
    nota_fiscal: String,
    itens_recebidos: [{
      item_index: Number,
      quantidade: Number,
      lote: String,
      validade: Date,
      localizacao: String
    }],
    usuario: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Usuario'
    },
    observacoes: String,
    anexos: [{
      nome: String,
      arquivo: String
    }]
  }],
  observacoes: String,
  anexos: [{
    nome: String,
    arquivo: String,
    tipo: String
  }],
  solicitante: {
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

// Modelo para Requisição de Compra
const requisicaoCompraSchema = new mongoose.Schema({
  numero: {
    type: String,
    required: true,
    unique: true
  },
  solicitante: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true
  },
  departamento: {
    type: String,
    required: true
  },
  data_solicitacao: {
    type: Date,
    default: Date.now,
    required: true
  },
  data_necessidade: {
    type: Date,
    required: true
  },
  prioridade: {
    type: String,
    enum: ['baixa', 'normal', 'alta', 'urgente'],
    default: 'normal'
  },
  itens: [{
    material: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Material'
    },
    descricao: String,
    quantidade: Number,
    unidade: String,
    valor_estimado: Number,
    observacoes: String,
    fornecedores_sugeridos: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Fornecedor'
    }],
    status: {
      type: String,
      enum: ['pendente', 'em_cotacao', 'aprovado', 'rejeitado', 'comprado'],
      default: 'pendente'
    }
  }],
  justificativa: String,
  centro_custo: String,
  projeto: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Projeto'
  },
  ordem_servico: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'OrdemServico'
  },
  status: {
    type: String,
    enum: ['rascunho', 'enviada', 'em_analise', 'aprovada', 'parcialmente_atendida', 'atendida', 'rejeitada', 'cancelada'],
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
  aprovacao: {
    necessaria: {
      type: Boolean,
      default: true
    },
    nivel: {
      type: Number,
      default: 1
    },
    aprovadores: [{
      usuario: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuario'
      },
      nivel: Number,
      status: {
        type: String,
        enum: ['pendente', 'aprovado', 'rejeitado'],
        default: 'pendente'
      },
      data: Date,
      observacao: String
    }]
  },
  ordens_compra: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'OrdemCompra'
  }],
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

// Modelo para Estoque com Rastreamento por Lote/Série
const estoqueSchema = new mongoose.Schema({
  material: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Material',
    required: true
  },
  deposito: {
    type: String,
    required: true
  },
  localizacao: {
    corredor: String,
    prateleira: String,
    posicao: String
  },
  quantidade_disponivel: {
    type: Number,
    required: true,
    default: 0
  },
  quantidade_reservada: {
    type: Number,
    default: 0
  },
  quantidade_em_transito: {
    type: Number,
    default: 0
  },
  lotes: [{
    numero: {
      type: String,
      required: true
    },
    quantidade: {
      type: Number,
      required: true
    },
    data_fabricacao: Date,
    data_validade: Date,
    fornecedor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Fornecedor'
    },
    ordem_compra: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'OrdemCompra'
    },
    nota_fiscal: String,
    data_entrada: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['disponivel', 'reservado', 'bloqueado', 'vencido'],
      default: 'disponivel'
    },
    observacoes: String
  }],
  itens_serie: [{
    numero_serie: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: ['disponivel', 'reservado', 'em_uso', 'em_manutencao', 'vendido'],
      default: 'disponivel'
    },
    lote: String,
    data_entrada: {
      type: Date,
      default: Date.now
    },
    fornecedor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Fornecedor'
    },
    ordem_compra: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'OrdemCompra'
    },
    nota_fiscal: String,
    cliente: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Cliente'
    },
    ordem_servico: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'OrdemServico'
    },
    garantia: {
      inicio: Date,
      fim: Date,
      termos: String
    },
    manutencoes: [{
      data: Date,
      tipo: String,
      descricao: String,
      responsavel: String,
      custo: Number
    }],
    observacoes: String
  }],
  ponto_pedido: {
    type: Number,
    default: 0
  },
  estoque_minimo: {
    type: Number,
    default: 0
  },
  estoque_maximo: {
    type: Number,
    default: 0
  },
  giro: {
    mensal: Number,
    trimestral: Number,
    anual: Number
  },
  ultima_contagem: {
    data: Date,
    usuario: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Usuario'
    },
    quantidade_anterior: Number,
    quantidade_contada: Number,
    ajuste: Number,
    observacoes: String
  },
  valor_medio: Number,
  valor_total: Number,
  criado_em: {
    type: Date,
    default: Date.now
  },
  atualizado_em: {
    type: Date,
    default: Date.now
  }
});

const Fornecedor = mongoose.model('Fornecedor', fornecedorSchema);
const OrdemCompra = mongoose.model('OrdemCompra', ordemCompraSchema);
const RequisicaoCompra = mongoose.model('RequisicaoCompra', requisicaoCompraSchema);
const Estoque = mongoose.model('Estoque', estoqueSchema);

module.exports = {
  Fornecedor,
  OrdemCompra,
  RequisicaoCompra,
  Estoque
};
