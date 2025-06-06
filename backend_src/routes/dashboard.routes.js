const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboard.controller');
const authMiddleware = require('../middleware/auth.middleware');

/**
 * @route GET /api/dashboard/metricas
 * @desc Obter métricas principais do dashboard
 * @access Private
 */
router.get('/metricas',
  authMiddleware.verificarToken,
  dashboardController.obterMetricas
);

/**
 * @route GET /api/dashboard/graficos
 * @desc Obter dados para gráficos
 * @access Private
 */
router.get('/graficos',
  authMiddleware.verificarToken,
  dashboardController.obterGraficos
);

/**
 * @route GET /api/dashboard/atividades
 * @desc Obter atividades recentes
 * @access Private
 */
router.get('/atividades',
  authMiddleware.verificarToken,
  dashboardController.obterAtividades
);

/**
 * @route GET /api/dashboard/notificacoes
 * @desc Obter notificações do usuário
 * @access Private
 */
router.get('/notificacoes',
  authMiddleware.verificarToken,
  dashboardController.obterNotificacoes
);

/**
 * @route PUT /api/dashboard/notificacoes/:id/lida
 * @desc Marcar notificação como lida
 * @access Private
 */
router.put('/notificacoes/:id/lida',
  authMiddleware.verificarToken,
  dashboardController.marcarNotificacaoLida
);

/**
 * @route GET /api/dashboard/resumo
 * @desc Obter resumo executivo
 * @access Private
 */
router.get('/resumo',
  authMiddleware.verificarToken,
  dashboardController.obterResumo
);

/**
 * @route GET /api/dashboard/calendario
 * @desc Obter dados para calendário
 * @access Private
 */
router.get('/calendario',
  authMiddleware.verificarToken,
  dashboardController.obterCalendario
);

/**
 * @route GET /api/dashboard/performance
 * @desc Obter estatísticas de performance
 * @access Private
 */
router.get('/performance',
  authMiddleware.verificarToken,
  dashboardController.obterPerformance
);

module.exports = router;

