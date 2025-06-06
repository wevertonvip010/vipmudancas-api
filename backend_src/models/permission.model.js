const mongoose = require('mongoose');

const permissionSchema = new mongoose.Schema({
  nome: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  descricao: {
    type: String,
    required: true,
    trim: true
  },
  modulo: {
    type: String,
    required: true,
    trim: true
  },
  codigo: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  ativo: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

const Permission = mongoose.model('Permission', permissionSchema);

module.exports = Permission;
