const express = require('express');
const router = express.Router();

// Rota básica para usuários
router.get('/', (req, res) => {
  res.status(200).json({
    sucesso: true,
    dados: { message: 'Rota de usuários funcionando' },
    erro: null
  });
});

module.exports = router;

