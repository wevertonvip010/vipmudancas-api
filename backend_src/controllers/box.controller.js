const Box = require('../models/box.model');
const ContratoStorage = require('../models/contratoStorage.model');

// Controlador para gerenciamento de boxes
exports.criarBox = async (req, res) => {
  try {
    const { numero, altura, largura, profundidade, valorPorMetroQuadrado, localizacao, observacoes } = req.body;
    
    // Verificar se já existe um box com o mesmo número
    const boxExistente = await Box.findOne({ numero });
    if (boxExistente) {
      return res.status(400).json({ message: 'Já existe um box com este número' });
    }
    
    // Criar novo box
    const novoBox = new Box({
      numero,
      altura,
      largura,
      profundidade,
      valorPorMetroQuadrado,
      localizacao,
      observacoes
    });
    
    // Salvar box (o middleware calculará automaticamente a metragem quadrada e o valor total)
    await novoBox.save();
    
    res.status(201).json({
      success: true,
      data: novoBox,
      message: 'Box criado com sucesso'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao criar box',
      error: error.message
    });
  }
};

// Listar todos os boxes
exports.listarBoxes = async (req, res) => {
  try {
    const { status } = req.query;
    let filtro = {};
    
    // Filtrar por status se fornecido
    if (status) {
      filtro.status = status;
    }
    
    const boxes = await Box.find(filtro).sort({ numero: 1 });
    
    // Estatísticas de ocupação
    const estatisticas = {
      total: await Box.countDocuments(),
      disponiveis: await Box.countDocuments({ status: 'disponível' }),
      ocupados: await Box.countDocuments({ status: 'ocupado' }),
      manutencao: await Box.countDocuments({ status: 'em manutenção' }),
      reservados: await Box.countDocuments({ status: 'reservado' })
    };
    
    res.status(200).json({
      success: true,
      count: boxes.length,
      estatisticas,
      data: boxes
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao listar boxes',
      error: error.message
    });
  }
};

// Obter detalhes de um box específico
exports.obterBox = async (req, res) => {
  try {
    const box = await Box.findById(req.params.id);
    
    if (!box) {
      return res.status(404).json({
        success: false,
        message: 'Box não encontrado'
      });
    }
    
    // Verificar se o box está ocupado e obter informações do contrato
    let contratoAtivo = null;
    if (box.status === 'ocupado') {
      contratoAtivo = await ContratoStorage.findOne({ 
        box: box._id, 
        status: 'ativo' 
      }).populate('cliente');
    }
    
    res.status(200).json({
      success: true,
      data: box,
      contratoAtivo
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao obter detalhes do box',
      error: error.message
    });
  }
};

// Atualizar box
exports.atualizarBox = async (req, res) => {
  try {
    const { numero, altura, largura, profundidade, valorPorMetroQuadrado, status, localizacao, observacoes } = req.body;
    
    // Verificar se o box existe
    let box = await Box.findById(req.params.id);
    if (!box) {
      return res.status(404).json({
        success: false,
        message: 'Box não encontrado'
      });
    }
    
    // Verificar se está tentando alterar o número para um que já existe
    if (numero && numero !== box.numero) {
      const boxExistente = await Box.findOne({ numero });
      if (boxExistente) {
        return res.status(400).json({
          success: false,
          message: 'Já existe um box com este número'
        });
      }
    }
    
    // Atualizar campos
    box.numero = numero || box.numero;
    box.altura = altura || box.altura;
    box.largura = largura || box.largura;
    box.profundidade = profundidade || box.profundidade;
    box.valorPorMetroQuadrado = valorPorMetroQuadrado || box.valorPorMetroQuadrado;
    box.status = status || box.status;
    box.localizacao = localizacao || box.localizacao;
    box.observacoes = observacoes !== undefined ? observacoes : box.observacoes;
    
    // Salvar alterações (o middleware recalculará a metragem quadrada e o valor total)
    await box.save();
    
    res.status(200).json({
      success: true,
      data: box,
      message: 'Box atualizado com sucesso'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar box',
      error: error.message
    });
  }
};

// Excluir box
exports.excluirBox = async (req, res) => {
  try {
    // Verificar se o box existe
    const box = await Box.findById(req.params.id);
    if (!box) {
      return res.status(404).json({
        success: false,
        message: 'Box não encontrado'
      });
    }
    
    // Verificar se o box está ocupado
    if (box.status === 'ocupado') {
      const contratoAtivo = await ContratoStorage.findOne({ box: box._id, status: 'ativo' });
      if (contratoAtivo) {
        return res.status(400).json({
          success: false,
          message: 'Não é possível excluir um box que está ocupado'
        });
      }
    }
    
    // Excluir box
    await Box.findByIdAndDelete(req.params.id);
    
    res.status(200).json({
      success: true,
      message: 'Box excluído com sucesso'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao excluir box',
      error: error.message
    });
  }
};

// Dashboard de ocupação
exports.dashboardOcupacao = async (req, res) => {
  try {
    // Estatísticas gerais
    const estatisticas = {
      total: await Box.countDocuments(),
      disponiveis: await Box.countDocuments({ status: 'disponível' }),
      ocupados: await Box.countDocuments({ status: 'ocupado' }),
      manutencao: await Box.countDocuments({ status: 'em manutenção' }),
      reservados: await Box.countDocuments({ status: 'reservado' }),
      taxaOcupacao: 0
    };
    
    // Calcular taxa de ocupação
    if (estatisticas.total > 0) {
      estatisticas.taxaOcupacao = ((estatisticas.ocupados / estatisticas.total) * 100).toFixed(2);
    }
    
    // Estatísticas por tamanho
    const boxesPorTamanho = await Box.aggregate([
      {
        $group: {
          _id: {
            $concat: [
              { $toString: { $trunc: "$largura" } },
              "x",
              { $toString: { $trunc: "$profundidade" } }
            ]
          },
          count: { $sum: 1 },
          ocupados: {
            $sum: {
              $cond: [{ $eq: ["$status", "ocupado"] }, 1, 0]
            }
          },
          metragemMedia: { $avg: "$metragemQuadrada" },
          valorMedio: { $avg: "$valorTotal" }
        }
      },
      { $sort: { "_id": 1 } }
    ]);
    
    // Faturamento atual
    const faturamentoAtual = await ContratoStorage.aggregate([
      { $match: { status: 'ativo' } },
      { $group: { _id: null, total: { $sum: "$valorMensal" } } }
    ]);
    
    const faturamento = faturamentoAtual.length > 0 ? faturamentoAtual[0].total : 0;
    
    res.status(200).json({
      success: true,
      estatisticas,
      boxesPorTamanho,
      faturamento,
      planejamentoExpansao: {
        unidadesAtuais: estatisticas.total,
        unidadesPlanejadas: 200,
        progressoExpansao: ((estatisticas.total / 256) * 100).toFixed(2) // 56 atuais + 200 planejadas
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao gerar dashboard de ocupação',
      error: error.message
    });
  }
};
