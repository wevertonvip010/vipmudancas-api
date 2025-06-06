const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const googleCalendarConfigSchema = new Schema({
  usuarioId: {
    type: Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true
  },
  defaultCalendarId: {
    type: String,
    default: ''
  },
  syncVisitas: {
    type: Boolean,
    default: true
  },
  syncOrdensServico: {
    type: Boolean,
    default: true
  },
  notificacaoEmail: {
    type: Boolean,
    default: true
  },
  notificacaoMinutos: {
    type: Number,
    default: 30
  },
  visitas: {
    type: Boolean,
    default: false
  },
  ordensServico: {
    type: Boolean,
    default: false
  },
  lastSync: {
    type: Date,
    default: null
  }
}, { timestamps: true });

module.exports = mongoose.model('GoogleCalendarConfig', googleCalendarConfigSchema);
