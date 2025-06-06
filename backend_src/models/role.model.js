const mongoose = require('mongoose');

const roleSchema = new mongoose.Schema({
  // Identificação do role
  nome: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  
  displayName: {
    type: String,
    required: true,
    trim: true
  },
  
  descricao: {
    type: String,
    required: true,
    trim: true
  },
  
  // Cor para identificação visual
  cor: {
    type: String,
    default: '#6B7280'
  },
  
  // Ícone para identificação visual
  icone: {
    type: String,
    default: 'user'
  },
  
  // Permissões associadas ao role
  permissoes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Permissao'
  }],
  
  // Configurações do role
  configuracoes: {
    // Acesso ao dashboard
    dashboard: {
      type: Boolean,
      default: true
    },
    
    // Módulos visíveis
    modulosVisiveis: [{
      type: String,
      enum: [
        'dashboard',
        'clientes',
        'vendas',
        'financeiro',
        'estoque',
        'operacional',
        'marketing',
        'relatorios',
        'equipe',
        'configuracoes'
      ]
    }],
    
    // Limitações
    limitacoes: {
      // Pode ver apenas seus próprios dados
      apenasPropriosDados: {
        type: Boolean,
        default: false
      },
      
      // Limite de registros por consulta
      limiteRegistros: {
        type: Number,
        default: 1000
      },
      
      // Pode exportar dados
      podeExportar: {
        type: Boolean,
        default: true
      }
    }
  },
  
  // Hierarquia
  nivel: {
    type: Number,
    required: true,
    min: 1,
    max: 10
  },
  
  // Status
  ativo: {
    type: Boolean,
    default: true
  },
  
  // Sistema (não pode ser editado/excluído)
  sistema: {
    type: Boolean,
    default: false
  },
  
  // Metadados
  criadoEm: {
    type: Date,
    default: Date.now
  },
  
  criadoPor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  atualizadoEm: {
    type: Date,
    default: Date.now
  }
  
}, {
  timestamps: true,
  collection: 'roles'
});

// Índices
roleSchema.index({ nome: 1 });
roleSchema.index({ nivel: 1 });
roleSchema.index({ ativo: 1 });

// Middleware para atualizar atualizadoEm
roleSchema.pre('save', function(next) {
  this.atualizadoEm = new Date();
  next();
});

// Métodos do schema
roleSchema.methods.temPermissao = function(nomePermissao) {
  return this.permissoes.some(permissao => 
    permissao.nome === nomePermissao && permissao.ativa
  );
};

roleSchema.methods.adicionarPermissao = function(permissaoId) {
  if (!this.permissoes.includes(permissaoId)) {
    this.permissoes.push(permissaoId);
  }
  return this.save();
};

roleSchema.methods.removerPermissao = function(permissaoId) {
  this.permissoes = this.permissoes.filter(id => 
    id.toString() !== permissaoId.toString()
  );
  return this.save();
};

// Métodos estáticos
roleSchema.statics.buscarComPermissoes = function(filtros = {}) {
  return this.find({ ...filtros, ativo: true })
    .populate('permissoes', 'nome descricao categoria nivel')
    .sort({ nivel: 1, nome: 1 });
};

roleSchema.statics.criarRolesBasicos = async function() {
  const Permissao = require('./permissao.model');
  
  // Buscar todas as permissões
  const todasPermissoes = await Permissao.find({ ativa: true });
  
  const rolesBasicos = [
    {
      nome: 'admin',
      displayName: 'Administrador',
      descricao: 'Acesso completo ao sistema',
      cor: '#DC2626',
      icone: 'shield-check',
      nivel: 1,
      sistema: true,
      permissoes: todasPermissoes.map(p => p._id),
      configuracoes: {
        dashboard: true,
        modulosVisiveis: [
          'dashboard', 'clientes', 'vendas', 'financeiro', 
          'estoque', 'operacional', 'marketing', 'relatorios', 
          'equipe', 'configuracoes'
        ],
        limitacoes: {
          apenasPropriosDados: false,
          limiteRegistros: 10000,
          podeExportar: true
        }
      }
    },
    
    {
      nome: 'vendedor',
      displayName: 'Vendedor',
      descricao: 'Acesso a vendas, clientes e orçamentos',
      cor: '#059669',
      icone: 'briefcase',
      nivel: 3,
      sistema: true,
      permissoes: todasPermissoes.filter(p => 
        ['CLIENTES', 'VENDAS', 'RELATORIOS'].includes(p.categoria) &&
        p.nivel !== 'EXCLUSAO'
      ).map(p => p._id),
      configuracoes: {
        dashboard: true,
        modulosVisiveis: ['dashboard', 'clientes', 'vendas', 'relatorios'],
        limitacoes: {
          apenasPropriosDados: true,
          limiteRegistros: 1000,
          podeExportar: true
        }
      }
    },
    
    {
      nome: 'financeiro',
      displayName: 'Financeiro',
      descricao: 'Acesso ao módulo financeiro e relatórios',
      cor: '#7C3AED',
      icone: 'calculator',
      nivel: 2,
      sistema: true,
      permissoes: todasPermissoes.filter(p => 
        ['FINANCEIRO', 'RELATORIOS', 'CLIENTES'].includes(p.categoria)
      ).map(p => p._id),
      configuracoes: {
        dashboard: true,
        modulosVisiveis: ['dashboard', 'clientes', 'financeiro', 'relatorios'],
        limitacoes: {
          apenasPropriosDados: false,
          limiteRegistros: 5000,
          podeExportar: true
        }
      }
    },
    
    {
      nome: 'operacional',
      displayName: 'Operacional',
      descricao: 'Acesso a operações, estoque e ordens de serviço',
      cor: '#EA580C',
      icone: 'truck',
      nivel: 4,
      sistema: true,
      permissoes: todasPermissoes.filter(p => 
        ['OPERACIONAL', 'ESTOQUE', 'CLIENTES'].includes(p.categoria) &&
        p.nivel !== 'EXCLUSAO'
      ).map(p => p._id),
      configuracoes: {
        dashboard: true,
        modulosVisiveis: ['dashboard', 'clientes', 'estoque', 'operacional'],
        limitacoes: {
          apenasPropriosDados: false,
          limiteRegistros: 1000,
          podeExportar: false
        }
      }
    }
  ];
  
  for (const role of rolesBasicos) {
    await this.findOneAndUpdate(
      { nome: role.nome },
      role,
      { upsert: true, new: true }
    );
  }
  
  console.log('✅ Roles básicos criados/atualizados');
};

// Virtual para contagem de usuários
roleSchema.virtual('totalUsuarios', {
  ref: 'User',
  localField: '_id',
  foreignField: 'role',
  count: true
});

// Configurar virtuals no JSON
roleSchema.set('toJSON', { virtuals: true });
roleSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Role', roleSchema);

