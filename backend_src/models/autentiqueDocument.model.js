const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const AutentiqueDocumentSchema = new Schema({
  documentId: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['pending', 'partially_signed', 'completed', 'rejected', 'expired'],
    default: 'pending'
  },
  signers: [{
    publicId: String,
    name: String,
    email: String,
    signatureLink: String,
    deliveryMethod: {
      type: String,
      enum: ['EMAIL', 'LINK', 'WHATSAPP'],
      default: 'EMAIL'
    },
    status: {
      type: String,
      enum: ['pending', 'viewed', 'signed', 'rejected'],
      default: 'pending'
    },
    viewedAt: Date,
    signedAt: Date,
    rejectedAt: Date,
    rejectionReason: String
  }],
  pdfUrl: String,
  signedPdfUrl: String
});

module.exports = mongoose.model('AutentiqueDocument', AutentiqueDocumentSchema);
