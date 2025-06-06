const express = require('express');
const router = express.Router();
const gamificacaoController = require('../controllers/gamificacao.controller');
const { auth } = require('../middleware/auth.middleware');

// Middleware de autenticação para todas as rotas
router.use(auth);

// Obter ranking dos vendedores
router.get('/ranking', gamificacaoController.obterRanking);

// Obter dados de gamificação de um vendedor específico
router.get('/vendedor/:vendedorId', gamificacaoController.obterDadosVendedor);

// Adicionar pontos para um vendedor
router.post('/pontos', gamificacaoController.adicionarPontos);

// Obter estatísticas gerais da gamificação
router.get('/estatisticas', gamificacaoController.obterEstatisticasGerais);

// Obter histórico de pontuação
router.get('/historico/:vendedorId', gamificacaoController.obterHistorico);

// Resetar pontuações (apenas admin)
router.post('/resetar', (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      sucesso: false,
      erro: 'Acesso negado. Apenas administradores podem resetar pontuações.',
    });
  }
  next();
}, gamificacaoController.resetarPontuacoes);

// Pontuação automática por proposta
router.post('/auto/proposta', async (req, res) => {
  try {
    const { vendedorId, clienteId } = req.body;

    if (!vendedorId) {
      return res.status(400).json({
        sucesso: false,
        erro: 'vendedorId é obrigatório',
      });
    }

    await gamificacaoController.adicionarPontos({
      body: {
        vendedorId,
        acao: 'proposta_enviada',
        pontos: 5,
        detalhes: clienteId ? `Proposta enviada para cliente ${clienteId}` : 'Proposta enviada',
      },
    }, res);

  } catch (error) {
    console.error('Erro na pontuação automática de proposta:', error);
    res.status(500).json({ sucesso: false, erro: 'Erro interno' });
  }
});

// Pontuação automática por contrato
router.post('/auto/contrato', async (req, res) => {
  try {
    const { vendedorId, contratoId } = req.body;

    if (!vendedorId) {
      return res.status(400).json({
        sucesso: false,
        erro: 'vendedorId é obrigatório',
      });
    }

    await gamificacaoController.adicionarPontos({
      body: {
        vendedorId,
        acao: 'contrato_fechado',
        pontos: 20,
        detalhes: contratoId ? `Contrato ${contratoId} fechado` : 'Contrato fechado',
      },
    }, res);

  } catch (error) {
    console.error('Erro na pontuação automática de contrato:', error);
    res.status(500).json({ sucesso: false, erro: 'Erro interno' });
  }
});

// Pontuação automática por avaliação
router.post('/auto/avaliacao', async (req, res) => {
  try {
    const { vendedorId, nota, avaliacaoId } = req.body;

    if (!vendedorId || nota == null) {
      return res.status(400).json({
        sucesso: false,
        erro: 'vendedorId e nota são obrigatórios',
      });
    }

    if (nota >= 4) {
      await gamificacaoController.adicionarPontos({
        body: {
          vendedorId,
          acao: 'avaliacao_recebida',
          pontos: 10,
          detalhes: avaliacaoId
            ? `Avaliação ${nota} estrelas (ID: ${avaliacaoId})`
            : `Avaliação ${nota} estrelas`,
        },
      }, res);
    } else {
      res.status(200).json({
        sucesso: true,
        dados: { mensagem: 'Avaliação sem pontuação (nota < 4)' },
        erro: null,
      });
    }

  } catch (error) {
    console.error('Erro na pontuação automática de avaliação:', error);
    res.status(500).json({ sucesso: false, erro: 'Erro interno' });
  }
});

module.exports = router;
