const autentiqueService = require('../services/autentique.service');
const DocumentoAutentique = require('../models/documentoAutentique.model');
const fs = require('fs').promises;
const path = require('path');

class AutentiqueController {
  
  /**
   * Criar documento para assinatura
   * POST /api/autentique/documentos
   */
  async criarDocumento(req, res) {
    try {
      const { 
        nome, 
        tipo, 
        signatarios, 
        clienteId, 
        orcamentoId, 
        contratoId,
        configuracoes,
        observacoes 
      } = req.body;
      
      const arquivo = req.file;
      
      // Validações básicas
      if (!nome || !signatarios || !Array.isArray(signatarios) || signatarios.length === 0) {
        return res.status(400).json({
          sucesso: false,
          erro: 'Nome do documento e signatários são obrigatórios'
        });
      }
      
      if (!arquivo) {
        return res.status(400).json({
          sucesso: false,
          erro: 'Arquivo do documento é obrigatório'
        });
      }
      
      // Converter arquivo para base64
      const arquivoBuffer = await fs.readFile(arquivo.path);
      const arquivoBase64 = arquivoBuffer.toString('base64');
      
      // Preparar dados para a Autentique
      const documentData = {
        nome,
        arquivo: `data:${arquivo.mimetype};base64,${arquivoBase64}`,
        signatarios,
        configuracoes: configuracoes || {}
      };
      
      // Enviar para Autentique
      const resultadoAutentique = await autentiqueService.criarDocumento(documentData);
      
      if (!resultadoAutentique.sucesso) {
        return res.status(400).json({
          sucesso: false,
          erro: 'Erro ao criar documento na Autentique',
          detalhes: resultadoAutentique.erro
        });
      }
      
      // Salvar no banco local
      const documentoLocal = new DocumentoAutentique({
        autentiqueId: resultadoAutentique.dados.id,
        uuid: resultadoAutentique.dados.uuid,
        nome,
        tipo: tipo || 'CONTRATO',
        status: 'PENDING',
        linkVisualizacao: resultadoAutentique.dados.linkVisualizacao,
        clienteId,
        orcamentoId,
        contratoId,
        signatarios: signatarios.map(s => ({
          nome: s.nome,
          email: s.email,
          telefone: s.telefone,
          acao: s.acao || 'SIGN',
          status: 'PENDING'
        })),
        configuracoes: configuracoes || {},
        arquivoOriginal: {
          nome: arquivo.originalname,
          caminho: arquivo.path,
          tamanho: arquivo.size
        },
        criadoPor: req.user.id,
        observacoes,
        eventos: [{
          tipo: 'CREATED',
          descricao: 'Documento criado e enviado para assinatura',
          usuario: {
            nome: req.user.nome,
            email: req.user.email
          },
          dataHora: new Date()
        }]
      });
      
      await documentoLocal.save();
      
      // Limpar arquivo temporário
      try {
        await fs.unlink(arquivo.path);
      } catch (error) {
        console.warn('⚠️  Erro ao remover arquivo temporário:', error.message);
      }
      
      return res.status(201).json({
        sucesso: true,
        dados: {
          id: documentoLocal._id,
          autentiqueId: documentoLocal.autentiqueId,
          uuid: documentoLocal.uuid,
          nome: documentoLocal.nome,
          status: documentoLocal.status,
          linkVisualizacao: documentoLocal.linkVisualizacao,
          urlVisualizacao: documentoLocal.urlVisualizacao,
          signatarios: documentoLocal.signatarios,
          criadoEm: documentoLocal.criadoEm
        }
      });
      
    } catch (error) {
      console.error('❌ Erro ao criar documento:', error);
      
      return res.status(500).json({
        sucesso: false,
        erro: 'Erro interno do servidor',
        detalhes: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
  
  /**
   * Listar documentos
   * GET /api/autentique/documentos
   */
  async listarDocumentos(req, res) {
    try {
      const { 
        status, 
        clienteId, 
        tipo, 
        pagina = 1, 
        limite = 20,
        ordenacao = '-criadoEm'
      } = req.query;
      
      // Construir filtros
      const filtros = {};
      if (status) filtros.status = status;
      if (clienteId) filtros.clienteId = clienteId;
      if (tipo) filtros.tipo = tipo;
      
      // Aplicar filtros de permissão baseado no usuário
      if (req.user.role !== 'admin') {
        // Vendedores só veem seus próprios documentos
        if (req.user.role === 'vendedor') {
          filtros.criadoPor = req.user.id;
        }
      }
      
      const skip = (parseInt(pagina) - 1) * parseInt(limite);
      
      const [documentos, total] = await Promise.all([
        DocumentoAutentique.find(filtros)
          .populate('clienteId', 'nome email telefone')
          .populate('criadoPor', 'nome email')
          .sort(ordenacao)
          .skip(skip)
          .limit(parseInt(limite)),
        DocumentoAutentique.countDocuments(filtros)
      ]);
      
      return res.status(200).json({
        sucesso: true,
        dados: {
          documentos: documentos.map(doc => ({
            id: doc._id,
            autentiqueId: doc.autentiqueId,
            uuid: doc.uuid,
            nome: doc.nome,
            tipo: doc.tipo,
            status: doc.status,
            linkVisualizacao: doc.linkVisualizacao,
            urlVisualizacao: doc.urlVisualizacao,
            cliente: doc.clienteId,
            signatarios: doc.signatarios,
            criadoEm: doc.criadoEm,
            finalizadoEm: doc.finalizadoEm,
            criadoPor: doc.criadoPor
          })),
          paginacao: {
            paginaAtual: parseInt(pagina),
            totalPaginas: Math.ceil(total / parseInt(limite)),
            totalItens: total,
            itensPorPagina: parseInt(limite)
          }
        }
      });
      
    } catch (error) {
      console.error('❌ Erro ao listar documentos:', error);
      
      return res.status(500).json({
        sucesso: false,
        erro: 'Erro interno do servidor',
        detalhes: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
  
  /**
   * Consultar documento específico
   * GET /api/autentique/documentos/:id
   */
  async consultarDocumento(req, res) {
    try {
      const { id } = req.params;
      
      const documento = await DocumentoAutentique.findById(id)
        .populate('clienteId', 'nome email telefone endereco')
        .populate('orcamentoId', 'numero valor')
        .populate('contratoId', 'numero valor')
        .populate('criadoPor', 'nome email');
      
      if (!documento) {
        return res.status(404).json({
          sucesso: false,
          erro: 'Documento não encontrado'
        });
      }
      
      // Verificar permissões
      if (req.user.role !== 'admin' && req.user.role !== 'financeiro') {
        if (req.user.role === 'vendedor' && documento.criadoPor._id.toString() !== req.user.id) {
          return res.status(403).json({
            sucesso: false,
            erro: 'Acesso negado'
          });
        }
      }
      
      // Sincronizar com Autentique
      const statusAutentique = await autentiqueService.consultarDocumento(documento.autentiqueId);
      
      if (statusAutentique.sucesso) {
        // Atualizar dados locais se necessário
        let atualizado = false;
        
        if (documento.status !== statusAutentique.dados.status) {
          documento.status = statusAutentique.dados.status;
          atualizado = true;
        }
        
        if (statusAutentique.dados.linkDownload && !documento.linkDownload) {
          documento.linkDownload = statusAutentique.dados.linkDownload;
          atualizado = true;
        }
        
        if (statusAutentique.dados.finalizadoEm && !documento.finalizadoEm) {
          documento.finalizadoEm = new Date(statusAutentique.dados.finalizadoEm);
          atualizado = true;
        }
        
        // Atualizar signatários
        statusAutentique.dados.signatarios.forEach(sigAutentique => {
          const sigLocal = documento.signatarios.find(s => s.email === sigAutentique.email);
          if (sigLocal && sigLocal.status !== sigAutentique.status) {
            sigLocal.status = sigAutentique.status;
            if (sigAutentique.assinadoEm) {
              sigLocal.assinadoEm = new Date(sigAutentique.assinadoEm);
            }
            atualizado = true;
          }
        });
        
        if (atualizado) {
          await documento.save();
        }
      }
      
      return res.status(200).json({
        sucesso: true,
        dados: {
          id: documento._id,
          autentiqueId: documento.autentiqueId,
          uuid: documento.uuid,
          nome: documento.nome,
          tipo: documento.tipo,
          status: documento.status,
          linkVisualizacao: documento.linkVisualizacao,
          linkDownload: documento.linkDownload,
          urlVisualizacao: documento.urlVisualizacao,
          cliente: documento.clienteId,
          orcamento: documento.orcamentoId,
          contrato: documento.contratoId,
          signatarios: documento.signatarios,
          configuracoes: documento.configuracoes,
          eventos: documento.eventos,
          criadoEm: documento.criadoEm,
          finalizadoEm: documento.finalizadoEm,
          venceEm: documento.venceEm,
          criadoPor: documento.criadoPor,
          observacoes: documento.observacoes
        }
      });
      
    } catch (error) {
      console.error('❌ Erro ao consultar documento:', error);
      
      return res.status(500).json({
        sucesso: false,
        erro: 'Erro interno do servidor',
        detalhes: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
  
  /**
   * Cancelar documento
   * DELETE /api/autentique/documentos/:id
   */
  async cancelarDocumento(req, res) {
    try {
      const { id } = req.params;
      const { motivo } = req.body;
      
      const documento = await DocumentoAutentique.findById(id);
      
      if (!documento) {
        return res.status(404).json({
          sucesso: false,
          erro: 'Documento não encontrado'
        });
      }
      
      // Verificar permissões
      if (req.user.role !== 'admin' && documento.criadoPor.toString() !== req.user.id) {
        return res.status(403).json({
          sucesso: false,
          erro: 'Apenas o criador do documento ou administrador pode cancelá-lo'
        });
      }
      
      if (documento.status === 'SIGNED') {
        return res.status(400).json({
          sucesso: false,
          erro: 'Não é possível cancelar um documento já assinado'
        });
      }
      
      // Cancelar na Autentique
      const resultadoCancelamento = await autentiqueService.cancelarDocumento(documento.autentiqueId);
      
      if (!resultadoCancelamento.sucesso) {
        return res.status(400).json({
          sucesso: false,
          erro: 'Erro ao cancelar documento na Autentique',
          detalhes: resultadoCancelamento.erro
        });
      }
      
      // Atualizar status local
      await documento.atualizarStatus('CANCELLED', {
        nome: req.user.nome,
        email: req.user.email
      });
      
      if (motivo) {
        await documento.adicionarEvento(
          'CANCELLED',
          `Documento cancelado. Motivo: ${motivo}`,
          {
            nome: req.user.nome,
            email: req.user.email
          }
        );
      }
      
      return res.status(200).json({
        sucesso: true,
        dados: {
          mensagem: 'Documento cancelado com sucesso',
          id: documento._id,
          status: 'CANCELLED'
        }
      });
      
    } catch (error) {
      console.error('❌ Erro ao cancelar documento:', error);
      
      return res.status(500).json({
        sucesso: false,
        erro: 'Erro interno do servidor',
        detalhes: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
  
  /**
   * Reenviar documento
   * POST /api/autentique/documentos/:id/reenviar
   */
  async reenviarDocumento(req, res) {
    try {
      const { id } = req.params;
      
      const documento = await DocumentoAutentique.findById(id);
      
      if (!documento) {
        return res.status(404).json({
          sucesso: false,
          erro: 'Documento não encontrado'
        });
      }
      
      if (documento.status !== 'PENDING') {
        return res.status(400).json({
          sucesso: false,
          erro: 'Apenas documentos pendentes podem ser reenviados'
        });
      }
      
      // Reenviar na Autentique
      const resultadoReenvio = await autentiqueService.reenviarDocumento(documento.autentiqueId);
      
      if (!resultadoReenvio.sucesso) {
        return res.status(400).json({
          sucesso: false,
          erro: 'Erro ao reenviar documento na Autentique',
          detalhes: resultadoReenvio.erro
        });
      }
      
      // Registrar evento
      await documento.adicionarEvento(
        'SENT',
        'Documento reenviado para assinatura',
        {
          nome: req.user.nome,
          email: req.user.email
        }
      );
      
      return res.status(200).json({
        sucesso: true,
        dados: {
          mensagem: 'Documento reenviado com sucesso',
          id: documento._id
        }
      });
      
    } catch (error) {
      console.error('❌ Erro ao reenviar documento:', error);
      
      return res.status(500).json({
        sucesso: false,
        erro: 'Erro interno do servidor',
        detalhes: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
  
  /**
   * Webhook da Autentique
   * POST /api/autentique/webhook
   */
  async webhook(req, res) {
    try {
      const webhookData = req.body;
      
      // Processar dados do webhook
      const resultado = autentiqueService.processarWebhook(webhookData);
      
      if (!resultado.sucesso) {
        return res.status(400).json({
          sucesso: false,
          erro: 'Erro ao processar webhook',
          detalhes: resultado.erro
        });
      }
      
      const { evento, documento: docWebhook } = resultado.dados;
      
      // Buscar documento local
      const documentoLocal = await DocumentoAutentique.findOne({
        autentiqueId: docWebhook.id
      });
      
      if (!documentoLocal) {
        console.warn(`⚠️  Documento ${docWebhook.id} não encontrado localmente`);
        return res.status(200).json({ sucesso: true });
      }
      
      // Atualizar status e dados
      if (documentoLocal.status !== docWebhook.status) {
        await documentoLocal.atualizarStatus(docWebhook.status);
      }
      
      if (docWebhook.linkDownload && !documentoLocal.linkDownload) {
        documentoLocal.linkDownload = docWebhook.linkDownload;
      }
      
      if (docWebhook.finalizadoEm && !documentoLocal.finalizadoEm) {
        documentoLocal.finalizadoEm = new Date(docWebhook.finalizadoEm);
      }
      
      // Atualizar signatários
      docWebhook.signatarios.forEach(sigWebhook => {
        const sigLocal = documentoLocal.signatarios.find(s => s.email === sigWebhook.email);
        if (sigLocal) {
          sigLocal.status = sigWebhook.status;
          if (sigWebhook.assinadoEm) {
            sigLocal.assinadoEm = new Date(sigWebhook.assinadoEm);
          }
        }
      });
      
      await documentoLocal.save();
      
      // Registrar evento do webhook
      await documentoLocal.adicionarEvento(
        evento.toUpperCase(),
        `Webhook recebido: ${evento}`,
        null,
        { webhook: webhookData }
      );
      
      return res.status(200).json({
        sucesso: true,
        dados: {
          mensagem: 'Webhook processado com sucesso',
          evento,
          documentoId: documentoLocal._id
        }
      });
      
    } catch (error) {
      console.error('❌ Erro ao processar webhook:', error);
      
      return res.status(500).json({
        sucesso: false,
        erro: 'Erro interno do servidor',
        detalhes: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
  
  /**
   * Estatísticas dos documentos
   * GET /api/autentique/estatisticas
   */
  async estatisticas(req, res) {
    try {
      const { periodo = '30' } = req.query;
      
      const dataInicio = new Date();
      dataInicio.setDate(dataInicio.getDate() - parseInt(periodo));
      
      const filtros = {
        criadoEm: { $gte: dataInicio }
      };
      
      // Aplicar filtros de permissão
      if (req.user.role === 'vendedor') {
        filtros.criadoPor = req.user.id;
      }
      
      const [estatisticas, documentosVencendo] = await Promise.all([
        DocumentoAutentique.estatisticas(filtros),
        DocumentoAutentique.buscarVencendoEm(3)
      ]);
      
      const resumo = {
        total: 0,
        pendentes: 0,
        assinados: 0,
        cancelados: 0,
        expirados: 0,
        vencendoEm3Dias: documentosVencendo.length
      };
      
      estatisticas.forEach(stat => {
        resumo.total += stat.total;
        switch (stat._id) {
          case 'PENDING':
            resumo.pendentes = stat.total;
            break;
          case 'SIGNED':
            resumo.assinados = stat.total;
            break;
          case 'CANCELLED':
            resumo.cancelados = stat.total;
            break;
          case 'EXPIRED':
            resumo.expirados = stat.total;
            break;
        }
      });
      
      return res.status(200).json({
        sucesso: true,
        dados: {
          resumo,
          periodo: `${periodo} dias`,
          documentosVencendo: documentosVencendo.map(doc => ({
            id: doc._id,
            nome: doc.nome,
            cliente: doc.clienteId,
            venceEm: doc.venceEm
          }))
        }
      });
      
    } catch (error) {
      console.error('❌ Erro ao gerar estatísticas:', error);
      
      return res.status(500).json({
        sucesso: false,
        erro: 'Erro interno do servidor',
        detalhes: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
}

module.exports = new AutentiqueController();

