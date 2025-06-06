const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const auth = require('../middleware/auth.middleware');

// Modelos
const Bonificacao = require('../models/bonificacao.model');
const ConfiguracaoBonificacao = require('../models/configuracaoBonificacao.model');
const OrdemServico = require('../models/ordemServico.model');
const Usuario = require('../models/user.model');
const Cliente = require('../models/cliente.model');

// Obter todas as bonificações
router.get('/', auth, async (req, res) => {
  try {
    const bonificacoes = await Bonificacao.find()
      .populate('funcionarioId', 'nome email')
      .populate('ordemServicoId', 'numero dataAgendamento')
      .populate('clienteId', 'nome email');
    
    return res.status(200).json(bonificacoes);
  } catch (error) {
    console.error('Erro ao obter bonificações:', error);
    return res.status(500).json({ message: 'Erro ao obter bonificações' });
  }
});

// Obter bonificações por funcionário
router.get('/funcionario/:id', auth, async (req, res) => {
  try {
    const bonificacoes = await Bonificacao.find({ funcionarioId: req.params.id })
      .populate('funcionarioId', 'nome email')
      .populate('ordemServicoId', 'numero dataAgendamento')
      .populate('clienteId', 'nome email');
    
    return res.status(200).json(bonificacoes);
  } catch (error) {
    console.error('Erro ao obter bonificações do funcionário:', error);
    return res.status(500).json({ message: 'Erro ao obter bonificações do funcionário' });
  }
});

// Obter bonificações por ordem de serviço
router.get('/ordem-servico/:id', auth, async (req, res) => {
  try {
    const bonificacoes = await Bonificacao.find({ ordemServicoId: req.params.id })
      .populate('funcionarioId', 'nome email')
      .populate('ordemServicoId', 'numero dataAgendamento')
      .populate('clienteId', 'nome email');
    
    return res.status(200).json(bonificacoes);
  } catch (error) {
    console.error('Erro ao obter bonificações da ordem de serviço:', error);
    return res.status(500).json({ message: 'Erro ao obter bonificações da ordem de serviço' });
  }
});

// Registrar nova avaliação e bonificação
router.post('/', auth, async (req, res) => {
  const { 
    funcionarioId, 
    ordemServicoId, 
    clienteId, 
    tipoAvaliacao, 
    pontuacao, 
    comentario 
  } = req.body;
  
  if (!funcionarioId || !ordemServicoId || !clienteId || !tipoAvaliacao || !pontuacao) {
    return res.status(400).json({ message: 'Todos os campos obrigatórios devem ser fornecidos' });
  }
  
  try {
    // Verificar se a ordem de serviço existe
    const ordemServico = await OrdemServico.findById(ordemServicoId);
    if (!ordemServico) {
      return res.status(404).json({ message: 'Ordem de serviço não encontrada' });
    }
    
    // Verificar se o funcionário existe
    const funcionario = await Usuario.findById(funcionarioId);
    if (!funcionario) {
      return res.status(404).json({ message: 'Funcionário não encontrado' });
    }
    
    // Verificar se o cliente existe
    const cliente = await Cliente.findById(clienteId);
    if (!cliente) {
      return res.status(404).json({ message: 'Cliente não encontrado' });
    }
    
    // Obter configurações de bonificação
    let config = await ConfiguracaoBonificacao.findOne();
    if (!config) {
      // Criar configuração padrão se não existir
      config = new ConfiguracaoBonificacao();
      await config.save();
    }
    
    // Calcular valor da bonificação
    let valorBonificacao = pontuacao * config.valorPorEstrela;
    
    // Adicionar bônus para avaliação 5 estrelas
    if (pontuacao === 5) {
      valorBonificacao += config.bonusAvaliacao5Estrelas;
    }
    
    // Criar nova bonificação
    const novaBonificacao = new Bonificacao({
      funcionarioId,
      ordemServicoId,
      clienteId,
      tipoAvaliacao,
      pontuacao,
      comentario,
      valorBonificacao
    });
    
    await novaBonificacao.save();
    
    // Verificar se toda a equipe da ordem de serviço recebeu avaliação positiva
    // e adicionar bônus de equipe se aplicável
    if (pontuacao >= config.pontuacaoMinimaBonus) {
      const equipe = ordemServico.equipe.map(membro => membro.funcionarioId.toString());
      
      // Verificar se todos os membros da equipe já receberam avaliação para esta ordem
      const avaliacoesEquipe = await Bonificacao.find({ 
        ordemServicoId, 
        funcionarioId: { $in: equipe },
        pontuacao: { $gte: config.pontuacaoMinimaBonus }
      });
      
      const funcionariosAvaliados = new Set(avaliacoesEquipe.map(av => av.funcionarioId.toString()));
      
      // Se todos os membros da equipe receberam avaliação positiva, adicionar bônus
      if (equipe.length > 0 && equipe.every(id => funcionariosAvaliados.has(id))) {
        // Adicionar bônus para cada membro da equipe
        for (const membroId of equipe) {
          await Bonificacao.create({
            funcionarioId: membroId,
            ordemServicoId,
            clienteId,
            tipoAvaliacao: 'sistema',
            pontuacao: 5,
            comentario: 'Bônus por desempenho de equipe completa',
            valorBonificacao: config.bonusEquipeCompleta / equipe.length
          });
        }
      }
    }
    
    return res.status(201).json({ 
      message: 'Avaliação registrada com sucesso', 
      bonificacao: novaBonificacao 
    });
  } catch (error) {
    console.error('Erro ao registrar avaliação:', error);
    return res.status(500).json({ message: 'Erro ao registrar avaliação' });
  }
});

// Marcar bonificação como paga
router.patch('/:id/pagar', auth, async (req, res) => {
  try {
    const bonificacao = await Bonificacao.findById(req.params.id);
    
    if (!bonificacao) {
      return res.status(404).json({ message: 'Bonificação não encontrada' });
    }
    
    bonificacao.pago = true;
    bonificacao.dataPagamento = new Date();
    await bonificacao.save();
    
    return res.status(200).json({ 
      message: 'Bonificação marcada como paga', 
      bonificacao 
    });
  } catch (error) {
    console.error('Erro ao marcar bonificação como paga:', error);
    return res.status(500).json({ message: 'Erro ao marcar bonificação como paga' });
  }
});

// Obter configurações de bonificação
router.get('/configuracoes', auth, async (req, res) => {
  try {
    let config = await ConfiguracaoBonificacao.findOne();
    
    if (!config) {
      // Criar configuração padrão se não existir
      config = new ConfiguracaoBonificacao();
      await config.save();
    }
    
    return res.status(200).json(config);
  } catch (error) {
    console.error('Erro ao obter configurações de bonificação:', error);
    return res.status(500).json({ message: 'Erro ao obter configurações de bonificação' });
  }
});

// Atualizar configurações de bonificação
router.put('/configuracoes', auth, async (req, res) => {
  try {
    let config = await ConfiguracaoBonificacao.findOne();
    
    if (!config) {
      // Criar configuração se não existir
      config = new ConfiguracaoBonificacao();
    }
    
    // Atualizar campos
    const campos = [
      'valorPorEstrela',
      'bonusEquipeCompleta',
      'pontuacaoMinimaBonus',
      'bonusAvaliacao5Estrelas',
      'metaMensalAvaliacoes',
      'bonusMetaMensal',
      'ativoGoogle',
      'ativoWhatsApp',
      'ativoSistema',
      'mensagemSolicitacaoAvaliacao',
      'mensagemAgradecimento'
    ];
    
    campos.forEach(campo => {
      if (req.body[campo] !== undefined) {
        config[campo] = req.body[campo];
      }
    });
    
    config.ultimaAtualizacao = new Date();
    await config.save();
    
    return res.status(200).json({ 
      message: 'Configurações atualizadas com sucesso', 
      config 
    });
  } catch (error) {
    console.error('Erro ao atualizar configurações de bonificação:', error);
    return res.status(500).json({ message: 'Erro ao atualizar configurações de bonificação' });
  }
});

// Obter resumo de bonificações por período
router.get('/resumo', auth, async (req, res) => {
  const { inicio, fim } = req.query;
  
  try {
    const filtro = {};
    
    if (inicio || fim) {
      filtro.createdAt = {};
      if (inicio) filtro.createdAt.$gte = new Date(inicio);
      if (fim) filtro.createdAt.$lte = new Date(fim);
    }
    
    // Obter todas as bonificações do período
    const bonificacoes = await Bonificacao.find(filtro);
    
    // Calcular totais
    const totalBonificacoes = bonificacoes.length;
    const totalValor = bonificacoes.reduce((sum, b) => sum + b.valorBonificacao, 0);
    const totalPago = bonificacoes.filter(b => b.pago).reduce((sum, b) => sum + b.valorBonificacao, 0);
    const totalPendente = totalValor - totalPago;
    
    // Agrupar por funcionário
    const porFuncionario = {};
    for (const b of bonificacoes) {
      const id = b.funcionarioId.toString();
      if (!porFuncionario[id]) {
        porFuncionario[id] = {
          funcionarioId: id,
          total: 0,
          pago: 0,
          pendente: 0,
          quantidade: 0
        };
      }
      
      porFuncionario[id].total += b.valorBonificacao;
      if (b.pago) {
        porFuncionario[id].pago += b.valorBonificacao;
      } else {
        porFuncionario[id].pendente += b.valorBonificacao;
      }
      porFuncionario[id].quantidade += 1;
    }
    
    // Agrupar por tipo de avaliação
    const porTipo = {
      google: { quantidade: 0, valor: 0 },
      whatsapp: { quantidade: 0, valor: 0 },
      sistema: { quantidade: 0, valor: 0 }
    };
    
    for (const b of bonificacoes) {
      porTipo[b.tipoAvaliacao].quantidade += 1;
      porTipo[b.tipoAvaliacao].valor += b.valorBonificacao;
    }
    
    // Obter detalhes dos funcionários
    const funcionariosIds = Object.keys(porFuncionario);
    const funcionarios = await Usuario.find(
      { _id: { $in: funcionariosIds } },
      { nome: 1, email: 1 }
    );
    
    // Adicionar detalhes dos funcionários ao resumo
    const resumoPorFuncionario = funcionariosIds.map(id => {
      const funcionario = funcionarios.find(f => f._id.toString() === id);
      return {
        ...porFuncionario[id],
        nome: funcionario ? funcionario.nome : 'Desconhecido',
        email: funcionario ? funcionario.email : ''
      };
    });
    
    return res.status(200).json({
      periodo: {
        inicio: inicio ? new Date(inicio) : null,
        fim: fim ? new Date(fim) : null
      },
      totais: {
        bonificacoes: totalBonificacoes,
        valor: totalValor,
        pago: totalPago,
        pendente: totalPendente
      },
      porFuncionario: resumoPorFuncionario,
      porTipoAvaliacao: porTipo
    });
  } catch (error) {
    console.error('Erro ao obter resumo de bonificações:', error);
    return res.status(500).json({ message: 'Erro ao obter resumo de bonificações' });
  }
});

// Webhook para receber avaliações do Google
router.post('/webhook/google', async (req, res) => {
  try {
    // Implementação do webhook para Google My Business
    // Esta é uma implementação simplificada, na prática seria necessário
    // verificar a autenticidade da requisição e processar os dados conforme
    // a estrutura específica da API do Google
    
    const { 
      review_id,
      rating,
      comment,
      reviewer,
      business_id,
      order_reference
    } = req.body;
    
    // Verificar se temos uma referência para a ordem de serviço
    if (!order_reference) {
      return res.status(400).json({ message: 'Referência de ordem de serviço não fornecida' });
    }
    
    // Buscar a ordem de serviço pelo número de referência
    const ordemServico = await OrdemServico.findOne({ numero: order_reference });
    
    if (!ordemServico) {
      return res.status(404).json({ message: 'Ordem de serviço não encontrada' });
    }
    
    // Verificar se a avaliação já foi registrada
    const avaliacaoExistente = await Bonificacao.findOne({ 
      'metadados.review_id': review_id,
      tipoAvaliacao: 'google'
    });
    
    if (avaliacaoExistente) {
      return res.status(200).json({ message: 'Avaliação já registrada anteriormente' });
    }
    
    // Registrar bonificação para cada membro da equipe
    const equipe = ordemServico.equipe;
    const clienteId = ordemServico.clienteId;
    
    // Obter configurações
    const config = await ConfiguracaoBonificacao.findOne();
    
    if (!config || !config.ativoGoogle) {
      return res.status(200).json({ message: 'Bonificações para Google desativadas' });
    }
    
    // Calcular valor da bonificação
    const valorPorPessoa = (rating * config.valorPorEstrela) / equipe.length;
    
    // Registrar bonificação para cada membro da equipe
    const bonificacoes = [];
    
    for (const membro of equipe) {
      const bonificacao = new Bonificacao({
        funcionarioId: membro.funcionarioId,
        ordemServicoId: ordemServico._id,
        clienteId,
        tipoAvaliacao: 'google',
        pontuacao: rating,
        comentario: comment || '',
        valorBonificacao: valorPorPessoa,
        metadados: {
          review_id,
          reviewer,
          business_id
        }
      });
      
      await bonificacao.save();
      bonificacoes.push(bonificacao);
    }
    
    // Adicionar bônus para avaliação 5 estrelas
    if (rating === 5 && config.bonusAvaliacao5Estrelas > 0) {
      const bonusPorPessoa = config.bonusAvaliacao5Estrelas / equipe.length;
      
      for (const membro of equipe) {
        const bonificacaoBonus = new Bonificacao({
          funcionarioId: membro.funcionarioId,
          ordemServicoId: ordemServico._id,
          clienteId,
          tipoAvaliacao: 'sistema',
          pontuacao: 5,
          comentario: 'Bônus por avaliação 5 estrelas no Google',
          valorBonificacao: bonusPorPessoa
        });
        
        await bonificacaoBonus.save();
      }
    }
    
    return res.status(201).json({ 
      message: 'Avaliação do Google registrada com sucesso',
      bonificacoes
    });
  } catch (error) {
    console.error('Erro ao processar webhook do Google:', error);
    return res.status(500).json({ message: 'Erro ao processar avaliação do Google' });
  }
});

// Webhook para receber avaliações do WhatsApp
router.post('/webhook/whatsapp', async (req, res) => {
  try {
    // Implementação do webhook para WhatsApp Business API
    // Esta é uma implementação simplificada, na prática seria necessário
    // verificar a autenticidade da requisição e processar os dados conforme
    // a estrutura específica da API do WhatsApp
    
    const { 
      phone_number,
      message,
      timestamp,
      order_reference
    } = req.body;
    
    // Extrair a avaliação da mensagem (assumindo formato simples como "5" ou "4 estrelas")
    const ratingMatch = message.match(/^(\d+)(\s+estrelas?)?$/i);
    if (!ratingMatch) {
      return res.status(400).json({ message: 'Formato de avaliação inválido' });
    }
    
    const rating = parseInt(ratingMatch[1], 10);
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Avaliação deve ser entre 1 e 5' });
    }
    
    // Verificar se temos uma referência para a ordem de serviço
    if (!order_reference) {
      return res.status(400).json({ message: 'Referência de ordem de serviço não fornecida' });
    }
    
    // Buscar a ordem de serviço pelo número de referência
    const ordemServico = await OrdemServico.findOne({ numero: order_reference });
    
    if (!ordemServico) {
      return res.status(404).json({ message: 'Ordem de serviço não encontrada' });
    }
    
    // Verificar se o cliente corresponde ao número de telefone
    const cliente = await Cliente.findById(ordemServico.clienteId);
    
    if (!cliente) {
      return res.status(404).json({ message: 'Cliente não encontrado' });
    }
    
    // Verificar se a avaliação já foi registrada
    const avaliacaoExistente = await Bonificacao.findOne({ 
      'metadados.phone_number': phone_number,
      'metadados.timestamp': timestamp,
      tipoAvaliacao: 'whatsapp'
    });
    
    if (avaliacaoExistente) {
      return res.status(200).json({ message: 'Avaliação já registrada anteriormente' });
    }
    
    // Obter configurações
    const config = await ConfiguracaoBonificacao.findOne();
    
    if (!config || !config.ativoWhatsApp) {
      return res.status(200).json({ message: 'Bonificações para WhatsApp desativadas' });
    }
    
    // Registrar bonificação para cada membro da equipe
    const equipe = ordemServico.equipe;
    
    // Calcular valor da bonificação
    const valorPorPessoa = (rating * config.valorPorEstrela) / equipe.length;
    
    // Registrar bonificação para cada membro da equipe
    const bonificacoes = [];
    
    for (const membro of equipe) {
      const bonificacao = new Bonificacao({
        funcionarioId: membro.funcionarioId,
        ordemServicoId: ordemServico._id,
        clienteId: ordemServico.clienteId,
        tipoAvaliacao: 'whatsapp',
        pontuacao: rating,
        comentario: message,
        valorBonificacao: valorPorPessoa,
        metadados: {
          phone_number,
          timestamp
        }
      });
      
      await bonificacao.save();
      bonificacoes.push(bonificacao);
    }
    
    // Adicionar bônus para avaliação 5 estrelas
    if (rating === 5 && config.bonusAvaliacao5Estrelas > 0) {
      const bonusPorPessoa = config.bonusAvaliacao5Estrelas / equipe.length;
      
      for (const membro of equipe) {
        const bonificacaoBonus = new Bonificacao({
          funcionarioId: membro.funcionarioId,
          ordemServicoId: ordemServico._id,
          clienteId: ordemServico.clienteId,
          tipoAvaliacao: 'sistema',
          pontuacao: 5,
          comentario: 'Bônus por avaliação 5 estrelas no WhatsApp',
          valorBonificacao: bonusPorPessoa
        });
        
        await bonificacaoBonus.save();
      }
    }
    
    // Enviar mensagem de agradecimento
    // Na implementação real, aqui seria chamada a API do WhatsApp para enviar a mensagem
    console.log(`Enviando agradecimento para ${phone_number}: ${config.mensagemAgradecimento}`);
    
    return res.status(201).json({ 
      message: 'Avaliação do WhatsApp registrada com sucesso',
      bonificacoes,
      mensagemAgradecimento: config.mensagemAgradecimento
    });
  } catch (error) {
    console.error('Erro ao processar webhook do WhatsApp:', error);
    return res.status(500).json({ message: 'Erro ao processar avaliação do WhatsApp' });
  }
});

// Enviar solicitação de avaliação via WhatsApp
router.post('/solicitar-avaliacao/:ordemId', auth, async (req, res) => {
  try {
    const ordemServico = await OrdemServico.findById(req.params.ordemId)
      .populate('clienteId');
    
    if (!ordemServico) {
      return res.status(404).json({ message: 'Ordem de serviço não encontrada' });
    }
    
    // Verificar se a ordem está concluída
    if (ordemServico.status !== 'concluída') {
      return res.status(400).json({ 
        message: 'Só é possível solicitar avaliação para ordens de serviço concluídas' 
      });
    }
    
    // Obter configurações
    const config = await ConfiguracaoBonificacao.findOne();
    
    if (!config) {
      return res.status(500).json({ message: 'Configurações de bonificação não encontradas' });
    }
    
    const cliente = ordemServico.clienteId;
    
    if (!cliente || !cliente.telefone) {
      return res.status(400).json({ message: 'Cliente não possui telefone cadastrado' });
    }
    
    // Montar mensagem
    const mensagem = `${config.mensagemSolicitacaoAvaliacao}\n\nReferência: ${ordemServico.numero}`;
    
    // Na implementação real, aqui seria chamada a API do WhatsApp para enviar a mensagem
    console.log(`Enviando solicitação para ${cliente.telefone}: ${mensagem}`);
    
    // Registrar que a solicitação foi enviada
    ordemServico.avaliacaoSolicitada = true;
    ordemServico.dataAvaliacaoSolicitada = new Date();
    await ordemServico.save();
    
    return res.status(200).json({ 
      message: 'Solicitação de avaliação enviada com sucesso',
      telefone: cliente.telefone,
      mensagem
    });
  } catch (error) {
    console.error('Erro ao enviar solicitação de avaliação:', error);
    return res.status(500).json({ message: 'Erro ao enviar solicitação de avaliação' });
  }
});

module.exports = router;
