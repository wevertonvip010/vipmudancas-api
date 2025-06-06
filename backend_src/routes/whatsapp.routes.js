const express = require('express');
const router = express.Router();
const whatsappController = require('../controllers/whatsapp.controller');
const { auth } = require('../middleware/auth.middleware');

// Aplica autenticação
router.use(auth);

// Rotas protegidas, apenas se os métodos existirem
if (whatsappController?.enviarMensagemTexto) {
  router.post('/texto', whatsappController.enviarMensagemTexto);
}
if (whatsappController?.enviarArquivo) {
  router.post('/arquivo', whatsappController.enviarArquivo);
}
if (whatsappController?.consultarStatus) {
  router.get('/status', whatsappController.consultarStatus);
}

module.exports = router;
