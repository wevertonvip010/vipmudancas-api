const express = require('express');
const router = express.Router();
const permissionController = require('../controllers/permission.controller');
const { protect, hasPermission } = require('../middleware/auth.middleware');

// Todas as rotas requerem autenticação
router.use(protect);

// Rotas para gerenciar permissões (apenas para administradores)
router.route('/')
  .get(hasPermission('admin:view_permissions'), permissionController.getAllPermissions)
  .post(hasPermission('admin:create_permission'), permissionController.createPermission);

router.route('/:id')
  .get(hasPermission('admin:view_permissions'), permissionController.getPermissionById)
  .put(hasPermission('admin:edit_permission'), permissionController.updatePermission)
  .delete(hasPermission('admin:delete_permission'), permissionController.deletePermission);

// Rotas adicionais
router.get('/module/:modulo', hasPermission('admin:view_permissions'), permissionController.getPermissionsByModule);
router.get('/modules/all', hasPermission('admin:view_permissions'), permissionController.getAllModules);

module.exports = router;
