class DashboardService {
  
  /**
   * Obter métricas principais baseadas no role do usuário
   */
  async obterMetricasPorRole(userRole, userId) {
    try {
      const metricas = {};
      
      // Métricas comuns para todos os roles
      metricas.contratosAtivos = await this.contarContratosAtivos(userRole, userId);
      metricas.visitasSemanais = await this.contarVisitasSemanais(userRole, userId);
      
      // Métricas específicas por role
      switch (userRole) {
        case 'admin':
          metricas.receitaMensal = await this.calcularReceitaMensal();
          metricas.caixasEstoque = await this.contarCaixasEstoque();
          metricas.equipePerformance = await this.calcularPerformanceEquipe();
          metricas.leadsMes = await this.contarLeadsMes();
          break;
          
        case 'vendedor':
          metricas.orcamentosAbertos = await this.contarOrcamentosAbertos(userId);
          metricas.metaVendas = await this.calcularMetaVendas(userId);
          metricas.comissaoMes = await this.calcularComissaoMes(userId);
          break;
          
        case 'financeiro':
          metricas.receitaMensal = await this.calcularReceitaMensal();
          metricas.despesasMes = await this.calcularDespesasMes();
          metricas.lucroLiquido = await this.calcularLucroLiquido();
          metricas.contasReceber = await this.contarContasReceber();
          break;
          
        case 'operacional':
          metricas.caixasEstoque = await this.contarCaixasEstoque();
          metricas.ordensServico = await this.contarOrdensServico();
          metricas.equipesDisponiveis = await this.contarEquipesDisponiveis();
          break;
      }
      
      return metricas;
      
    } catch (error) {
      console.error('❌ Erro ao obter métricas por role:', error);
      throw error;
    }
  }
  
  /**
   * Contar contratos ativos
   */
  async contarContratosAtivos(userRole, userId) {
    try {
      // Simulação - substituir por consulta real ao banco
      const total = Math.floor(Math.random() * 50) + 70; // 70-120
      const variacao = (Math.random() * 20 - 10).toFixed(1); // -10% a +10%
      
      return {
        total,
        variacao: `${variacao > 0 ? '+' : ''}${variacao}%`,
        descricao: 'Contratos ativos este mês',
        tendencia: variacao > 0 ? 'crescimento' : 'queda'
      };
      
    } catch (error) {
      console.error('❌ Erro ao contar contratos ativos:', error);
      return { total: 0, variacao: '0%', descricao: 'Erro ao carregar dados' };
    }
  }
  
  /**
   * Contar visitas semanais
   */
  async contarVisitasSemanais(userRole, userId) {
    try {
      const total = Math.floor(Math.random() * 15) + 15; // 15-30
      const variacao = (Math.random() * 30 - 15).toFixed(1); // -15% a +15%
      
      return {
        total,
        variacao: `${variacao > 0 ? '+' : ''}${variacao}%`,
        descricao: 'Visitas agendadas nesta semana',
        tendencia: variacao > 0 ? 'crescimento' : 'queda'
      };
      
    } catch (error) {
      console.error('❌ Erro ao contar visitas semanais:', error);
      return { total: 0, variacao: '0%', descricao: 'Erro ao carregar dados' };
    }
  }
  
  /**
   * Calcular receita mensal
   */
  async calcularReceitaMensal() {
    try {
      const total = (Math.random() * 50000 + 50000).toFixed(0); // R$ 50.000 - R$ 100.000
      const variacao = (Math.random() * 25 - 5).toFixed(1); // -5% a +20%
      
      return {
        total: `R$ ${parseInt(total).toLocaleString('pt-BR')}`,
        variacao: `${variacao > 0 ? '+' : ''}${variacao}%`,
        descricao: 'Receita total do mês',
        tendencia: variacao > 0 ? 'crescimento' : 'queda'
      };
      
    } catch (error) {
      console.error('❌ Erro ao calcular receita mensal:', error);
      return { total: 'R$ 0', variacao: '0%', descricao: 'Erro ao carregar dados' };
    }
  }
  
  /**
   * Contar caixas em estoque
   */
  async contarCaixasEstoque() {
    try {
      const total = Math.floor(Math.random() * 100) + 100; // 100-200
      const variacao = (Math.random() * 20 - 10).toFixed(1); // -10% a +10%
      
      return {
        total,
        variacao: `${variacao > 0 ? '+' : ''}${variacao}%`,
        descricao: 'Total de caixas em estoque',
        tendencia: variacao > 0 ? 'crescimento' : 'queda',
        alerta: total < 120 ? 'Estoque baixo' : null
      };
      
    } catch (error) {
      console.error('❌ Erro ao contar caixas em estoque:', error);
      return { total: 0, variacao: '0%', descricao: 'Erro ao carregar dados' };
    }
  }
  
  /**
   * Obter dados para gráficos
   */
  async obterDadosGraficos(userRole, userId, periodo, tipo) {
    try {
      const graficos = {};
      
      // Gráfico de vendas mensais
      graficos.vendasMensais = {
        labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'],
        datasets: [{
          label: 'Vendas (R$)',
          data: Array.from({length: 6}, () => Math.floor(Math.random() * 50000) + 30000),
          borderColor: '#3B82F6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.4
        }]
      };
      
      // Gráfico de tipos de serviço
      graficos.tiposServico = {
        labels: ['Mudança Residencial', 'Mudança Comercial', 'Self Storage', 'Embalagem'],
        datasets: [{
          data: [45, 25, 20, 10],
          backgroundColor: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444']
        }]
      };
      
      // Gráfico de performance da equipe
      if (userRole === 'admin') {
        graficos.performanceEquipe = {
          labels: ['Kenneth', 'Douglas', 'Maciel', 'Diego', 'Sebastião'],
          datasets: [{
            label: 'Avaliação Média',
            data: [4.8, 4.6, 4.9, 4.7, 4.5],
            backgroundColor: '#10B981'
          }]
        };
      }
      
      return graficos;
      
    } catch (error) {
      console.error('❌ Erro ao obter dados dos gráficos:', error);
      return {};
    }
  }
  
  /**
   * Obter atividades recentes
   */
  async obterAtividadesRecentes(userRole, userId, limite) {
    try {
      const atividades = [
        {
          id: 1,
          tipo: 'contrato',
          titulo: 'Novo contrato assinado',
          descricao: 'Contrato #1089 - Maria Santos - Mudança residencial',
          data: new Date(Date.now() - 1 * 60 * 60 * 1000),
          usuario: 'Kenneth Silva',
          icone: 'file-text',
          cor: 'green'
        },
        {
          id: 2,
          tipo: 'visita',
          titulo: 'Visita realizada',
          descricao: 'Visita técnica na Rua das Flores, 123',
          data: new Date(Date.now() - 3 * 60 * 60 * 1000),
          usuario: 'Kenneth Silva',
          icone: 'calendar',
          cor: 'blue'
        },
        {
          id: 3,
          tipo: 'pagamento',
          titulo: 'Pagamento recebido',
          descricao: 'R$ 2.500,00 - Contrato #1087',
          data: new Date(Date.now() - 5 * 60 * 60 * 1000),
          usuario: 'Douglas Financeiro',
          icone: 'dollar-sign',
          cor: 'green'
        },
        {
          id: 4,
          tipo: 'estoque',
          titulo: 'Reposição de estoque',
          descricao: '50 caixas de papelão adicionadas',
          data: new Date(Date.now() - 8 * 60 * 60 * 1000),
          usuario: 'Maciel Santos',
          icone: 'package',
          cor: 'purple'
        }
      ];
      
      return atividades.slice(0, limite);
      
    } catch (error) {
      console.error('❌ Erro ao obter atividades recentes:', error);
      return [];
    }
  }
  
  /**
   * Obter notificações do usuário
   */
  async obterNotificacoes(userId, apenasNaoLidas = false) {
    try {
      const notificacoes = [
        {
          id: 1,
          tipo: 'visita',
          titulo: 'Visita agendada para hoje',
          descricao: 'João Silva - 14:30 - Rua das Palmeiras, 456',
          data: new Date(Date.now() - 30 * 60 * 1000),
          lida: false,
          prioridade: 'alta',
          icone: 'calendar',
          cor: 'blue'
        },
        {
          id: 2,
          tipo: 'contrato',
          titulo: 'Contrato vencendo',
          descricao: 'Contrato #1082 vence em 3 dias',
          data: new Date(Date.now() - 2 * 60 * 60 * 1000),
          lida: false,
          prioridade: 'media',
          icone: 'file-text',
          cor: 'orange'
        },
        {
          id: 3,
          tipo: 'estoque',
          titulo: 'Estoque baixo',
          descricao: 'Caixas de papelão: apenas 12 unidades',
          data: new Date(Date.now() - 4 * 60 * 60 * 1000),
          lida: false,
          prioridade: 'alta',
          icone: 'package',
          cor: 'red'
        },
        {
          id: 4,
          tipo: 'lead',
          titulo: 'Novo lead no sistema',
          descricao: 'Ana Costa solicitou orçamento',
          data: new Date(Date.now() - 6 * 60 * 60 * 1000),
          lida: true,
          prioridade: 'baixa',
          icone: 'users',
          cor: 'green'
        }
      ];
      
      if (apenasNaoLidas) {
        return notificacoes.filter(n => !n.lida);
      }
      
      return notificacoes;
      
    } catch (error) {
      console.error('❌ Erro ao obter notificações:', error);
      return [];
    }
  }
  
  /**
   * Marcar notificação como lida
   */
  async marcarNotificacaoLida(notificacaoId, userId) {
    try {
      // Simulação - substituir por atualização real no banco
      console.log(`✅ Notificação ${notificacaoId} marcada como lida para usuário ${userId}`);
      
      return {
        id: notificacaoId,
        lida: true,
        lidaEm: new Date()
      };
      
    } catch (error) {
      console.error('❌ Erro ao marcar notificação como lida:', error);
      return null;
    }
  }
  
  /**
   * Gerar resumo executivo
   */
  async gerarResumoExecutivo(userRole, userId) {
    try {
      const resumo = {
        crescimento: 'Receita mensal cresceu 15% comparado ao mês anterior',
        oportunidade: '23 visitas agendadas podem gerar até R$ 45.000 em novos contratos',
        atencao: 'Estoque de caixas reduziu 3%, considere reposição',
        meta: '87 contratos ativos, faltam 13 para atingir meta mensal de 100',
        destaque: 'Kenneth Silva lidera em vendas este mês com 12 contratos fechados'
      };
      
      return resumo;
      
    } catch (error) {
      console.error('❌ Erro ao gerar resumo executivo:', error);
      return {};
    }
  }
  
  /**
   * Obter eventos do calendário
   */
  async obterEventosCalendario(userRole, userId, mes, ano) {
    try {
      const eventos = [
        {
          id: 1,
          titulo: 'Visita - Carlos Silva',
          tipo: 'visita',
          data: new Date(ano, mes - 1, 2, 14, 30),
          cor: 'blue',
          descricao: 'Visita técnica para orçamento'
        },
        {
          id: 2,
          titulo: 'Mudança - Família Santos',
          tipo: 'mudanca',
          data: new Date(ano, mes - 1, 5, 8, 0),
          cor: 'green',
          descricao: 'Mudança residencial completa'
        },
        {
          id: 3,
          titulo: 'Pagamento - Contrato #1082',
          tipo: 'financeiro',
          data: new Date(ano, mes - 1, 8, 10, 0),
          cor: 'purple',
          descricao: 'Vencimento de pagamento'
        },
        {
          id: 4,
          titulo: 'Reunião de equipe',
          tipo: 'reuniao',
          data: new Date(ano, mes - 1, 15, 9, 0),
          cor: 'orange',
          descricao: 'Reunião semanal da equipe'
        }
      ];
      
      return eventos;
      
    } catch (error) {
      console.error('❌ Erro ao obter eventos do calendário:', error);
      return [];
    }
  }
  
  /**
   * Obter estatísticas de performance
   */
  async obterEstatisticasPerformance(userRole, userId, periodo) {
    try {
      const performance = {
        vendas: {
          total: Math.floor(Math.random() * 20) + 10,
          meta: 25,
          percentual: 0
        },
        satisfacao: {
          media: (Math.random() * 1 + 4).toFixed(1), // 4.0 - 5.0
          total_avaliacoes: Math.floor(Math.random() * 50) + 20
        },
        tempo_resposta: {
          media: Math.floor(Math.random() * 60) + 30, // 30-90 minutos
          meta: 60
        }
      };
      
      performance.vendas.percentual = ((performance.vendas.total / performance.vendas.meta) * 100).toFixed(1);
      
      return performance;
      
    } catch (error) {
      console.error('❌ Erro ao obter estatísticas de performance:', error);
      return {};
    }
  }
}

module.exports = new DashboardService();

