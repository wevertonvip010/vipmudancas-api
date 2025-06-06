const Avaliacao = require('../models/avaliacao.model');
const Client = require('../models/cliente.model');
const Contract = require('../models/contrato.model');
const User = require('../models/user.model');
const gamificacaoController = require('./gamificacao.controller');

class AvaliacaoController {

  // Criar nova avaliação (enviar link para cliente)
  async criarAvaliacao(req, res) {
    try {
      const {
        clienteId,
        contratoId,
        vendedorId,
        dadosMudanca
      } = req.body;
      
      // Validar dados obrigatórios
      if (!clienteId || !contratoId || !vendedorId) {
        return res.status(400).json({
          sucesso: false,
          dados: null,
          erro: 'clienteId, contratoId e vendedorId são obrigatórios'
        });
      }
      
      // Verificar se já existe avaliação para este contrato
      const avaliacaoExistente = await Avaliacao.findOne({ contratoId });
      if (avaliacaoExistente) {
        return res.status(409).json({
          sucesso: false,
          dados: null,
          erro: 'Já existe uma avaliação para este contrato'
        });
      }
      
      // Buscar dados do cliente
      const cliente = await Client.findById(clienteId);
      if (!cliente) {
        return res.status(404).json({
          sucesso: false,
          dados: null,
          erro: 'Cliente não encontrado'
        });
      }
      
      // Buscar dados do contrato
      const contrato = await Contract.findById(contratoId);
      if (!contrato) {
        return res.status(404).json({
          sucesso: false,
          dados: null,
          erro: 'Contrato não encontrado'
        });
      }
      
      // Verificar se vendedor existe
      const vendedor = await User.findById(vendedorId);
      if (!vendedor) {
        return res.status(404).json({
          sucesso: false,
          dados: null,
          erro: 'Vendedor não encontrado'
        });
      }
      
      // Gerar token único
      const token = Avaliacao.gerarToken();
      
      // Criar nova avaliação
      const novaAvaliacao = new Avaliacao({
        clienteId,
        contratoId,
        vendedorId,
        nomeCliente: cliente.nome,
        emailCliente: cliente.email,
        telefoneCliente: cliente.telefone,
        tokenAvaliacao: token,
        dadosMudanca: dadosMudanca || {
          dataServico: contrato.dataServico,
          enderecoOrigem: contrato.enderecoOrigem,
          enderecoDestino: contrato.enderecoDestino,
          valorServico: contrato.valor,
          tipoServico: contrato.tipoServico
        }
      });
      
      // Gerar link de avaliação
      novaAvaliacao.gerarLink();
      
      await novaAvaliacao.save();
      
      // Aqui seria implementado o envio do email/SMS com o link
      await this.enviarLinkAvaliacao(novaAvaliacao);
      
      res.status(201).json({
        sucesso: true,
        dados: {
          avaliacaoId: novaAvaliacao._id,
          token: novaAvaliacao.tokenAvaliacao,
          link: novaAvaliacao.linkAvaliacao,
          cliente: novaAvaliacao.nomeCliente,
          dataExpiracao: novaAvaliacao.dataExpiracao
        },
        erro: null
      });
      
    } catch (error) {
      console.error('Erro ao criar avaliação:', error);
      res.status(500).json({
        sucesso: false,
        dados: null,
        erro: 'Erro interno do servidor ao criar avaliação'
      });
    }
  }

  // Obter avaliação por token (página pública)
  async obterAvaliacaoPorToken(req, res) {
    try {
      const { token } = req.params;
      
      const avaliacao = await Avaliacao.findOne({ tokenAvaliacao: token })
        .populate('vendedorId', 'nome')
        .populate('clienteId', 'nome email');
      
      if (!avaliacao) {
        return res.status(404).json({
          sucesso: false,
          dados: null,
          erro: 'Avaliação não encontrada'
        });
      }
      
      // Verificar se está expirada
      if (avaliacao.estaExpirada()) {
        avaliacao.status = 'expirada';
        await avaliacao.save();
        
        return res.status(410).json({
          sucesso: false,
          dados: null,
          erro: 'Link de avaliação expirado'
        });
      }
      
      // Verificar se já foi respondida
      if (avaliacao.status === 'respondida') {
        return res.status(409).json({
          sucesso: false,
          dados: null,
          erro: 'Esta avaliação já foi respondida'
        });
      }
      
      res.status(200).json({
        sucesso: true,
        dados: {
          avaliacaoId: avaliacao._id,
          nomeCliente: avaliacao.nomeCliente,
          vendedor: avaliacao.vendedorId.nome,
          dadosMudanca: avaliacao.dadosMudanca,
          dataExpiracao: avaliacao.dataExpiracao
        },
        erro: null
      });
      
    } catch (error) {
      console.error('Erro ao obter avaliação por token:', error);
      res.status(500).json({
        sucesso: false,
        dados: null,
        erro: 'Erro interno do servidor'
      });
    }
  }

  // Responder avaliação (página pública)
  async responderAvaliacao(req, res) {
    try {
      const { token } = req.params;
      const {
        nota,
        comentario,
        avaliacaoDetalhada,
        recomendaria,
        motivoNaoRecomendacao
      } = req.body;
      
      // Validar nota obrigatória
      if (!nota || nota < 1 || nota > 5) {
        return res.status(400).json({
          sucesso: false,
          dados: null,
          erro: 'Nota é obrigatória e deve estar entre 1 e 5'
        });
      }
      
      const avaliacao = await Avaliacao.findOne({ tokenAvaliacao: token });
      
      if (!avaliacao) {
        return res.status(404).json({
          sucesso: false,
          dados: null,
          erro: 'Avaliação não encontrada'
        });
      }
      
      // Verificar se está expirada
      if (avaliacao.estaExpirada()) {
        return res.status(410).json({
          sucesso: false,
          dados: null,
          erro: 'Link de avaliação expirado'
        });
      }
      
      // Verificar se já foi respondida
      if (avaliacao.status === 'respondida') {
        return res.status(409).json({
          sucesso: false,
          dados: null,
          erro: 'Esta avaliação já foi respondida'
        });
      }
      
      // Capturar IP e User Agent
      const ip = req.ip || req.connection.remoteAddress;
      const userAgent = req.get('User-Agent');
      
      // Responder avaliação
      await avaliacao.responder({
        nota,
        comentario,
        avaliacaoDetalhada,
        recomendaria,
        motivoNaoRecomendacao
      }, ip, userAgent);
      
      // Adicionar pontos ao vendedor se nota >= 4
      if (nota >= 4) {
        try {
          await gamificacaoController.adicionarPontos({
            body: {
              vendedorId: avaliacao.vendedorId,
              acao: 'avaliacao_recebida',
              pontos: 10,
              detalhes: `Avaliação ${nota} estrelas recebida`
            }
          }, { status: () => ({ json: () => {} }) });
        } catch (error) {
          console.error('Erro ao adicionar pontos de gamificação:', error);
        }
      }
      
      res.status(200).json({
        sucesso: true,
        dados: {
          mensagem: 'Avaliação enviada com sucesso!',
          nota,
          dataResposta: avaliacao.dataResposta
        },
        erro: null
      });
      
    } catch (error) {
      console.error('Erro ao responder avaliação:', error);
      res.status(500).json({
        sucesso: false,
        dados: null,
        erro: 'Erro interno do servidor ao responder avaliação'
      });
    }
  }

  // Listar avaliações (painel administrativo)
  async listarAvaliacoes(req, res) {
    try {
      const {
        status,
        vendedorId,
        dataInicio,
        dataFim,
        nota,
        pagina = 1,
        limite = 20,
        ordenacao = 'dataEnvio',
        direcao = 'desc'
      } = req.query;
      
      // Construir filtros
      const filtros = {};
      
      if (status) {
        filtros.status = status;
      }
      
      if (vendedorId) {
        filtros.vendedorId = vendedorId;
      }
      
      if (nota) {
        filtros.nota = parseInt(nota);
      }
      
      if (dataInicio || dataFim) {
        filtros.dataResposta = {};
        if (dataInicio) {
          filtros.dataResposta.$gte = new Date(dataInicio);
        }
        if (dataFim) {
          filtros.dataResposta.$lte = new Date(dataFim);
        }
      }
      
      // Configurar paginação
      const skip = (parseInt(pagina) - 1) * parseInt(limite);
      const sort = { [ordenacao]: direcao === 'desc' ? -1 : 1 };
      
      // Buscar avaliações
      const avaliacoes = await Avaliacao.find(filtros)
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limite))
        .populate('vendedorId', 'nome email')
        .populate('clienteId', 'nome email telefone')
        .populate('contratoId', 'numero valor');
      
      // Contar total
      const total = await Avaliacao.countDocuments(filtros);
      
      res.status(200).json({
        sucesso: true,
        dados: {
          avaliacoes,
          paginacao: {
            total,
            pagina: parseInt(pagina),
            limite: parseInt(limite),
            totalPaginas: Math.ceil(total / parseInt(limite))
          }
        },
        erro: null
      });
      
    } catch (error) {
      console.error('Erro ao listar avaliações:', error);
      res.status(500).json({
        sucesso: false,
        dados: null,
        erro: 'Erro interno do servidor ao listar avaliações'
      });
    }
  }

  // Obter estatísticas de um vendedor
  async obterEstatisticasVendedor(req, res) {
    try {
      const { vendedorId } = req.params;
      const { periodo = 30 } = req.query;
      
      const estatisticas = await Avaliacao.obterEstatisticasVendedor(vendedorId, parseInt(periodo));
      
      res.status(200).json({
        sucesso: true,
        dados: {
          vendedorId,
          periodo: parseInt(periodo),
          estatisticas: estatisticas[0] || {
            totalAvaliacoes: 0,
            notaMedia: 0,
            recomendacoes: 0
          }
        },
        erro: null
      });
      
    } catch (error) {
      console.error('Erro ao obter estatísticas do vendedor:', error);
      res.status(500).json({
        sucesso: false,
        dados: null,
        erro: 'Erro interno do servidor'
      });
    }
  }

  // Obter estatísticas gerais
  async obterEstatisticasGerais(req, res) {
    try {
      const { periodo = 30 } = req.query;
      
      const estatisticas = await Avaliacao.obterEstatisticasGerais(parseInt(periodo));
      const ranking = await Avaliacao.obterRankingVendedores(parseInt(periodo), 5);
      
      res.status(200).json({
        sucesso: true,
        dados: {
          periodo: parseInt(periodo),
          estatisticasGerais: estatisticas[0] || {},
          rankingVendedores: ranking
        },
        erro: null
      });
      
    } catch (error) {
      console.error('Erro ao obter estatísticas gerais:', error);
      res.status(500).json({
        sucesso: false,
        dados: null,
        erro: 'Erro interno do servidor'
      });
    }
  }

  // Moderar avaliação
  async moderarAvaliacao(req, res) {
    try {
      const { avaliacaoId } = req.params;
      const { publicada, motivoModeração } = req.body;
      
      const avaliacao = await Avaliacao.findById(avaliacaoId);
      
      if (!avaliacao) {
        return res.status(404).json({
          sucesso: false,
          dados: null,
          erro: 'Avaliação não encontrada'
        });
      }
      
      avaliacao.publicada = publicada;
      avaliacao.moderada = true;
      avaliacao.moderadoPor = req.user.id;
      avaliacao.motivoModeração = motivoModeração || '';
      
      await avaliacao.save();
      
      res.status(200).json({
        sucesso: true,
        dados: {
          avaliacaoId,
          publicada,
          moderada: true
        },
        erro: null
      });
      
    } catch (error) {
      console.error('Erro ao moderar avaliação:', error);
      res.status(500).json({
        sucesso: false,
        dados: null,
        erro: 'Erro interno do servidor'
      });
    }
  }

  // Responder como empresa
  async responderComoEmpresa(req, res) {
    try {
      const { avaliacaoId } = req.params;
      const { texto } = req.body;
      
      if (!texto || texto.trim().length === 0) {
        return res.status(400).json({
          sucesso: false,
          dados: null,
          erro: 'Texto da resposta é obrigatório'
        });
      }
      
      const avaliacao = await Avaliacao.findById(avaliacaoId);
      
      if (!avaliacao) {
        return res.status(404).json({
          sucesso: false,
          dados: null,
          erro: 'Avaliação não encontrada'
        });
      }
      
      avaliacao.respostaEmpresa = {
        texto: texto.trim(),
        data: new Date(),
        usuario: req.user.id
      };
      
      await avaliacao.save();
      
      res.status(200).json({
        sucesso: true,
        dados: {
          avaliacaoId,
          resposta: avaliacao.respostaEmpresa
        },
        erro: null
      });
      
    } catch (error) {
      console.error('Erro ao responder como empresa:', error);
      res.status(500).json({
        sucesso: false,
        dados: null,
        erro: 'Erro interno do servidor'
      });
    }
  }

  // Reenviar link de avaliação
  async reenviarLink(req, res) {
    try {
      const { avaliacaoId } = req.params;
      
      const avaliacao = await Avaliacao.findById(avaliacaoId);
      
      if (!avaliacao) {
        return res.status(404).json({
          sucesso: false,
          dados: null,
          erro: 'Avaliação não encontrada'
        });
      }
      
      if (avaliacao.status === 'respondida') {
        return res.status(409).json({
          sucesso: false,
          dados: null,
          erro: 'Avaliação já foi respondida'
        });
      }
      
      if (avaliacao.estaExpirada()) {
        return res.status(410).json({
          sucesso: false,
          dados: null,
          erro: 'Avaliação expirada'
        });
      }
      
      // Reenviar link
      await this.enviarLinkAvaliacao(avaliacao);
      
      res.status(200).json({
        sucesso: true,
        dados: {
          avaliacaoId,
          mensagem: 'Link reenviado com sucesso'
        },
        erro: null
      });
      
    } catch (error) {
      console.error('Erro ao reenviar link:', error);
      res.status(500).json({
        sucesso: false,
        dados: null,
        erro: 'Erro interno do servidor'
      });
    }
  }

  // Método auxiliar para enviar link de avaliação
  async enviarLinkAvaliacao(avaliacao) {
    try {
      // Implementar envio de email/SMS
      console.log(`Enviando link de avaliação para ${avaliacao.emailCliente}`);
      console.log(`Link: ${avaliacao.linkAvaliacao}`);
      
      // Aqui seria implementada a integração com:
      // - Serviço de email (SendGrid, Mailgun, etc.)
      // - Serviço de SMS (Twilio, etc.)
      // - WhatsApp Business API
      
      return true;
    } catch (error) {
      console.error('Erro ao enviar link de avaliação:', error);
      throw error;
    }
  }

  // Expirar avaliações antigas (método para cron job)
  async expirarAvaliacoes(req, res) {
    try {
      const resultado = await Avaliacao.expirarAvaliacoes();
      
      res.status(200).json({
        sucesso: true,
        dados: {
          avaliacoesExpiradas: resultado.modifiedCount
        },
        erro: null
      });
      
    } catch (error) {
      console.error('Erro ao expirar avaliações:', error);
      res.status(500).json({
        sucesso: false,
        dados: null,
        erro: 'Erro interno do servidor'
      });
    }
  }
}

module.exports = new AvaliacaoController();

