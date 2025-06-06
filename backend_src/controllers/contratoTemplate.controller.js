const ContratoTemplate = require('../models/contratoTemplate.model');

// Criar novo template de contrato
exports.criarTemplate = async (req, res) => {
  try {
    const { nome, tipo, conteudo, versao } = req.body;
    
    // Verificar se já existe um template com o mesmo nome e versão
    const templateExistente = await ContratoTemplate.findOne({ nome, versao });
    if (templateExistente) {
      return res.status(400).json({
        success: false,
        message: 'Já existe um template com este nome e versão'
      });
    }
    
    // Criar novo template
    const novoTemplate = new ContratoTemplate({
      nome,
      tipo,
      conteudo,
      versao
    });
    
    // Salvar template
    await novoTemplate.save();
    
    res.status(201).json({
      success: true,
      data: novoTemplate,
      message: 'Template de contrato criado com sucesso'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao criar template de contrato',
      error: error.message
    });
  }
};

// Listar todos os templates
exports.listarTemplates = async (req, res) => {
  try {
    const { tipo, ativo } = req.query;
    let filtro = {};
    
    // Filtrar por tipo se fornecido
    if (tipo) {
      filtro.tipo = tipo;
    }
    
    // Filtrar por status se fornecido
    if (ativo !== undefined) {
      filtro.ativo = ativo === 'true';
    }
    
    const templates = await ContratoTemplate.find(filtro).sort({ nome: 1, versao: -1 });
    
    res.status(200).json({
      success: true,
      count: templates.length,
      data: templates
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao listar templates de contrato',
      error: error.message
    });
  }
};

// Obter detalhes de um template específico
exports.obterTemplate = async (req, res) => {
  try {
    const template = await ContratoTemplate.findById(req.params.id);
    
    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template de contrato não encontrado'
      });
    }
    
    res.status(200).json({
      success: true,
      data: template
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao obter detalhes do template de contrato',
      error: error.message
    });
  }
};

// Atualizar template
exports.atualizarTemplate = async (req, res) => {
  try {
    const { nome, conteudo, ativo } = req.body;
    
    // Verificar se o template existe
    let template = await ContratoTemplate.findById(req.params.id);
    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template de contrato não encontrado'
      });
    }
    
    // Atualizar campos
    if (nome) template.nome = nome;
    if (conteudo) template.conteudo = conteudo;
    if (ativo !== undefined) template.ativo = ativo;
    
    // Salvar alterações
    await template.save();
    
    res.status(200).json({
      success: true,
      data: template,
      message: 'Template de contrato atualizado com sucesso'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar template de contrato',
      error: error.message
    });
  }
};

// Excluir template
exports.excluirTemplate = async (req, res) => {
  try {
    // Verificar se o template existe
    const template = await ContratoTemplate.findById(req.params.id);
    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template de contrato não encontrado'
      });
    }
    
    // Excluir template
    await ContratoTemplate.findByIdAndDelete(req.params.id);
    
    res.status(200).json({
      success: true,
      message: 'Template de contrato excluído com sucesso'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao excluir template de contrato',
      error: error.message
    });
  }
};

// Gerar contrato a partir do template
exports.gerarContrato = async (req, res) => {
  try {
    const { templateId, dados } = req.body;
    
    // Verificar se o template existe
    const template = await ContratoTemplate.findById(templateId);
    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template de contrato não encontrado'
      });
    }
    
    // Substituir variáveis no template
    let conteudoContrato = template.conteudo;
    
    // Substituir todas as variáveis no formato {{variavel}} pelos valores correspondentes
    Object.keys(dados).forEach(chave => {
      const regex = new RegExp(`{{${chave}}}`, 'g');
      conteudoContrato = conteudoContrato.replace(regex, dados[chave]);
    });
    
    res.status(200).json({
      success: true,
      data: {
        nome: template.nome,
        tipo: template.tipo,
        versao: template.versao,
        conteudo: conteudoContrato
      },
      message: 'Contrato gerado com sucesso'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao gerar contrato',
      error: error.message
    });
  }
};
