const axios = require('axios');
const CoraConfig = require('../models/coraConfig.model');
const Boleto = require('../models/boleto.model');

class CoraService {
  constructor() {
    this.baseUrl = {
      sandbox: 'https://sandbox.api.cora.com.br',
      producao: 'https://api.cora.com.br'
    };
    this.config = null;
  }

  // Inicializar configuração
  async init() {
    try {
      this.config = await CoraConfig.findOne({ ativo: true });
      if (!this.config) {
        throw new Error('Configuração do Cora não encontrada ou inativa');
      }
      return true;
    } catch (error) {
      console.error('Erro ao inicializar serviço Cora:', error);
      return false;
    }
  }

  // Obter token de autenticação
  async getAuthToken() {
    try {
      if (!this.config) await this.init();
      
      const response = await axios.post(
        `${this.baseUrl[this.config.ambiente]}/token`,
        {
          client_id: this.config.apiKey,
          client_secret: this.config.secretKey,
          grant_type: 'client_credentials'
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      
      return response.data.access_token;
    } catch (error) {
      console.error('Erro ao obter token de autenticação Cora:', error.response?.data || error.message);
      throw new Error('Falha na autenticação com a API do Cora');
    }
  }

  // Emitir boleto
  async emitirBoleto(contratoStorage, cliente, valor, dataVencimento, referencia) {
    try {
      if (!this.config) await this.init();
      const token = await this.getAuthToken();
      
      // Preparar dados do boleto
      const dadosBoleto = {
        account_id: this.config.contaBancaria.id,
        amount: valor * 100, // Cora trabalha com centavos
        due_date: dataVencimento.toISOString().split('T')[0],
        customer: {
          name: cliente.nome,
          email: cliente.email,
          tax_id: cliente.cpfCnpj.replace(/[^\d]/g, ''), // Remover caracteres não numéricos
          phone_number: cliente.telefone.replace(/[^\d]/g, '')
        },
        payment_terms: {
          fine: {
            percentage: this.config.configuracaoBoleto.multa
          },
          interest: {
            percentage: this.config.configuracaoBoleto.juros
          }
        },
        description: referencia,
        payment_methods: ['boleto']
      };
      
      // Adicionar endereço se disponível
      if (cliente.endereco) {
        dadosBoleto.customer.address = {
          street: cliente.endereco.rua,
          number: cliente.endereco.numero,
          complement: cliente.endereco.complemento,
          neighborhood: cliente.endereco.bairro,
          city: cliente.endereco.cidade,
          state: cliente.endereco.estado,
          postal_code: cliente.endereco.cep.replace(/[^\d]/g, '')
        };
      }
      
      // Enviar requisição para API do Cora
      const response = await axios.post(
        `${this.baseUrl[this.config.ambiente]}/invoices`,
        dadosBoleto,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      // Criar registro de boleto no sistema
      const novoBoleto = new Boleto({
        contratoStorage: contratoStorage._id,
        cliente: cliente._id,
        coraId: response.data.id,
        valor,
        dataEmissao: new Date(),
        dataVencimento,
        status: 'emitido',
        linkBoleto: response.data.payment_methods.boleto.url,
        codigoBarras: response.data.payment_methods.boleto.barcode,
        linhaDigitavel: response.data.payment_methods.boleto.formatted_barcode,
        referencia,
        metadados: response.data
      });
      
      await novoBoleto.save();
      return novoBoleto;
    } catch (error) {
      console.error('Erro ao emitir boleto Cora:', error.response?.data || error.message);
      
      // Registrar tentativa de emissão com erro
      const boletoPendente = new Boleto({
        contratoStorage: contratoStorage._id,
        cliente: cliente._id,
        valor,
        dataEmissao: new Date(),
        dataVencimento,
        status: 'emitido',
        referencia,
        tentativasEmissao: 1,
        ultimoErro: error.response?.data?.message || error.message
      });
      
      await boletoPendente.save();
      throw new Error('Falha na emissão do boleto');
    }
  }

  // Verificar status de um boleto
  async verificarStatusBoleto(boletoId) {
    try {
      if (!this.config) await this.init();
      const token = await this.getAuthToken();
      
      const boleto = await Boleto.findById(boletoId);
      if (!boleto || !boleto.coraId) {
        throw new Error('Boleto não encontrado ou sem ID do Cora');
      }
      
      const response = await axios.get(
        `${this.baseUrl[this.config.ambiente]}/invoices/${boleto.coraId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      // Atualizar status do boleto
      const statusMap = {
        'PENDING': 'emitido',
        'PAID': 'pago',
        'OVERDUE': 'vencido',
        'CANCELED': 'cancelado'
      };
      
      boleto.status = statusMap[response.data.status] || boleto.status;
      
      // Se foi pago, registrar data de pagamento
      if (response.data.status === 'PAID' && response.data.payment_date) {
        boleto.dataPagamento = new Date(response.data.payment_date);
      }
      
      await boleto.save();
      return boleto;
    } catch (error) {
      console.error('Erro ao verificar status do boleto:', error.response?.data || error.message);
      throw new Error('Falha ao verificar status do boleto');
    }
  }

  // Cancelar boleto
  async cancelarBoleto(boletoId) {
    try {
      if (!this.config) await this.init();
      const token = await this.getAuthToken();
      
      const boleto = await Boleto.findById(boletoId);
      if (!boleto || !boleto.coraId) {
        throw new Error('Boleto não encontrado ou sem ID do Cora');
      }
      
      // Só pode cancelar boletos não pagos
      if (boleto.status === 'pago') {
        throw new Error('Não é possível cancelar um boleto já pago');
      }
      
      await axios.post(
        `${this.baseUrl[this.config.ambiente]}/invoices/${boleto.coraId}/cancel`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      // Atualizar status do boleto
      boleto.status = 'cancelado';
      await boleto.save();
      
      return boleto;
    } catch (error) {
      console.error('Erro ao cancelar boleto:', error.response?.data || error.message);
      throw new Error('Falha ao cancelar boleto');
    }
  }

  // Gerar boletos mensais para todos os contratos ativos
  async gerarBoletosMensais() {
    try {
      if (!this.config) await this.init();
      
      const ContratoStorage = require('../models/contratoStorage.model');
      const Cliente = require('../models/cliente.model');
      
      // Buscar todos os contratos ativos
      const contratosAtivos = await ContratoStorage.find({ status: 'ativo' });
      
      const resultados = {
        total: contratosAtivos.length,
        sucesso: 0,
        falha: 0,
        detalhes: []
      };
      
      // Para cada contrato, verificar se já existe boleto para o mês atual
      const mesAtual = new Date().getMonth();
      const anoAtual = new Date().getFullYear();
      
      for (const contrato of contratosAtivos) {
        try {
          // Verificar se já existe boleto para este mês/ano
          const boletoExistente = await Boleto.findOne({
            contratoStorage: contrato._id,
            dataEmissao: {
              $gte: new Date(anoAtual, mesAtual, 1),
              $lt: new Date(anoAtual, mesAtual + 1, 1)
            }
          });
          
          if (boletoExistente) {
            resultados.detalhes.push({
              contratoId: contrato._id,
              status: 'pulado',
              mensagem: 'Boleto já emitido para este mês'
            });
            continue;
          }
          
          // Buscar cliente
          const cliente = await Cliente.findById(contrato.cliente);
          if (!cliente) {
            resultados.falha++;
            resultados.detalhes.push({
              contratoId: contrato._id,
              status: 'erro',
              mensagem: 'Cliente não encontrado'
            });
            continue;
          }
          
          // Calcular data de vencimento (dia de pagamento do contrato)
          const diaVencimento = contrato.dataPagamentoMensal;
          let dataVencimento = new Date(anoAtual, mesAtual, diaVencimento);
          
          // Se o dia já passou, emitir para o próximo mês
          if (dataVencimento < new Date()) {
            dataVencimento = new Date(anoAtual, mesAtual + 1, diaVencimento);
          }
          
          // Referência do boleto
          const nomeMes = dataVencimento.toLocaleString('pt-BR', { month: 'long' });
          const referencia = `Aluguel Box - ${nomeMes}/${dataVencimento.getFullYear()}`;
          
          // Emitir boleto
          const novoBoleto = await this.emitirBoleto(
            contrato,
            cliente,
            contrato.valorMensal,
            dataVencimento,
            referencia
          );
          
          resultados.sucesso++;
          resultados.detalhes.push({
            contratoId: contrato._id,
            boletoId: novoBoleto._id,
            status: 'sucesso',
            mensagem: 'Boleto emitido com sucesso'
          });
        } catch (error) {
          resultados.falha++;
          resultados.detalhes.push({
            contratoId: contrato._id,
            status: 'erro',
            mensagem: error.message
          });
        }
      }
      
      return resultados;
    } catch (error) {
      console.error('Erro ao gerar boletos mensais:', error);
      throw new Error('Falha ao gerar boletos mensais');
    }
  }
}

module.exports = new CoraService();
