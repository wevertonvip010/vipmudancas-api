const AutentiqueService = require('../services/autentique.service');
const Cliente = require('../models/cliente.model');
const OrdemServico = require('../models/ordemServico.model');
const Contrato = require('../models/contrato.model');
const ContratoStorage = require('../models/contratoStorage.model');
const ClienteHistorico = require('../models/clienteHistorico.model');
const clienteHistoricoController = require('./clienteHistorico.controller');
const fs = require('fs');
const path = require('path');
const { PDFDocument } = require('pdf-lib');
const moment = require('moment');

class AutentiqueIntegrationController {
  constructor() {
    this.autentiqueService = new AutentiqueService();
    this.templateDir = path.join(__dirname, '../../templates/contratos');
  }

  /**
   * Gera um contrato PDF com os dados do cliente
   * @param {Object} cliente - Dados do cliente
   * @param {Object} dadosContrato - Dados específicos do contrato
   * @param {string} tipoContrato - Tipo de contrato ('mudanca' ou 'storage')
   * @returns {Promise<string>} - Caminho do arquivo PDF gerado
   */
  async gerarContratoPDF(cliente, dadosContrato, tipoContrato) {
    try {
      // Selecionar o template correto baseado no tipo de contrato
      const templatePath = path.join(this.templateDir, 
        tipoContrato === 'storage' ? 'template_storage.pdf' : 'template_mudanca.pdf');
      
      if (!fs.existsSync(templatePath)) {
        throw new Error(`Template de contrato não encontrado: ${templatePath}`);
      }
      
      // Carregar o template PDF
      const templateBytes = fs.readFileSync(templatePath);
      const pdfDoc = await PDFDocument.load(templateBytes);
      
      // Obter os campos do formulário
      const form = pdfDoc.getForm();
      
      // Preencher os campos com os dados do cliente
      // Campos comuns a todos os contratos
      if (form.getTextField('nome_cliente')) form.getTextField('nome_cliente').setText(cliente.nome || '');
      if (form.getTextField('cpf_cnpj')) form.getTextField('cpf_cnpj').setText(cliente.cpfCnpj || '');
      if (form.getTextField('endereco')) {
        const enderecoCompleto = cliente.endereco ? 
          `${cliente.endereco.rua}, ${cliente.endereco.numero}, ${cliente.endereco.complemento || ''}, ${cliente.endereco.bairro}, ${cliente.endereco.cidade}/${cliente.endereco.estado}, CEP: ${cliente.endereco.cep}` : '';
        form.getTextField('endereco').setText(enderecoCompleto);
      }
      if (form.getTextField('telefone')) form.getTextField('telefone').setText(cliente.telefone || '');
      if (form.getTextField('email')) form.getTextField('email').setText(cliente.email || '');
      
      // Número do contrato (mesmo da ordem de serviço)
      if (form.getTextField('numero_contrato') && dadosContrato.numeroOS) {
        form.getTextField('numero_contrato').setText(dadosContrato.numeroOS.toString());
      }
      
      // Data atual formatada
      const dataAtual = moment().format('DD/MM/YYYY');
      if (form.getTextField('data_contrato')) form.getTextField('data_contrato').setText(dataAtual);
      
      // Campos específicos para contrato de mudança
      if (tipoContrato === 'mudanca') {
        if (form.getTextField('endereco_origem') && dadosContrato.enderecoOrigem) {
          const enderecoOrigem = `${dadosContrato.enderecoOrigem.rua}, ${dadosContrato.enderecoOrigem.numero}, ${dadosContrato.enderecoOrigem.complemento || ''}, ${dadosContrato.enderecoOrigem.bairro}, ${dadosContrato.enderecoOrigem.cidade}/${dadosContrato.enderecoOrigem.estado}, CEP: ${dadosContrato.enderecoOrigem.cep}`;
          form.getTextField('endereco_origem').setText(enderecoOrigem);
        }
        
        if (form.getTextField('endereco_destino') && dadosContrato.enderecoDestino) {
          const enderecoDestino = `${dadosContrato.enderecoDestino.rua}, ${dadosContrato.enderecoDestino.numero}, ${dadosContrato.enderecoDestino.complemento || ''}, ${dadosContrato.enderecoDestino.bairro}, ${dadosContrato.enderecoDestino.cidade}/${dadosContrato.enderecoDestino.estado}, CEP: ${dadosContrato.enderecoDestino.cep}`;
          form.getTextField('endereco_destino').setText(enderecoDestino);
        }
        
        if (form.getTextField('data_mudanca') && dadosContrato.dataMudanca) {
          form.getTextField('data_mudanca').setText(moment(dadosContrato.dataMudanca).format('DD/MM/YYYY'));
        }
        
        if (form.getTextField('valor_total') && dadosContrato.valorTotal) {
          form.getTextField('valor_total').setText(`R$ ${dadosContrato.valorTotal.toFixed(2)}`);
        }
      }
      
      // Campos específicos para contrato de storage
      if (tipoContrato === 'storage') {
        if (form.getTextField('numero_box') && dadosContrato.numeroBox) {
          form.getTextField('numero_box').setText(dadosContrato.numeroBox.toString());
        }
        
        if (form.getTextField('dimensoes_box') && dadosContrato.dimensoesBox) {
          form.getTextField('dimensoes_box').setText(dadosContrato.dimensoesBox);
        }
        
        if (form.getTextField('valor_mensal') && dadosContrato.valorMensal) {
          form.getTextField('valor_mensal').setText(`R$ ${dadosContrato.valorMensal.toFixed(2)}`);
        }
        
        if (form.getTextField('data_inicio') && dadosContrato.dataInicio) {
          form.getTextField('data_inicio').setText(moment(dadosContrato.dataInicio).format('DD/MM/YYYY'));
        }
        
        if (form.getTextField('data_fim') && dadosContrato.dataFim) {
          form.getTextField('data_fim').setText(moment(dadosContrato.dataFim).format('DD/MM/YYYY'));
        }
      }
      
      // Achatamento dos campos do formulário para que não sejam editáveis
      form.flatten();
      
      // Salvar o PDF preenchido
      const pdfBytes = await pdfDoc.save();
      
      // Criar diretório para contratos se não existir
      const contratoDir = path.join(__dirname, '../../uploads/contratos');
      if (!fs.existsSync(contratoDir)) {
        fs.mkdirSync(contratoDir, { recursive: true });
      }
      
      // Gerar nome de arquivo único
      const fileName = `contrato_${tipoContrato}_${cliente._id}_${Date.now()}.pdf`;
      const filePath = path.join(contratoDir, fileName);
      
      // Salvar o arquivo
      fs.writeFileSync(filePath, pdfBytes);
      
      return filePath;
    } catch (error) {
      console.error('Erro ao gerar contrato PDF:', error);
      throw error;
    }
  }

  /**
   * Envia um contrato para assinatura na Autentique
   * @param {Object} req - Requisição HTTP
   * @param {Object} res - Resposta HTTP
   */
  async enviarContratoParaAssinatura(req, res) {
    try {
      const { contratoId, tipoContrato } = req.params;
      
      // Verificar tipo de contrato
      if (!['mudanca', 'storage'].includes(tipoContrato)) {
        return res.status(400).json({ message: 'Tipo de contrato inválido. Use "mudanca" ou "storage".' });
      }
      
      // Buscar dados do contrato e cliente
      let contrato, cliente, dadosContrato;
      
      if (tipoContrato === 'mudanca') {
        contrato = await Contrato.findById(contratoId)
          .populate('cliente')
          .populate('ordemServico');
          
        if (!contrato) {
          return res.status(404).json({ message: 'Contrato não encontrado.' });
        }
        
        cliente = contrato.cliente;
        
        // Verificar se existe ordem de serviço associada
        if (!contrato.ordemServico) {
          return res.status(400).json({ message: 'Contrato não possui ordem de serviço associada.' });
        }
        
        dadosContrato = {
          numeroOS: contrato.ordemServico.numero,
          enderecoOrigem: contrato.enderecoOrigem,
          enderecoDestino: contrato.enderecoDestino,
          dataMudanca: contrato.dataMudanca,
          valorTotal: contrato.valorTotal
        };
      } else {
        // Contrato de storage
        contrato = await ContratoStorage.findById(contratoId)
          .populate('cliente')
          .populate('box');
          
        if (!contrato) {
          return res.status(404).json({ message: 'Contrato de storage não encontrado.' });
        }
        
        cliente = contrato.cliente;
        
        // Verificar se existe box associado
        if (!contrato.box) {
          return res.status(400).json({ message: 'Contrato não possui box associado.' });
        }
        
        // Buscar ordem de serviço associada (se existir)
        const ordemServico = await OrdemServico.findOne({ contratoStorage: contratoId });
        
        dadosContrato = {
          numeroOS: ordemServico ? ordemServico.numero : contrato.numero,
          numeroBox: contrato.box.numero,
          dimensoesBox: `${contrato.box.altura}m x ${contrato.box.largura}m x ${contrato.box.profundidade}m`,
          valorMensal: contrato.valorMensal,
          dataInicio: contrato.dataInicio,
          dataFim: contrato.dataFim
        };
      }
      
      // Gerar PDF do contrato com os dados do cliente
      const filePath = await this.gerarContratoPDF(cliente, dadosContrato, tipoContrato);
      
      // Preparar signatários
      const signers = [
        {
          name: cliente.nome,
          email: cliente.email,
          deliveryMethod: "EMAIL"
        },
        {
          name: req.body.nomeRepresentante || "Representante VIP",
          email: req.body.emailRepresentante || "contato@vipmudancas.com.br",
          deliveryMethod: "EMAIL"
        }
      ];
      
      // Nome do documento
      const documentName = `Contrato de ${tipoContrato === 'mudanca' ? 'Mudança' : 'Self Storage'} - ${cliente.nome} - ${dadosContrato.numeroOS}`;
      
      // Enviar para Autentique
      const documentoAutentique = await this.autentiqueService.createDocument(
        filePath,
        documentName,
        signers
      );
      
      // Atualizar contrato com dados da Autentique
      if (tipoContrato === 'mudanca') {
        contrato.autentique = {
          documentId: documentoAutentique.id,
          status: 'pendente',
          dataCriacao: new Date(),
          linkAssinatura: documentoAutentique.signatures[0].link.short_link
        };
      } else {
        contrato.autentique = {
          documentId: documentoAutentique.id,
          status: 'pendente',
          dataCriacao: new Date(),
          linkAssinatura: documentoAutentique.signatures[0].link.short_link
        };
      }
      
      await contrato.save();
      
      // Registrar no histórico do cliente
      await clienteHistoricoController.registrarEvento(
        cliente._id,
        'contrato',
        `Contrato de ${tipoContrato === 'mudanca' ? 'Mudança' : 'Self Storage'} enviado para assinatura`,
        `Contrato #${dadosContrato.numeroOS} enviado para assinatura digital via Autentique`,
        {
          tipo: tipoContrato === 'mudanca' ? 'contrato' : 'contratoStorage',
          id: contrato._id
        },
        {
          autentiqueId: documentoAutentique.id,
          linkAssinatura: documentoAutentique.signatures[0].link.short_link
        },
        req.user.id
      );
      
      // Retornar sucesso
      res.status(200).json({
        message: 'Contrato enviado para assinatura com sucesso',
        contrato: {
          id: contrato._id,
          tipo: tipoContrato,
          cliente: {
            id: cliente._id,
            nome: cliente.nome,
            email: cliente.email
          },
          autentique: {
            documentId: documentoAutentique.id,
            linkAssinatura: documentoAutentique.signatures[0].link.short_link
          }
        }
      });
    } catch (error) {
      console.error('Erro ao enviar contrato para assinatura:', error);
      res.status(500).json({ message: 'Erro ao enviar contrato para assinatura.', error: error.message });
    }
  }

  /**
   * Verifica o status de um contrato na Autentique
   * @param {Object} req - Requisição HTTP
   * @param {Object} res - Resposta HTTP
   */
  async verificarStatusContrato(req, res) {
    try {
      const { contratoId, tipoContrato } = req.params;
      
      // Verificar tipo de contrato
      if (!['mudanca', 'storage'].includes(tipoContrato)) {
        return res.status(400).json({ message: 'Tipo de contrato inválido. Use "mudanca" ou "storage".' });
      }
      
      // Buscar contrato
      let contrato;
      
      if (tipoContrato === 'mudanca') {
        contrato = await Contrato.findById(contratoId);
      } else {
        contrato = await ContratoStorage.findById(contratoId);
      }
      
      if (!contrato) {
        return res.status(404).json({ message: `Contrato de ${tipoContrato} não encontrado.` });
      }
      
      // Verificar se o contrato tem dados da Autentique
      if (!contrato.autentique || !contrato.autentique.documentId) {
        return res.status(400).json({ message: 'Contrato não possui dados de assinatura digital.' });
      }
      
      // Consultar status na Autentique
      const documentoAutentique = await this.autentiqueService.getDocument(contrato.autentique.documentId);
      
      // Verificar status das assinaturas
      const todasAssinadas = documentoAutentique.signatures.every(signature => signature.signed_at);
      const algumRejeitado = documentoAutentique.signatures.some(signature => signature.rejected_at);
      
      let novoStatus;
      if (algumRejeitado) {
        novoStatus = 'rejeitado';
      } else if (todasAssinadas) {
        novoStatus = 'assinado';
      } else {
        novoStatus = 'pendente';
      }
      
      // Atualizar status do contrato se necessário
      if (novoStatus !== contrato.autentique.status) {
        contrato.autentique.status = novoStatus;
        contrato.autentique.ultimaAtualizacao = new Date();
        await contrato.save();
      }
      
      // Retornar status atualizado
      res.json({
        contrato: {
          id: contrato._id,
          tipo: tipoContrato
        },
        autentique: {
          documentId: documentoAutentique.id,
          status: novoStatus,
          assinaturas: documentoAutentique.signatures.map(signature => ({
            nome: signature.name,
            email: signature.email,
            visualizado: signature.viewed_at ? new Date(signature.viewed_at) : null,
            assinado: signature.signed_at ? new Date(signature.signed_at) : null,
            rejeitado: signature.rejected_at ? new Date(signature.rejected_at) : null,
            motivoRejeicao: signature.reason_for_rejection
          }))
        }
      });
    } catch (error) {
      console.error('Erro ao verificar status do contrato:', error);
      res.status(500).json({ message: 'Erro ao verificar status do contrato.', error: error.message });
    }
  }

  /**
   * Reenvia solicitações de assinatura para um contrato
   * @param {Object} req - Requisição HTTP
   * @param {Object} res - Resposta HTTP
   */
  async reenviarSolicitacoesAssinatura(req, res) {
    try {
      const { contratoId, tipoContrato } = req.params;
      
      // Verificar tipo de contrato
      if (!['mudanca', 'storage'].includes(tipoContrato)) {
        return res.status(400).json({ message: 'Tipo de contrato inválido. Use "mudanca" ou "storage".' });
      }
      
      // Buscar contrato
      let contrato;
      
      if (tipoContrato === 'mudanca') {
        contrato = await Contrato.findById(contratoId).populate('cliente');
      } else {
        contrato = await ContratoStorage.findById(contratoId).populate('cliente');
      }
      
      if (!contrato) {
        return res.status(404).json({ message: `Contrato de ${tipoContrato} não encontrado.` });
      }
      
      // Verificar se o contrato tem dados da Autentique
      if (!contrato.autentique || !contrato.autentique.documentId) {
        return res.status(400).json({ message: 'Contrato não possui dados de assinatura digital.' });
      }
      
      // Reenviar solicitações
      const resultado = await this.autentiqueService.resendSignatureRequests(contrato.autentique.documentId);
      
      // Registrar no histórico do cliente
      await clienteHistoricoController.registrarEvento(
        contrato.cliente._id,
        'contrato',
        `Solicitações de assinatura reenviadas`,
        `Solicitações de assinatura do contrato de ${tipoContrato === 'mudanca' ? 'Mudança' : 'Self Storage'} foram reenviadas`,
        {
          tipo: tipoContrato === 'mudanca' ? 'contrato' : 'contratoStorage',
          id: contrato._id
        },
        null,
        req.user.id
      );
      
      // Retornar sucesso
      res.json({
        message: 'Solicitações de assinatura reenviadas com sucesso',
        sucesso: resultado
      });
    } catch (error) {
      console.error('Erro ao reenviar solicitações de assinatura:', error);
      res.status(500).json({ message: 'Erro ao reenviar solicitações de assinatura.', error: error.message });
    }
  }

  /**
   * Webhook para receber notificações da Autentique
   * @param {Object} req - Requisição HTTP
   * @param {Object} res - Resposta HTTP
   */
  async webhookAutentique(req, res) {
    try {
      const { event, data } = req.body;
      
      // Verificar se o evento é válido
      if (!event || !data || !data.document || !data.document.id) {
        return res.status(400).json({ message: 'Payload de webhook inválido.' });
      }
      
      const documentId = data.document.id;
      
      // Buscar contratos relacionados a este documento
      const contratoMudanca = await Contrato.findOne({
        'autentique.documentId': documentId
      }).populate('cliente');
      
      const contratoStorage = await ContratoStorage.findOne({
        'autentique.documentId': documentId
      }).populate('cliente');
      
      const contrato = contratoMudanca || contratoStorage;
      const tipoContrato = contratoMudanca ? 'mudanca' : 'storage';
      
      if (!contrato) {
        return res.status(404).json({ message: 'Contrato não encontrado para este documento.' });
      }
      
      // Processar evento
      switch (event) {
        case 'document.signed':
          // Documento foi assinado por alguém
          contrato.autentique.ultimaAtualizacao = new Date();
          
          // Verificar se todas as assinaturas foram concluídas
          const documentoAutentique = await this.autentiqueService.getDocument(documentId);
          const todasAssinadas = documentoAutentique.signatures.every(signature => signature.signed_at);
          
          if (todasAssinadas) {
            contrato.autentique.status = 'assinado';
            
            // Registrar no histórico do cliente
            await clienteHistoricoController.registrarEvento(
              contrato.cliente._id,
              'contrato',
              `Contrato assinado por todos os signatários`,
              `O contrato de ${tipoContrato === 'mudanca' ? 'Mudança' : 'Self Storage'} foi assinado por todos os signatários`,
              {
                tipo: tipoContrato === 'mudanca' ? 'contrato' : 'contratoStorage',
                id: contrato._id
              },
              null,
              null // Sistema
            );
          }
          
          await contrato.save();
          break;
          
        case 'document.rejected':
          // Documento foi rejeitado por alguém
          contrato.autentique.status = 'rejeitado';
          contrato.autentique.ultimaAtualizacao = new Date();
          await contrato.save();
          
          // Registrar no histórico do cliente
          await clienteHistoricoController.registrarEvento(
            contrato.cliente._id,
            'contrato',
            `Assinatura de contrato rejeitada`,
            `A assinatura do contrato de ${tipoContrato === 'mudanca' ? 'Mudança' : 'Self Storage'} foi rejeitada`,
            {
              tipo: tipoContrato === 'mudanca' ? 'contrato' : 'contratoStorage',
              id: contrato._id
            },
            null,
            null // Sistema
          );
          break;
          
        case 'document.created':
        case 'document.viewed':
        default:
          // Apenas atualizar a data de última atualização
          contrato.autentique.ultimaAtualizacao = new Date();
          await contrato.save();
          break;
      }
      
      // Retornar sucesso
      res.status(200).json({ success: true });
    } catch (error) {
      console.error('Erro ao processar webhook da Autentique:', error);
      res.status(500).json({ message: 'Erro ao processar webhook.', error: error.message });
    }
  }
}

// Exportar instância do controlador
module.exports = new AutentiqueIntegrationController();
