const ContratoStorage = require('../models/contratoStorage.model');
const Box = require('../models/box.model');
const Cliente = require('../models/cliente.model');

// Criar novo contrato de aluguel
exports.criarContrato = async (req, res) => {
  try {
    const { 
      clienteId, 
      boxId, 
      dataEntrada, 
      dataSaidaPrevista, 
      dataPagamentoMensal, 
      itensArmazenados, 
      observacoes 
    } = req.body;
    
    // Verificar se o cliente existe
    const cliente = await Cliente.findById(clienteId);
    if (!cliente) {
      return res.status(404).json({
        success: false,
        message: 'Cliente não encontrado'
      });
    }
    
    // Verificar se o box existe e está disponível
    const box = await Box.findById(boxId);
    if (!box) {
      return res.status(404).json({
        success: false,
        message: 'Box não encontrado'
      });
    }
    
    if (box.status !== 'disponível' && box.status !== 'reservado') {
      return res.status(400).json({
        success: false,
        message: `Box não está disponível para aluguel. Status atual: ${box.status}`
      });
    }
    
    // Criar novo contrato
    const novoContrato = new ContratoStorage({
      cliente: clienteId,
      box: boxId,
      dataEntrada: dataEntrada || new Date(),
      dataSaidaPrevista,
      dataPagamentoMensal,
      valorMensal: box.valorTotal, // Valor calculado automaticamente com base no box
      itensArmazenados,
      observacoes,
      historicoPagamentos: [{
        dataPagamento: new Date(),
        valor: box.valorTotal,
        referencia: `${new Date().toLocaleString('pt-BR', { month: 'long' })}/${new Date().getFullYear()}`,
        status: 'pendente'
      }]
    });
    
    // Salvar contrato
    await novoContrato.save();
    
    // Atualizar status do box para 'ocupado' (isso também é feito pelo middleware, mas garantimos aqui)
    box.status = 'ocupado';
    await box.save();
    
    res.status(201).json({
      success: true,
      data: novoContrato,
      message: 'Contrato de aluguel criado com sucesso'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao criar contrato de aluguel',
      error: error.message
    });
  }
};

// Listar todos os contratos
exports.listarContratos = async (req, res) => {
  try {
    const { status, cliente } = req.query;
    let filtro = {};
    
    // Filtrar por status se fornecido
    if (status) {
      filtro.status = status;
    }
    
    // Filtrar por cliente se fornecido
    if (cliente) {
      filtro.cliente = cliente;
    }
    
    const contratos = await ContratoStorage.find(filtro)
      .populate('cliente', 'nome email telefone')
      .populate('box', 'numero metragemQuadrada valorTotal')
      .sort({ dataEntrada: -1 });
    
    res.status(200).json({
      success: true,
      count: contratos.length,
      data: contratos
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao listar contratos',
      error: error.message
    });
  }
};

// Obter detalhes de um contrato específico
exports.obterContrato = async (req, res) => {
  try {
    const contrato = await ContratoStorage.findById(req.params.id)
      .populate('cliente')
      .populate('box');
    
    if (!contrato) {
      return res.status(404).json({
        success: false,
        message: 'Contrato não encontrado'
      });
    }
    
    res.status(200).json({
      success: true,
      data: contrato
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao obter detalhes do contrato',
      error: error.message
    });
  }
};

// Atualizar contrato
exports.atualizarContrato = async (req, res) => {
  try {
    const { 
      dataSaidaPrevista, 
      dataPagamentoMensal, 
      status, 
      itensArmazenados, 
      observacoes 
    } = req.body;
    
    // Verificar se o contrato existe
    let contrato = await ContratoStorage.findById(req.params.id);
    if (!contrato) {
      return res.status(404).json({
        success: false,
        message: 'Contrato não encontrado'
      });
    }
    
    // Atualizar campos
    if (dataSaidaPrevista) contrato.dataSaidaPrevista = dataSaidaPrevista;
    if (dataPagamentoMensal) contrato.dataPagamentoMensal = dataPagamentoMensal;
    if (itensArmazenados) contrato.itensArmazenados = itensArmazenados;
    if (observacoes !== undefined) contrato.observacoes = observacoes;
    
    // Se estiver alterando o status para 'encerrado', liberar o box
    if (status && status !== contrato.status) {
      contrato.status = status;
      
      if (status === 'encerrado') {
        // Atualizar box para disponível
        await Box.findByIdAndUpdate(contrato.box, { status: 'disponível' });
      }
    }
    
    // Salvar alterações
    await contrato.save();
    
    res.status(200).json({
      success: true,
      data: contrato,
      message: 'Contrato atualizado com sucesso'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar contrato',
      error: error.message
    });
  }
};

// Registrar pagamento
exports.registrarPagamento = async (req, res) => {
  try {
    const { valor, referencia, comprovante } = req.body;
    
    // Verificar se o contrato existe
    const contrato = await ContratoStorage.findById(req.params.id);
    if (!contrato) {
      return res.status(404).json({
        success: false,
        message: 'Contrato não encontrado'
      });
    }
    
    // Adicionar novo pagamento ao histórico
    contrato.historicoPagamentos.push({
      dataPagamento: new Date(),
      valor: valor || contrato.valorMensal,
      referencia,
      status: 'pago',
      comprovante
    });
    
    // Se o contrato estava inadimplente, atualizar para ativo
    if (contrato.status === 'inadimplente') {
      contrato.status = 'ativo';
    }
    
    // Salvar alterações
    await contrato.save();
    
    res.status(200).json({
      success: true,
      data: contrato,
      message: 'Pagamento registrado com sucesso'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao registrar pagamento',
      error: error.message
    });
  }
};

// Renovar contrato
exports.renovarContrato = async (req, res) => {
  try {
    const { novoPeriodo, novoValor } = req.body;
    
    // Verificar se o contrato existe
    const contrato = await ContratoStorage.findById(req.params.id);
    if (!contrato) {
      return res.status(404).json({
        success: false,
        message: 'Contrato não encontrado'
      });
    }
    
    // Calcular nova data de saída prevista
    let novaDataSaida = new Date(contrato.dataSaidaPrevista || contrato.dataEntrada);
    novaDataSaida.setMonth(novaDataSaida.getMonth() + novoPeriodo);
    
    // Atualizar contrato
    contrato.dataSaidaPrevista = novaDataSaida;
    if (novoValor) contrato.valorMensal = novoValor;
    contrato.status = 'ativo';
    
    // Adicionar ao histórico de renovações
    contrato.historicoRenovacoes.push({
      dataRenovacao: new Date(),
      novoPeriodo,
      novoValor: novoValor || contrato.valorMensal
    });
    
    // Salvar alterações
    await contrato.save();
    
    res.status(200).json({
      success: true,
      data: contrato,
      message: 'Contrato renovado com sucesso'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao renovar contrato',
      error: error.message
    });
  }
};

// Encerrar contrato
exports.encerrarContrato = async (req, res) => {
  try {
    // Verificar se o contrato existe
    const contrato = await ContratoStorage.findById(req.params.id);
    if (!contrato) {
      return res.status(404).json({
        success: false,
        message: 'Contrato não encontrado'
      });
    }
    
    // Verificar se há pagamentos pendentes
    const pagamentosPendentes = contrato.historicoPagamentos.filter(p => p.status === 'pendente' || p.status === 'atrasado');
    if (pagamentosPendentes.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Não é possível encerrar um contrato com pagamentos pendentes',
        pagamentosPendentes
      });
    }
    
    // Atualizar status do contrato
    contrato.status = 'encerrado';
    
    // Liberar o box
    await Box.findByIdAndUpdate(contrato.box, { status: 'disponível' });
    
    // Salvar alterações
    await contrato.save();
    
    res.status(200).json({
      success: true,
      data: contrato,
      message: 'Contrato encerrado com sucesso'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao encerrar contrato',
      error: error.message
    });
  }
};

// Relatório financeiro
exports.relatorioFinanceiro = async (req, res) => {
  try {
    const { mes, ano } = req.query;
    
    let filtroData = {};
    if (mes && ano) {
      const dataInicio = new Date(ano, mes - 1, 1);
      const dataFim = new Date(ano, mes, 0);
      filtroData = {
        'historicoPagamentos.dataPagamento': {
          $gte: dataInicio,
          $lte: dataFim
        }
      };
    }
    
    // Pagamentos recebidos no período
    const pagamentosRecebidos = await ContratoStorage.aggregate([
      { $match: filtroData },
      { $unwind: '$historicoPagamentos' },
      { $match: { 'historicoPagamentos.status': 'pago' } },
      {
        $group: {
          _id: null,
          total: { $sum: '$historicoPagamentos.valor' },
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Contratos ativos
    const contratosAtivos = await ContratoStorage.countDocuments({ status: 'ativo' });
    
    // Faturamento mensal projetado
    const faturamentoProjetado = await ContratoStorage.aggregate([
      { $match: { status: 'ativo' } },
      { $group: { _id: null, total: { $sum: '$valorMensal' } } }
    ]);
    
    // Inadimplência
    const inadimplencia = await ContratoStorage.countDocuments({ status: 'inadimplente' });
    
    res.status(200).json({
      success: true,
      data: {
        pagamentosRecebidos: pagamentosRecebidos.length > 0 ? pagamentosRecebidos[0] : { total: 0, count: 0 },
        contratosAtivos,
        faturamentoProjetado: faturamentoProjetado.length > 0 ? faturamentoProjetado[0].total : 0,
        inadimplencia,
        taxaInadimplencia: contratosAtivos > 0 ? ((inadimplencia / contratosAtivos) * 100).toFixed(2) : 0
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao gerar relatório financeiro',
      error: error.message
    });
  }
};
