const express = require('express');
const router = express.Router();
const avaliacaoController = require('../controllers/avaliacao.controller');
const { auth } = require('../middleware/auth.middleware');

// Aplica autenticação em todas as rotas
router.use(auth);

// Verifica e registra cada rota, somente se a função existir
if (avaliacaoController?.listarAvaliacoes) {
  router.get('/', avaliacaoController.listarAvaliacoes);
}
if (avaliacaoController?.criarAvaliacao) {
  router.post('/', avaliacaoController.criarAvaliacao);
}
if (avaliacaoController?.buscarPorId) {
  router.get('/:id', avaliacaoController.buscarPorId);
}
if (avaliacaoController?.atualizarAvaliacao) {
  router.put('/:id', avaliacaoController.atualizarAvaliacao);
}
if (avaliacaoController?.deletarAvaliacao) {
  router.delete('/:id', avaliacaoController.deletarAvaliacao);
}

module.exports = router;
