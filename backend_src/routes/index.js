const express = require('express');
const router = express.Router();

// Importa todos os arquivos de rota (se precisar, pode comentar algum para debugar depois)
const authRoutes = require('./auth.routes');
const userRoutes = require('./User.routes');
const clienteRoutes = require('./client.routes');
const contratoRoutes = require('./contract.routes');
const leadRoutes = require('./leadSite.routes');
const gamificacaoRoutes = require('./gamificacao.routes');
const googleDriveRoutes = require('./googleDrive.routes');
const avaliacaoRoutes = require('./avaliacao.routes');
const whatsappRoutes = require('./whatsapp.routes');
// adicione outros arquivos conforme necessário...

// Usa as rotas
router.use('/auth', authRoutes);
router.use('/usuarios', userRoutes);
router.use('/clientes', clienteRoutes);
router.use('/contratos', contratoRoutes);
router.use('/leads', leadRoutes);
router.use('/gamificacao', gamificacaoRoutes);
router.use('/drive', googleDriveRoutes);
router.use('/avaliacoes', avaliacaoRoutes);
router.use('/whatsapp', whatsappRoutes);

module.exports = router;
