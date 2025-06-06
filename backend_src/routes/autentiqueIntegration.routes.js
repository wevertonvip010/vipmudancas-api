const express = require('express');
const router = express.Router();
const autentiqueIntegrationController = require('../controllers/autentiqueIntegration.controller');
const { auth, checkRole } = require('../middleware/auth.middleware');

// Todas as rotas requerem autenticação
router.use(auth);

// Rotas para integração com Autentique
router.post('/contratos/:tipoContrato/:contratoId/enviar-para-assinatura', 
  checkRole(['admin', 'gerente']), 
  autentiqueIntegrationController.enviarContratoParaAssinatura
);

router.get('/contratos/:tipoContrato/:contratoId/verificar-status', 
  checkRole(['admin', 'gerente', 'vendedor']), 
  autentiqueIntegrationController.verificarStatusContrato
);

router.post('/contratos/:tipoContrato/:contratoId/reenviar-solicitacoes', 
  checkRole(['admin', 'gerente']), 
  autentiqueIntegrationController.reenviarSolicitacoesAssinatura
);

// Webhook da Autentique (não requer autenticação)
router.post('/webhook', 
  express.json({ type: 'application/json' }), 
  autentiqueIntegrationController.webhookAutentique
);

module.exports = router;
