const express = require('express');
const router = express.Router();
const leadSiteController = require('../controllers/leadSite.controller');
const { auth } = require('../middleware/auth.middleware');

// Aplica o middleware de autenticação
router.use(auth);

// Funções disponíveis (verifica se existem no controller)
if (leadSiteController?.listarLeads) {
  router.get('/', leadSiteController.listarLeads);
}
if (leadSiteController?.criarLead) {
  router.post('/', leadSiteController.criarLead);
}
if (leadSiteController?.buscarLeadPorId) {
  router.get('/:id', leadSiteController.buscarLeadPorId);
}
if (leadSiteController?.atualizarLead) {
  router.put('/:id', leadSiteController.atualizarLead);
}
if (leadSiteController?.deletarLead) {
  router.delete('/:id', leadSiteController.deletarLead);
}

module.exports = router;
