const express = require('express');
const router = express.Router();
const eventoController = require('../controllers/evento.controller');
const { protect, hasPermission, hasAnyPermission } = require('../middleware/auth.middleware');

// Todas as rotas requerem autenticação
router.use(protect);

// Rotas para gerenciar eventos
router.route('/')
  .get(eventoController.getAllEventos)
  .post(eventoController.createEvento);

router.route('/:id')
  .get(eventoController.getEventoById)
  .put(hasAnyPermission(['admin:edit_eventos', 'calendario:edit_eventos']), eventoController.updateEvento)
  .delete(hasAnyPermission(['admin:delete_eventos', 'calendario:delete_eventos']), eventoController.deleteEvento);

// Rotas adicionais
router.get('/setor/:setor', eventoController.getEventosBySetor);
router.get('/data/:dataInicio/:dataFim', eventoController.getEventosByDateRange);

module.exports = router;
