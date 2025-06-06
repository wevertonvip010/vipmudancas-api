const express = require('express');
const router = express.Router();
const contratoNumeracaoController = require('../controllers/contratoNumeracao.controller');
const { auth, checkRole } = require('../middleware/auth.middleware');

// Todas as rotas requerem autenticação
router.use(auth);

// Rotas para numeração de contratos
router.post('/contratos/:tipoContrato/:contratoId/vincular-os/:ordemServicoId', 
  checkRole(['admin', 'gerente']), 
  contratoNumeracaoController.vincularContratoOrdemServico
);

router.post('/ordens-servico/:ordemServicoId/criar-contrato/:tipoContrato', 
  checkRole(['admin', 'gerente']), 
  contratoNumeracaoController.criarContratoComOrdemServico
);

router.get('/contratos/numero/:numero', 
  checkRole(['admin', 'gerente', 'vendedor', 'operacional']), 
  contratoNumeracaoController.buscarContratoPorNumero
);

module.exports = router;
