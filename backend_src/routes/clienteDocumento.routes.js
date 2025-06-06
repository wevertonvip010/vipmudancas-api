const express = require('express');
const router = express.Router();
const clienteDocumentoController = require('../controllers/clienteDocumento.controller');
const { auth, checkRole } = require('../middleware/auth.middleware');

// Todas as rotas requerem autenticação
router.use(auth);

// Rotas para documentos do cliente
router.get('/cliente/:clienteId/documentos', clienteDocumentoController.getDocumentos);
router.get('/cliente/:clienteId/documentos/search', clienteDocumentoController.searchDocumentos);
router.get('/documentos/:documentoId', clienteDocumentoController.getDocumentoById);
router.get('/documentos/:documentoId/download', clienteDocumentoController.downloadDocumento);

// Rotas para criação e atualização (requerem permissões específicas)
router.post('/cliente/:clienteId/documentos', 
  checkRole(['admin', 'gerente', 'vendedor']), 
  clienteDocumentoController.uploadMiddleware, 
  clienteDocumentoController.addDocumento
);

router.put('/documentos/:documentoId', 
  checkRole(['admin', 'gerente', 'vendedor']), 
  clienteDocumentoController.updateDocumento
);

router.patch('/documentos/:documentoId/deactivate', 
  checkRole(['admin', 'gerente']), 
  clienteDocumentoController.deactivateDocumento
);

module.exports = router;
