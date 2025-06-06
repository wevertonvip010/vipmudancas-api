const express = require('express');
const router = express.Router();
const permissaoController = require('../controllers/permissao.controller');
const authMiddleware = require('../middleware/auth.middleware');

/**
 * @route GET /api/permissoes
 * @desc Listar todas as permissões
 * @access Private (Admin)
 */
router.get('/permissoes',
  authMiddleware.verificarToken,
  authMiddleware.verificarPermissao(['admin']),
  permissaoController.listarPermissoes
);

/**
 * @route GET /api/permissoes/minhas
 * @desc Obter permissões do usuário atual
 * @access Private
 */
router.get('/permissoes/minhas',
  authMiddleware.verificarToken,
  permissaoController.minhasPermissoes
);

/**
 * @route POST /api/permissoes/inicializar
 * @desc Inicializar sistema de permissões
 * @access Private (Admin)
 */
router.post('/permissoes/inicializar',
  authMiddleware.verificarToken,
  authMiddleware.verificarPermissao(['admin']),
  permissaoController.inicializarSistema
);

/**
 * @route GET /api/roles
 * @desc Listar todos os roles
 * @access Private (Admin)
 */
router.get('/roles',
  authMiddleware.verificarToken,
  authMiddleware.verificarPermissao(['admin']),
  permissaoController.listarRoles
);

/**
 * @route POST /api/roles
 * @desc Criar novo role
 * @access Private (Admin)
 */
router.post('/roles',
  authMiddleware.verificarToken,
  authMiddleware.verificarPermissao(['admin']),
  permissaoController.criarRole
);

/**
 * @route PUT /api/roles/:id
 * @desc Atualizar role
 * @access Private (Admin)
 */
router.put('/roles/:id',
  authMiddleware.verificarToken,
  authMiddleware.verificarPermissao(['admin']),
  permissaoController.atualizarRole
);

/**
 * @route DELETE /api/roles/:id
 * @desc Excluir role
 * @access Private (Admin)
 */
router.delete('/roles/:id',
  authMiddleware.verificarToken,
  authMiddleware.verificarPermissao(['admin']),
  permissaoController.excluirRole
);

module.exports = router;

