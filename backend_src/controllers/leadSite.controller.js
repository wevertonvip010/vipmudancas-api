const LeadSite = require('../models/leadSite.model');
const User = require('../models/user.model');

class LeadSiteController {
  
  // Capturar novo lead do formulário do site
  async capturarLead(req, res) {
    try {
      const {
        nome,
        telefone,
        email,
        tipoImovel,
        volumeItens,
        andarOrigem,
        andarDestino,
        necessitaIcamento,
        dataMudanca,
        bairroOrigem,
        cidadeOrigem,
        bairroDestino,
        cidadeDestino
      } = req.body;
      
      // Validar dados obrigatórios
      if (!nome || !telefone || !email || !tipoImovel || !volumeItens || !dataMudanca || !bairroOrigem || !bairroDestino) {
        return res.status(400).json({
          sucesso: false,
          dados: null,
          erro: 'Dados obrigatórios: nome, telefone, email, tipoImovel, volumeItens, dataMudanca, bairroOrigem, bairroDestino'
        });
      }
      
      // Verificar se já existe lead com mesmo email ou telefone
      const leadExistente = await LeadSite.findOne({
        $or: [
          { email: email.toLowerCase() },
          { telefone }
        ],
        ativo: true
      });
      
      if (leadExistente) {
        return res.status(409).json({
          sucesso: false,
          dados: null,
          erro: 'Já existe um lead ativo com este email ou telefone'
        });
      }
      
      // Calcular estimativa automática
      const dadosEstimativa = {
        tipoImovel,
        volumeItens,
        andarOrigem: parseInt(andarOrigem) || 0,
        andarDestino: parseInt(andarDestino) || 0,
        necessitaIcamento: necessitaIcamento === true || necessitaIcamento === 'true'
      };
      
      const estimativa = LeadSite.calcularEstimativa(dadosEstimativa);
      
      // Capturar dados da requisição
      const ipOrigem = req.ip || req.connection.remoteAddress;
      const userAgent = req.get('User-Agent');
      const urlOrigem = req.get('Referer');
      
      // Criar novo lead
      const novoLead = new LeadSite({
        nome: nome.trim(),
        telefone: telefone.trim(),
        email: email.toLowerCase().trim(),
        tipoImovel,
        volumeItens,
        andarOrigem: parseInt(andarOrigem) || 0,
        andarDestino: parseInt(andarDestino) || 0,
        necessitaIcamento: dadosEstimativa.necessitaIcamento,
        dataMudanca: new Date(dataMudanca),
        bairroOrigem: bairroOrigem.trim(),
        cidadeOrigem: cidadeOrigem?.trim() || 'São Paulo',
        bairroDestino: bairroDestino.trim(),
        cidadeDestino: cidadeDestino?.trim() || 'São Paulo',
        estimativaValor: estimativa.valorFinal,
        detalhesEstimativa: estimativa,
        ipOrigem,
        userAgent,
        urlOrigem,
        prioridade: this.calcularPrioridade(dadosEstimativa, estimativa)
      });
      
      await novoLead.save();
      
      // Notificar vendedores (implementar notificação)
      await this.notificarVendedores(novoLead);
      
      res.status(201).json({
        sucesso: true,
        dados: {
          leadId: novoLead._id,
          estimativa: {
            valor: estimativa.valorFinal,
            detalhes: estimativa
          },
          mensagem: 'Lead capturado com sucesso! Nossa equipe entrará em contato em breve.'
        },
        erro: null
      });
      
    } catch (error) {
      console.error('Erro ao capturar lead:', error);
      res.status(500).json({
        sucesso: false,
        dados: null,
        erro: 'Erro interno do servidor ao capturar lead'
      });
    }
  }
  
  // Obter todos os leads
  async obterLeads(req, res) {
    try {
      const { 
        status, 
        vendedor, 
        dataInicio, 
        dataFim, 
        pagina = 1, 
        limite = 20,
        ordenacao = 'createdAt',
        direcao = 'desc'
      } = req.query;
      
      // Construir filtros
      const filtros = { ativo: true };
      
      if (status) {
        filtros.status = status;
      }
      
      if (vendedor) {
        filtros.vendedorResponsavel = vendedor;
      }
      
      if (dataInicio || dataFim) {
        filtros.createdAt = {};
        if (dataInicio) {
          filtros.createdAt.$gte = new Date(dataInicio);
        }
        if (dataFim) {
          filtros.createdAt.$lte = new Date(dataFim);
        }
      }
      
      // Configurar paginação
      const skip = (parseInt(pagina) - 1) * parseInt(limite);
      const sort = { [ordenacao]: direcao === 'desc' ? -1 : 1 };
      
      // Buscar leads
      const leads = await LeadSite.find(filtros)
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limite))
        .populate('vendedorResponsavel', 'nome email')
        .populate('historico.usuario', 'nome');
      
      // Contar total
      const total = await LeadSite.countDocuments(filtros);
      
      res.status(200).json({
        sucesso: true,
        dados: {
          leads,
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
      console.error('Erro ao obter leads:', error);
      res.status(500).json({
        sucesso: false,
        dados: null,
        erro: 'Erro interno do servidor ao obter leads'
      });
    }
  }
  
  // Obter lead específico
  async obterLead(req, res) {
    try {
      const { leadId } = req.params;
      
      const lead = await LeadSite.findById(leadId)
        .populate('vendedorResponsavel', 'nome email telefone')
        .populate('historico.usuario', 'nome');
      
      if (!lead) {
        return res.status(404).json({
          sucesso: false,
          dados: null,
          erro: 'Lead não encontrado'
        });
      }
      
      res.status(200).json({
        sucesso: true,
        dados: lead,
        erro: null
      });
      
    } catch (error) {
      console.error('Erro ao obter lead:', error);
      res.status(500).json({
        sucesso: false,
        dados: null,
        erro: 'Erro interno do servidor ao obter lead'
      });
    }
  }
  
  // Atualizar status do lead
  async atualizarStatus(req, res) {
    try {
      const { leadId } = req.params;
      const { status, observacao } = req.body;
      
      const statusValidos = ['novo', 'contatado', 'orcamento_enviado', 'negociacao', 'fechado', 'perdido'];
      
      if (!statusValidos.includes(status)) {
        return res.status(400).json({
          sucesso: false,
          dados: null,
          erro: 'Status inválido'
        });
      }
      
      const lead = await LeadSite.findById(leadId);
      
      if (!lead) {
        return res.status(404).json({
          sucesso: false,
          dados: null,
          erro: 'Lead não encontrado'
        });
      }
      
      await lead.atualizarStatus(status, req.user.id, observacao);
      
      res.status(200).json({
        sucesso: true,
        dados: {
          leadId,
          statusAnterior: lead.status,
          statusAtual: status
        },
        erro: null
      });
      
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      res.status(500).json({
        sucesso: false,
        dados: null,
        erro: 'Erro interno do servidor ao atualizar status'
      });
    }
  }
  
  // Atribuir vendedor ao lead
  async atribuirVendedor(req, res) {
    try {
      const { leadId } = req.params;
      const { vendedorId } = req.body;
      
      if (!vendedorId) {
        return res.status(400).json({
          sucesso: false,
          dados: null,
          erro: 'vendedorId é obrigatório'
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
      
      const lead = await LeadSite.findById(leadId);
      if (!lead) {
        return res.status(404).json({
          sucesso: false,
          dados: null,
          erro: 'Lead não encontrado'
        });
      }
      
      await lead.atribuirVendedor(vendedorId, req.user.id);
      
      res.status(200).json({
        sucesso: true,
        dados: {
          leadId,
          vendedorId,
          vendedorNome: vendedor.nome
        },
        erro: null
      });
      
    } catch (error) {
      console.error('Erro ao atribuir vendedor:', error);
      res.status(500).json({
        sucesso: false,
        dados: null,
        erro: 'Erro interno do servidor ao atribuir vendedor'
      });
    }
  }
  
  // Obter estatísticas dos leads
  async obterEstatisticas(req, res) {
    try {
      const { periodo = 30 } = req.query;
      
      const estatisticas = await LeadSite.obterEstatisticas(parseInt(periodo));
      
      // Estatísticas por vendedor
      const estatisticasVendedor = await LeadSite.aggregate([
        {
          $match: {
            vendedorResponsavel: { $ne: null },
            ativo: true
          }
        },
        {
          $group: {
            _id: '$vendedorResponsavel',
            totalLeads: { $sum: 1 },
            leadsFechados: {
              $sum: { $cond: [{ $eq: ['$status', 'fechado'] }, 1, 0] }
            },
            valorMedio: { $avg: '$estimativaValor' }
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'vendedor'
          }
        }
      ]);
      
      res.status(200).json({
        sucesso: true,
        dados: {
          estatisticasGerais: estatisticas,
          estatisticasVendedor,
          periodo: parseInt(periodo)
        },
        erro: null
      });
      
    } catch (error) {
      console.error('Erro ao obter estatísticas:', error);
      res.status(500).json({
        sucesso: false,
        dados: null,
        erro: 'Erro interno do servidor ao obter estatísticas'
      });
    }
  }
  
  // Método auxiliar para calcular prioridade
  calcularPrioridade(dados, estimativa) {
    let pontos = 0;
    
    // Valor da estimativa
    if (estimativa.valorFinal > 3000) pontos += 3;
    else if (estimativa.valorFinal > 2000) pontos += 2;
    else pontos += 1;
    
    // Volume alto = mais prioridade
    if (dados.volumeItens === 'alto') pontos += 2;
    else if (dados.volumeItens === 'medio') pontos += 1;
    
    // Içamento = mais complexo = mais prioridade
    if (dados.necessitaIcamento) pontos += 1;
    
    // Data próxima = mais urgente
    const diasParaMudanca = Math.ceil((new Date(dados.dataMudanca) - new Date()) / (1000 * 60 * 60 * 24));
    if (diasParaMudanca <= 7) pontos += 3;
    else if (diasParaMudanca <= 15) pontos += 2;
    else if (diasParaMudanca <= 30) pontos += 1;
    
    if (pontos >= 7) return 'urgente';
    if (pontos >= 5) return 'alta';
    if (pontos >= 3) return 'media';
    return 'baixa';
  }
  
  // Método auxiliar para notificar vendedores
  async notificarVendedores(lead) {
    try {
      // Implementar notificação (email, WhatsApp, etc.)
      console.log(`Novo lead capturado: ${lead.nome} - ${lead.email}`);
      
      // Aqui pode ser implementada integração com:
      // - Email
      // - WhatsApp Business API
      // - Slack
      // - Sistema de notificações interno
      
    } catch (error) {
      console.error('Erro ao notificar vendedores:', error);
    }
  }
}

module.exports = new LeadSiteController();

