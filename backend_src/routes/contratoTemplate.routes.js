const express = require('express');
const router = express.Router();
const contratoTemplateController = require('../controllers/contratoTemplate.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

// Rotas protegidas por autenticação
router.use(protect);

// Rotas para administradores
router.route('/')
  .post(authorize('admin'), contratoTemplateController.criarTemplate)
  .get(contratoTemplateController.listarTemplates);

router.route('/:id')
  .get(contratoTemplateController.obterTemplate)
  .put(authorize('admin'), contratoTemplateController.atualizarTemplate)
  .delete(authorize('admin'), contratoTemplateController.excluirTemplate);

router.post('/gerar', contratoTemplateController.gerarContrato);

module.exports = router;
