const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  nome: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  senha: {
    type: String,
    required: true
  },
  cargo: {
    type: String,
    required: true,
    trim: true
  },
  // Campo mantido para compatibilidade com código existente
  perfil: {
    type: String,
    enum: ['admin', 'gerente', 'vendedor', 'operacional'],
    default: 'operacional'
  },
  // Novo campo para sistema de permissões granular
  roles: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Role'
  }],
  // Permissões específicas adicionais para o usuário
  permissoesAdicionais: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Permission'
  }],
  // NOVO CAMPO PARA COMISSÃO DE VENDAS
  percentualComissao: {
    type: Number,
    default: 0,
    min: 0,
    max: 100,
    comment: 'Percentual de comissão do vendedor (usado para cálculo automático)'
  },
  telefone: {
    type: String,
    trim: true
  },
  dataCriacao: {
    type: Date,
    default: Date.now
  },
  ultimoAcesso: {
    type: Date
  },
  ativo: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Método para criptografar a senha antes de salvar
userSchema.pre('save', async function(next) {
  if (!this.isModified('senha')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.senha = await bcrypt.hash(this.senha, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Método para comparar senhas
userSchema.methods.compararSenha = async function(senha) {
  return await bcrypt.compare(senha, this.senha);
};

// Método para verificar se o usuário tem uma permissão específica
userSchema.methods.hasPermission = async function(permissionCode) {
  // Carregar o usuário com suas roles e permissões
  const user = await this.constructor.findById(this._id)
    .populate({
      path: 'roles',
      populate: {
        path: 'permissoes'
      }
    })
    .populate('permissoesAdicionais');
  
  // Verificar permissões adicionais do usuário
  for (const permission of user.permissoesAdicionais) {
    if (permission.codigo === permissionCode && permission.ativo) {
      return true;
    }
  }
  
  // Verificar permissões das roles do usuário
  for (const role of user.roles) {
    if (!role.ativo) continue;
    
    for (const permission of role.permissoes) {
      if (permission.codigo === permissionCode && permission.ativo) {
        return true;
      }
    }
  }
  
  return false;
};

// Método para obter todas as permissões do usuário
userSchema.methods.getAllPermissions = async function() {
  // Carregar o usuário com suas roles e permissões
  const user = await this.constructor.findById(this._id)
    .populate({
      path: 'roles',
      populate: {
        path: 'permissoes'
      }
    })
    .populate('permissoesAdicionais');
  
  const permissions = new Set();
  
  // Adicionar permissões adicionais do usuário
  for (const permission of user.permissoesAdicionais) {
    if (permission.ativo) {
      permissions.add(permission.codigo);
    }
  }
  
  // Adicionar permissões das roles do usuário
  for (const role of user.roles) {
    if (!role.ativo) continue;
    
    for (const permission of role.permissoes) {
      if (permission.ativo) {
        permissions.add(permission.codigo);
      }
    }
  }
  
  return Array.from(permissions);
};

const User = mongoose.model('User', userSchema);

module.exports = User;

