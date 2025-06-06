const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const autentiqueController = require('../controllers/autentique.controller');
const authMiddleware = require('../middleware/auth.middleware');

// Configuração do multer para upload de arquivos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/documentos/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  // Aceitar apenas PDFs e documentos Word
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Tipo de arquivo não permitido. Apenas PDF, DOC e DOCX são aceitos.'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  }
});

/**
 * @route POST /api/autentique/documentos
 * @desc Criar documento para assinatura
 * @access Private (Admin, Vendedor)
 */
router.post('/documentos', 
  authMiddleware.verificarToken,
  authMiddleware.verificarPermissao(['admin', 'vendedor']),
  upload.single('arquivo'),
  autentiqueController.criarDocumento
);

/**
 * @route GET /api/autentique/documentos
 * @desc Listar documentos
 * @access Private (Admin, Vendedor, Financeiro)
 */
router.get('/documentos',
  authMiddleware.verificarToken,
  authMiddleware.verificarPermissao(['admin', 'vendedor', 'financeiro']),
  autentiqueController.listarDocumentos
);

/**
 * @route GET /api/autentique/documentos/:id
 * @desc Consultar documento específico
 * @access Private (Admin, Vendedor, Financeiro)
 */
router.get('/documentos/:id',
  authMiddleware.verificarToken,
  authMiddleware.verificarPermissao(['admin', 'vendedor', 'financeiro']),
  autentiqueController.consultarDocumento
);

/**
 * @route DELETE /api/autentique/documentos/:id
 * @desc Cancelar documento
 * @access Private (Admin, Criador do documento)
 */
router.delete('/documentos/:id',
  authMiddleware.verificarToken,
  authMiddleware.verificarPermissao(['admin', 'vendedor']),
  autentiqueController.cancelarDocumento
);

/**
 * @route POST /api/autentique/documentos/:id/reenviar
 * @desc Reenviar documento para assinatura
 * @access Private (Admin, Vendedor)
 */
router.post('/documentos/:id/reenviar',
  authMiddleware.verificarToken,
  authMiddleware.verificarPermissao(['admin', 'vendedor']),
  autentiqueController.reenviarDocumento
);

/**
 * @route POST /api/autentique/webhook
 * @desc Webhook da Autentique para receber atualizações
 * @access Public (mas com validação de origem)
 */
router.post('/webhook',
  autentiqueController.webhook
);

/**
 * @route GET /api/autentique/estatisticas
 * @desc Estatísticas dos documentos
 * @access Private (Admin, Vendedor, Financeiro)
 */
router.get('/estatisticas',
  authMiddleware.verificarToken,
  authMiddleware.verificarPermissao(['admin', 'vendedor', 'financeiro']),
  autentiqueController.estatisticas
);

// Middleware de tratamento de erros do multer
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        sucesso: false,
        erro: 'Arquivo muito grande. Tamanho máximo: 10MB'
      });
    }
    
    return res.status(400).json({
      sucesso: false,
      erro: 'Erro no upload do arquivo',
      detalhes: error.message
    });
  }
  
  if (error.message.includes('Tipo de arquivo não permitido')) {
    return res.status(400).json({
      sucesso: false,
      erro: error.message
    });
  }
  
  next(error);
});

module.exports = router;

