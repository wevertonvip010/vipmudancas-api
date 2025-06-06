const Financeiro = require('../models/financeiro.model');
const Contrato = require('../models/contrato.model');
const ContratoStorage = require('../models/contratoStorage.model');
const OrdemServico = require('../models/ordemServico.model');
const Boleto = require('../models/boleto.model');

// Listar todos os registros financeiros
exports.getAllFinanceiros = async (req, res) => {
  try {
    const { negocio } = req.query;
    
    let query = {};
    
    // Filtrar por negócio se fornecido
    if (negocio && ['mudancas', 'storage'].includes(negocio)) {
      query.negocio = negocio;
    }
    
    const financeiros = await Financeiro.find(query)
      .populate('contratoId', 'numero')
      .populate('contratoStorageId', 'cliente box')
      .populate('ordemServicoId', 'numero')
      .populate('boletoId', 'referencia linkBoleto');
    
    res.json(financeiros);
  } catch (error) {
    console.error('Erro ao listar registros financeiros:', error);
    res.status(500).json({ message: 'Erro ao listar registros financeiros.' });
  }
};

// Obter registro financeiro por ID
exports.getFinanceiroById = async (req, res) => {
  try {
    const financeiro = await Financeiro.findById(req.params.id)
      .populate('contratoId', 'numero')
      .populate('contratoStorageId', 'cliente box')
      .populate('ordemServicoId', 'numero')
      .populate('boletoId', 'referencia linkBoleto');
    
    if (!financeiro) {
      return res.status(404).json({ message: 'Registro financeiro não encontrado.' });
    }
    
    res.json(financeiro);
  } catch (error) {
    console.error('Erro ao buscar registro financeiro:', error);
    res.status(500).json({ message: 'Erro ao buscar registro financeiro.' });
  }
};

// Criar novo registro financeiro
exports.createFinanceiro = async (req, res) => {
  try {
    const { 
      tipo, 
      negocio,
      categoria, 
      descricao, 
      valor, 
      dataVencimento,
      dataPagamento,
      formaPagamento,
      status,
      contratoId,
      contratoStorageId,
      ordemServicoId,
      boletoId,
      comprovante,
      observacoes
    } = req.body;

    // Verificar se o tipo é válido
    if (!['receita', 'despesa'].includes(tipo)) {
      return res.status(400).json({ message: 'Tipo inválido. Use "receita" ou "despesa".' });
    }
    
    // Verificar se o negócio é válido
    if (!['mudancas', 'storage'].includes(negocio)) {
      return res.status(400).json({ message: 'Negócio inválido. Use "mudancas" ou "storage".' });
    }

    // Verificar se o status é válido
    if (!['pendente', 'pago', 'atrasado', 'cancelado'].includes(status)) {
      return res.status(400).json({ message: 'Status inválido.' });
    }

    // Verificar se o contrato existe, se fornecido
    if (contratoId) {
      const contrato = await Contrato.findById(contratoId);
      if (!contrato) {
        return res.status(404).json({ message: 'Contrato não encontrado.' });
      }
    }
    
    // Verificar se o contrato de storage existe, se fornecido
    if (contratoStorageId) {
      const contratoStorage = await ContratoStorage.findById(contratoStorageId);
      if (!contratoStorage) {
        return res.status(404).json({ message: 'Contrato de Storage não encontrado.' });
      }
    }

    // Verificar se a ordem de serviço existe, se fornecida
    if (ordemServicoId) {
      const ordemServico = await OrdemServico.findById(ordemServicoId);
      if (!ordemServico) {
        return res.status(404).json({ message: 'Ordem de serviço não encontrada.' });
      }
    }
    
    // Verificar se o boleto existe, se fornecido
    if (boletoId) {
      const boleto = await Boleto.findById(boletoId);
      if (!boleto) {
        return res.status(404).json({ message: 'Boleto não encontrado.' });
      }
    }

    // Criar novo registro financeiro
    const financeiro = new Financeiro({
      tipo,
      negocio,
      categoria,
      descricao,
      valor,
      dataVencimento,
      dataPagamento,
      formaPagamento,
      status,
      contratoId,
      contratoStorageId,
      ordemServicoId,
      boletoId,
      comprovante,
      observacoes,
      dataCriacao: Date.now(),
      ultimaAtualizacao: Date.now()
    });

    // Salvar registro financeiro no banco de dados
    await financeiro.save();

    res.status(201).json({
      message: 'Registro financeiro criado com sucesso',
      financeiro
    });
  } catch (error) {
    console.error('Erro ao criar registro financeiro:', error);
    res.status(500).json({ message: 'Erro ao criar registro financeiro.' });
  }
};

// Atualizar registro financeiro
exports.updateFinanceiro = async (req, res) => {
  try {
    const { 
      negocio,
      categoria, 
      descricao, 
      valor, 
      dataVencimento,
      dataPagamento,
      formaPagamento,
      status,
      comprovante,
      observacoes
    } = req.body;
    
    // Verificar se o registro financeiro existe
    const financeiro = await Financeiro.findById(req.params.id);
    if (!financeiro) {
      return res.status(404).json({ message: 'Registro financeiro não encontrado.' });
    }
    
    // Verificar se o negócio é válido
    if (negocio && !['mudancas', 'storage'].includes(negocio)) {
      return res.status(400).json({ message: 'Negócio inválido. Use "mudancas" ou "storage".' });
    }
    
    // Verificar se o status é válido
    if (status && !['pendente', 'pago', 'atrasado', 'cancelado'].includes(status)) {
      return res.status(400).json({ message: 'Status inválido.' });
    }
    
    // Atualizar dados do registro financeiro
    if (negocio) financeiro.negocio = negocio;
    if (categoria) financeiro.categoria = categoria;
    if (descricao) financeiro.descricao = descricao;
    if (valor !== undefined) financeiro.valor = valor;
    if (dataVencimento) financeiro.dataVencimento = dataVencimento;
    if (dataPagamento !== undefined) financeiro.dataPagamento = dataPagamento;
    if (formaPagamento) financeiro.formaPagamento = formaPagamento;
    if (status) financeiro.status = status;
    if (comprovante !== undefined) financeiro.comprovante = comprovante;
    if (observacoes !== undefined) financeiro.observacoes = observacoes;
    
    financeiro.ultimaAtualizacao = Date.now();
    
    await financeiro.save();
    
    res.json({
      message: 'Registro financeiro atualizado com sucesso',
      financeiro
    });
  } catch (error) {
    console.error('Erro ao atualizar registro financeiro:', error);
    res.status(500).json({ message: 'Erro ao atualizar registro financeiro.' });
  }
};

// Marcar como pago
exports.markAsPaid = async (req, res) => {
  try {
    const { dataPagamento, formaPagamento, comprovante } = req.body;
    
    if (!dataPagamento) {
      return res.status(400).json({ message: 'Data de pagamento é obrigatória.' });
    }
    
    // Verificar se o registro financeiro existe
    const financeiro = await Financeiro.findById(req.params.id);
    if (!financeiro) {
      return res.status(404).json({ message: 'Registro financeiro não encontrado.' });
    }
    
    // Verificar se já está pago
    if (financeiro.status === 'pago') {
      return res.status(400).json({ message: 'Registro financeiro já está pago.' });
    }
    
    // Verificar se está cancelado
    if (financeiro.status === 'cancelado') {
      return res.status(400).json({ message: 'Registro financeiro cancelado não pode ser pago.' });
    }
    
    financeiro.status = 'pago';
    financeiro.dataPagamento = dataPagamento;
    if (formaPagamento) financeiro.formaPagamento = formaPagamento;
    if (comprovante !== undefined) financeiro.comprovante = comprovante;
    financeiro.ultimaAtualizacao = Date.now();
    
    await financeiro.save();
    
    res.json({
      message: 'Registro financeiro marcado como pago com sucesso',
      financeiro
    });
  } catch (error) {
    console.error('Erro ao marcar registro financeiro como pago:', error);
    res.status(500).json({ message: 'Erro ao marcar registro financeiro como pago.' });
  }
};

// Cancelar registro financeiro
exports.cancelFinanceiro = async (req, res) => {
  try {
    const { motivoCancelamento } = req.body;
    
    // Verificar se o registro financeiro existe
    const financeiro = await Financeiro.findById(req.params.id);
    if (!financeiro) {
      return res.status(404).json({ message: 'Registro financeiro não encontrado.' });
    }
    
    // Verificar se já está cancelado
    if (financeiro.status === 'cancelado') {
      return res.status(400).json({ message: 'Registro financeiro já está cancelado.' });
    }
    
    // Verificar se já está pago
    if (financeiro.status === 'pago') {
      return res.status(400).json({ message: 'Registro financeiro pago não pode ser cancelado. Crie um estorno.' });
    }
    
    financeiro.status = 'cancelado';
    if (motivoCancelamento) {
      financeiro.observacoes = financeiro.observacoes 
        ? `${financeiro.observacoes}\nMotivo do cancelamento: ${motivoCancelamento}`
        : `Motivo do cancelamento: ${motivoCancelamento}`;
    }
    financeiro.ultimaAtualizacao = Date.now();
    
    await financeiro.save();
    
    res.json({
      message: 'Registro financeiro cancelado com sucesso',
      financeiro
    });
  } catch (error) {
    console.error('Erro ao cancelar registro financeiro:', error);
    res.status(500).json({ message: 'Erro ao cancelar registro financeiro.' });
  }
};

// Buscar registros financeiros por tipo
exports.getFinanceirosByTipo = async (req, res) => {
  try {
    const { tipo } = req.params;
    const { negocio } = req.query;
    
    if (!['receita', 'despesa'].includes(tipo)) {
      return res.status(400).json({ message: 'Tipo inválido. Use "receita" ou "despesa".' });
    }
    
    let query = { tipo };
    
    // Filtrar por negócio se fornecido
    if (negocio && ['mudancas', 'storage'].includes(negocio)) {
      query.negocio = negocio;
    }
    
    const financeiros = await Financeiro.find(query)
      .populate('contratoId', 'numero')
      .populate('contratoStorageId', 'cliente box')
      .populate('ordemServicoId', 'numero')
      .populate('boletoId', 'referencia linkBoleto')
      .sort({ dataVencimento: 1 });
    
    res.json(financeiros);
  } catch (error) {
    console.error('Erro ao buscar registros financeiros por tipo:', error);
    res.status(500).json({ message: 'Erro ao buscar registros financeiros por tipo.' });
  }
};

// Buscar registros financeiros por status
exports.getFinanceirosByStatus = async (req, res) => {
  try {
    const { status } = req.params;
    const { negocio } = req.query;
    
    if (!['pendente', 'pago', 'atrasado', 'cancelado'].includes(status)) {
      return res.status(400).json({ message: 'Status inválido.' });
    }
    
    let query = { status };
    
    // Filtrar por negócio se fornecido
    if (negocio && ['mudancas', 'storage'].includes(negocio)) {
      query.negocio = negocio;
    }
    
    const financeiros = await Financeiro.find(query)
      .populate('contratoId', 'numero')
      .populate('contratoStorageId', 'cliente box')
      .populate('ordemServicoId', 'numero')
      .populate('boletoId', 'referencia linkBoleto')
      .sort({ dataVencimento: 1 });
    
    res.json(financeiros);
  } catch (error) {
    console.error('Erro ao buscar registros financeiros por status:', error);
    res.status(500).json({ message: 'Erro ao buscar registros financeiros por status.' });
  }
};

// Buscar registros financeiros por período
exports.getFinanceirosByPeriodo = async (req, res) => {
  try {
    const { dataInicio, dataFim, tipo, status, negocio } = req.query;
    
    if (!dataInicio || !dataFim) {
      return res.status(400).json({ message: 'Data de início e fim são obrigatórias.' });
    }
    
    let query = {
      dataVencimento: {
        $gte: new Date(dataInicio),
        $lte: new Date(dataFim)
      }
    };
    
    // Filtrar por tipo
    if (tipo && ['receita', 'despesa'].includes(tipo)) {
      query.tipo = tipo;
    }
    
    // Filtrar por status
    if (status && ['pendente', 'pago', 'atrasado', 'cancelado'].includes(status)) {
      query.status = status;
    }
    
    // Filtrar por negócio
    if (negocio && ['mudancas', 'storage'].includes(negocio)) {
      query.negocio = negocio;
    }
    
    const financeiros = await Financeiro.find(query)
      .populate('contratoId', 'numero')
      .populate('contratoStorageId', 'cliente box')
      .populate('ordemServicoId', 'numero')
      .populate('boletoId', 'referencia linkBoleto')
      .sort({ dataVencimento: 1 });
    
    res.json(financeiros);
  } catch (error) {
    console.error('Erro ao buscar registros financeiros por período:', error);
    res.status(500).json({ message: 'Erro ao buscar registros financeiros por período.' });
  }
};

// Obter resumo financeiro
exports.getResumoFinanceiro = async (req, res) => {
  try {
    const { dataInicio, dataFim, negocio } = req.query;
    
    if (!dataInicio || !dataFim) {
      return res.status(400).json({ message: 'Data de início e fim são obrigatórias.' });
    }
    
    let periodoQuery = {
      dataVencimento: {
        $gte: new Date(dataInicio),
        $lte: new Date(dataFim)
      }
    };
    
    // Filtrar por negócio se fornecido
    if (negocio && ['mudancas', 'storage'].includes(negocio)) {
      periodoQuery.negocio = negocio;
    }
    
    // Total de receitas
    const receitasPagas = await Financeiro.aggregate([
      { 
        $match: { 
          ...periodoQuery,
          tipo: 'receita',
          status: 'pago'
        } 
      },
      { 
        $group: { 
          _id: '$negocio', 
          total: { $sum: '$valor' } 
        } 
      }
    ]);
    
    const receitasPendentes = await Financeiro.aggregate([
      { 
        $match: { 
          ...periodoQuery,
          tipo: 'receita',
          status: 'pendente'
        } 
      },
      { 
        $group: { 
          _id: '$negocio', 
          total: { $sum: '$valor' } 
        } 
      }
    ]);
    
    // Total de despesas
    const despesasPagas = await Financeiro.aggregate([
      { 
        $match: { 
          ...periodoQuery,
          tipo: 'despesa',
          status: 'pago'
        } 
      },
      { 
        $group: { 
          _id: '$negocio', 
          total: { $sum: '$valor' } 
        } 
      }
    ]);
    
    const despesasPendentes = await Financeiro.aggregate([
      { 
        $match: { 
          ...periodoQuery,
          tipo: 'despesa',
          status: 'pendente'
        } 
      },
      { 
        $group: { 
          _id: '$negocio', 
          total: { $sum: '$valor' } 
        } 
      }
    ]);
    
    // Resumo por categoria de receita
    const receitasPorCategoria = await Financeiro.aggregate([
      { 
        $match: { 
          ...periodoQuery,
          tipo: 'receita',
          status: 'pago'
        } 
      },
      { 
        $group: { 
          _id: {
            negocio: '$negocio',
            categoria: '$categoria'
          }, 
          total: { $sum: '$valor' } 
        } 
      },
      { 
        $sort: { 
          '_id.negocio': 1,
          total: -1 
        } 
      }
    ]);
    
    // Resumo por categoria de despesa
    const despesasPorCategoria = await Financeiro.aggregate([
      { 
        $match: { 
          ...periodoQuery,
          tipo: 'despesa',
          status: 'pago'
        } 
      },
      { 
        $group: { 
          _id: {
            negocio: '$negocio',
            categoria: '$categoria'
          }, 
          total: { $sum: '$valor' } 
        } 
      },
      { 
        $sort: { 
          '_id.negocio': 1,
          total: -1 
        } 
      }
    ]);
    
    // Processar resultados para formato adequado
    const processarResultadosPorNegocio = (resultados) => {
      const porNegocio = {
        mudancas: 0,
        storage: 0,
        total: 0
      };
      
      resultados.forEach(item => {
        if (item._id === 'mudancas') {
          porNegocio.mudancas = item.total;
        } else if (item._id === 'storage') {
          porNegocio.storage = item.total;
        }
        porNegocio.total += item.total;
      });
      
      return porNegocio;
    };
    
    // Processar categorias por negócio
    const processarCategoriasPorNegocio = (resultados) => {
      const categorias = {
        mudancas: [],
        storage: []
      };
      
      resultados.forEach(item => {
        const negocio = item._id.negocio;
        const categoria = item._id.categoria;
        
        if (negocio === 'mudancas' || negocio === 'storage') {
          categorias[negocio].push({
            categoria: categoria,
            total: item.total
          });
        }
      });
      
      return categorias;
    };
    
    const resumo = {
      receitas: {
        pagas: processarResultadosPorNegocio(receitasPagas),
        pendentes: processarResultadosPorNegocio(receitasPendentes),
        porCategoria: processarCategoriasPorNegocio(receitasPorCategoria)
      },
      despesas: {
        pagas: processarResultadosPorNegocio(despesasPagas),
        pendentes: processarResultadosPorNegocio(despesasPendentes),
        porCategoria: processarCategoriasPorNegocio(despesasPorCategoria)
      },
      saldo: {
        mudancas: {
          realizado: 
            (receitasPagas.find(i => i._id === 'mudancas')?.total || 0) - 
            (despesasPagas.find(i => i._id === 'mudancas')?.total || 0),
          previsto: 
            (receitasPagas.find(i => i._id === 'mudancas')?.total || 0) + 
            (receitasPendentes.find(i => i._id === 'mudancas')?.total || 0) - 
            (despesasPagas.find(i => i._id === 'mudancas')?.total || 0) - 
            (despesasPendentes.find(i => i._id === 'mudancas')?.total || 0)
        },
        storage: {
          realizado: 
            (receitasPagas.find(i => i._id === 'storage')?.total || 0) - 
            (despesasPagas.find(i => i._id === 'storage')?.total || 0),
          previsto: 
            (receitasPagas.find(i => i._id === 'storage')?.total || 0) + 
            (receitasPendentes.find(i => i._id === 'storage')?.total || 0) - 
            (despesasPagas.find(i => i._id === 'storage')?.total || 0) - 
            (despesasPendentes.find(i => i._id === 'storage')?.total || 0)
        },
        total: {
          realizado: 
            processarResultadosPorNegocio(receitasPagas).total - 
            processarResultadosPorNegocio(despesasPagas).total,
          previsto: 
            processarResultadosPorNegocio(receitasPagas).total + 
            processarResultadosPorNegocio(receitasPendentes).total - 
            processarResultadosPorNegocio(despesasPagas).total - 
            processarResultadosPorNegocio(despesasPendentes).total
        }
      }
    };
    
    res.json(resumo);
  } catch (error) {
    console.error('Erro ao gerar resumo financeiro:', error);
    res.status(500).json({ message: 'Erro ao gerar resumo financeiro.' });
  }
};

// Registrar pagamento de boleto
exports.registrarPagamentoBoleto = async (req, res) => {
  try {
    const { boletoId, dataPagamento, formaPagamento, comprovante } = req.body;
    
    if (!boletoId || !dataPagamento) {
      return res.status(400).json({ message: 'ID do boleto e data de pagamento são obrigatórios.' });
    }
    
    // Verificar se o boleto existe
    const boleto = await Boleto.findById(boletoId);
    if (!boleto) {
      return res.status(404).json({ message: 'Boleto não encontrado.' });
    }
    
    // Verificar se já existe um registro financeiro para este boleto
    const registroExistente = await Financeiro.findOne({ boletoId, status: 'pago' });
    if (registroExistente) {
      return res.status(400).json({ message: 'Já existe um registro de pagamento para este boleto.' });
    }
    
    // Buscar o contrato de storage associado ao boleto
    const contratoStorage = await ContratoStorage.findById(boleto.contratoStorage).populate('box');
    if (!contratoStorage) {
      return res.status(404).json({ message: 'Contrato de Storage não encontrado.' });
    }
    
    // Criar registro financeiro
    const financeiro = new Financeiro({
      tipo: 'receita',
      negocio: 'storage',
      categoria: 'Aluguel de Box',
      descricao: `Pagamento de aluguel - ${boleto.referencia}`,
      valor: boleto.valor,
      dataVencimento: boleto.dataVencimento,
      dataPagamento,
      formaPagamento,
      status: 'pago',
      contratoStorageId: boleto.contratoStorage,
      boletoId: boleto._id,
      comprovante,
      observacoes: `Box ${contratoStorage.box?.numero || 'N/A'} - Pagamento via ${formaPagamento || 'boleto'}`
    });
    
    // Salvar registro financeiro
    await financeiro.save();
    
    // Atualizar status do boleto
    boleto.status = 'pago';
    boleto.dataPagamento = dataPagamento;
    await boleto.save();
    
    // Se o contrato estava inadimplente, atualizar para ativo
    if (contratoStorage.status === 'inadimplente') {
      contratoStorage.status = 'ativo';
      await contratoStorage.save();
    }
    
    res.status(201).json({
      message: 'Pagamento de boleto registrado com sucesso',
      financeiro,
      boleto
    });
  } catch (error) {
    console.error('Erro ao registrar pagamento de boleto:', error);
    res.status(500).json({ message: 'Erro ao registrar pagamento de boleto.' });
  }
};

// Obter resumo comparativo entre VIP Mudanças e VIP Storage
exports.getResumoComparativo = async (req, res) => {
  try {
    const { dataInicio, dataFim } = req.query;
    
    if (!dataInicio || !dataFim) {
      return res.status(400).json({ message: 'Data de início e fim são obrigatórias.' });
    }
    
    const periodoQuery = {
      dataVencimento: {
        $gte: new Date(dataInicio),
        $lte: new Date(dataFim)
      }
    };
    
    // Receitas por negócio
    const receitasPorNegocio = await Financeiro.aggregate([
      { 
        $match: { 
          ...periodoQuery,
          tipo: 'receita',
          status: 'pago'
        } 
      },
      { 
        $group: { 
          _id: '$negocio', 
          total: { $sum: '$valor' },
          quantidade: { $sum: 1 }
        } 
      }
    ]);
    
    // Despesas por negócio
    const despesasPorNegocio = await Financeiro.aggregate([
      { 
        $match: { 
          ...periodoQuery,
          tipo: 'despesa',
          status: 'pago'
        } 
      },
      { 
        $group: { 
          _id: '$negocio', 
          total: { $sum: '$valor' },
          quantidade: { $sum: 1 }
        } 
      }
    ]);
    
    // Calcular percentuais e métricas comparativas
    const calcularMetricas = () => {
      // Extrair valores
      const receitaMudancas = receitasPorNegocio.find(i => i._id === 'mudancas')?.total || 0;
      const receitaStorage = receitasPorNegocio.find(i => i._id === 'storage')?.total || 0;
      const receitaTotal = receitaMudancas + receitaStorage;
      
      const despesaMudancas = despesasPorNegocio.find(i => i._id === 'mudancas')?.total || 0;
      const despesaStorage = despesasPorNegocio.find(i => i._id === 'storage')?.total || 0;
      const despesaTotal = despesaMudancas + despesaStorage;
      
      const lucroMudancas = receitaMudancas - despesaMudancas;
      const lucroStorage = receitaStorage - despesaStorage;
      const lucroTotal = lucroMudancas + lucroStorage;
      
      // Calcular percentuais
      const percentualReceitaMudancas = receitaTotal > 0 ? (receitaMudancas / receitaTotal * 100).toFixed(2) : 0;
      const percentualReceitaStorage = receitaTotal > 0 ? (receitaStorage / receitaTotal * 100).toFixed(2) : 0;
      
      const percentualDespesaMudancas = despesaTotal > 0 ? (despesaMudancas / despesaTotal * 100).toFixed(2) : 0;
      const percentualDespesaStorage = despesaTotal > 0 ? (despesaStorage / despesaTotal * 100).toFixed(2) : 0;
      
      const percentualLucroMudancas = lucroTotal > 0 ? (lucroMudancas / lucroTotal * 100).toFixed(2) : 0;
      const percentualLucroStorage = lucroTotal > 0 ? (lucroStorage / lucroTotal * 100).toFixed(2) : 0;
      
      // Calcular margens
      const margemMudancas = receitaMudancas > 0 ? (lucroMudancas / receitaMudancas * 100).toFixed(2) : 0;
      const margemStorage = receitaStorage > 0 ? (lucroStorage / receitaStorage * 100).toFixed(2) : 0;
      const margemTotal = receitaTotal > 0 ? (lucroTotal / receitaTotal * 100).toFixed(2) : 0;
      
      return {
        receitas: {
          mudancas: {
            valor: receitaMudancas,
            percentual: parseFloat(percentualReceitaMudancas),
            quantidade: receitasPorNegocio.find(i => i._id === 'mudancas')?.quantidade || 0
          },
          storage: {
            valor: receitaStorage,
            percentual: parseFloat(percentualReceitaStorage),
            quantidade: receitasPorNegocio.find(i => i._id === 'storage')?.quantidade || 0
          },
          total: receitaTotal
        },
        despesas: {
          mudancas: {
            valor: despesaMudancas,
            percentual: parseFloat(percentualDespesaMudancas),
            quantidade: despesasPorNegocio.find(i => i._id === 'mudancas')?.quantidade || 0
          },
          storage: {
            valor: despesaStorage,
            percentual: parseFloat(percentualDespesaStorage),
            quantidade: despesasPorNegocio.find(i => i._id === 'storage')?.quantidade || 0
          },
          total: despesaTotal
        },
        lucro: {
          mudancas: {
            valor: lucroMudancas,
            percentual: parseFloat(percentualLucroMudancas),
            margem: parseFloat(margemMudancas)
          },
          storage: {
            valor: lucroStorage,
            percentual: parseFloat(percentualLucroStorage),
            margem: parseFloat(margemStorage)
          },
          total: {
            valor: lucroTotal,
            margem: parseFloat(margemTotal)
          }
        }
      };
    };
    
    res.json({
      periodo: {
        inicio: dataInicio,
        fim: dataFim
      },
      comparativo: calcularMetricas()
    });
  } catch (error) {
    console.error('Erro ao gerar resumo comparativo:', error);
    res.status(500).json({ message: 'Erro ao gerar resumo comparativo.' });
  }
};
