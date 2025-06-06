const OrdemServico = require('../models/ordemServico.model');
const Contrato = require('../models/contrato.model');
const ContratoStorage = require('../models/contratoStorage.model');
const Cliente = require('../models/cliente.model');
const clienteHistoricoController = require('./clienteHistorico.controller');

/**
 * Controlador para gerenciar a numeração de contratos vinculada às ordens de serviço
 */
class ContratoNumeracaoController {
  /**
   * Gera um número de contrato baseado na ordem de serviço
   * @param {string} ordemServicoId - ID da ordem de serviço
   * @returns {Promise<string>} - Número do contrato
   */
  async gerarNumeroContrato(ordemServicoId) {
    try {
      // Buscar a ordem de serviço
      const ordemServico = await OrdemServico.findById(ordemServicoId);
      
      if (!ordemServico) {
        throw new Error('Ordem de serviço não encontrada');
      }
      
      // Retornar o número da ordem de serviço como número do contrato
      return ordemServico.numero.toString();
    } catch (error) {
      console.error('Erro ao gerar número de contrato:', error);
      throw error;
    }
  }
  
  /**
   * Vincula um contrato a uma ordem de serviço e atualiza o número do contrato
   * @param {string} contratoId - ID do contrato
   * @param {string} ordemServicoId - ID da ordem de serviço
   * @param {string} tipoContrato - Tipo de contrato ('mudanca' ou 'storage')
   * @returns {Promise<Object>} - Contrato atualizado
   */
  async vincularContratoOrdemServico(req, res) {
    try {
      const { contratoId, ordemServicoId, tipoContrato } = req.params;
      
      // Verificar tipo de contrato
      if (!['mudanca', 'storage'].includes(tipoContrato)) {
        return res.status(400).json({ message: 'Tipo de contrato inválido. Use "mudanca" ou "storage".' });
      }
      
      // Buscar a ordem de serviço
      const ordemServico = await OrdemServico.findById(ordemServicoId);
      
      if (!ordemServico) {
        return res.status(404).json({ message: 'Ordem de serviço não encontrada.' });
      }
      
      // Verificar se a ordem de serviço já está vinculada a outro contrato
      let contratoExistente;
      
      if (tipoContrato === 'mudanca') {
        contratoExistente = await Contrato.findOne({ ordemServicoId });
      } else {
        contratoExistente = await ContratoStorage.findOne({ ordemServicoId });
      }
      
      if (contratoExistente && contratoExistente._id.toString() !== contratoId) {
        return res.status(400).json({ 
          message: 'Esta ordem de serviço já está vinculada a outro contrato.',
          contratoExistente: {
            id: contratoExistente._id,
            numero: contratoExistente.numero
          }
        });
      }
      
      // Buscar o contrato
      let contrato;
      
      if (tipoContrato === 'mudanca') {
        contrato = await Contrato.findById(contratoId);
      } else {
        contrato = await ContratoStorage.findOne({ _id: contratoId });
      }
      
      if (!contrato) {
        return res.status(404).json({ message: `Contrato de ${tipoContrato} não encontrado.` });
      }
      
      // Atualizar o contrato com o ID da ordem de serviço e o número
      contrato.ordemServicoId = ordemServicoId;
      contrato.numero = ordemServico.numero.toString();
      
      await contrato.save();
      
      // Atualizar a ordem de serviço com referência ao contrato
      if (tipoContrato === 'mudanca') {
        ordemServico.contrato = contratoId;
      } else {
        ordemServico.contratoStorage = contratoId;
      }
      
      await ordemServico.save();
      
      // Registrar no histórico do cliente
      const cliente = await Cliente.findById(
        tipoContrato === 'mudanca' ? contrato.clienteId : contrato.cliente
      );
      
      if (cliente) {
        await clienteHistoricoController.registrarEvento(
          cliente._id,
          'contrato',
          `Contrato vinculado à Ordem de Serviço #${ordemServico.numero}`,
          `O contrato de ${tipoContrato === 'mudanca' ? 'Mudança' : 'Self Storage'} foi vinculado à Ordem de Serviço #${ordemServico.numero}`,
          {
            tipo: tipoContrato === 'mudanca' ? 'contrato' : 'contratoStorage',
            id: contrato._id
          },
          {
            ordemServicoId: ordemServico._id,
            numeroOS: ordemServico.numero
          },
          req.user.id
        );
      }
      
      // Retornar sucesso
      res.json({
        message: `Contrato de ${tipoContrato} vinculado com sucesso à Ordem de Serviço #${ordemServico.numero}`,
        contrato: {
          id: contrato._id,
          tipo: tipoContrato,
          numero: contrato.numero,
          ordemServico: {
            id: ordemServico._id,
            numero: ordemServico.numero
          }
        }
      });
    } catch (error) {
      console.error('Erro ao vincular contrato à ordem de serviço:', error);
      res.status(500).json({ message: 'Erro ao vincular contrato à ordem de serviço.', error: error.message });
    }
  }
  
  /**
   * Cria um novo contrato já vinculado a uma ordem de serviço
   * @param {Object} req - Requisição HTTP
   * @param {Object} res - Resposta HTTP
   */
  async criarContratoComOrdemServico(req, res) {
    try {
      const { ordemServicoId, tipoContrato } = req.params;
      
      // Verificar tipo de contrato
      if (!['mudanca', 'storage'].includes(tipoContrato)) {
        return res.status(400).json({ message: 'Tipo de contrato inválido. Use "mudanca" ou "storage".' });
      }
      
      // Buscar a ordem de serviço
      const ordemServico = await OrdemServico.findById(ordemServicoId)
        .populate('cliente');
      
      if (!ordemServico) {
        return res.status(404).json({ message: 'Ordem de serviço não encontrada.' });
      }
      
      // Verificar se a ordem de serviço já está vinculada a um contrato
      if (tipoContrato === 'mudanca' && ordemServico.contrato) {
        return res.status(400).json({ 
          message: 'Esta ordem de serviço já está vinculada a um contrato de mudança.',
          contratoExistente: ordemServico.contrato
        });
      }
      
      if (tipoContrato === 'storage' && ordemServico.contratoStorage) {
        return res.status(400).json({ 
          message: 'Esta ordem de serviço já está vinculada a um contrato de storage.',
          contratoExistente: ordemServico.contratoStorage
        });
      }
      
      // Criar o contrato com base no tipo
      let novoContrato;
      
      if (tipoContrato === 'mudanca') {
        // Validar dados específicos para contrato de mudança
        const { 
          orcamentoId, 
          dataAssinatura, 
          dataInicio, 
          dataTermino, 
          valorTotal, 
          formaPagamento, 
          condicoesPagamento, 
          termos, 
          observacoes 
        } = req.body;
        
        if (!orcamentoId || !dataAssinatura || !dataInicio || !dataTermino || 
            !valorTotal || !formaPagamento || !condicoesPagamento || !termos) {
          return res.status(400).json({ message: 'Dados incompletos para criação do contrato de mudança.' });
        }
        
        // Criar contrato de mudança
        novoContrato = new Contrato({
          orcamentoId,
          clienteId: ordemServico.cliente._id,
          responsavelId: req.user.id,
          ordemServicoId,
          numero: ordemServico.numero.toString(),
          dataAssinatura: new Date(dataAssinatura),
          dataInicio: new Date(dataInicio),
          dataTermino: new Date(dataTermino),
          valorTotal,
          formaPagamento,
          condicoesPagamento,
          termos,
          observacoes,
          dataCriacao: new Date(),
          ultimaAtualizacao: new Date()
        });
      } else {
        // Validar dados específicos para contrato de storage
        const { 
          boxId, 
          dataInicio, 
          dataFim, 
          valorMensal, 
          diaPagamento, 
          observacoes 
        } = req.body;
        
        if (!boxId || !dataInicio || !valorMensal || !diaPagamento) {
          return res.status(400).json({ message: 'Dados incompletos para criação do contrato de storage.' });
        }
        
        // Criar contrato de storage
        novoContrato = new ContratoStorage({
          cliente: ordemServico.cliente._id,
          box: boxId,
          ordemServicoId,
          numero: ordemServico.numero.toString(),
          dataInicio: new Date(dataInicio),
          dataFim: dataFim ? new Date(dataFim) : null,
          valorMensal,
          diaPagamento,
          observacoes,
          criadoPor: req.user.id,
          criadoEm: new Date(),
          atualizadoEm: new Date()
        });
      }
      
      // Salvar o contrato
      await novoContrato.save();
      
      // Atualizar a ordem de serviço com referência ao contrato
      if (tipoContrato === 'mudanca') {
        ordemServico.contrato = novoContrato._id;
      } else {
        ordemServico.contratoStorage = novoContrato._id;
      }
      
      await ordemServico.save();
      
      // Registrar no histórico do cliente
      await clienteHistoricoController.registrarEvento(
        ordemServico.cliente._id,
        'contrato',
        `Contrato de ${tipoContrato === 'mudanca' ? 'Mudança' : 'Self Storage'} criado`,
        `Contrato #${ordemServico.numero} criado e vinculado à Ordem de Serviço #${ordemServico.numero}`,
        {
          tipo: tipoContrato === 'mudanca' ? 'contrato' : 'contratoStorage',
          id: novoContrato._id
        },
        {
          ordemServicoId: ordemServico._id,
          numeroOS: ordemServico.numero
        },
        req.user.id
      );
      
      // Retornar sucesso
      res.status(201).json({
        message: `Contrato de ${tipoContrato} criado com sucesso e vinculado à Ordem de Serviço #${ordemServico.numero}`,
        contrato: {
          id: novoContrato._id,
          tipo: tipoContrato,
          numero: novoContrato.numero,
          ordemServico: {
            id: ordemServico._id,
            numero: ordemServico.numero
          }
        }
      });
    } catch (error) {
      console.error('Erro ao criar contrato com ordem de serviço:', error);
      res.status(500).json({ message: 'Erro ao criar contrato com ordem de serviço.', error: error.message });
    }
  }
  
  /**
   * Busca contratos por número (que é o mesmo da ordem de serviço)
   * @param {Object} req - Requisição HTTP
   * @param {Object} res - Resposta HTTP
   */
  async buscarContratoPorNumero(req, res) {
    try {
      const { numero } = req.params;
      
      // Buscar contratos com o número especificado
      const contratoMudanca = await Contrato.findOne({ numero })
        .populate('clienteId', 'nome email telefone')
        .populate('responsavelId', 'nome email')
        .populate('ordemServicoId');
      
      const contratoStorage = await ContratoStorage.findOne({ numero })
        .populate('cliente', 'nome email telefone')
        .populate('box')
        .populate('criadoPor', 'nome email')
        .populate('ordemServicoId');
      
      // Verificar se encontrou algum contrato
      if (!contratoMudanca && !contratoStorage) {
        return res.status(404).json({ message: `Nenhum contrato encontrado com o número ${numero}.` });
      }
      
      // Preparar resposta
      const resultado = {
        numero,
        contratos: []
      };
      
      if (contratoMudanca) {
        resultado.contratos.push({
          tipo: 'mudanca',
          id: contratoMudanca._id,
          cliente: {
            id: contratoMudanca.clienteId._id,
            nome: contratoMudanca.clienteId.nome,
            email: contratoMudanca.clienteId.email,
            telefone: contratoMudanca.clienteId.telefone
          },
          responsavel: {
            id: contratoMudanca.responsavelId._id,
            nome: contratoMudanca.responsavelId.nome,
            email: contratoMudanca.responsavelId.email
          },
          ordemServico: contratoMudanca.ordemServicoId ? {
            id: contratoMudanca.ordemServicoId._id,
            numero: contratoMudanca.ordemServicoId.numero,
            status: contratoMudanca.ordemServicoId.status
          } : null,
          dataAssinatura: contratoMudanca.dataAssinatura,
          status: contratoMudanca.status,
          valorTotal: contratoMudanca.valorTotal,
          autentique: contratoMudanca.autentique
        });
      }
      
      if (contratoStorage) {
        resultado.contratos.push({
          tipo: 'storage',
          id: contratoStorage._id,
          cliente: {
            id: contratoStorage.cliente._id,
            nome: contratoStorage.cliente.nome,
            email: contratoStorage.cliente.email,
            telefone: contratoStorage.cliente.telefone
          },
          box: contratoStorage.box ? {
            id: contratoStorage.box._id,
            numero: contratoStorage.box.numero,
            dimensoes: `${contratoStorage.box.altura}m x ${contratoStorage.box.largura}m x ${contratoStorage.box.profundidade}m`
          } : null,
          ordemServico: contratoStorage.ordemServicoId ? {
            id: contratoStorage.ordemServicoId._id,
            numero: contratoStorage.ordemServicoId.numero,
            status: contratoStorage.ordemServicoId.status
          } : null,
          dataInicio: contratoStorage.dataInicio,
          dataFim: contratoStorage.dataFim,
          status: contratoStorage.status,
          valorMensal: contratoStorage.valorMensal,
          autentique: contratoStorage.autentique
        });
      }
      
      res.json(resultado);
    } catch (error) {
      console.error('Erro ao buscar contrato por número:', error);
      res.status(500).json({ message: 'Erro ao buscar contrato por número.', error: error.message });
    }
  }
}

// Exportar instância do controlador
module.exports = new ContratoNumeracaoController();
