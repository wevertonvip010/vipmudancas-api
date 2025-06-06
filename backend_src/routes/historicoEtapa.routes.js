const express = require('express');
const router = express.Router();

const historicoEtapaController = require('../controllers/historicoEtapa.controller');
const { authenticateToken, requireRole } = require('../middleware/auth.middleware');

// aplicar autenticação
const { auth } = require('../middleware/auth.middleware');
router.use(auth);