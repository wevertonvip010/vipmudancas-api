const express = require('express');
const router = express.Router();
const assistantBotController = require('../controllers/assistantBot.controller');
const { protect, hasPermission, hasAnyPermission } = require('../middleware/auth.middleware');

// Todas as rotas requerem autenticação
router.use(protect);

// Rotas para configuração do assistente (apenas para administradores)
router.get('/config', 
  hasPermission('admin:view_system_config'), 
  assistantBotController.getAssistantConfig);

router.put('/config', 
  hasPermission('admin:edit_system_config'), 
  assistantBotController.updateAssistantConfig);

// Rotas para gerenciar departamentos
router.post('/departamentos', 
  hasPermission('admin:edit_system_config'), 
  assistantBotController.upsertDepartamento);

// Rotas para gerenciar base de conhecimento
router.post('/conhecimento', 
  hasAnyPermission(['admin:edit_system_config', 'assistente:gerenciar_conhecimento']), 
  assistantBotController.addKnowledgeItem);

// Rota para consultar o assistente (disponível para todos os usuários autenticados)
router.post('/consultar', 
  assistantBotController.consultarAssistente);

// Rota para avaliar resposta
router.post('/avaliar', 
  assistantBotController.avaliarResposta);

// Rota para obter estatísticas
router.get('/estatisticas', 
  hasAnyPermission(['admin:view_system_config', 'assistente:view_estatisticas']), 
  assistantBotController.getEstatisticas);

module.exports = router;
