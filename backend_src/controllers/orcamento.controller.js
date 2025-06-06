const Orcamento = require('../models/orcamento.model');
const Cliente = require('../models/cliente.model');
const Visita = require('../models/visita.model');
const User = require('../models/user.model');

// Listar todos os orçamentos
exports.getAllOrcamentos = async (req, res) => {
  try {
    const orcamentos = await Orcamento.find()
      .populate('clienteId', 'nome email telefone')
      .populate('visitaId')
      .populate('responsavelId', 'nome cargo percentualComissao');
    
    res.status(200).json({
      sucesso: true,
      dados: orcamentos,
      erro: null
    });
  } catch (error) {
    console.error('Erro ao listar orçamentos:', error);
    res.status(500).json({
      sucesso: false,
      dados: null,
      erro: 'Erro ao listar orçamentos.'
    });
  }
};

// Obter orçamento por ID
exports.getOrcamentoById = async (req, res) => {
  try {
    const orcamento = await Orcamento.findById(req.params.id)
      .populate('clienteId', 'nome email telefone')
      .populate('visitaId')
      .populate('responsavelId', 'nome cargo percentualComissao');
    
    if (!orcamento) {
      return res.status(404).json({
        sucesso: false,
        dados: null,
        erro: 'Orçamento não encontrado.'
      });
    }
    
    res.status(200).json({
      sucesso: true,
      dados: orcamento,
      erro: null
    });
  } catch (error) {
    console.error('Erro ao buscar orçamento:', error);
    res.status(500).json({
      sucesso: false,
      dados: null,
      erro: 'Erro ao buscar orçamento.'
    });
  }
};

// Criar novo orçamento
exports.createOrcamento = async (req, res) => {
  try {
    const { 
      clienteId, 
      visitaId, 
      numero,
      enderecoOrigem, 
      enderecoDestino,
      itens,
      valorMudanca,
      valorImovel,
      desconto,
      formaPagamento,
      condicoesPagamento,
      observacoes,
      dataValidade
    } = req.body;

    // Verificar se o cliente existe
    const cliente = await Cliente.findById(clienteId);
    if (!cliente) {
      return res.status(404).json({
        sucesso: false,
        dados: null,
        erro: 'Cliente não encontrado.'
      });
    }

    // Verificar se a visita existe, se fornecida
    if (visitaId) {
      const visita = await Visita.findById(visitaId);
      if (!visita) {
        return res.status(404).json({
          sucesso: false,
          dados: null,
          erro: 'Visita não encontrada.'
        });
      }
    }

    // Buscar dados do vendedor responsável para obter percentual de comissão
    const vendedor = await User.findById(req.userId);
    if (!vendedor) {
      return res.status(404).json({
        sucesso: false,
        dados: null,
        erro: 'Vendedor não encontrado.'
      });
    }

    // Verificar se o número do orçamento já existe
    const orcamentoExists = await Orcamento.findOne({ numero });
    if (orcamentoExists) {
      return res.status(400).json({
        sucesso: false,
        dados: null,
        erro: 'Já existe um orçamento com este número.'
      });
    }

    // Criar novo orçamento
    const orcamento = new Orcamento({
      clienteId,
      visitaId,
      responsavelId: req.userId,
      numero,
      data: Date.now(),
      enderecoOrigem,
      enderecoDestino,
      itens,
      valorMudanca,
      valorImovel: valorImovel || 0,
      percentualComissao: vendedor.percentualComissao || 0,
      desconto: desconto || 0,
      formaPagamento,
      condicoesPagamento,
      observacoes,
      status: 'pendente',
      dataValidade,
      dataCriacao: Date.now(),
      ultimaAtualizacao: Date.now()
    });

    // Salvar orçamento no banco de dados (os cálculos são feitos automaticamente no middleware)
    await orcamento.save();

    // Recarregar com populate para retornar dados completos
    const orcamentoCompleto = await Orcamento.findById(orcamento._id)
      .populate('clienteId', 'nome email telefone')
      .populate('visitaId')
      .populate('responsavelId', 'nome cargo percentualComissao');

    res.status(201).json({
      sucesso: true,
      dados: {
        message: 'Orçamento criado com sucesso',
        orcamento: orcamentoCompleto
      },
      erro: null
    });
  } catch (error) {
    console.error('Erro ao criar orçamento:', error);
    res.status(500).json({
      sucesso: false,
      dados: null,
      erro: 'Erro ao criar orçamento.'
    });
  }
};

// Atualizar orçamento
exports.updateOrcamento = async (req, res) => {
  try {
    const { 
      enderecoOrigem, 
      enderecoDestino,
      itens,
      valorMudanca,
      valorImovel,
      desconto,
      formaPagamento,
      condicoesPagamento,
      observacoes,
      dataValidade
    } = req.body;
    
    // Verificar se o orçamento existe
    const orcamento = await Orcamento.findById(req.params.id);
    if (!orcamento) {
      return res.status(404).json({
        sucesso: false,
        dados: null,
        erro: 'Orçamento não encontrado.'
      });
    }
    
    // Verificar se o orçamento já foi aprovado ou rejeitado
    if (orcamento.status === 'aprovado' || orcamento.status === 'rejeitado') {
      return res.status(400).json({
        sucesso: false,
        dados: null,
        erro: `Não é possível atualizar um orçamento que já foi ${orcamento.status}.`
      });
    }
    
    // Atualizar dados do orçamento
    if (enderecoOrigem) orcamento.enderecoOrigem = enderecoOrigem;
    if (enderecoDestino) orcamento.enderecoDestino = enderecoDestino;
    if (itens) orcamento.itens = itens;
    if (valorMudanca !== undefined) orcamento.valorMudanca = valorMudanca;
    if (valorImovel !== undefined) orcamento.valorImovel = valorImovel;
    if (desconto !== undefined) orcamento.desconto = desconto;
    if (formaPagamento) orcamento.formaPagamento = formaPagamento;
    if (condicoesPagamento) orcamento.condicoesPagamento = condicoesPagamento;
    if (observacoes !== undefined) orcamento.observacoes = observacoes;
    if (dataValidade) orcamento.dataValidade = dataValidade;
    
    // Salvar (os cálculos são feitos automaticamente no middleware)
    await orcamento.save();
    
    // Recarregar com populate
    const orcamentoAtualizado = await Orcamento.findById(orcamento._id)
      .populate('clienteId', 'nome email telefone')
      .populate('visitaId')
      .populate('responsavelId', 'nome cargo percentualComissao');
    
    res.status(200).json({
      sucesso: true,
      dados: {
        message: 'Orçamento atualizado com sucesso',
        orcamento: orcamentoAtualizado
      },
      erro: null
    });
  } catch (error) {
    console.error('Erro ao atualizar orçamento:', error);
    res.status(500).json({
      sucesso: false,
      dados: null,
      erro: 'Erro ao atualizar orçamento.'
    });
  }
};

// Aprovar orçamento
exports.approveOrcamento = async (req, res) => {
  try {
    const orcamento = await Orcamento.findById(req.params.id);
    if (!orcamento) {
      return res.status(404).json({
        sucesso: false,
        dados: null,
        erro: 'Orçamento não encontrado.'
      });
    }
    
    // Verificar se o orçamento já foi aprovado ou rejeitado
    if (orcamento.status === 'aprovado') {
      return res.status(400).json({
        sucesso: false,
        dados: null,
        erro: 'Orçamento já foi aprovado.'
      });
    }
    
    if (orcamento.status === 'rejeitado') {
      return res.status(400).json({
        sucesso: false,
        dados: null,
        erro: 'Orçamento já foi rejeitado e não pode ser aprovado.'
      });
    }
    
    if (orcamento.status === 'expirado') {
      return res.status(400).json({
        sucesso: false,
        dados: null,
        erro: 'Orçamento expirado não pode ser aprovado.'
      });
    }
    
    orcamento.status = 'aprovado';
    await orcamento.save();
    
    res.status(200).json({
      sucesso: true,
      dados: { message: 'Orçamento aprovado com sucesso.' },
      erro: null
    });
  } catch (error) {
    console.error('Erro ao aprovar orçamento:', error);
    res.status(500).json({
      sucesso: false,
      dados: null,
      erro: 'Erro ao aprovar orçamento.'
    });
  }
};

// Rejeitar orçamento ou marcar como não fechado
exports.rejectOrcamento = async (req, res) => {
  try {
    const { motivoRejeicao, justificativaNaoFechado } = req.body;
    
    const orcamento = await Orcamento.findById(req.params.id);
    if (!orcamento) {
      return res.status(404).json({
        sucesso: false,
        dados: null,
        erro: 'Orçamento não encontrado.'
      });
    }
    
    // Verificar se o orçamento já foi aprovado ou rejeitado
    if (orcamento.status === 'rejeitado' || orcamento.status === 'nao_fechado') {
      return res.status(400).json({
        sucesso: false,
        dados: null,
        erro: 'Orçamento já foi rejeitado.'
      });
    }
    
    if (orcamento.status === 'aprovado') {
      return res.status(400).json({
        sucesso: false,
        dados: null,
        erro: 'Orçamento já foi aprovado e não pode ser rejeitado.'
      });
    }
    
    // Determinar se é rejeição ou não fechado
    if (justificativaNaoFechado) {
      orcamento.status = 'nao_fechado';
      orcamento.justificativaNaoFechado = justificativaNaoFechado;
    } else {
      orcamento.status = 'rejeitado';
      if (motivoRejeicao) {
        orcamento.observacoes = orcamento.observacoes 
          ? `${orcamento.observacoes}\nMotivo da rejeição: ${motivoRejeicao}`
          : `Motivo da rejeição: ${motivoRejeicao}`;
      }
    }
    
    await orcamento.save();
    
    const mensagem = orcamento.status === 'nao_fechado' 
      ? 'Orçamento marcado como não fechado com sucesso.' 
      : 'Orçamento rejeitado com sucesso.';
    
    res.status(200).json({
      sucesso: true,
      dados: { message: mensagem },
      erro: null
    });
  } catch (error) {
    console.error('Erro ao rejeitar orçamento:', error);
    res.status(500).json({
      sucesso: false,
      dados: null,
      erro: 'Erro ao rejeitar orçamento.'
    });
  }
};

// Buscar orçamentos por cliente
exports.getOrcamentosByCliente = async (req, res) => {
  try {
    const { clienteId } = req.params;
    
    // Verificar se o cliente existe
    const cliente = await Cliente.findById(clienteId);
    if (!cliente) {
      return res.status(404).json({
        sucesso: false,
        dados: null,
        erro: 'Cliente não encontrado.'
      });
    }
    
    const orcamentos = await Orcamento.find({ clienteId })
      .populate('responsavelId', 'nome cargo percentualComissao')
      .sort({ data: -1 });
    
    res.status(200).json({
      sucesso: true,
      dados: orcamentos,
      erro: null
    });
  } catch (error) {
    console.error('Erro ao buscar orçamentos do cliente:', error);
    res.status(500).json({
      sucesso: false,
      dados: null,
      erro: 'Erro ao buscar orçamentos do cliente.'
    });
  }
};

// Buscar orçamentos por período
exports.getOrcamentosByPeriodo = async (req, res) => {
  try {
    const { dataInicio, dataFim } = req.query;
    
    if (!dataInicio || !dataFim) {
      return res.status(400).json({
        sucesso: false,
        dados: null,
        erro: 'Data de início e fim são obrigatórias.'
      });
    }
    
    const orcamentos = await Orcamento.find({
      data: {
        $gte: new Date(dataInicio),
        $lte: new Date(dataFim)
      }
    })
    .populate('clienteId', 'nome email telefone')
    .populate('responsavelId', 'nome cargo percentualComissao')
    .sort({ data: 1 });
    
    res.status(200).json({
      sucesso: true,
      dados: orcamentos,
      erro: null
    });
  } catch (error) {
    console.error('Erro ao buscar orçamentos por período:', error);
    res.status(500).json({
      sucesso: false,
      dados: null,
      erro: 'Erro ao buscar orçamentos por período.'
    });
  }
};

// Buscar orçamentos por status
exports.getOrcamentosByStatus = async (req, res) => {
  try {
    const { status } = req.params;
    
    if (!['pendente', 'aprovado', 'rejeitado', 'expirado', 'nao_fechado'].includes(status)) {
      return res.status(400).json({
        sucesso: false,
        dados: null,
        erro: 'Status inválido.'
      });
    }
    
    const orcamentos = await Orcamento.find({ status })
      .populate('clienteId', 'nome email telefone')
      .populate('responsavelId', 'nome cargo percentualComissao')
      .sort({ data: -1 });
    
    res.status(200).json({
      sucesso: true,
      dados: orcamentos,
      erro: null
    });
  } catch (error) {
    console.error('Erro ao buscar orçamentos por status:', error);
    res.status(500).json({
      sucesso: false,
      dados: null,
      erro: 'Erro ao buscar orçamentos por status.'
    });
  }
};

// Relatório de comissões por vendedor
exports.getRelatorioComissoes = async (req, res) => {
  try {
    const { dataInicio, dataFim, vendedorId } = req.query;
    
    // Construir filtros
    const filtros = {};
    
    if (dataInicio && dataFim) {
      filtros.data = {
        $gte: new Date(dataInicio),
        $lte: new Date(dataFim)
      };
    }
    
    if (vendedorId) {
      filtros.responsavelId = vendedorId;
    }
    
    // Buscar apenas orçamentos aprovados (fechados)
    filtros.status = 'aprovado';
    
    const orcamentos = await Orcamento.find(filtros)
      .populate('clienteId', 'nome email telefone')
      .populate('responsavelId', 'nome cargo percentualComissao')
      .sort({ data: -1 });
    
    // Calcular totais por vendedor
    const relatorio = {};
    
    orcamentos.forEach(orcamento => {
      const vendedorId = orcamento.responsavelId._id.toString();
      const vendedorNome = orcamento.responsavelId.nome;
      
      if (!relatorio[vendedorId]) {
        relatorio[vendedorId] = {
          vendedor: {
            id: vendedorId,
            nome: vendedorNome,
            cargo: orcamento.responsavelId.cargo,
            percentualComissao: orcamento.responsavelId.percentualComissao
          },
          totalOrcamentos: 0,
          totalVendas: 0,
          totalComissoes: 0,
          orcamentos: []
        };
      }
      
      relatorio[vendedorId].totalOrcamentos++;
      relatorio[vendedorId].totalVendas += orcamento.valorMudanca;
      relatorio[vendedorId].totalComissoes += orcamento.valorComissao;
      relatorio[vendedorId].orcamentos.push({
        id: orcamento._id,
        numero: orcamento.numero,
        cliente: orcamento.clienteId.nome,
        data: orcamento.data,
        valorMudanca: orcamento.valorMudanca,
        valorComissao: orcamento.valorComissao,
        percentualComissao: orcamento.percentualComissao
      });
    });
    
    // Converter para array
    const relatorioArray = Object.values(relatorio);
    
    res.status(200).json({
      sucesso: true,
      dados: {
        periodo: { dataInicio, dataFim },
        vendedores: relatorioArray,
        resumo: {
          totalVendedores: relatorioArray.length,
          totalOrcamentos: orcamentos.length,
          totalVendas: relatorioArray.reduce((sum, v) => sum + v.totalVendas, 0),
          totalComissoes: relatorioArray.reduce((sum, v) => sum + v.totalComissoes, 0)
        }
      },
      erro: null
    });
  } catch (error) {
    console.error('Erro ao gerar relatório de comissões:', error);
    res.status(500).json({
      sucesso: false,
      dados: null,
      erro: 'Erro ao gerar relatório de comissões.'
    });
  }
};

