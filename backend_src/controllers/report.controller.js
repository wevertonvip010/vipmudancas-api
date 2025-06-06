const Cliente = require('../models/cliente.model');
const Visita = require('../models/visita.model');
const Orcamento = require('../models/orcamento.model');
const Contrato = require('../models/contrato.model');
const OrdemServico = require('../models/ordemServico.model');
const Financeiro = require('../models/financeiro.model');
const User = require('../models/user.model');
const Material = require('../models/material.model');

// Relatório de vendas
exports.getRelatorioVendas = async (req, res) => {
  try {
    const { dataInicio, dataFim } = req.query;
    
    if (!dataInicio || !dataFim) {
      return res.status(400).json({ message: 'Data de início e fim são obrigatórias.' });
    }
    
    const periodoInicio = new Date(dataInicio);
    periodoInicio.setHours(0, 0, 0, 0);
    
    const periodoFim = new Date(dataFim);
    periodoFim.setHours(23, 59, 59, 999);
    
    // Buscar orçamentos no período
    const orcamentos = await Orcamento.find({
      data: {
        $gte: periodoInicio,
        $lte: periodoFim
      }
    }).populate('clienteId', 'nome').populate('responsavelId', 'nome');
    
    // Buscar contratos no período
    const contratos = await Contrato.find({
      dataAssinatura: {
        $gte: periodoInicio,
        $lte: periodoFim
      }
    }).populate('clienteId', 'nome').populate('responsavelId', 'nome');
    
    // Calcular estatísticas
    const totalOrcamentos = orcamentos.length;
    const orcamentosAprovados = orcamentos.filter(o => o.status === 'aprovado').length;
    const orcamentosRejeitados = orcamentos.filter(o => o.status === 'rejeitado').length;
    const orcamentosPendentes = orcamentos.filter(o => o.status === 'pendente').length;
    const orcamentosExpirados = orcamentos.filter(o => o.status === 'expirado').length;
    
    const totalContratos = contratos.length;
    const contratosAtivos = contratos.filter(c => c.status === 'ativo').length;
    const contratosConcluidos = contratos.filter(c => c.status === 'concluído').length;
    const contratosCancelados = contratos.filter(c => c.status === 'cancelado').length;
    
    // Calcular valor total dos orçamentos e contratos
    const valorTotalOrcamentos = orcamentos.reduce((total, o) => total + o.valorFinal, 0);
    const valorTotalContratos = contratos.reduce((total, c) => total + c.valorTotal, 0);
    
    // Calcular taxa de conversão
    const taxaConversao = totalOrcamentos > 0 ? (orcamentosAprovados / totalOrcamentos * 100).toFixed(2) : 0;
    
    // Agrupar por vendedor
    const vendedores = {};
    
    orcamentos.forEach(o => {
      const vendedorId = o.responsavelId?._id?.toString();
      const vendedorNome = o.responsavelId?.nome || 'Desconhecido';
      
      if (!vendedores[vendedorId]) {
        vendedores[vendedorId] = {
          nome: vendedorNome,
          orcamentos: 0,
          orcamentosAprovados: 0,
          valorOrcamentos: 0,
          contratos: 0,
          valorContratos: 0,
          taxaConversao: 0
        };
      }
      
      vendedores[vendedorId].orcamentos++;
      vendedores[vendedorId].valorOrcamentos += o.valorFinal;
      
      if (o.status === 'aprovado') {
        vendedores[vendedorId].orcamentosAprovados++;
      }
    });
    
    contratos.forEach(c => {
      const vendedorId = c.responsavelId?._id?.toString();
      const vendedorNome = c.responsavelId?.nome || 'Desconhecido';
      
      if (!vendedores[vendedorId]) {
        vendedores[vendedorId] = {
          nome: vendedorNome,
          orcamentos: 0,
          orcamentosAprovados: 0,
          valorOrcamentos: 0,
          contratos: 0,
          valorContratos: 0,
          taxaConversao: 0
        };
      }
      
      vendedores[vendedorId].contratos++;
      vendedores[vendedorId].valorContratos += c.valorTotal;
    });
    
    // Calcular taxa de conversão por vendedor
    Object.keys(vendedores).forEach(id => {
      const v = vendedores[id];
      v.taxaConversao = v.orcamentos > 0 ? (v.orcamentosAprovados / v.orcamentos * 100).toFixed(2) : 0;
    });
    
    const relatorio = {
      periodo: {
        dataInicio: periodoInicio,
        dataFim: periodoFim
      },
      resumo: {
        totalOrcamentos,
        orcamentosAprovados,
        orcamentosRejeitados,
        orcamentosPendentes,
        orcamentosExpirados,
        valorTotalOrcamentos,
        totalContratos,
        contratosAtivos,
        contratosConcluidos,
        contratosCancelados,
        valorTotalContratos,
        taxaConversao: parseFloat(taxaConversao)
      },
      vendedores: Object.values(vendedores).map(v => ({
        ...v,
        taxaConversao: parseFloat(v.taxaConversao)
      })),
      orcamentos: orcamentos.map(o => ({
        _id: o._id,
        numero: o.numero,
        data: o.data,
        cliente: o.clienteId?.nome,
        responsavel: o.responsavelId?.nome,
        valorTotal: o.valorTotal,
        desconto: o.desconto,
        valorFinal: o.valorFinal,
        status: o.status
      })),
      contratos: contratos.map(c => ({
        _id: c._id,
        numero: c.numero,
        dataAssinatura: c.dataAssinatura,
        cliente: c.clienteId?.nome,
        responsavel: c.responsavelId?.nome,
        valorTotal: c.valorTotal,
        status: c.status
      }))
    };
    
    res.json(relatorio);
  } catch (error) {
    console.error('Erro ao gerar relatório de vendas:', error);
    res.status(500).json({ message: 'Erro ao gerar relatório de vendas.' });
  }
};

// Relatório de operações
exports.getRelatorioOperacoes = async (req, res) => {
  try {
    const { dataInicio, dataFim } = req.query;
    
    if (!dataInicio || !dataFim) {
      return res.status(400).json({ message: 'Data de início e fim são obrigatórias.' });
    }
    
    const periodoInicio = new Date(dataInicio);
    periodoInicio.setHours(0, 0, 0, 0);
    
    const periodoFim = new Date(dataFim);
    periodoFim.setHours(23, 59, 59, 999);
    
    // Buscar ordens de serviço no período
    const ordensServico = await OrdemServico.find({
      dataAgendamento: {
        $gte: periodoInicio,
        $lte: periodoFim
      }
    })
    .populate('clienteId', 'nome')
    .populate('responsavelId', 'nome')
    .populate('equipe.funcionarioId', 'nome cargo')
    .populate('veiculoId', 'placa modelo');
    
    // Calcular estatísticas
    const totalOrdens = ordensServico.length;
    const ordensAgendadas = ordensServico.filter(o => o.status === 'agendada').length;
    const ordensEmAndamento = ordensServico.filter(o => o.status === 'em andamento').length;
    const ordensConcluidas = ordensServico.filter(o => o.status === 'concluída').length;
    const ordensCanceladas = ordensServico.filter(o => o.status === 'cancelada').length;
    
    // Calcular tempo médio de conclusão (em horas)
    let tempoTotalHoras = 0;
    let ordensComTempo = 0;
    
    ordensServico.forEach(os => {
      if (os.status === 'concluída' && os.ultimaAtualizacao && os.dataAgendamento) {
        const tempoEmMilissegundos = new Date(os.ultimaAtualizacao) - new Date(os.dataAgendamento);
        const tempoEmHoras = tempoEmMilissegundos / (1000 * 60 * 60);
        tempoTotalHoras += tempoEmHoras;
        ordensComTempo++;
      }
    });
    
    const tempoMedioConclusao = ordensComTempo > 0 ? (tempoTotalHoras / ordensComTempo).toFixed(2) : 0;
    
    // Agrupar por funcionário
    const funcionarios = {};
    
    ordensServico.forEach(os => {
      os.equipe.forEach(membro => {
        const funcionarioId = membro.funcionarioId?._id?.toString();
        const funcionarioNome = membro.funcionarioId?.nome || 'Desconhecido';
        const funcionarioCargo = membro.funcionarioId?.cargo || 'Desconhecido';
        
        if (!funcionarios[funcionarioId]) {
          funcionarios[funcionarioId] = {
            nome: funcionarioNome,
            cargo: funcionarioCargo,
            totalOrdens: 0,
            ordensConcluidas: 0,
            ordensEmAndamento: 0,
            ordensAgendadas: 0,
            ordensCanceladas: 0
          };
        }
        
        funcionarios[funcionarioId].totalOrdens++;
        
        if (os.status === 'concluída') {
          funcionarios[funcionarioId].ordensConcluidas++;
        } else if (os.status === 'em andamento') {
          funcionarios[funcionarioId].ordensEmAndamento++;
        } else if (os.status === 'agendada') {
          funcionarios[funcionarioId].ordensAgendadas++;
        } else if (os.status === 'cancelada') {
          funcionarios[funcionarioId].ordensCanceladas++;
        }
      });
    });
    
    // Agrupar por veículo
    const veiculos = {};
    
    ordensServico.forEach(os => {
      if (os.veiculoId) {
        const veiculoId = os.veiculoId?._id?.toString();
        const veiculoPlaca = os.veiculoId?.placa || 'Desconhecido';
        const veiculoModelo = os.veiculoId?.modelo || 'Desconhecido';
        
        if (!veiculos[veiculoId]) {
          veiculos[veiculoId] = {
            placa: veiculoPlaca,
            modelo: veiculoModelo,
            totalOrdens: 0,
            ordensConcluidas: 0,
            ordensEmAndamento: 0,
            ordensAgendadas: 0,
            ordensCanceladas: 0
          };
        }
        
        veiculos[veiculoId].totalOrdens++;
        
        if (os.status === 'concluída') {
          veiculos[veiculoId].ordensConcluidas++;
        } else if (os.status === 'em andamento') {
          veiculos[veiculoId].ordensEmAndamento++;
        } else if (os.status === 'agendada') {
          veiculos[veiculoId].ordensAgendadas++;
        } else if (os.status === 'cancelada') {
          veiculos[veiculoId].ordensCanceladas++;
        }
      }
    });
    
    const relatorio = {
      periodo: {
        dataInicio: periodoInicio,
        dataFim: periodoFim
      },
      resumo: {
        totalOrdens,
        ordensAgendadas,
        ordensEmAndamento,
        ordensConcluidas,
        ordensCanceladas,
        tempoMedioConclusao: parseFloat(tempoMedioConclusao)
      },
      funcionarios: Object.values(funcionarios),
      veiculos: Object.values(veiculos),
      ordens: ordensServico.map(os => ({
        _id: os._id,
        numero: os.numero,
        dataAgendamento: os.dataAgendamento,
        cliente: os.clienteId?.nome,
        responsavel: os.responsavelId?.nome,
        equipe: os.equipe.map(m => ({
          nome: m.funcionarioId?.nome,
          funcao: m.funcao
        })),
        veiculo: os.veiculoId ? `${os.veiculoId.placa} - ${os.veiculoId.modelo}` : null,
        status: os.status
      }))
    };
    
    res.json(relatorio);
  } catch (error) {
    console.error('Erro ao gerar relatório de operações:', error);
    res.status(500).json({ message: 'Erro ao gerar relatório de operações.' });
  }
};

// Relatório financeiro
exports.getRelatorioFinanceiro = async (req, res) => {
  try {
    const { dataInicio, dataFim } = req.query;
    
    if (!dataInicio || !dataFim) {
      return res.status(400).json({ message: 'Data de início e fim são obrigatórias.' });
    }
    
    const periodoInicio = new Date(dataInicio);
    periodoInicio.setHours(0, 0, 0, 0);
    
    const periodoFim = new Date(dataFim);
    periodoFim.setHours(23, 59, 59, 999);
    
    // Buscar registros financeiros no período
    const registros = await Financeiro.find({
      dataVencimento: {
        $gte: periodoInicio,
        $lte: periodoFim
      }
    })
    .populate('contratoId', 'numero')
    .populate('ordemServicoId', 'numero');
    
    // Calcular estatísticas
    const totalRegistros = registros.length;
    const totalReceitas = registros.filter(r => r.tipo === 'receita').length;
    const totalDespesas = registros.filter(r => r.tipo === 'despesa').length;
    
    const registrosPagos = registros.filter(r => r.status === 'pago').length;
    const registrosPendentes = registros.filter(r => r.status === 'pendente').length;
    const registrosAtrasados = registros.filter(r => r.status === 'atrasado').length;
    const registrosCancelados = registros.filter(r => r.status === 'cancelado').length;
    
    // Calcular valores
    const valorTotalReceitas = registros
      .filter(r => r.tipo === 'receita')
      .reduce((total, r) => total + r.valor, 0);
    
    const valorTotalDespesas = registros
      .filter(r => r.tipo === 'despesa')
      .reduce((total, r) => total + r.valor, 0);
    
    const valorReceitasPagas = registros
      .filter(r => r.tipo === 'receita' && r.status === 'pago')
      .reduce((total, r) => total + r.valor, 0);
    
    const valorReceitasPendentes = registros
      .filter(r => r.tipo === 'receita' && r.status === 'pendente')
      .reduce((total, r) => total + r.valor, 0);
    
    const valorDespesasPagas = registros
      .filter(r => r.tipo === 'despesa' && r.status === 'pago')
      .reduce((total, r) => total + r.valor, 0);
    
    const valorDespesasPendentes = registros
      .filter(r => r.tipo === 'despesa' && r.status === 'pendente')
      .reduce((total, r) => total + r.valor, 0);
    
    // Calcular saldo
    const saldoRealizado = valorReceitasPagas - valorDespesasPagas;
    const saldoPrevisto = (valorReceitasPagas + valorReceitasPendentes) - (valorDespesasPagas + valorDespesasPendentes);
    
    // Agrupar por categoria
    const categorias = {};
    
    registros.forEach(r => {
      const categoria = r.categoria;
      const tipo = r.tipo;
      
      if (!categorias[categoria]) {
        categorias[categoria] = {
          nome: categoria,
          tipo,
          total: 0,
          pago: 0,
          pendente: 0
        };
      }
      
      categorias[categoria].total += r.valor;
      
      if (r.status === 'pago') {
        categorias[categoria].pago += r.valor;
      } else if (r.status === 'pendente' || r.status === 'atrasado') {
        categorias[categoria].pendente += r.valor;
      }
    });
    
    const relatorio = {
      periodo: {
        dataInicio: periodoInicio,
        dataFim: periodoFim
      },
      resumo: {
        totalRegistros,
        totalReceitas,
        totalDespesas,
        registrosPagos,
        registrosPendentes,
        registrosAtrasados,
        registrosCancelados,
        valorTotalReceitas,
        valorTotalDespesas,
        valorReceitasPagas,
        valorReceitasPendentes,
        valorDespesasPagas,
        valorDespesasPendentes,
        saldoRealizado,
        saldoPrevisto
      },
      categorias: Object.values(categorias),
      registros: registros.map(r => ({
        _id: r._id,
        tipo: r.tipo,
        categoria: r.categoria,
        descricao: r.descricao,
        valor: r.valor,
        dataVencimento: r.dataVencimento,
        dataPagamento: r.dataPagamento,
        status: r.status,
        contrato: r.contratoId?.numero,
        ordemServico: r.ordemServicoId?.numero
      }))
    };
    
    res.json(relatorio);
  } catch (error) {
    console.error('Erro ao gerar relatório financeiro:', error);
    res.status(500).json({ message: 'Erro ao gerar relatório financeiro.' });
  }
};

// Relatório de estoque
exports.getRelatorioEstoque = async (req, res) => {
  try {
    // Buscar todos os materiais
    const materiais = await Material.find({ ativo: true });
    
    // Calcular estatísticas
    const totalMateriais = materiais.length;
    const materiaisComEstoqueBaixo = materiais.filter(m => m.quantidadeEstoque <= m.estoqueMinimo).length;
    const materiaisSemEstoque = materiais.filter(m => m.quantidadeEstoque === 0).length;
    
    // Calcular valor total em estoque
    const valorTotalEstoque = materiais.reduce((total, m) => total + (m.quantidadeEstoque * m.valorUnitario), 0);
    
    // Agrupar por categoria
    const categorias = {};
    
    materiais.forEach(m => {
      const categoria = m.categoria;
      
      if (!categorias[categoria]) {
        categorias[categoria] = {
          nome: categoria,
          quantidade: 0,
          valor: 0,
          itens: []
        };
      }
      
      categorias[categoria].quantidade += m.quantidadeEstoque;
      categorias[categoria].valor += (m.quantidadeEstoque * m.valorUnitario);
      categorias[categoria].itens.push({
        _id: m._id,
        codigo: m.codigo,
        nome: m.nome,
        quantidadeEstoque: m.quantidadeEstoque,
        estoqueMinimo: m.estoqueMinimo,
        valorUnitario: m.valorUnitario,
        valorTotal: m.quantidadeEstoque * m.valorUnitario
      });
    });
    
    const relatorio = {
      resumo: {
        totalMateriais,
        materiaisComEstoqueBaixo,
        materiaisSemEstoque,
        valorTotalEstoque
      },
      categorias: Object.values(categorias),
      materiais: materiais.map(m => ({
        _id: m._id,
        codigo: m.codigo,
        nome: m.nome,
        categoria: m.categoria,
        unidadeMedida: m.unidadeMedida,
        quantidadeEstoque: m.quantidadeEstoque,
        estoqueMinimo: m.estoqueMinimo,
        valorUnitario: m.valorUnitario,
        valorTotal: m.quantidadeEstoque * m.valorUnitario,
        status: m.quantidadeEstoque === 0 ? 'sem_estoque' : 
               m.quantidadeEstoque <= m.estoqueMinimo ? 'estoque_baixo' : 'normal'
      }))
    };
    
    res.json(relatorio);
  } catch (error) {
    console.error('Erro ao gerar relatório de estoque:', error);
    res.status(500).json({ message: 'Erro ao gerar relatório de estoque.' });
  }
};

// Dashboard
exports.getDashboard = async (req, res) => {
  try {
    // Definir período (últimos 30 dias)
    const dataFim = new Date();
    const dataInicio = new Date();
    dataInicio.setDate(dataInicio.getDate() - 30);
    
    // Buscar dados para o dashboard
    const [
      clientes,
      visitas,
      orcamentos,
      contratos,
      ordensServico,
      financeiros,
      materiais,
      usuarios
    ] = await Promise.all([
      Cliente.countDocuments({ ativo: true }),
      Visita.find({ 
        dataAgendamento: { $gte: dataInicio, $lte: dataFim } 
      }).countDocuments(),
      Orcamento.find({ 
        data: { $gte: dataInicio, $lte: dataFim } 
      }),
      Contrato.find({ 
        dataAssinatura: { $gte: dataInicio, $lte: dataFim } 
      }),
      OrdemServico.find({ 
        dataAgendamento: { $gte: dataInicio, $lte: dataFim } 
      }),
      Financeiro.find({ 
        dataVencimento: { $gte: dataInicio, $lte: dataFim } 
      }),
      Material.find({ 
        quantidadeEstoque: { $lte: '$estoqueMinimo' },
        ativo: true
      }),
      User.countDocuments({ ativo: true })
    ]);
    
    // Calcular estatísticas de orçamentos
    const totalOrcamentos = orcamentos.length;
    const orcamentosAprovados = orcamentos.filter(o => o.status === 'aprovado').length;
    const taxaConversao = totalOrcamentos > 0 ? (orcamentosAprovados / totalOrcamentos * 100).toFixed(2) : 0;
    const valorOrcamentos = orcamentos.reduce((total, o) => total + o.valorFinal, 0);
    
    // Calcular estatísticas de contratos
    const totalContratos = contratos.length;
    const valorContratos = contratos.reduce((total, c) => total + c.valorTotal, 0);
    
    // Calcular estatísticas de ordens de serviço
    const totalOrdens = ordensServico.length;
    const ordensAgendadas = ordensServico.filter(o => o.status === 'agendada').length;
    const ordensEmAndamento = ordensServico.filter(o => o.status === 'em andamento').length;
    const ordensConcluidas = ordensServico.filter(o => o.status === 'concluída').length;
    
    // Calcular estatísticas financeiras
    const receitasPagas = financeiros
      .filter(f => f.tipo === 'receita' && f.status === 'pago')
      .reduce((total, f) => total + f.valor, 0);
    
    const despesasPagas = financeiros
      .filter(f => f.tipo === 'despesa' && f.status === 'pago')
      .reduce((total, f) => total + f.valor, 0);
    
    const receitasPendentes = financeiros
      .filter(f => f.tipo === 'receita' && (f.status === 'pendente' || f.status === 'atrasado'))
      .reduce((total, f) => total + f.valor, 0);
    
    const despesasPendentes = financeiros
      .filter(f => f.tipo === 'despesa' && (f.status === 'pendente' || f.status === 'atrasado'))
      .reduce((total, f) => total + f.valor, 0);
    
    const saldoRealizado = receitasPagas - despesasPagas;
    
    // Calcular alertas de estoque
    const alertasEstoque = materiais.length;
    
    const dashboard = {
      periodo: {
        dataInicio,
        dataFim
      },
      resumo: {
        clientes,
        usuarios,
        visitas,
        orcamentos: {
          total: totalOrcamentos,
          aprovados: orcamentosAprovados,
          taxaConversao: parseFloat(taxaConversao),
          valor: valorOrcamentos
        },
        contratos: {
          total: totalContratos,
          valor: valorContratos
        },
        ordensServico: {
          total: totalOrdens,
          agendadas: ordensAgendadas,
          emAndamento: ordensEmAndamento,
          concluidas: ordensConcluidas
        },
        financeiro: {
          receitasPagas,
          despesasPagas,
          receitasPendentes,
          despesasPendentes,
          saldoRealizado
        },
        estoque: {
          alertas: alertasEstoque
        }
      },
      alertas: {
        estoque: materiais.map(m => ({
          _id: m._id,
          codigo: m.codigo,
          nome: m.nome,
          quantidadeEstoque: m.quantidadeEstoque,
          estoqueMinimo: m.estoqueMinimo,
          status: m.quantidadeEstoque === 0 ? 'sem_estoque' : 'estoque_baixo'
        })),
        financeiro: financeiros
          .filter(f => f.status === 'atrasado')
          .map(f => ({
            _id: f._id,
            tipo: f.tipo,
            descricao: f.descricao,
            valor: f.valor,
            dataVencimento: f.dataVencimento,
            diasAtraso: Math.floor((new Date() - new Date(f.dataVencimento)) / (1000 * 60 * 60 * 24))
          }))
      },
      proximasOrdens: ordensServico
        .filter(o => o.status === 'agendada')
        .sort((a, b) => new Date(a.dataAgendamento) - new Date(b.dataAgendamento))
        .slice(0, 5)
        .map(o => ({
          _id: o._id,
          numero: o.numero,
          dataAgendamento: o.dataAgendamento,
          horarioInicio: o.horarioInicio,
          horarioFim: o.horarioFim
        }))
    };
    
    res.json(dashboard);
  } catch (error) {
    console.error('Erro ao gerar dashboard:', error);
    res.status(500).json({ message: 'Erro ao gerar dashboard.' });
  }
};
