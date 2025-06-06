const express = require('express');
const router = express.Router();
const clienteHistoricoController = require('../controllers/clienteHistorico.controller');
const { auth, checkRole } = require('../middleware/auth.middleware');

// Todas as rotas requerem autenticação
router.use(auth);

// Rotas para histórico do cliente
router.get('/cliente/:clienteId/historico', clienteHistoricoController.getHistorico);
router.get('/cliente/:clienteId/historico/search', clienteHistoricoController.searchHistorico);
router.get('/cliente/:clienteId/historico/resumo', clienteHistoricoController.getHistoricoResumo);
router.get('/historico/:historicoId', clienteHistoricoController.getHistoricoById);

// Rotas para criação (requerem permissões específicas)
router.post('/cliente/:clienteId/historico', 
  checkRole(['admin', 'gerente', 'vendedor', 'operacional']), 
  clienteHistoricoController.addHistorico
);

module.exports = router;
