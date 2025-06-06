const OrdemServico = require('../models/ordemServico.model');
const Contrato = require('../models/contrato.model');
const Cliente = require('../models/cliente.model');
const User = require('../models/user.model');
const Material = require('../models/material.model');
const Veiculo = require('../models/veiculo.model');
const MovimentacaoEstoque = require('../models/movimentacaoEstoque.model');

// Listar todas as ordens de serviço
exports.getAllOrdensServico = async (req, res) => {
  try {
    const ordensServico = await OrdemServico.find()
      .populate('clienteId', 'nome email telefone')
      .populate('contratoId')
      .populate('responsavelId', 'nome cargo')
      .populate('equipe.funcionarioId', 'nome cargo')
      .populate('materiais.materialId', 'nome codigo')
      .populate('veiculoId', 'placa modelo');
    
    res.json(ordensServico);
  } catch (error) {
    console.error('Erro ao listar ordens de serviço:', error);
    res.status(500).json({ message: 'Erro ao listar ordens de serviço.' });
  }
};

// Obter ordem de serviço por ID
exports.getOrdemServicoById = async (req, res) => {
  try {
    const ordemServico = await OrdemServico.findById(req.params.id)
      .populate('clienteId', 'nome email telefone')
      .populate('contratoId')
      .populate('responsavelId', 'nome cargo')
      .populate('equipe.funcionarioId', 'nome cargo')
      .populate('materiais.materialId', 'nome codigo')
      .populate('veiculoId', 'placa modelo');
    
    if (!ordemServico) {
      return res.status(404).json({ message: 'Ordem de serviço não encontrada.' });
    }
    
    res.json(ordemServico);
  } catch (error) {
    console.error('Erro ao buscar ordem de serviço:', error);
    res.status(500).json({ message: 'Erro ao buscar ordem de serviço.' });
  }
};

// Criar nova ordem de serviço a partir de um contrato
exports.createOrdemServico = async (req, res) => {
  try {
    const { 
      contratoId, 
      dataAgendamento,
      horarioInicio,
      horarioFim,
      enderecoOrigem,
      enderecoDestino,
      equipe,
      materiais,
      veiculoId,
      observacoes,
      checklistPre,
      checklistPos
    } = req.body;

    // Verificar se o contrato existe
    const contrato = await Contrato.findById(contratoId);
    if (!contrato) {
      return res.status(404).json({ message: 'Contrato não encontrado.' });
    }

    // Verificar se o contrato está ativo
    if (contrato.status !== 'ativo') {
      return res.status(400).json({ message: 'Só é possível gerar ordem de serviço a partir de contratos ativos.' });
    }

    // Verificar se a equipe existe
    if (equipe && equipe.length > 0) {
      for (const membro of equipe) {
        const funcionario = await User.findById(membro.funcionarioId);
        if (!funcionario) {
          return res.status(404).json({ message: `Funcionário com ID ${membro.funcionarioId} não encontrado.` });
        }
      }
    }

    // Verificar se os materiais existem
    if (materiais && materiais.length > 0) {
      for (const item of materiais) {
        const material = await Material.findById(item.materialId);
        if (!material) {
          return res.status(404).json({ message: `Material com ID ${item.materialId} não encontrado.` });
        }
        
        // Verificar se há estoque suficiente
        if (material.quantidadeEstoque < item.quantidade) {
          return res.status(400).json({ 
            message: `Estoque insuficiente para o material ${material.nome}. Disponível: ${material.quantidadeEstoque}, Solicitado: ${item.quantidade}` 
          });
        }
      }
    }

    // Verificar se o veículo existe
    if (veiculoId) {
      const veiculo = await Veiculo.findById(veiculoId);
      if (!veiculo) {
        return res.status(404).json({ message: 'Veículo não encontrado.' });
      }
      
      // Verificar se o veículo está disponível
      if (veiculo.status !== 'disponível') {
        return res.status(400).json({ message: `Veículo não está disponível. Status atual: ${veiculo.status}` });
      }
    }

    // Gerar número da ordem de serviço (ano + sequencial)
    const ano = new Date().getFullYear();
    const ultimaOS = await OrdemServico.findOne().sort({ numero: -1 });
    let sequencial = 1;
    
    if (ultimaOS && ultimaOS.numero) {
      const partes = ultimaOS.numero.split('-');
      if (partes.length === 2 && partes[0] === ano.toString()) {
        sequencial = parseInt(partes[1]) + 1;
      }
    }
    
    const numeroOS = `${ano}-${sequencial.toString().padStart(4, '0')}`;

    // Criar nova ordem de serviço
    const ordemServico = new OrdemServico({
      contratoId,
      clienteId: contrato.clienteId,
      responsavelId: req.userId,
      numero: numeroOS,
      dataAgendamento,
      horarioInicio,
      horarioFim,
      enderecoOrigem: enderecoOrigem || contrato.enderecoOrigem,
      enderecoDestino: enderecoDestino || contrato.enderecoDestino,
      equipe: equipe || [],
      materiais: materiais || [],
      veiculoId,
      status: 'agendada',
      observacoes,
      checklistPre: checklistPre || [],
      checklistPos: checklistPos || [],
      dataCriacao: Date.now(),
      ultimaAtualizacao: Date.now()
    });

    // Salvar ordem de serviço no banco de dados
    await ordemServico.save();

    // Atualizar status do veículo
    if (veiculoId) {
      await Veiculo.findByIdAndUpdate(veiculoId, { status: 'em uso' });
    }

    // Registrar movimentação de estoque
    if (materiais && materiais.length > 0) {
      for (const item of materiais) {
        // Atualizar estoque do material
        await Material.findByIdAndUpdate(item.materialId, {
          $inc: { quantidadeEstoque: -item.quantidade }
        });
        
        // Registrar movimentação
        await MovimentacaoEstoque.create({
          materialId: item.materialId,
          tipoMovimentacao: 'saída',
          quantidade: item.quantidade,
          ordemServicoId: ordemServico._id,
          responsavelId: req.userId,
          observacao: `Saída para OS ${numeroOS}`,
          data: Date.now()
        });
      }
    }

    res.status(201).json({
      message: 'Ordem de serviço criada com sucesso',
      ordemServico
    });
  } catch (error) {
    console.error('Erro ao criar ordem de serviço:', error);
    res.status(500).json({ message: 'Erro ao criar ordem de serviço.' });
  }
};

// Atualizar ordem de serviço
exports.updateOrdemServico = async (req, res) => {
  try {
    const { 
      dataAgendamento,
      horarioInicio,
      horarioFim,
      enderecoOrigem,
      enderecoDestino,
      equipe,
      materiais,
      veiculoId,
      observacoes,
      checklistPre,
      checklistPos
    } = req.body;
    
    // Verificar se a ordem de serviço existe
    const ordemServico = await OrdemServico.findById(req.params.id)
      .populate('materiais.materialId');
    
    if (!ordemServico) {
      return res.status(404).json({ message: 'Ordem de serviço não encontrada.' });
    }
    
    // Verificar se a ordem de serviço já foi concluída ou cancelada
    if (ordemServico.status === 'concluída' || ordemServico.status === 'cancelada') {
      return res.status(400).json({ 
        message: `Não é possível atualizar uma ordem de serviço que já foi ${ordemServico.status}.` 
      });
    }
    
    // Verificar se há alteração no veículo
    if (veiculoId && veiculoId !== ordemServico.veiculoId?.toString()) {
      // Verificar se o novo veículo existe
      const veiculo = await Veiculo.findById(veiculoId);
      if (!veiculo) {
        return res.status(404).json({ message: 'Veículo não encontrado.' });
      }
      
      // Verificar se o novo veículo está disponível
      if (veiculo.status !== 'disponível') {
        return res.status(400).json({ message: `Veículo não está disponível. Status atual: ${veiculo.status}` });
      }
      
      // Liberar o veículo anterior
      if (ordemServico.veiculoId) {
        await Veiculo.findByIdAndUpdate(ordemServico.veiculoId, { status: 'disponível' });
      }
      
      // Reservar o novo veículo
      await Veiculo.findByIdAndUpdate(veiculoId, { status: 'em uso' });
      
      ordemServico.veiculoId = veiculoId;
    }
    
    // Verificar se há alteração nos materiais
    if (materiais && JSON.stringify(materiais) !== JSON.stringify(ordemServico.materiais)) {
      // Verificar se os novos materiais existem e têm estoque suficiente
      for (const item of materiais) {
        const material = await Material.findById(item.materialId);
        if (!material) {
          return res.status(404).json({ message: `Material com ID ${item.materialId} não encontrado.` });
        }
        
        // Calcular a diferença de quantidade
        const materialAtual = ordemServico.materiais.find(m => m.materialId.toString() === item.materialId);
        const quantidadeAtual = materialAtual ? materialAtual.quantidade : 0;
        const diferenca = item.quantidade - quantidadeAtual;
        
        // Verificar se há estoque suficiente para a diferença
        if (diferenca > 0 && material.quantidadeEstoque < diferenca) {
          return res.status(400).json({ 
            message: `Estoque insuficiente para o material ${material.nome}. Disponível: ${material.quantidadeEstoque}, Adicional necessário: ${diferenca}` 
          });
        }
        
        // Atualizar estoque e registrar movimentação se houver diferença
        if (diferenca !== 0) {
          await Material.findByIdAndUpdate(item.materialId, {
            $inc: { quantidadeEstoque: -diferenca }
          });
          
          if (diferenca > 0) {
            // Saída adicional
            await MovimentacaoEstoque.create({
              materialId: item.materialId,
              tipoMovimentacao: 'saída',
              quantidade: diferenca,
              ordemServicoId: ordemServico._id,
              responsavelId: req.userId,
              observacao: `Saída adicional para OS ${ordemServico.numero}`,
              data: Date.now()
            });
          } else {
            // Devolução
            await MovimentacaoEstoque.create({
              materialId: item.materialId,
              tipoMovimentacao: 'entrada',
              quantidade: Math.abs(diferenca),
              ordemServicoId: ordemServico._id,
              responsavelId: req.userId,
              observacao: `Devolução de material da OS ${ordemServico.numero}`,
              data: Date.now()
            });
          }
        }
      }
      
      // Verificar materiais removidos
      for (const materialAtual of ordemServico.materiais) {
        const mantido = materiais.find(m => m.materialId === materialAtual.materialId.toString());
        if (!mantido) {
          // Material foi removido, devolver ao estoque
          await Material.findByIdAndUpdate(materialAtual.materialId, {
            $inc: { quantidadeEstoque: materialAtual.quantidade }
          });
          
          await MovimentacaoEstoque.create({
            materialId: materialAtual.materialId,
            tipoMovimentacao: 'entrada',
            quantidade: materialAtual.quantidade,
            ordemServicoId: ordemServico._id,
            responsavelId: req.userId,
            observacao: `Devolução de material removido da OS ${ordemServico.numero}`,
            data: Date.now()
          });
        }
      }
      
      ordemServico.materiais = materiais;
    }
    
    // Atualizar dados da ordem de serviço
    if (dataAgendamento) ordemServico.dataAgendamento = dataAgendamento;
    if (horarioInicio) ordemServico.horarioInicio = horarioInicio;
    if (horarioFim) ordemServico.horarioFim = horarioFim;
    if (enderecoOrigem) ordemServico.enderecoOrigem = enderecoOrigem;
    if (enderecoDestino) ordemServico.enderecoDestino = enderecoDestino;
    if (equipe) ordemServico.equipe = equipe;
    if (observacoes !== undefined) ordemServico.observacoes = observacoes;
    if (checklistPre) ordemServico.checklistPre = checklistPre;
    if (checklistPos) ordemServico.checklistPos = checklistPos;
    
    ordemServico.ultimaAtualizacao = Date.now();
    
    await ordemServico.save();
    
    res.json({
      message: 'Ordem de serviço atualizada com sucesso',
      ordemServico
    });
  } catch (error) {
    console.error('Erro ao atualizar ordem de serviço:', error);
    res.status(500).json({ message: 'Erro ao atualizar ordem de serviço.' });
  }
};

// Iniciar ordem de serviço
exports.startOrdemServico = async (req, res) => {
  try {
    const ordemServico = await OrdemServico.findById(req.params.id);
    if (!ordemServico) {
      return res.status(404).json({ message: 'Ordem de serviço não encontrada.' });
    }
    
    // Verificar se a ordem de serviço já foi iniciada, concluída ou cancelada
    if (ordemServico.status === 'em andamento') {
      return res.status(400).json({ message: 'Ordem de serviço já foi iniciada.' });
    }
    
    if (ordemServico.status === 'concluída') {
      return res.status(400).json({ message: 'Ordem de serviço já foi concluída.' });
    }
    
    if (ordemServico.status === 'cancelada') {
      return res.status(400).json({ message: 'Ordem de serviço cancelada não pode ser iniciada.' });
    }
    
    ordemServico.status = 'em andamento';
    ordemServico.ultimaAtualizacao = Date.now();
    
    await ordemServico.save();
    
    res.json({ message: 'Ordem de serviço iniciada com sucesso.' });
  } catch (error) {
    console.error('Erro ao iniciar ordem de serviço:', error);
    res.status(500).json({ message: 'Erro ao iniciar ordem de serviço.' });
  }
};

// Concluir ordem de serviço
exports.completeOrdemServico = async (req, res) => {
  try {
    const ordemServico = await OrdemServico.findById(req.params.id);
    if (!ordemServico) {
      return res.status(404).json({ message: 'Ordem de serviço não encontrada.' });
    }
    
    // Verificar se a ordem de serviço já foi concluída ou cancelada
    if (ordemServico.status === 'concluída') {
      return res.status(400).json({ message: 'Ordem de serviço já foi concluída.' });
    }
    
    if (ordemServico.status === 'cancelada') {
      return res.status(400).json({ message: 'Ordem de serviço cancelada não pode ser concluída.' });
    }
    
    // Verificar se todos os itens do checklist pós-serviço foram concluídos
    if (ordemServico.checklistPos && ordemServico.checklistPos.length > 0) {
      const pendentes = ordemServico.checklistPos.filter(item => !item.concluido);
      if (pendentes.length > 0) {
        return res.status(400).json({ 
          message: 'Não é possível concluir a ordem de serviço com itens pendentes no checklist pós-serviço.' 
        });
      }
    }
    
    ordemServico.status = 'concluída';
    ordemServico.ultimaAtualizacao = Date.now();
    
    await ordemServico.save();
    
    // Liberar o veículo
    if (ordemServico.veiculoId) {
      await Veiculo.findByIdAndUpdate(ordemServico.veiculoId, { status: 'disponível' });
    }
    
    res.json({ message: 'Ordem de serviço concluída com sucesso.' });
  } catch (error) {
    console.error('Erro ao concluir ordem de serviço:', error);
    res.status(500).json({ message: 'Erro ao concluir ordem de serviço.' });
  }
};

// Cancelar ordem de serviço
exports.cancelOrdemServico = async (req, res) => {
  try {
    const { motivoCancelamento } = req.body;
    
    const ordemServico = await OrdemServico.findById(req.params.id)
      .populate('materiais.materialId');
    
    if (!ordemServico) {
      return res.status(404).json({ message: 'Ordem de serviço não encontrada.' });
    }
    
    // Verificar se a ordem de serviço já foi concluída ou cancelada
    if (ordemServico.status === 'cancelada') {
      return res.status(400).json({ message: 'Ordem de serviço já foi cancelada.' });
    }
    
    if (ordemServico.status === 'concluída') {
      return res.status(400).json({ message: 'Ordem de serviço concluída não pode ser cancelada.' });
    }
    
    ordemServico.status = 'cancelada';
    if (motivoCancelamento) {
      ordemServico.observacoes = ordemServico.observacoes 
        ? `${ordemServico.observacoes}\nMotivo do cancelamento: ${motivoCancelamento}`
        : `Motivo do cancelamento: ${motivoCancelamento}`;
    }
    ordemServico.ultimaAtualizacao = Date.now();
    
    await ordemServico.save();
    
    // Liberar o veículo
    if (ordemServico.veiculoId) {
      await Veiculo.findByIdAndUpdate(ordemServico.veiculoId, { status: 'disponível' });
    }
    
    // Devolver materiais ao estoque
    if (ordemServico.materiais && ordemServico.materiais.length > 0) {
      for (const item of ordemServico.materiais) {
        // Atualizar estoque do material
        await Material.findByIdAndUpdate(item.materialId, {
          $inc: { quantidadeEstoque: item.quantidade }
        });
        
        // Registrar movimentação
        await MovimentacaoEstoque.create({
          materialId: item.materialId._id,
          tipoMovimentacao: 'entrada',
          quantidade: item.quantidade,
          ordemServicoId: ordemServico._id,
          responsavelId: req.userId,
          observacao: `Devolução por cancelamento da OS ${ordemServico.numero}`,
          data: Date.now()
        });
      }
    }
    
    res.json({ message: 'Ordem de serviço cancelada com sucesso.' });
  } catch (error) {
    console.error('Erro ao cancelar ordem de serviço:', error);
    res.status(500).json({ message: 'Erro ao cancelar ordem de serviço.' });
  }
};

// Buscar ordens de serviço por cliente
exports.getOrdensServicoByCliente = async (req, res) => {
  try {
    const { clienteId } = req.params;
    
    // Verificar se o cliente existe
    const cliente = await Cliente.findById(clienteId);
    if (!cliente) {
      return res.status(404).json({ message: 'Cliente não encontrado.' });
    }
    
    const ordensServico = await OrdemServico.find({ clienteId })
      .populate('contratoId')
      .populate('responsavelId', 'nome cargo')
      .sort({ dataAgendamento: -1 });
    
    res.json(ordensServico);
  } catch (error) {
    console.error('Erro ao buscar ordens de serviço do cliente:', error);
    res.status(500).json({ message: 'Erro ao buscar ordens de serviço do cliente.' });
  }
};

// Buscar ordens de serviço por período
exports.getOrdensServicoByPeriodo = async (req, res) => {
  try {
    const { dataInicio, dataFim } = req.query;
    
    if (!dataInicio || !dataFim) {
      return res.status(400).json({ message: 'Data de início e fim são obrigatórias.' });
    }
    
    const ordensServico = await OrdemServico.find({
      dataAgendamento: {
        $gte: new Date(dataInicio),
        $lte: new Date(dataFim)
      }
    })
    .populate('clienteId', 'nome email telefone')
    .populate('responsavelId', 'nome cargo')
    .sort({ dataAgendamento: 1 });
    
    res.json(ordensServico);
  } catch (error) {
    console.error('Erro ao buscar ordens de serviço por período:', error);
    res.status(500).json({ message: 'Erro ao buscar ordens de serviço por período.' });
  }
};

// Buscar ordens de serviço por status
exports.getOrdensServicoByStatus = async (req, res) => {
  try {
    const { status } = req.params;
    
    if (!['agendada', 'em andamento', 'concluída', 'cancelada'].includes(status)) {
      return res.status(400).json({ message: 'Status inválido.' });
    }
    
    const ordensServico = await OrdemServico.find({ status })
      .populate('clienteId', 'nome email telefone')
      .populate('responsavelId', 'nome cargo')
      .sort({ dataAgendamento: -1 });
    
    res.json(ordensServico);
  } catch (error) {
    console.error('Erro ao buscar ordens de serviço por status:', error);
    res.status(500).json({ message: 'Erro ao buscar ordens de serviço por status.' });
  }
};

// Atualizar checklist
exports.updateChecklist = async (req, res) => {
  try {
    const { tipo, checklist } = req.body;
    
    if (!['pre', 'pos'].includes(tipo)) {
      return res.status(400).json({ message: 'Tipo de checklist inválido. Use "pre" ou "pos".' });
    }
    
    const ordemServico = await OrdemServico.findById(req.params.id);
    if (!ordemServico) {
      return res.status(404).json({ message: 'Ordem de serviço não encontrada.' });
    }
    
    // Verificar se a ordem de serviço já foi concluída ou cancelada
    if (ordemServico.status === 'concluída' || ordemServico.status === 'cancelada') {
      return res.status(400).json({ 
        message: `Não é possível atualizar o checklist de uma ordem de serviço que já foi ${ordemServico.status}.` 
      });
    }
    
    if (tipo === 'pre') {
      ordemServico.checklistPre = checklist;
    } else {
      ordemServico.checklistPos = checklist;
    }
    
    ordemServico.ultimaAtualizacao = Date.now();
    
    await ordemServico.save();
    
    res.json({
      message: `Checklist ${tipo === 'pre' ? 'pré-serviço' : 'pós-serviço'} atualizado com sucesso`,
      ordemServico
    });
  } catch (error) {
    console.error('Erro ao atualizar checklist:', error);
    res.status(500).json({ message: 'Erro ao atualizar checklist.' });
  }
};
