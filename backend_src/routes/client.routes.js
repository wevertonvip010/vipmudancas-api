const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.status(200).json({
    sucesso: true,
    dados: { message: 'Rota de clientes funcionando' },
    erro: null
  });
});

module.exports = router;

