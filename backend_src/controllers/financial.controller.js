const Financeiro = require('../models/financeiro.model');
const Contrato = require('../models/contrato.model');
const ContratoStorage = require('../models/contratoStorage.model');
const OrdemServico = require('../models/ordemServico.model');
const Boleto = require('../models/boleto.model');

// Listar todos os registros financeiros
exports.getAllFinanceiros = async (req, res) => {
  try {
    const { negocio, tipo, status, dataInicio, dataFim } = req.query;
    
    let query = {};
    
    // Filtrar por negócio se fornecido
    if (negocio && ['mudancas', 'storage'].includes(negocio)) {
      query.negocio = negocio;
    }
    
    // Filtrar por tipo se fornecido
    if (tipo && ['receita', 'despesa'].includes(tipo)) {
      query.tipo = tipo;
    }
    
    // Filtrar por status se fornecido
    if (status) {
      query.status = status;
    }
    
    // Filtrar por período se fornecido
    if (dataInicio || dataFim) {
      query.dataVencimento = {};
      if (dataInicio) {
        query.dataVencimento.$gte = new Date(dataInicio);
      }
      if (dataFim) {
        query.dataVencimento.$lte = new Date(dataFim);
      }
    }
    
    const financeiros = await Financeiro.find(query)
      .populate('contratoId', 'numero cliente')
      .populate('contratoStorageId', 'cliente box')
      .populate('ordemServicoId', 'numero')
      .populate('boletoId', 'referencia linkBoleto')
      .sort({ dataVencimento: -1 });
    
    res.status(200).json({
      sucesso: true,
      dados: financeiros,
      erro: null
    });
  } catch (error) {
    console.error('Erro ao listar registros financeiros:', error);
    res.status(500).json({ 
      sucesso: false, 
      dados: null, 
      erro: 'Erro ao listar registros financeiros.' 
    });
  }
};

// Obter registro financeiro por ID
exports.getFinanceiroById = async (req, res) => {
  try {
    const financeiro = await Financeiro.findById(req.params.id)
      .populate('contratoId', 'numero cliente')
      .populate('contratoStorageId', 'cliente box')
      .populate('ordemServicoId', 'numero')
      .populate('boletoId', 'referencia linkBoleto');
    
    if (!financeiro) {
      return res.status(404).json({ 
        sucesso: false, 
        dados: null, 
        erro: 'Registro financeiro não encontrado.' 
      });
    }
    
    res.status(200).json({
      sucesso: true,
      dados: financeiro,
      erro: null
    });
  } catch (error) {
    console.error('Erro ao buscar registro financeiro:', error);
    res.status(500).json({ 
      sucesso: false, 
      dados: null, 
      erro: 'Erro ao buscar registro financeiro.' 
    });
  }
};

// Criar novo registro financeiro
exports.createFinanceiro = async (req, res) => {
  try {
    const financeiroData = req.body;
    
    const financeiro = new Financeiro(financeiroData);
    await financeiro.save();
    
    // Buscar o registro criado com populações
    const novoFinanceiro = await Financeiro.findById(financeiro._id)
      .populate('contratoId', 'numero cliente')
      .populate('contratoStorageId', 'cliente box')
      .populate('ordemServicoId', 'numero')
      .populate('boletoId', 'referencia linkBoleto');
    
    res.status(201).json({
      sucesso: true,
      dados: novoFinanceiro,
      erro: null
    });
  } catch (error) {
    console.error('Erro ao criar registro financeiro:', error);
    res.status(500).json({ 
      sucesso: false, 
      dados: null, 
      erro: 'Erro ao criar registro financeiro.' 
    });
  }
};

// Atualizar registro financeiro
exports.updateFinanceiro = async (req, res) => {
  try {
    const financeiroId = req.params.id;
    const updateData = req.body;
    
    const financeiro = await Financeiro.findByIdAndUpdate(
      financeiroId,
      updateData,
      { new: true, runValidators: true }
    )
    .populate('contratoId', 'numero cliente')
    .populate('contratoStorageId', 'cliente box')
    .populate('ordemServicoId', 'numero')
    .populate('boletoId', 'referencia linkBoleto');
    
    if (!financeiro) {
      return res.status(404).json({ 
        sucesso: false, 
        dados: null, 
        erro: 'Registro financeiro não encontrado.' 
      });
    }
    
    res.status(200).json({
      sucesso: true,
      dados: financeiro,
      erro: null
    });
  } catch (error) {
    console.error('Erro ao atualizar registro financeiro:', error);
    res.status(500).json({ 
      sucesso: false, 
      dados: null, 
      erro: 'Erro ao atualizar registro financeiro.' 
    });
  }
};

// Deletar registro financeiro
exports.deleteFinanceiro = async (req, res) => {
  try {
    const financeiro = await Financeiro.findByIdAndDelete(req.params.id);
    
    if (!financeiro) {
      return res.status(404).json({ 
        sucesso: false, 
        dados: null, 
        erro: 'Registro financeiro não encontrado.' 
      });
    }
    
    res.status(200).json({
      sucesso: true,
      dados: { message: 'Registro financeiro deletado com sucesso.' },
      erro: null
    });
  } catch (error) {
    console.error('Erro ao deletar registro financeiro:', error);
    res.status(500).json({ 
      sucesso: false, 
      dados: null, 
      erro: 'Erro ao deletar registro financeiro.' 
    });
  }
};

// Obter resumo financeiro
exports.getResumoFinanceiro = async (req, res) => {
  try {
    const { negocio, mes, ano } = req.query;
    
    let matchQuery = {};
    
    // Filtrar por negócio se fornecido
    if (negocio && ['mudancas', 'storage'].includes(negocio)) {
      matchQuery.negocio = negocio;
    }
    
    // Filtrar por período se fornecido
    if (mes && ano) {
      const dataInicio = new Date(ano, mes - 1, 1);
      const dataFim = new Date(ano, mes, 0);
      matchQuery.dataVencimento = {
        $gte: dataInicio,
        $lte: dataFim
      };
    }
    
    const resumo = await Financeiro.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$tipo',
          total: { $sum: '$valor' },
          pago: {
            $sum: {
              $cond: [{ $eq: ['$status', 'pago'] }, '$valor', 0]
            }
          },
          pendente: {
            $sum: {
              $cond: [{ $eq: ['$status', 'pendente'] }, '$valor', 0]
            }
          },
          vencido: {
            $sum: {
              $cond: [{ $eq: ['$status', 'vencido'] }, '$valor', 0]
            }
          },
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Organizar dados do resumo
    const resumoOrganizado = {
      receitas: resumo.find(r => r._id === 'receita') || { total: 0, pago: 0, pendente: 0, vencido: 0, count: 0 },
      despesas: resumo.find(r => r._id === 'despesa') || { total: 0, pago: 0, pendente: 0, vencido: 0, count: 0 }
    };
    
    resumoOrganizado.lucro = resumoOrganizado.receitas.pago - resumoOrganizado.despesas.pago;
    resumoOrganizado.margemLucro = resumoOrganizado.receitas.pago > 0 
      ? (resumoOrganizado.lucro / resumoOrganizado.receitas.pago) * 100 
      : 0;
    
    res.status(200).json({
      sucesso: true,
      dados: resumoOrganizado,
      erro: null
    });
  } catch (error) {
    console.error('Erro ao obter resumo financeiro:', error);
    res.status(500).json({ 
      sucesso: false, 
      dados: null, 
      erro: 'Erro ao obter resumo financeiro.' 
    });
  }
};

// Obter gráfico de receitas vs despesas
exports.getGraficoReceitasDespesas = async (req, res) => {
  try {
    const { negocio, ano } = req.query;
    const anoAtual = ano || new Date().getFullYear();
    
    let matchQuery = {
      dataVencimento: {
        $gte: new Date(anoAtual, 0, 1),
        $lte: new Date(anoAtual, 11, 31)
      }
    };
    
    if (negocio && ['mudancas', 'storage'].includes(negocio)) {
      matchQuery.negocio = negocio;
    }
    
    const dadosGrafico = await Financeiro.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: {
            mes: { $month: '$dataVencimento' },
            tipo: '$tipo'
          },
          total: { $sum: '$valor' }
        }
      },
      {
        $group: {
          _id: '$_id.mes',
          receitas: {
            $sum: {
              $cond: [{ $eq: ['$_id.tipo', 'receita'] }, '$total', 0]
            }
          },
          despesas: {
            $sum: {
              $cond: [{ $eq: ['$_id.tipo', 'despesa'] }, '$total', 0]
            }
          }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    // Preencher meses sem dados
    const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const dadosCompletos = meses.map((mes, index) => {
      const dadosMes = dadosGrafico.find(d => d._id === index + 1);
      return {
        mes,
        receitas: dadosMes ? dadosMes.receitas : 0,
        despesas: dadosMes ? dadosMes.despesas : 0
      };
    });
    
    res.status(200).json({
      sucesso: true,
      dados: dadosCompletos,
      erro: null
    });
  } catch (error) {
    console.error('Erro ao obter gráfico de receitas vs despesas:', error);
    res.status(500).json({ 
      sucesso: false, 
      dados: null, 
      erro: 'Erro ao obter gráfico de receitas vs despesas.' 
    });
  }
};

