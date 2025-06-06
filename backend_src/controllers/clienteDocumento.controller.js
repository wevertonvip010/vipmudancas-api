const ClienteDocumento = require('../models/clienteDocumento.model');
const Cliente = require('../models/cliente.model');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');

// Configuração do multer para upload de arquivos
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const clienteId = req.params.clienteId;
    const uploadDir = path.join(__dirname, '../../uploads/clientes', clienteId);
    
    // Criar diretório se não existir
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Gerar nome único para o arquivo
    const uniqueFilename = `${Date.now()}-${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueFilename);
  }
});

// Filtro para tipos de arquivos permitidos
const fileFilter = (req, file, cb) => {
  // Tipos de arquivos permitidos
  const allowedTypes = [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'application/pdf',
    'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain'
  ];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Tipo de arquivo não permitido. Apenas imagens, PDFs, documentos do Office e arquivos de texto são permitidos.'), false);
  }
};

// Configuração do multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // Limite de 10MB
  }
});

// Middleware para upload de arquivos
exports.uploadMiddleware = upload.single('arquivo');

// Adicionar documento ao cliente
exports.addDocumento = async (req, res) => {
  try {
    const { clienteId } = req.params;
    const { nome, tipo, descricao, referencia } = req.body;
    
    // Verificar se o cliente existe
    const cliente = await Cliente.findById(clienteId);
    if (!cliente) {
      // Remover o arquivo se o cliente não existir
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(404).json({ message: 'Cliente não encontrado.' });
    }
    
    // Verificar se o arquivo foi enviado
    if (!req.file) {
      return res.status(400).json({ message: 'Nenhum arquivo enviado.' });
    }
    
    // Criar novo documento
    const documento = new ClienteDocumento({
      cliente: clienteId,
      nome: nome || req.file.originalname,
      tipo: tipo || 'outro',
      descricao,
      caminhoArquivo: req.file.path,
      tamanhoArquivo: req.file.size,
      tipoArquivo: req.file.mimetype,
      referencia: referencia ? JSON.parse(referencia) : undefined,
      criadoPor: req.user.id
    });
    
    // Salvar documento
    await documento.save();
    
    // Atualizar última interação do cliente
    cliente.ultimaInteracao = {
      data: Date.now(),
      tipo: 'documento',
      descricao: `Documento ${nome || req.file.originalname} adicionado`
    };
    cliente.ultimaAtualizacao = Date.now();
    await cliente.save();
    
    // Registrar no histórico do cliente (será implementado na próxima etapa)
    
    res.status(201).json({
      message: 'Documento adicionado com sucesso',
      documento
    });
  } catch (error) {
    console.error('Erro ao adicionar documento:', error);
    // Remover o arquivo em caso de erro
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ message: 'Erro ao adicionar documento.' });
  }
};

// Listar documentos do cliente
exports.getDocumentos = async (req, res) => {
  try {
    const { clienteId } = req.params;
    const { tipo, referencia } = req.query;
    
    // Verificar se o cliente existe
    const cliente = await Cliente.findById(clienteId);
    if (!cliente) {
      return res.status(404).json({ message: 'Cliente não encontrado.' });
    }
    
    // Construir filtro
    const filtro = { cliente: clienteId, ativo: true };
    
    if (tipo) {
      filtro.tipo = tipo;
    }
    
    if (referencia) {
      filtro['referencia.tipo'] = referencia;
    }
    
    // Buscar documentos
    const documentos = await ClienteDocumento.find(filtro)
      .sort({ dataCriacao: -1 })
      .populate('criadoPor', 'nome email');
    
    res.json(documentos);
  } catch (error) {
    console.error('Erro ao listar documentos:', error);
    res.status(500).json({ message: 'Erro ao listar documentos.' });
  }
};

// Obter documento por ID
exports.getDocumentoById = async (req, res) => {
  try {
    const { documentoId } = req.params;
    
    const documento = await ClienteDocumento.findById(documentoId)
      .populate('criadoPor', 'nome email');
    
    if (!documento) {
      return res.status(404).json({ message: 'Documento não encontrado.' });
    }
    
    res.json(documento);
  } catch (error) {
    console.error('Erro ao buscar documento:', error);
    res.status(500).json({ message: 'Erro ao buscar documento.' });
  }
};

// Download de documento
exports.downloadDocumento = async (req, res) => {
  try {
    const { documentoId } = req.params;
    
    const documento = await ClienteDocumento.findById(documentoId);
    
    if (!documento) {
      return res.status(404).json({ message: 'Documento não encontrado.' });
    }
    
    // Verificar se o arquivo existe
    if (!fs.existsSync(documento.caminhoArquivo)) {
      return res.status(404).json({ message: 'Arquivo não encontrado.' });
    }
    
    // Enviar arquivo
    res.download(documento.caminhoArquivo, documento.nome);
  } catch (error) {
    console.error('Erro ao fazer download do documento:', error);
    res.status(500).json({ message: 'Erro ao fazer download do documento.' });
  }
};

// Atualizar documento
exports.updateDocumento = async (req, res) => {
  try {
    const { documentoId } = req.params;
    const { nome, tipo, descricao, referencia } = req.body;
    
    const documento = await ClienteDocumento.findById(documentoId);
    
    if (!documento) {
      return res.status(404).json({ message: 'Documento não encontrado.' });
    }
    
    // Atualizar campos
    documento.nome = nome || documento.nome;
    documento.tipo = tipo || documento.tipo;
    documento.descricao = descricao !== undefined ? descricao : documento.descricao;
    
    if (referencia) {
      documento.referencia = JSON.parse(referencia);
    }
    
    await documento.save();
    
    res.json({
      message: 'Documento atualizado com sucesso',
      documento
    });
  } catch (error) {
    console.error('Erro ao atualizar documento:', error);
    res.status(500).json({ message: 'Erro ao atualizar documento.' });
  }
};

// Desativar documento
exports.deactivateDocumento = async (req, res) => {
  try {
    const { documentoId } = req.params;
    
    const documento = await ClienteDocumento.findById(documentoId);
    
    if (!documento) {
      return res.status(404).json({ message: 'Documento não encontrado.' });
    }
    
    documento.ativo = false;
    await documento.save();
    
    res.json({ message: 'Documento desativado com sucesso.' });
  } catch (error) {
    console.error('Erro ao desativar documento:', error);
    res.status(500).json({ message: 'Erro ao desativar documento.' });
  }
};

// Buscar documentos por tipo
exports.searchDocumentos = async (req, res) => {
  try {
    const { clienteId } = req.params;
    const { termo } = req.query;
    
    if (!termo) {
      return res.status(400).json({ message: 'Termo de busca não fornecido.' });
    }
    
    const documentos = await ClienteDocumento.find({
      cliente: clienteId,
      ativo: true,
      $or: [
        { nome: { $regex: termo, $options: 'i' } },
        { descricao: { $regex: termo, $options: 'i' } }
      ]
    }).sort({ dataCriacao: -1 });
    
    res.json(documentos);
  } catch (error) {
    console.error('Erro ao buscar documentos:', error);
    res.status(500).json({ message: 'Erro ao buscar documentos.' });
  }
};
