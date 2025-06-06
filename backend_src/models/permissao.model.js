const mongoose = require('mongoose');

const permissaoSchema = new mongoose.Schema({
  // Identificação da permissão
  nome: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true
  },
  
  descricao: {
    type: String,
    required: true,
    trim: true
  },
  
  // Categoria da permissão
  categoria: {
    type: String,
    required: true,
    enum: [
      'USUARIOS',
      'CLIENTES', 
      'VENDAS',
      'FINANCEIRO',
      'ESTOQUE',
      'OPERACIONAL',
      'MARKETING',
      'RELATORIOS',
      'CONFIGURACOES',
      'SISTEMA'
    ]
  },
  
  // Nível de acesso
  nivel: {
    type: String,
    required: true,
    enum: ['LEITURA', 'ESCRITA', 'EXCLUSAO', 'ADMIN']
  },
  
  // Recurso que a permissão controla
  recurso: {
    type: String,
    required: true,
    trim: true
  },
  
  // Ações permitidas
  acoes: [{
    type: String,
    enum: ['CREATE', 'READ', 'UPDATE', 'DELETE', 'EXPORT', 'IMPORT', 'APPROVE']
  }],
  
  // Metadados
  ativa: {
    type: Boolean,
    default: true
  },
  
  criadoEm: {
    type: Date,
    default: Date.now
  },
  
  atualizadoEm: {
    type: Date,
    default: Date.now
  }
  
}, {
  timestamps: true,
  collection: 'permissoes'
});

// Índices
permissaoSchema.index({ categoria: 1, nivel: 1 });
permissaoSchema.index({ recurso: 1 });
permissaoSchema.index({ ativa: 1 });

// Middleware para atualizar atualizadoEm
permissaoSchema.pre('save', function(next) {
  this.atualizadoEm = new Date();
  next();
});

// Métodos estáticos
permissaoSchema.statics.buscarPorCategoria = function(categoria) {
  return this.find({ categoria, ativa: true }).sort({ nome: 1 });
};

permissaoSchema.statics.buscarPorRecurso = function(recurso) {
  return this.find({ recurso, ativa: true }).sort({ nivel: 1 });
};

permissaoSchema.statics.criarPermissoesBasicas = async function() {
  const permissoesBasicas = [
    // USUÁRIOS
    { nome: 'USUARIOS_LISTAR', descricao: 'Listar usuários', categoria: 'USUARIOS', nivel: 'LEITURA', recurso: 'users', acoes: ['READ'] },
    { nome: 'USUARIOS_CRIAR', descricao: 'Criar usuários', categoria: 'USUARIOS', nivel: 'ESCRITA', recurso: 'users', acoes: ['create'] },
    { nome: 'USUARIOS_EDITAR', descricao: 'Editar usuários', categoria: 'USUARIOS', nivel: 'ESCRITA', recurso: 'users', acoes: ['update'] },
    { nome: 'USUARIOS_EXCLUIR', descricao: 'Excluir usuários', categoria: 'USUARIOS', nivel: 'EXCLUSAO', recurso: 'users', acoes: ['delete'] },
    
    // CLIENTES
    { nome: 'CLIENTES_LISTAR', descricao: 'Listar clientes', categoria: 'CLIENTES', nivel: 'LEITURA', recurso: 'clients', acoes: ['read'] },
    { nome: 'CLIENTES_CRIAR', descricao: 'Criar clientes', categoria: 'CLIENTES', nivel: 'ESCRITA', recurso: 'clients', acoes: ['create'] },
    { nome: 'CLIENTES_EDITAR', descricao: 'Editar clientes', categoria: 'CLIENTES', nivel: 'ESCRITA', recurso: 'clients', acoes: ['update'] },
    { nome: 'CLIENTES_EXCLUIR', descricao: 'Excluir clientes', categoria: 'CLIENTES', nivel: 'EXCLUSAO', recurso: 'clients', acoes: ['delete'] },
    
    // VENDAS
    { nome: 'VENDAS_LISTAR', descricao: 'Listar vendas e orçamentos', categoria: 'VENDAS', nivel: 'LEITURA', recurso: 'sales', acoes: ['read'] },
    { nome: 'VENDAS_CRIAR', descricao: 'Criar orçamentos', categoria: 'VENDAS', nivel: 'ESCRITA', recurso: 'sales', acoes: ['create'] },
    { nome: 'VENDAS_EDITAR', descricao: 'Editar orçamentos', categoria: 'VENDAS', nivel: 'ESCRITA', recurso: 'sales', acoes: ['update'] },
    { nome: 'VENDAS_APROVAR', descricao: 'Aprovar orçamentos', categoria: 'VENDAS', nivel: 'ADMIN', recurso: 'sales', acoes: ['approve'] },
    
    // FINANCEIRO
    { nome: 'FINANCEIRO_LISTAR', descricao: 'Visualizar dados financeiros', categoria: 'FINANCEIRO', nivel: 'LEITURA', recurso: 'financial', acoes: ['read'] },
    { nome: 'FINANCEIRO_CRIAR', descricao: 'Criar lançamentos financeiros', categoria: 'FINANCEIRO', nivel: 'ESCRITA', recurso: 'financial', acoes: ['create'] },
    { nome: 'FINANCEIRO_EDITAR', descricao: 'Editar lançamentos financeiros', categoria: 'FINANCEIRO', nivel: 'ESCRITA', recurso: 'financial', acoes: ['update'] },
    { nome: 'FINANCEIRO_EXCLUIR', descricao: 'Excluir lançamentos financeiros', categoria: 'FINANCEIRO', nivel: 'EXCLUSAO', recurso: 'financial', acoes: ['delete'] },
    
    // ESTOQUE
    { nome: 'ESTOQUE_LISTAR', descricao: 'Visualizar estoque', categoria: 'ESTOQUE', nivel: 'LEITURA', recurso: 'inventory', acoes: ['read'] },
    { nome: 'ESTOQUE_MOVIMENTAR', descricao: 'Movimentar estoque', categoria: 'ESTOQUE', nivel: 'ESCRITA', recurso: 'inventory', acoes: ['create', 'update'] },
    { nome: 'ESTOQUE_AJUSTAR', descricao: 'Ajustar estoque', categoria: 'ESTOQUE', nivel: 'ADMIN', recurso: 'inventory', acoes: ['update', 'delete'] },
    
    // OPERACIONAL
    { nome: 'OPERACIONAL_LISTAR', descricao: 'Visualizar ordens de serviço', categoria: 'OPERACIONAL', nivel: 'LEITURA', recurso: 'operations', acoes: ['read'] },
    { nome: 'OPERACIONAL_CRIAR', descricao: 'Criar ordens de serviço', categoria: 'OPERACIONAL', nivel: 'ESCRITA', recurso: 'operations', acoes: ['create'] },
    { nome: 'OPERACIONAL_EDITAR', descricao: 'Editar ordens de serviço', categoria: 'OPERACIONAL', nivel: 'ESCRITA', recurso: 'operations', acoes: ['update'] },
    
    // MARKETING
    { nome: 'MARKETING_LISTAR', descricao: 'Visualizar campanhas', categoria: 'MARKETING', nivel: 'LEITURA', recurso: 'marketing', acoes: ['read'] },
    { nome: 'MARKETING_CRIAR', descricao: 'Criar campanhas', categoria: 'MARKETING', nivel: 'ESCRITA', recurso: 'marketing', acoes: ['create'] },
    { nome: 'MARKETING_EDITAR', descricao: 'Editar campanhas', categoria: 'MARKETING', nivel: 'ESCRITA', recurso: 'marketing', acoes: ['update'] },
    
    // RELATÓRIOS
    { nome: 'RELATORIOS_VISUALIZAR', descricao: 'Visualizar relatórios', categoria: 'RELATORIOS', nivel: 'LEITURA', recurso: 'reports', acoes: ['read'] },
    { nome: 'RELATORIOS_EXPORTAR', descricao: 'Exportar relatórios', categoria: 'RELATORIOS', nivel: 'ESCRITA', recurso: 'reports', acoes: ['export'] },
    { nome: 'RELATORIOS_CRIAR', descricao: 'Criar relatórios personalizados', categoria: 'RELATORIOS', nivel: 'ADMIN', recurso: 'reports', acoes: ['create'] },
    
    // CONFIGURAÇÕES
    { nome: 'CONFIGURACOES_VISUALIZAR', descricao: 'Visualizar configurações', categoria: 'CONFIGURACOES', nivel: 'LEITURA', recurso: 'settings', acoes: ['read'] },
    { nome: 'CONFIGURACOES_EDITAR', descricao: 'Editar configurações', categoria: 'CONFIGURACOES', nivel: 'ADMIN', recurso: 'settings', acoes: ['update'] },
    
    // SISTEMA
    { nome: 'SISTEMA_ADMIN', descricao: 'Administração completa do sistema', categoria: 'SISTEMA', nivel: 'ADMIN', recurso: 'system', acoes: ['create', 'read', 'update', 'delete', 'export', 'import', 'approve'] }
  ];
  
  for (const permissao of permissoesBasicas) {
    await this.findOneAndUpdate(
      { nome: permissao.nome },
      permissao,
      { upsert: true, new: true }
    );
  }
  
  console.log('✅ Permissões básicas criadas/atualizadas');
};

module.exports = mongoose.model('Permissao', permissaoSchema);

