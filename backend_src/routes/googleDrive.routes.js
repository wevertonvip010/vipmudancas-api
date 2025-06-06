const express = require('express');
const router = express.Router();
const googleDriveController = require('../controllers/googleDrive.controller');
const { auth } = require('../middleware/auth.middleware');

// Aplica autenticação em todas as rotas
router.use(auth);

// Verifica se as funções existem antes de registrar
if (googleDriveController?.uploadArquivo) {
  router.post('/upload', googleDriveController.uploadArquivo);
}
if (googleDriveController?.listarArquivos) {
  router.get('/listar', googleDriveController.listarArquivos);
}
if (googleDriveController?.deletarArquivo) {
  router.delete('/:id', googleDriveController.deletarArquivo);
}

module.exports = router;
