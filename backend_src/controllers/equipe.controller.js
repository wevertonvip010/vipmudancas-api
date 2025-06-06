const User = require('../models/user.model');
const OrdemServico = require('../models/ordemServico.model');

// Listar funcionários por função
exports.getFuncionariosByFuncao = async (req, res) => {
  try {
    const { funcao } = req.params;
    
    const funcionarios = await User.find({
      cargo: { $regex: funcao, $options: 'i' },
      ativo: true
    }).select('-senha');
    
    res.json(funcionarios);
  } catch (error) {
    console.error('Erro ao listar funcionários por função:', error);
    res.status(500).json({ message: 'Erro ao listar funcionários por função.' });
  }
};

// Obter disponibilidade de funcionários
exports.getFuncionariosDisponibilidade = async (req, res) => {
  try {
    const { data } = req.query;
    
    if (!data) {
      return res.status(400).json({ message: 'Data é obrigatória.' });
    }
    
    // Buscar todos os funcionários ativos
    const funcionarios = await User.find({ 
      ativo: true,
      perfil: { $in: ['operacional', 'vendedor'] }
    }).select('-senha');
    
    // Buscar ordens de serviço para a data especificada
    const dataInicio = new Date(data);
    dataInicio.setHours(0, 0, 0, 0);
    
    const dataFim = new Date(data);
    dataFim.setHours(23, 59, 59, 999);
    
    const ordensServico = await OrdemServico.find({
      dataAgendamento: {
        $gte: dataInicio,
        $lte: dataFim
      },
      status: { $in: ['agendada', 'em andamento'] }
    }).populate('equipe.funcionarioId', 'nome');
    
    // Mapear disponibilidade
    const disponibilidade = funcionarios.map(funcionario => {
      const ordens = ordensServico.filter(os => 
        os.equipe.some(membro => membro.funcionarioId._id.toString() === funcionario._id.toString())
      );
      
      return {
        funcionario: {
          _id: funcionario._id,
          nome: funcionario.nome,
          cargo: funcionario.cargo,
          perfil: funcionario.perfil
        },
        disponivel: ordens.length === 0,
        ordensServico: ordens.map(os => ({
          _id: os._id,
          numero: os.numero,
          horarioInicio: os.horarioInicio,
          horarioFim: os.horarioFim,
          status: os.status
        }))
      };
    });
    
    res.json(disponibilidade);
  } catch (error) {
    console.error('Erro ao verificar disponibilidade de funcionários:', error);
    res.status(500).json({ message: 'Erro ao verificar disponibilidade de funcionários.' });
  }
};

// Obter carga de trabalho dos funcionários
exports.getFuncionariosCargaTrabalho = async (req, res) => {
  try {
    const { dataInicio, dataFim } = req.query;
    
    if (!dataInicio || !dataFim) {
      return res.status(400).json({ message: 'Data de início e fim são obrigatórias.' });
    }
    
    // Buscar todos os funcionários ativos
    const funcionarios = await User.find({ 
      ativo: true,
      perfil: { $in: ['operacional', 'vendedor'] }
    }).select('-senha');
    
    // Buscar ordens de serviço para o período especificado
    const periodoInicio = new Date(dataInicio);
    periodoInicio.setHours(0, 0, 0, 0);
    
    const periodoFim = new Date(dataFim);
    periodoFim.setHours(23, 59, 59, 999);
    
    const ordensServico = await OrdemServico.find({
      dataAgendamento: {
        $gte: periodoInicio,
        $lte: periodoFim
      }
    }).populate('equipe.funcionarioId', 'nome');
    
    // Calcular carga de trabalho
    const cargaTrabalho = funcionarios.map(funcionario => {
      const ordens = ordensServico.filter(os => 
        os.equipe.some(membro => membro.funcionarioId._id.toString() === funcionario._id.toString())
      );
      
      const ordensAgendadas = ordens.filter(os => os.status === 'agendada').length;
      const ordensEmAndamento = ordens.filter(os => os.status === 'em andamento').length;
      const ordensConcluidas = ordens.filter(os => os.status === 'concluída').length;
      const ordensCanceladas = ordens.filter(os => os.status === 'cancelada').length;
      
      return {
        funcionario: {
          _id: funcionario._id,
          nome: funcionario.nome,
          cargo: funcionario.cargo,
          perfil: funcionario.perfil
        },
        totalOrdens: ordens.length,
        ordensAgendadas,
        ordensEmAndamento,
        ordensConcluidas,
        ordensCanceladas,
        detalhes: ordens.map(os => ({
          _id: os._id,
          numero: os.numero,
          dataAgendamento: os.dataAgendamento,
          status: os.status
        }))
      };
    });
    
    res.json(cargaTrabalho);
  } catch (error) {
    console.error('Erro ao calcular carga de trabalho dos funcionários:', error);
    res.status(500).json({ message: 'Erro ao calcular carga de trabalho dos funcionários.' });
  }
};

// Obter desempenho dos funcionários
exports.getFuncionariosDesempenho = async (req, res) => {
  try {
    const { dataInicio, dataFim } = req.query;
    
    if (!dataInicio || !dataFim) {
      return res.status(400).json({ message: 'Data de início e fim são obrigatórias.' });
    }
    
    // Buscar todos os funcionários ativos
    const funcionarios = await User.find({ 
      ativo: true,
      perfil: { $in: ['operacional', 'vendedor'] }
    }).select('-senha');
    
    // Buscar ordens de serviço para o período especificado
    const periodoInicio = new Date(dataInicio);
    periodoInicio.setHours(0, 0, 0, 0);
    
    const periodoFim = new Date(dataFim);
    periodoFim.setHours(23, 59, 59, 999);
    
    const ordensServico = await OrdemServico.find({
      dataAgendamento: {
        $gte: periodoInicio,
        $lte: periodoFim
      },
      status: 'concluída'
    }).populate('equipe.funcionarioId', 'nome');
    
    // Calcular desempenho
    const desempenho = funcionarios.map(funcionario => {
      const ordens = ordensServico.filter(os => 
        os.equipe.some(membro => membro.funcionarioId._id.toString() === funcionario._id.toString())
      );
      
      // Calcular tempo médio de conclusão (em horas)
      let tempoTotalHoras = 0;
      let ordensComTempo = 0;
      
      ordens.forEach(os => {
        if (os.status === 'concluída' && os.ultimaAtualizacao && os.dataAgendamento) {
          const tempoEmMilissegundos = new Date(os.ultimaAtualizacao) - new Date(os.dataAgendamento);
          const tempoEmHoras = tempoEmMilissegundos / (1000 * 60 * 60);
          tempoTotalHoras += tempoEmHoras;
          ordensComTempo++;
        }
      });
      
      const tempoMedioConclusao = ordensComTempo > 0 ? (tempoTotalHoras / ordensComTempo).toFixed(2) : 0;
      
      return {
        funcionario: {
          _id: funcionario._id,
          nome: funcionario.nome,
          cargo: funcionario.cargo,
          perfil: funcionario.perfil
        },
        ordensConcluidas: ordens.length,
        tempoMedioConclusao: parseFloat(tempoMedioConclusao),
        detalhes: ordens.map(os => ({
          _id: os._id,
          numero: os.numero,
          dataAgendamento: os.dataAgendamento,
          dataConclusao: os.ultimaAtualizacao
        }))
      };
    });
    
    // Ordenar por número de ordens concluídas (decrescente)
    desempenho.sort((a, b) => b.ordensConcluidas - a.ordensConcluidas);
    
    res.json(desempenho);
  } catch (error) {
    console.error('Erro ao calcular desempenho dos funcionários:', error);
    res.status(500).json({ message: 'Erro ao calcular desempenho dos funcionários.' });
  }
};

// Atribuir funcionário a uma ordem de serviço
exports.atribuirFuncionarioOrdemServico = async (req, res) => {
  try {
    const { ordemServicoId, funcionarioId, funcao } = req.body;
    
    if (!ordemServicoId || !funcionarioId || !funcao) {
      return res.status(400).json({ message: 'ID da ordem de serviço, ID do funcionário e função são obrigatórios.' });
    }
    
    // Verificar se a ordem de serviço existe
    const ordemServico = await OrdemServico.findById(ordemServicoId);
    if (!ordemServico) {
      return res.status(404).json({ message: 'Ordem de serviço não encontrada.' });
    }
    
    // Verificar se a ordem de serviço já foi concluída ou cancelada
    if (ordemServico.status === 'concluída' || ordemServico.status === 'cancelada') {
      return res.status(400).json({ 
        message: `Não é possível atribuir funcionário a uma ordem de serviço que já foi ${ordemServico.status}.` 
      });
    }
    
    // Verificar se o funcionário existe
    const funcionario = await User.findById(funcionarioId);
    if (!funcionario) {
      return res.status(404).json({ message: 'Funcionário não encontrado.' });
    }
    
    // Verificar se o funcionário já está atribuído a esta ordem de serviço
    const jaAtribuido = ordemServico.equipe.some(membro => 
      membro.funcionarioId.toString() === funcionarioId
    );
    
    if (jaAtribuido) {
      return res.status(400).json({ message: 'Funcionário já está atribuído a esta ordem de serviço.' });
    }
    
    // Adicionar funcionário à equipe
    ordemServico.equipe.push({
      funcionarioId,
      funcao
    });
    
    ordemServico.ultimaAtualizacao = Date.now();
    
    await ordemServico.save();
    
    res.json({
      message: 'Funcionário atribuído com sucesso à ordem de serviço',
      ordemServico
    });
  } catch (error) {
    console.error('Erro ao atribuir funcionário à ordem de serviço:', error);
    res.status(500).json({ message: 'Erro ao atribuir funcionário à ordem de serviço.' });
  }
};

// Remover funcionário de uma ordem de serviço
exports.removerFuncionarioOrdemServico = async (req, res) => {
  try {
    const { ordemServicoId, funcionarioId } = req.body;
    
    if (!ordemServicoId || !funcionarioId) {
      return res.status(400).json({ message: 'ID da ordem de serviço e ID do funcionário são obrigatórios.' });
    }
    
    // Verificar se a ordem de serviço existe
    const ordemServico = await OrdemServico.findById(ordemServicoId);
    if (!ordemServico) {
      return res.status(404).json({ message: 'Ordem de serviço não encontrada.' });
    }
    
    // Verificar se a ordem de serviço já foi concluída ou cancelada
    if (ordemServico.status === 'concluída' || ordemServico.status === 'cancelada') {
      return res.status(400).json({ 
        message: `Não é possível remover funcionário de uma ordem de serviço que já foi ${ordemServico.status}.` 
      });
    }
    
    // Verificar se o funcionário está atribuído a esta ordem de serviço
    const membroIndex = ordemServico.equipe.findIndex(membro => 
      membro.funcionarioId.toString() === funcionarioId
    );
    
    if (membroIndex === -1) {
      return res.status(400).json({ message: 'Funcionário não está atribuído a esta ordem de serviço.' });
    }
    
    // Remover funcionário da equipe
    ordemServico.equipe.splice(membroIndex, 1);
    
    ordemServico.ultimaAtualizacao = Date.now();
    
    await ordemServico.save();
    
    res.json({
      message: 'Funcionário removido com sucesso da ordem de serviço',
      ordemServico
    });
  } catch (error) {
    console.error('Erro ao remover funcionário da ordem de serviço:', error);
    res.status(500).json({ message: 'Erro ao remover funcionário da ordem de serviço.' });
  }
};
