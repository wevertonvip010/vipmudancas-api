const Material = require('../models/material.model');
const MovimentacaoEstoque = require('../models/movimentacaoEstoque.model');

// Listar todos os materiais
exports.getAllMateriais = async (req, res) => {
  try {
    const materiais = await Material.find({ ativo: true });
    res.json(materiais);
  } catch (error) {
    console.error('Erro ao listar materiais:', error);
    res.status(500).json({ message: 'Erro ao listar materiais.' });
  }
};

// Obter material por ID
exports.getMaterialById = async (req, res) => {
  try {
    const material = await Material.findById(req.params.id);
    if (!material) {
      return res.status(404).json({ message: 'Material não encontrado.' });
    }
    res.json(material);
  } catch (error) {
    console.error('Erro ao buscar material:', error);
    res.status(500).json({ message: 'Erro ao buscar material.' });
  }
};

// Criar novo material
exports.createMaterial = async (req, res) => {
  try {
    const { 
      codigo, 
      nome, 
      descricao, 
      categoria, 
      unidadeMedida, 
      quantidadeEstoque,
      estoqueMinimo,
      valorUnitario,
      fornecedor,
      localizacao
    } = req.body;

    // Verificar se o código já existe
    const materialExists = await Material.findOne({ codigo });
    if (materialExists) {
      return res.status(400).json({ message: 'Já existe um material com este código.' });
    }

    // Criar novo material
    const material = new Material({
      codigo,
      nome,
      descricao,
      categoria,
      unidadeMedida,
      quantidadeEstoque: quantidadeEstoque || 0,
      estoqueMinimo: estoqueMinimo || 1,
      valorUnitario,
      fornecedor,
      localizacao,
      dataCriacao: Date.now(),
      ultimaAtualizacao: Date.now(),
      ativo: true
    });

    // Salvar material no banco de dados
    await material.save();

    // Se houver estoque inicial, registrar entrada
    if (quantidadeEstoque && quantidadeEstoque > 0) {
      await MovimentacaoEstoque.create({
        materialId: material._id,
        tipoMovimentacao: 'entrada',
        quantidade: quantidadeEstoque,
        responsavelId: req.userId,
        observacao: 'Estoque inicial',
        data: Date.now()
      });
    }

    res.status(201).json({
      message: 'Material cadastrado com sucesso',
      material
    });
  } catch (error) {
    console.error('Erro ao criar material:', error);
    res.status(500).json({ message: 'Erro ao cadastrar material.' });
  }
};

// Atualizar material
exports.updateMaterial = async (req, res) => {
  try {
    const { 
      nome, 
      descricao, 
      categoria, 
      unidadeMedida, 
      estoqueMinimo,
      valorUnitario,
      fornecedor,
      localizacao
    } = req.body;
    
    // Verificar se o material existe
    const material = await Material.findById(req.params.id);
    if (!material) {
      return res.status(404).json({ message: 'Material não encontrado.' });
    }
    
    // Atualizar dados do material
    if (nome) material.nome = nome;
    if (descricao !== undefined) material.descricao = descricao;
    if (categoria) material.categoria = categoria;
    if (unidadeMedida) material.unidadeMedida = unidadeMedida;
    if (estoqueMinimo !== undefined) material.estoqueMinimo = estoqueMinimo;
    if (valorUnitario !== undefined) material.valorUnitario = valorUnitario;
    if (fornecedor !== undefined) material.fornecedor = fornecedor;
    if (localizacao !== undefined) material.localizacao = localizacao;
    
    material.ultimaAtualizacao = Date.now();
    
    await material.save();
    
    res.json({
      message: 'Material atualizado com sucesso',
      material
    });
  } catch (error) {
    console.error('Erro ao atualizar material:', error);
    res.status(500).json({ message: 'Erro ao atualizar material.' });
  }
};

// Ajustar estoque
exports.adjustEstoque = async (req, res) => {
  try {
    const { quantidade, tipoMovimentacao, observacao } = req.body;
    
    if (!['entrada', 'saída'].includes(tipoMovimentacao)) {
      return res.status(400).json({ message: 'Tipo de movimentação inválido. Use "entrada" ou "saída".' });
    }
    
    if (!quantidade || quantidade <= 0) {
      return res.status(400).json({ message: 'Quantidade deve ser maior que zero.' });
    }
    
    // Verificar se o material existe
    const material = await Material.findById(req.params.id);
    if (!material) {
      return res.status(404).json({ message: 'Material não encontrado.' });
    }
    
    // Verificar se há estoque suficiente para saída
    if (tipoMovimentacao === 'saída' && material.quantidadeEstoque < quantidade) {
      return res.status(400).json({ 
        message: `Estoque insuficiente. Disponível: ${material.quantidadeEstoque}, Solicitado: ${quantidade}` 
      });
    }
    
    // Atualizar estoque
    const valorAjuste = tipoMovimentacao === 'entrada' ? quantidade : -quantidade;
    material.quantidadeEstoque += valorAjuste;
    material.ultimaAtualizacao = Date.now();
    
    await material.save();
    
    // Registrar movimentação
    await MovimentacaoEstoque.create({
      materialId: material._id,
      tipoMovimentacao,
      quantidade,
      responsavelId: req.userId,
      observacao: observacao || `Ajuste manual de estoque (${tipoMovimentacao})`,
      data: Date.now()
    });
    
    res.json({
      message: `Estoque ${tipoMovimentacao === 'entrada' ? 'incrementado' : 'decrementado'} com sucesso`,
      material
    });
  } catch (error) {
    console.error('Erro ao ajustar estoque:', error);
    res.status(500).json({ message: 'Erro ao ajustar estoque.' });
  }
};

// Desativar material
exports.deactivateMaterial = async (req, res) => {
  try {
    const material = await Material.findById(req.params.id);
    if (!material) {
      return res.status(404).json({ message: 'Material não encontrado.' });
    }
    
    material.ativo = false;
    material.ultimaAtualizacao = Date.now();
    
    await material.save();
    
    res.json({ message: 'Material desativado com sucesso.' });
  } catch (error) {
    console.error('Erro ao desativar material:', error);
    res.status(500).json({ message: 'Erro ao desativar material.' });
  }
};

// Buscar materiais com estoque baixo
exports.getMaterialsWithLowStock = async (req, res) => {
  try {
    const materiais = await Material.find({
      ativo: true,
      $expr: { $lte: ['$quantidadeEstoque', '$estoqueMinimo'] }
    });
    
    res.json(materiais);
  } catch (error) {
    console.error('Erro ao buscar materiais com estoque baixo:', error);
    res.status(500).json({ message: 'Erro ao buscar materiais com estoque baixo.' });
  }
};

// Buscar histórico de movimentações de um material
exports.getMovimentacoesByMaterial = async (req, res) => {
  try {
    const { materialId } = req.params;
    
    // Verificar se o material existe
    const material = await Material.findById(materialId);
    if (!material) {
      return res.status(404).json({ message: 'Material não encontrado.' });
    }
    
    const movimentacoes = await MovimentacaoEstoque.find({ materialId })
      .populate('responsavelId', 'nome cargo')
      .populate('ordemServicoId', 'numero')
      .sort({ data: -1 });
    
    res.json(movimentacoes);
  } catch (error) {
    console.error('Erro ao buscar histórico de movimentações:', error);
    res.status(500).json({ message: 'Erro ao buscar histórico de movimentações.' });
  }
};

// Buscar todas as movimentações de estoque
exports.getAllMovimentacoes = async (req, res) => {
  try {
    const { dataInicio, dataFim, tipo } = req.query;
    
    let query = {};
    
    // Filtrar por período
    if (dataInicio && dataFim) {
      query.data = {
        $gte: new Date(dataInicio),
        $lte: new Date(dataFim)
      };
    }
    
    // Filtrar por tipo de movimentação
    if (tipo && ['entrada', 'saída'].includes(tipo)) {
      query.tipoMovimentacao = tipo;
    }
    
    const movimentacoes = await MovimentacaoEstoque.find(query)
      .populate('materialId', 'nome codigo')
      .populate('responsavelId', 'nome cargo')
      .populate('ordemServicoId', 'numero')
      .sort({ data: -1 });
    
    res.json(movimentacoes);
  } catch (error) {
    console.error('Erro ao buscar movimentações de estoque:', error);
    res.status(500).json({ message: 'Erro ao buscar movimentações de estoque.' });
  }
};
