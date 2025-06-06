const dashboardService = require('../services/dashboard.service');

class DashboardController {
  
  /**
   * Obter métricas principais do dashboard
   * GET /api/dashboard/metricas
   */
  async obterMetricas(req, res) {
    try {
      const userId = req.user.id;
      const userRole = req.user.role;
      
      // Buscar métricas baseadas no role do usuário
      const metricas = await dashboardService.obterMetricasPorRole(userRole, userId);
      
      return res.status(200).json({
        sucesso: true,
        dados: {
          metricas,
          ultimaAtualizacao: new Date(),
          usuario: {
            nome: req.user.nome,
            role: userRole
          }
        }
      });
      
    } catch (error) {
      console.error('❌ Erro ao obter métricas do dashboard:', error);
      
      return res.status(500).json({
        sucesso: false,
        erro: 'Erro interno do servidor',
        detalhes: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
  
  /**
   * Obter dados para gráficos
   * GET /api/dashboard/graficos
   */
  async obterGraficos(req, res) {
    try {
      const { periodo = '30d', tipo } = req.query;
      const userId = req.user.id;
      const userRole = req.user.role;
      
      const graficos = await dashboardService.obterDadosGraficos(userRole, userId, periodo, tipo);
      
      return res.status(200).json({
        sucesso: true,
        dados: {
          graficos,
          periodo,
          geradoEm: new Date()
        }
      });
      
    } catch (error) {
      console.error('❌ Erro ao obter dados dos gráficos:', error);
      
      return res.status(500).json({
        sucesso: false,
        erro: 'Erro interno do servidor',
        detalhes: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
  
  /**
   * Obter atividades recentes
   * GET /api/dashboard/atividades
   */
  async obterAtividades(req, res) {
    try {
      const { limite = 10 } = req.query;
      const userId = req.user.id;
      const userRole = req.user.role;
      
      const atividades = await dashboardService.obterAtividadesRecentes(userRole, userId, parseInt(limite));
      
      return res.status(200).json({
        sucesso: true,
        dados: {
          atividades,
          total: atividades.length
        }
      });
      
    } catch (error) {
      console.error('❌ Erro ao obter atividades recentes:', error);
      
      return res.status(500).json({
        sucesso: false,
        erro: 'Erro interno do servidor',
        detalhes: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
  
  /**
   * Obter notificações do usuário
   * GET /api/dashboard/notificacoes
   */
  async obterNotificacoes(req, res) {
    try {
      const { naoLidas = false } = req.query;
      const userId = req.user.id;
      
      const notificacoes = await dashboardService.obterNotificacoes(userId, naoLidas === 'true');
      
      return res.status(200).json({
        sucesso: true,
        dados: {
          notificacoes,
          totalNaoLidas: notificacoes.filter(n => !n.lida).length
        }
      });
      
    } catch (error) {
      console.error('❌ Erro ao obter notificações:', error);
      
      return res.status(500).json({
        sucesso: false,
        erro: 'Erro interno do servidor',
        detalhes: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
  
  /**
   * Marcar notificação como lida
   * PUT /api/dashboard/notificacoes/:id/lida
   */
  async marcarNotificacaoLida(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      
      const notificacao = await dashboardService.marcarNotificacaoLida(id, userId);
      
      if (!notificacao) {
        return res.status(404).json({
          sucesso: false,
          erro: 'Notificação não encontrada'
        });
      }
      
      return res.status(200).json({
        sucesso: true,
        dados: {
          notificacao,
          mensagem: 'Notificação marcada como lida'
        }
      });
      
    } catch (error) {
      console.error('❌ Erro ao marcar notificação como lida:', error);
      
      return res.status(500).json({
        sucesso: false,
        erro: 'Erro interno do servidor',
        detalhes: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
  
  /**
   * Obter resumo executivo
   * GET /api/dashboard/resumo
   */
  async obterResumo(req, res) {
    try {
      const userRole = req.user.role;
      const userId = req.user.id;
      
      const resumo = await dashboardService.gerarResumoExecutivo(userRole, userId);
      
      return res.status(200).json({
        sucesso: true,
        dados: {
          resumo,
          geradoEm: new Date()
        }
      });
      
    } catch (error) {
      console.error('❌ Erro ao obter resumo executivo:', error);
      
      return res.status(500).json({
        sucesso: false,
        erro: 'Erro interno do servidor',
        detalhes: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
  
  /**
   * Obter dados para calendário
   * GET /api/dashboard/calendario
   */
  async obterCalendario(req, res) {
    try {
      const { mes, ano } = req.query;
      const userId = req.user.id;
      const userRole = req.user.role;
      
      const eventos = await dashboardService.obterEventosCalendario(
        userRole, 
        userId, 
        parseInt(mes) || new Date().getMonth() + 1,
        parseInt(ano) || new Date().getFullYear()
      );
      
      return res.status(200).json({
        sucesso: true,
        dados: {
          eventos,
          mes: parseInt(mes) || new Date().getMonth() + 1,
          ano: parseInt(ano) || new Date().getFullYear()
        }
      });
      
    } catch (error) {
      console.error('❌ Erro ao obter dados do calendário:', error);
      
      return res.status(500).json({
        sucesso: false,
        erro: 'Erro interno do servidor',
        detalhes: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
  
  /**
   * Obter estatísticas de performance
   * GET /api/dashboard/performance
   */
  async obterPerformance(req, res) {
    try {
      const { periodo = '30d' } = req.query;
      const userId = req.user.id;
      const userRole = req.user.role;
      
      const performance = await dashboardService.obterEstatisticasPerformance(userRole, userId, periodo);
      
      return res.status(200).json({
        sucesso: true,
        dados: {
          performance,
          periodo,
          calculadoEm: new Date()
        }
      });
      
    } catch (error) {
      console.error('❌ Erro ao obter estatísticas de performance:', error);
      
      return res.status(500).json({
        sucesso: false,
        erro: 'Erro interno do servidor',
        detalhes: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
}

module.exports = new DashboardController();

