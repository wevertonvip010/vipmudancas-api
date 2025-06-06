const Gamificacao = require('../models/gamificacao.model');
const User = require('../models/user.model');

class GamificacaoController {
  
  // Obter ranking dos vendedores
  async obterRanking(req, res) {
    try {
      const { tipo = 'semanal', limite = 10 } = req.query;
      
      const ranking = await Gamificacao.obterRanking(tipo, parseInt(limite));
      
      // Adicionar posição no ranking
      const rankingComPosicao = ranking.map((vendedor, index) => ({
        ...vendedor.toObject(),
        posicao: index + 1
      }));
      
      res.status(200).json({
        sucesso: true,
        dados: {
          ranking: rankingComPosicao,
          tipo,
          totalVendedores: ranking.length
        },
        erro: null
      });
      
    } catch (error) {
      console.error('Erro ao obter ranking:', error);
      res.status(500).json({
        sucesso: false,
        dados: null,
        erro: 'Erro interno do servidor ao obter ranking'
      });
    }
  }
  
  // Obter dados de um vendedor específico
  async obterDadosVendedor(req, res) {
    try {
      const { vendedorId } = req.params;
      
      let gamificacao = await Gamificacao.findOne({ vendedorId })
        .populate('vendedorId', 'nome email');
      
      // Se não existir, criar registro inicial
      if (!gamificacao) {
        const vendedor = await User.findById(vendedorId);
        if (!vendedor) {
          return res.status(404).json({
            sucesso: false,
            dados: null,
            erro: 'Vendedor não encontrado'
          });
        }
        
        gamificacao = new Gamificacao({
          vendedorId,
          nomeVendedor: vendedor.nome
        });
        
        await gamificacao.save();
        await gamificacao.populate('vendedorId', 'nome email');
      }
      
      // Obter posição no ranking
      const rankingSemanal = await Gamificacao.obterRanking('semanal', 100);
      const posicaoSemanal = rankingSemanal.findIndex(v => v.vendedorId._id.toString() === vendedorId) + 1;
      
      const rankingMensal = await Gamificacao.obterRanking('mensal', 100);
      const posicaoMensal = rankingMensal.findIndex(v => v.vendedorId._id.toString() === vendedorId) + 1;
      
      res.status(200).json({
        sucesso: true,
        dados: {
          ...gamificacao.toObject(),
          posicoes: {
            semanal: posicaoSemanal || 'N/A',
            mensal: posicaoMensal || 'N/A'
          }
        },
        erro: null
      });
      
    } catch (error) {
      console.error('Erro ao obter dados do vendedor:', error);
      res.status(500).json({
        sucesso: false,
        dados: null,
        erro: 'Erro interno do servidor ao obter dados do vendedor'
      });
    }
  }
  
  // Adicionar pontos para um vendedor
  async adicionarPontos(req, res) {
    try {
      const { vendedorId, acao, pontos, detalhes } = req.body;
      
      // Validar dados obrigatórios
      if (!vendedorId || !acao || pontos === undefined) {
        return res.status(400).json({
          sucesso: false,
          dados: null,
          erro: 'Dados obrigatórios: vendedorId, acao, pontos'
        });
      }
      
      // Validar ação
      const acoesValidas = ['proposta_enviada', 'contrato_fechado', 'avaliacao_recebida'];
      if (!acoesValidas.includes(acao)) {
        return res.status(400).json({
          sucesso: false,
          dados: null,
          erro: 'Ação inválida. Use: proposta_enviada, contrato_fechado, avaliacao_recebida'
        });
      }
      
      let gamificacao = await Gamificacao.findOne({ vendedorId });
      
      // Se não existir, criar registro inicial
      if (!gamificacao) {
        const vendedor = await User.findById(vendedorId);
        if (!vendedor) {
          return res.status(404).json({
            sucesso: false,
            dados: null,
            erro: 'Vendedor não encontrado'
          });
        }
        
        gamificacao = new Gamificacao({
          vendedorId,
          nomeVendedor: vendedor.nome
        });
      }
      
      // Adicionar pontos
      await gamificacao.adicionarPontos(acao, pontos, detalhes || '');
      
      // Verificar conquistas
      await this.verificarConquistas(gamificacao);
      
      res.status(200).json({
        sucesso: true,
        dados: {
          vendedorId,
          acao,
          pontosAdicionados: pontos,
          pontuacaoTotal: gamificacao.pontuacaoTotal,
          pontuacaoSemanal: gamificacao.pontuacaoSemanal
        },
        erro: null
      });
      
    } catch (error) {
      console.error('Erro ao adicionar pontos:', error);
      res.status(500).json({
        sucesso: false,
        dados: null,
        erro: 'Erro interno do servidor ao adicionar pontos'
      });
    }
  }
  
  // Obter estatísticas gerais
  async obterEstatisticasGerais(req, res) {
    try {
      const estatisticas = await Gamificacao.obterEstatisticasGerais();
      
      // Obter destaques da semana
      const vendedorSemana = await Gamificacao.findOne({})
        .sort({ pontuacaoSemanal: -1 })
        .populate('vendedorId', 'nome');
      
      const recordeVendas = await Gamificacao.findOne({})
        .sort({ 'estatisticas.contratosFechados': -1 })
        .populate('vendedorId', 'nome');
      
      const maiorSatisfacao = await Gamificacao.findOne({})
        .sort({ 'estatisticas.mediaAvaliacoes': -1 })
        .populate('vendedorId', 'nome');
      
      res.status(200).json({
        sucesso: true,
        dados: {
          estatisticasGerais: estatisticas[0] || {},
          destaques: {
            vendedorSemana: vendedorSemana ? {
              nome: vendedorSemana.nomeVendedor,
              pontos: vendedorSemana.pontuacaoSemanal
            } : null,
            recordeVendas: recordeVendas ? {
              nome: recordeVendas.nomeVendedor,
              contratos: recordeVendas.estatisticas.contratosFechados
            } : null,
            maiorSatisfacao: maiorSatisfacao ? {
              nome: maiorSatisfacao.nomeVendedor,
              media: maiorSatisfacao.estatisticas.mediaAvaliacoes
            } : null
          }
        },
        erro: null
      });
      
    } catch (error) {
      console.error('Erro ao obter estatísticas gerais:', error);
      res.status(500).json({
        sucesso: false,
        dados: null,
        erro: 'Erro interno do servidor ao obter estatísticas'
      });
    }
  }
  
  // Resetar pontuações (para uso administrativo)
  async resetarPontuacoes(req, res) {
    try {
      const { tipo } = req.body; // 'semanal' ou 'mensal'
      
      if (!['semanal', 'mensal'].includes(tipo)) {
        return res.status(400).json({
          sucesso: false,
          dados: null,
          erro: 'Tipo deve ser "semanal" ou "mensal"'
        });
      }
      
      const vendedores = await Gamificacao.find({});
      
      for (const vendedor of vendedores) {
        if (tipo === 'semanal') {
          await vendedor.resetarSemanal();
        } else {
          await vendedor.resetarMensal();
        }
      }
      
      res.status(200).json({
        sucesso: true,
        dados: {
          tipo,
          vendedoresAtualizados: vendedores.length
        },
        erro: null
      });
      
    } catch (error) {
      console.error('Erro ao resetar pontuações:', error);
      res.status(500).json({
        sucesso: false,
        dados: null,
        erro: 'Erro interno do servidor ao resetar pontuações'
      });
    }
  }
  
  // Método auxiliar para verificar conquistas
  async verificarConquistas(gamificacao) {
    try {
      // Primeira proposta
      if (gamificacao.estatisticas.propostasEnviadas === 1) {
        await gamificacao.adicionarConquista('primeira_proposta', 'Primeira proposta enviada!');
      }
      
      // Primeiro contrato
      if (gamificacao.estatisticas.contratosFechados === 1) {
        await gamificacao.adicionarConquista('primeiro_contrato', 'Primeiro contrato fechado!');
      }
      
      // Meta de 10 contratos
      if (gamificacao.estatisticas.contratosFechados === 10) {
        await gamificacao.adicionarConquista('meta_mensal', '10 contratos fechados!');
      }
      
      // Verificar se é vendedor da semana
      const ranking = await Gamificacao.obterRanking('semanal', 1);
      if (ranking.length > 0 && ranking[0].vendedorId._id.toString() === gamificacao.vendedorId.toString()) {
        await gamificacao.adicionarConquista('vendedor_semana', 'Vendedor da semana!');
      }
      
    } catch (error) {
      console.error('Erro ao verificar conquistas:', error);
    }
  }
  
  // Obter histórico de um vendedor
  async obterHistorico(req, res) {
    try {
      const { vendedorId } = req.params;
      const { limite = 20, pagina = 1 } = req.query;
      
      const gamificacao = await Gamificacao.findOne({ vendedorId });
      
      if (!gamificacao) {
        return res.status(404).json({
          sucesso: false,
          dados: null,
          erro: 'Dados de gamificação não encontrados para este vendedor'
        });
      }
      
      // Paginar histórico
      const skip = (parseInt(pagina) - 1) * parseInt(limite);
      const historico = gamificacao.historico
        .sort((a, b) => new Date(b.data) - new Date(a.data))
        .slice(skip, skip + parseInt(limite));
      
      res.status(200).json({
        sucesso: true,
        dados: {
          historico,
          total: gamificacao.historico.length,
          pagina: parseInt(pagina),
          limite: parseInt(limite)
        },
        erro: null
      });
      
    } catch (error) {
      console.error('Erro ao obter histórico:', error);
      res.status(500).json({
        sucesso: false,
        dados: null,
        erro: 'Erro interno do servidor ao obter histórico'
      });
    }
  }
}

module.exports = new GamificacaoController();

