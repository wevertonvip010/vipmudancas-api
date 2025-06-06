const WhatsAppService = require('../services/whatsapp.service');
const Client = require('../models/cliente.model');
const Contract = require('../models/contrato.model');
const Avaliacao = require('../models/avaliacao.model');

class WhatsAppController {

  // Gerar link para envio de documentos via WhatsApp
  async gerarLinkDocumentos(req, res) {
    try {
      const { contratoId } = req.params;
      
      // Buscar contrato com dados do cliente
      const contrato = await Contract.findById(contratoId)
        .populate('clienteId', 'nome telefone email');
      
      if (!contrato) {
        return res.status(404).json({
          sucesso: false,
          dados: null,
          erro: 'Contrato não encontrado'
        });
      }
      
      const cliente = contrato.clienteId;
      
      // Validar telefone do cliente
      if (!WhatsAppService.validarTelefone(cliente.telefone)) {
        return res.status(400).json({
          sucesso: false,
          dados: null,
          erro: 'Número de telefone do cliente é inválido'
        });
      }
      
      // Gerar links dos documentos
      const documentos = WhatsAppService.gerarLinksDocumentos(contratoId);
      
      // Gerar link do WhatsApp
      const linkWhatsApp = WhatsAppService.gerarLinkEnvioDocumentos(cliente, documentos);
      
      // Log do envio
      WhatsAppService.logEnvio('documentos', cliente);
      
      res.status(200).json({
        sucesso: true,
        dados: {
          contratoId,
          cliente: {
            nome: cliente.nome,
            telefone: cliente.telefone
          },
          documentos,
          linkWhatsApp,
          mensagem: WhatsAppService.gerarMensagemDocumentos(cliente, documentos)
        },
        erro: null
      });
      
    } catch (error) {
      console.error('Erro ao gerar link de documentos:', error);
      res.status(500).json({
        sucesso: false,
        dados: null,
        erro: 'Erro interno do servidor'
      });
    }
  }

  // Gerar link para avaliação interna via WhatsApp
  async gerarLinkAvaliacaoInterna(req, res) {
    try {
      const { contratoId } = req.params;
      
      // Buscar contrato com dados do cliente
      const contrato = await Contract.findById(contratoId)
        .populate('clienteId', 'nome telefone email');
      
      if (!contrato) {
        return res.status(404).json({
          sucesso: false,
          dados: null,
          erro: 'Contrato não encontrado'
        });
      }
      
      // Verificar se o serviço foi concluído
      if (contrato.status !== 'concluido') {
        return res.status(400).json({
          sucesso: false,
          dados: null,
          erro: 'O serviço deve estar concluído para enviar avaliação'
        });
      }
      
      const cliente = contrato.clienteId;
      
      // Validar telefone do cliente
      if (!WhatsAppService.validarTelefone(cliente.telefone)) {
        return res.status(400).json({
          sucesso: false,
          dados: null,
          erro: 'Número de telefone do cliente é inválido'
        });
      }
      
      // Gerar link do WhatsApp
      const linkWhatsApp = WhatsAppService.gerarLinkAvaliacaoInterna(cliente);
      
      // Log do envio
      WhatsAppService.logEnvio('avaliacao_interna', cliente);
      
      res.status(200).json({
        sucesso: true,
        dados: {
          contratoId,
          cliente: {
            nome: cliente.nome,
            telefone: cliente.telefone
          },
          linkWhatsApp,
          mensagem: WhatsAppService.gerarMensagemAvaliacaoInterna(cliente)
        },
        erro: null
      });
      
    } catch (error) {
      console.error('Erro ao gerar link de avaliação interna:', error);
      res.status(500).json({
        sucesso: false,
        dados: null,
        erro: 'Erro interno do servidor'
      });
    }
  }

  // Gerar link para avaliação no Google via WhatsApp
  async gerarLinkAvaliacaoGoogle(req, res) {
    try {
      const { avaliacaoId } = req.params;
      
      // Buscar avaliação
      const avaliacao = await Avaliacao.findById(avaliacaoId)
        .populate('clienteId', 'nome telefone email');
      
      if (!avaliacao) {
        return res.status(404).json({
          sucesso: false,
          dados: null,
          erro: 'Avaliação não encontrada'
        });
      }
      
      // Verificar se a nota é 5 estrelas
      if (avaliacao.nota !== 5) {
        return res.status(400).json({
          sucesso: false,
          dados: null,
          erro: 'Link do Google só é disponibilizado para avaliações de 5 estrelas'
        });
      }
      
      const cliente = avaliacao.clienteId;
      
      // Validar telefone do cliente
      if (!WhatsAppService.validarTelefone(cliente.telefone)) {
        return res.status(400).json({
          sucesso: false,
          dados: null,
          erro: 'Número de telefone do cliente é inválido'
        });
      }
      
      // Gerar link do WhatsApp
      const linkWhatsApp = WhatsAppService.gerarLinkAvaliacaoGoogle(cliente);
      
      // Log do envio
      WhatsAppService.logEnvio('avaliacao_google', cliente);
      
      res.status(200).json({
        sucesso: true,
        dados: {
          avaliacaoId,
          cliente: {
            nome: cliente.nome,
            telefone: cliente.telefone
          },
          nota: avaliacao.nota,
          linkWhatsApp,
          mensagem: WhatsAppService.gerarMensagemAvaliacaoGoogle(cliente)
        },
        erro: null
      });
      
    } catch (error) {
      console.error('Erro ao gerar link de avaliação Google:', error);
      res.status(500).json({
        sucesso: false,
        dados: null,
        erro: 'Erro interno do servidor'
      });
    }
  }

  // Gerar link personalizado do WhatsApp
  async gerarLinkPersonalizado(req, res) {
    try {
      const { telefone, mensagem } = req.body;
      
      if (!telefone || !mensagem) {
        return res.status(400).json({
          sucesso: false,
          dados: null,
          erro: 'Telefone e mensagem são obrigatórios'
        });
      }
      
      // Validar telefone
      if (!WhatsAppService.validarTelefone(telefone)) {
        return res.status(400).json({
          sucesso: false,
          dados: null,
          erro: 'Número de telefone inválido'
        });
      }
      
      // Gerar link do WhatsApp
      const linkWhatsApp = WhatsAppService.gerarLinkWhatsApp(telefone, mensagem);
      
      res.status(200).json({
        sucesso: true,
        dados: {
          telefone: WhatsAppService.formatarTelefone(telefone),
          mensagem,
          linkWhatsApp
        },
        erro: null
      });
      
    } catch (error) {
      console.error('Erro ao gerar link personalizado:', error);
      res.status(500).json({
        sucesso: false,
        dados: null,
        erro: 'Erro interno do servidor'
      });
    }
  }

  // Obter estatísticas de envios WhatsApp
  async obterEstatisticas(req, res) {
    try {
      const estatisticas = WhatsAppService.obterEstatisticas();
      
      res.status(200).json({
        sucesso: true,
        dados: estatisticas,
        erro: null
      });
      
    } catch (error) {
      console.error('Erro ao obter estatísticas:', error);
      res.status(500).json({
        sucesso: false,
        dados: null,
        erro: 'Erro interno do servidor'
      });
    }
  }

  // Testar conectividade do serviço
  async testarConectividade(req, res) {
    try {
      const resultado = WhatsAppService.testarConectividade();
      
      res.status(200).json({
        sucesso: true,
        dados: resultado,
        erro: null
      });
      
    } catch (error) {
      console.error('Erro ao testar conectividade:', error);
      res.status(500).json({
        sucesso: false,
        dados: null,
        erro: 'Erro interno do servidor'
      });
    }
  }

  // Validar número de telefone
  async validarTelefone(req, res) {
    try {
      const { telefone } = req.body;
      
      if (!telefone) {
        return res.status(400).json({
          sucesso: false,
          dados: null,
          erro: 'Telefone é obrigatório'
        });
      }
      
      const valido = WhatsAppService.validarTelefone(telefone);
      const numeroFormatado = valido ? WhatsAppService.formatarTelefone(telefone) : null;
      
      res.status(200).json({
        sucesso: true,
        dados: {
          telefoneOriginal: telefone,
          telefoneFormatado: numeroFormatado,
          valido
        },
        erro: null
      });
      
    } catch (error) {
      console.error('Erro ao validar telefone:', error);
      res.status(500).json({
        sucesso: false,
        dados: null,
        erro: 'Erro interno do servidor'
      });
    }
  }

  // Obter dados para botões WhatsApp (usado pelo frontend)
  async obterDadosBotoes(req, res) {
    try {
      const { contratoId } = req.params;
      
      // Buscar contrato com dados do cliente
      const contrato = await Contract.findById(contratoId)
        .populate('clienteId', 'nome telefone email');
      
      if (!contrato) {
        return res.status(404).json({
          sucesso: false,
          dados: null,
          erro: 'Contrato não encontrado'
        });
      }
      
      const cliente = contrato.clienteId;
      const telefoneValido = WhatsAppService.validarTelefone(cliente.telefone);
      
      // Verificar se existe avaliação para este contrato
      const avaliacao = await Avaliacao.findOne({ contratoId });
      
      const dadosBotoes = {
        contratoId,
        cliente: {
          nome: cliente.nome,
          telefone: cliente.telefone,
          telefoneValido
        },
        contrato: {
          status: contrato.status,
          numero: contrato.numero
        },
        botoes: {
          enviarDocumentos: {
            disponivel: telefoneValido && contrato.status === 'ativo',
            motivo: !telefoneValido ? 'Telefone inválido' : 
                   contrato.status !== 'ativo' ? 'Contrato não está ativo' : null
          },
          enviarAvaliacaoInterna: {
            disponivel: telefoneValido && contrato.status === 'concluido' && !avaliacao,
            motivo: !telefoneValido ? 'Telefone inválido' :
                   contrato.status !== 'concluido' ? 'Serviço não foi concluído' :
                   avaliacao ? 'Avaliação já foi enviada' : null
          },
          enviarAvaliacaoGoogle: {
            disponivel: telefoneValido && avaliacao && avaliacao.nota === 5,
            motivo: !telefoneValido ? 'Telefone inválido' :
                   !avaliacao ? 'Avaliação interna não foi feita' :
                   avaliacao.nota !== 5 ? 'Disponível apenas para avaliações 5 estrelas' : null
          }
        },
        avaliacao: avaliacao ? {
          id: avaliacao._id,
          nota: avaliacao.nota,
          status: avaliacao.status,
          dataResposta: avaliacao.dataResposta
        } : null
      };
      
      res.status(200).json({
        sucesso: true,
        dados: dadosBotoes,
        erro: null
      });
      
    } catch (error) {
      console.error('Erro ao obter dados dos botões:', error);
      res.status(500).json({
        sucesso: false,
        dados: null,
        erro: 'Erro interno do servidor'
      });
    }
  }
}

module.exports = new WhatsAppController();

