const express = require('express');
const router = express.Router();
const CoraService = require('../services/cora.service');
const Boleto = require('../models/boleto.model');
const ContratoStorage = require('../models/contratoStorage.model');
const Financeiro = require('../models/financeiro.model');
const NotificacaoService = require('../services/notificacao.service');

// Webhook para receber notificações de pagamento do Cora
router.post('/webhook', async (req, res) => {
  try {
    // Verificar assinatura do webhook (implementação de segurança)
    // Esta é uma implementação simplificada, em produção deve-se verificar a assinatura
    // do webhook usando o header X-Cora-Signature e o secret compartilhado
    
    const { event, data } = req.body;
    
    if (!event || !data) {
      return res.status(400).json({ message: 'Payload inválido' });
    }
    
    console.log(`Webhook Cora recebido: ${event}`, data);
    
    // Processar diferentes tipos de eventos
    switch (event) {
      case 'invoice.paid':
        await processarPagamentoBoleto(data);
        break;
      
      case 'invoice.overdue':
        await processarBoletoVencido(data);
        break;
      
      case 'invoice.canceled':
        await processarBoletoCancelado(data);
        break;
      
      default:
        console.log(`Evento não processado: ${event}`);
    }
    
    // Responder com sucesso para o Cora
    res.status(200).json({ status: 'success', message: 'Webhook processado com sucesso' });
  } catch (error) {
    console.error('Erro ao processar webhook do Cora:', error);
    // Sempre responder com 200 para o Cora, mesmo em caso de erro
    // para evitar que o Cora continue tentando reenviar o webhook
    res.status(200).json({ status: 'error', message: error.message });
  }
});

// Processar pagamento de boleto
async function processarPagamentoBoleto(data) {
  try {
    const coraId = data.id;
    
    // Buscar boleto pelo ID do Cora
    const boleto = await Boleto.findOne({ coraId });
    if (!boleto) {
      throw new Error(`Boleto com Cora ID ${coraId} não encontrado`);
    }
    
    // Verificar se o boleto já está marcado como pago
    if (boleto.status === 'pago') {
      console.log(`Boleto ${boleto._id} já está marcado como pago`);
      return;
    }
    
    // Atualizar status do boleto
    boleto.status = 'pago';
    boleto.dataPagamento = new Date(data.payment_date);
    boleto.metadados = { ...boleto.metadados, pagamento: data };
    await boleto.save();
    
    // Buscar contrato de storage associado
    const contratoStorage = await ContratoStorage.findById(boleto.contratoStorage);
    if (!contratoStorage) {
      throw new Error(`Contrato de Storage ${boleto.contratoStorage} não encontrado`);
    }
    
    // Se o contrato estava inadimplente, atualizar para ativo
    if (contratoStorage.status === 'inadimplente') {
      contratoStorage.status = 'ativo';
      await contratoStorage.save();
    }
    
    // Registrar pagamento no histórico do contrato
    contratoStorage.historicoPagamentos.push({
      dataPagamento: new Date(data.payment_date),
      valor: boleto.valor,
      referencia: boleto.referencia,
      status: 'pago'
    });
    await contratoStorage.save();
    
    // Verificar se já existe um registro financeiro para este boleto
    const registroExistente = await Financeiro.findOne({ boletoId: boleto._id });
    if (!registroExistente) {
      // Criar registro financeiro
      const financeiro = new Financeiro({
        tipo: 'receita',
        negocio: 'storage',
        categoria: 'Aluguel de Box',
        descricao: `Pagamento de aluguel - ${boleto.referencia}`,
        valor: boleto.valor,
        dataVencimento: boleto.dataVencimento,
        dataPagamento: new Date(data.payment_date),
        formaPagamento: 'boleto',
        status: 'pago',
        contratoStorageId: boleto.contratoStorage,
        boletoId: boleto._id,
        observacoes: `Pagamento via Cora - ID: ${coraId}`
      });
      
      await financeiro.save();
      console.log(`Registro financeiro criado: ${financeiro._id}`);
    } else {
      // Atualizar registro existente
      registroExistente.status = 'pago';
      registroExistente.dataPagamento = new Date(data.payment_date);
      registroExistente.observacoes = `${registroExistente.observacoes || ''}\nPagamento confirmado via webhook Cora - ID: ${coraId}`;
      await registroExistente.save();
      console.log(`Registro financeiro atualizado: ${registroExistente._id}`);
    }
    
    console.log(`Pagamento do boleto ${boleto._id} processado com sucesso`);
  } catch (error) {
    console.error('Erro ao processar pagamento de boleto:', error);
    throw error;
  }
}

// Processar boleto vencido
async function processarBoletoVencido(data) {
  try {
    const coraId = data.id;
    
    // Buscar boleto pelo ID do Cora
    const boleto = await Boleto.findOne({ coraId });
    if (!boleto) {
      throw new Error(`Boleto com Cora ID ${coraId} não encontrado`);
    }
    
    // Verificar se o boleto já está marcado como vencido
    if (boleto.status === 'vencido') {
      console.log(`Boleto ${boleto._id} já está marcado como vencido`);
      return;
    }
    
    // Atualizar status do boleto
    boleto.status = 'vencido';
    boleto.metadados = { ...boleto.metadados, vencimento: data };
    await boleto.save();
    
    // Buscar contrato de storage associado
    const contratoStorage = await ContratoStorage.findById(boleto.contratoStorage).populate('cliente');
    if (!contratoStorage) {
      throw new Error(`Contrato de Storage ${boleto.contratoStorage} não encontrado`);
    }
    
    // Verificar se o atraso é superior a 5 dias
    const hoje = new Date();
    const dataVencimento = new Date(boleto.dataVencimento);
    const diasAtraso = Math.floor((hoje - dataVencimento) / (1000 * 60 * 60 * 24));
    
    // Se o atraso for superior a 5 dias, marcar contrato como inadimplente
    if (diasAtraso > 5 && contratoStorage.status === 'ativo') {
      contratoStorage.status = 'inadimplente';
      await contratoStorage.save();
    }
    
    // Enviar notificação de atraso ao cliente
    if (contratoStorage.cliente && contratoStorage.cliente.email) {
      // Usar o serviço de notificação para enviar alerta de atraso
      await NotificacaoService.enviarEmail(
        contratoStorage.cliente.email,
        `Pagamento em Atraso - ${diasAtraso} dias`,
        `Olá ${contratoStorage.cliente.nome},\n\nSeu pagamento referente a ${boleto.referencia} está atrasado há ${diasAtraso} dias.\nPor favor, regularize sua situação o mais breve possível.\n\nValor: R$ ${boleto.valor.toFixed(2)}\nVencimento: ${dataVencimento.toLocaleDateString('pt-BR')}\n\nPara pagar, acesse: ${boleto.linkBoleto}\n\nAtenciosamente,\nEquipe VIP Storage`
      );
      
      // Se tiver telefone, enviar SMS ou WhatsApp
      if (contratoStorage.cliente.telefone) {
        const mensagem = `VIP Storage: Seu pagamento de R$ ${boleto.valor.toFixed(2)} está atrasado há ${diasAtraso} dias. Acesse ${boleto.linkBoleto} para regularizar.`;
        await NotificacaoService.enviarSMS(contratoStorage.cliente.telefone, mensagem);
      }
    }
    
    console.log(`Boleto vencido ${boleto._id} processado com sucesso`);
  } catch (error) {
    console.error('Erro ao processar boleto vencido:', error);
    throw error;
  }
}

// Processar boleto cancelado
async function processarBoletoCancelado(data) {
  try {
    const coraId = data.id;
    
    // Buscar boleto pelo ID do Cora
    const boleto = await Boleto.findOne({ coraId });
    if (!boleto) {
      throw new Error(`Boleto com Cora ID ${coraId} não encontrado`);
    }
    
    // Verificar se o boleto já está marcado como cancelado
    if (boleto.status === 'cancelado') {
      console.log(`Boleto ${boleto._id} já está marcado como cancelado`);
      return;
    }
    
    // Atualizar status do boleto
    boleto.status = 'cancelado';
    boleto.metadados = { ...boleto.metadados, cancelamento: data };
    await boleto.save();
    
    // Verificar se existe um registro financeiro para este boleto
    const registroFinanceiro = await Financeiro.findOne({ boletoId: boleto._id });
    if (registroFinanceiro && registroFinanceiro.status !== 'pago') {
      // Cancelar registro financeiro
      registroFinanceiro.status = 'cancelado';
      registroFinanceiro.observacoes = `${registroFinanceiro.observacoes || ''}\nBoleto cancelado via webhook Cora - ID: ${coraId}`;
      await registroFinanceiro.save();
      console.log(`Registro financeiro cancelado: ${registroFinanceiro._id}`);
    }
    
    console.log(`Boleto cancelado ${boleto._id} processado com sucesso`);
  } catch (error) {
    console.error('Erro ao processar boleto cancelado:', error);
    throw error;
  }
}

// Rota para testar a conexão com o Cora
router.get('/test-connection', async (req, res) => {
  try {
    const token = await CoraService.getAuthToken();
    res.json({
      success: true,
      message: 'Conexão com o Cora estabelecida com sucesso',
      token_obtained: !!token
    });
  } catch (error) {
    console.error('Erro ao testar conexão com o Cora:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao conectar com o Cora',
      error: error.message
    });
  }
});

// Rota para configurar o webhook no Cora
router.post('/setup-webhook', async (req, res) => {
  try {
    const { webhookUrl, events } = req.body;
    
    if (!webhookUrl) {
      return res.status(400).json({
        success: false,
        message: 'URL do webhook é obrigatória'
      });
    }
    
    // Inicializar o serviço Cora
    await CoraService.init();
    
    // Obter token de autenticação
    const token = await CoraService.getAuthToken();
    
    // Configurar webhook no Cora
    // Esta é uma implementação simplificada, a API real do Cora pode ser diferente
    const axios = require('axios');
    const baseUrl = CoraService.config.ambiente === 'producao' 
      ? 'https://api.cora.com.br' 
      : 'https://sandbox.api.cora.com.br';
    
    const response = await axios.post(
      `${baseUrl}/webhooks`,
      {
        url: webhookUrl,
        events: events || ['invoice.paid', 'invoice.overdue', 'invoice.canceled']
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    res.json({
      success: true,
      message: 'Webhook configurado com sucesso no Cora',
      data: response.data
    });
  } catch (error) {
    console.error('Erro ao configurar webhook no Cora:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao configurar webhook no Cora',
      error: error.message
    });
  }
});

// Rota para gerar boletos mensais para todos os contratos ativos
router.post('/gerar-boletos-mensais', async (req, res) => {
  try {
    const resultados = await CoraService.gerarBoletosMensais();
    
    res.json({
      success: true,
      message: `Boletos gerados: ${resultados.sucesso} sucesso, ${resultados.falha} falha`,
      data: resultados
    });
  } catch (error) {
    console.error('Erro ao gerar boletos mensais:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao gerar boletos mensais',
      error: error.message
    });
  }
});

// Rota para verificar status de um boleto específico
router.get('/verificar-status/:boletoId', async (req, res) => {
  try {
    const boleto = await CoraService.verificarStatusBoleto(req.params.boletoId);
    
    res.json({
      success: true,
      message: 'Status do boleto verificado com sucesso',
      data: boleto
    });
  } catch (error) {
    console.error('Erro ao verificar status do boleto:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao verificar status do boleto',
      error: error.message
    });
  }
});

module.exports = router;
