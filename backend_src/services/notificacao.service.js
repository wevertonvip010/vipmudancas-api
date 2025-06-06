const nodemailer = require('nodemailer');
const Boleto = require('../models/boleto.model');
const ContratoStorage = require('../models/contratoStorage.model');
const Cliente = require('../models/cliente.model');

class NotificacaoService {
  constructor() {
    // Configuração do serviço de email
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: process.env.EMAIL_PORT || 587,
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER || 'contato@vipmudancas.com.br',
        pass: process.env.EMAIL_PASS || ''
      }
    });
  }

  // Enviar email
  async enviarEmail(destinatario, assunto, conteudo, anexos = []) {
    try {
      const info = await this.transporter.sendMail({
        from: '"VIP Storage" <contato@vipmudancas.com.br>',
        to: destinatario,
        subject: assunto,
        html: conteudo,
        attachments: anexos
      });

      console.log('Email enviado:', info.messageId);
      return { sucesso: true, messageId: info.messageId };
    } catch (error) {
      console.error('Erro ao enviar email:', error);
      return { sucesso: false, erro: error.message };
    }
  }

  // Enviar SMS (integração fictícia - substituir pela API real)
  async enviarSMS(telefone, mensagem) {
    try {
      // Aqui seria a integração com um serviço de SMS
      console.log(`SMS enviado para ${telefone}: ${mensagem}`);
      return { sucesso: true };
    } catch (error) {
      console.error('Erro ao enviar SMS:', error);
      return { sucesso: false, erro: error.message };
    }
  }

  // Enviar WhatsApp (integração fictícia - substituir pela API real)
  async enviarWhatsApp(telefone, mensagem) {
    try {
      // Aqui seria a integração com a API do WhatsApp Business
      console.log(`WhatsApp enviado para ${telefone}: ${mensagem}`);
      return { sucesso: true };
    } catch (error) {
      console.error('Erro ao enviar WhatsApp:', error);
      return { sucesso: false, erro: error.message };
    }
  }

  // Notificar sobre pagamento próximo do vencimento
  async notificarVencimentoProximo() {
    try {
      const hoje = new Date();
      const diasAntecedencia = 5; // Notificar 5 dias antes do vencimento
      
      // Calcular data limite para notificação (hoje + diasAntecedencia)
      const dataLimite = new Date();
      dataLimite.setDate(hoje.getDate() + diasAntecedencia);
      
      // Buscar boletos que vencem nos próximos dias
      const boletos = await Boleto.find({
        dataVencimento: {
          $gte: hoje,
          $lte: dataLimite
        },
        status: 'emitido',
        notificacaoEnviada: { $ne: true } // Não notificados ainda
      }).populate({
        path: 'contratoStorage',
        populate: { path: 'cliente' }
      });
      
      console.log(`Encontrados ${boletos.length} boletos próximos do vencimento para notificar`);
      
      const resultados = {
        total: boletos.length,
        sucesso: 0,
        falha: 0,
        detalhes: []
      };
      
      // Enviar notificações para cada boleto
      for (const boleto of boletos) {
        try {
          if (!boleto.contratoStorage || !boleto.contratoStorage.cliente) {
            throw new Error('Dados de contrato ou cliente não encontrados');
          }
          
          const cliente = boleto.contratoStorage.cliente;
          const dataVencimentoFormatada = boleto.dataVencimento.toLocaleDateString('pt-BR');
          
          // Preparar conteúdo do email
          const conteudoEmail = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
              <div style="text-align: center; margin-bottom: 20px;">
                <img src="https://vipmudancas.com.br/wp-content/uploads/2023/07/logo-vip-mudancas.png" alt="VIP Storage" style="max-width: 200px;">
              </div>
              <h2 style="color: #0e5c8f;">Lembrete de Pagamento</h2>
              <p>Olá, <strong>${cliente.nome}</strong>!</p>
              <p>Estamos enviando este lembrete para informar que o pagamento do seu aluguel de Self Storage está próximo do vencimento.</p>
              <div style="background-color: #f8f8f8; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <p><strong>Referência:</strong> ${boleto.referencia}</p>
                <p><strong>Valor:</strong> R$ ${boleto.valor.toFixed(2)}</p>
                <p><strong>Data de Vencimento:</strong> ${dataVencimentoFormatada}</p>
              </div>
              <p>Para sua comodidade, você pode efetuar o pagamento através do boleto anexo ou acessando o link abaixo:</p>
              <div style="text-align: center; margin: 25px 0;">
                <a href="${boleto.linkBoleto}" style="background-color: #0e5c8f; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Acessar Boleto</a>
              </div>
              <p>Se você já efetuou o pagamento, por favor desconsidere este aviso.</p>
              <p>Em caso de dúvidas, entre em contato conosco pelo telefone (XX) XXXX-XXXX ou responda a este e-mail.</p>
              <p>Agradecemos pela preferência!</p>
              <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; font-size: 12px; color: #777;">
                <p>VIP Storage - Guarda de Bens e Mudanças</p>
                <p>Este é um e-mail automático, por favor não responda diretamente.</p>
              </div>
            </div>
          `;
          
          // Enviar email
          const resultadoEmail = await this.enviarEmail(
            cliente.email,
            `Lembrete de Pagamento - Vencimento em ${dataVencimentoFormatada}`,
            conteudoEmail
          );
          
          // Enviar SMS se tiver telefone
          let resultadoSMS = { sucesso: false, mensagem: 'SMS não enviado' };
          if (cliente.telefone) {
            const mensagemSMS = `VIP Storage: Seu pagamento de R$ ${boleto.valor.toFixed(2)} vence em ${dataVencimentoFormatada}. Acesse o boleto em ${boleto.linkBoleto}`;
            resultadoSMS = await this.enviarSMS(cliente.telefone, mensagemSMS);
          }
          
          // Enviar WhatsApp se tiver telefone
          let resultadoWhatsApp = { sucesso: false, mensagem: 'WhatsApp não enviado' };
          if (cliente.telefone) {
            const mensagemWhatsApp = `*VIP Storage - Lembrete de Pagamento*\n\nOlá, ${cliente.nome}!\n\nSeu pagamento de *R$ ${boleto.valor.toFixed(2)}* vence em *${dataVencimentoFormatada}*.\n\nPara acessar seu boleto, clique no link: ${boleto.linkBoleto}\n\nEm caso de dúvidas, entre em contato conosco.`;
            resultadoWhatsApp = await this.enviarWhatsApp(cliente.telefone, mensagemWhatsApp);
          }
          
          // Marcar boleto como notificado
          boleto.notificacaoEnviada = true;
          await boleto.save();
          
          resultados.sucesso++;
          resultados.detalhes.push({
            boletoId: boleto._id,
            cliente: cliente.nome,
            email: resultadoEmail.sucesso,
            sms: resultadoSMS.sucesso,
            whatsapp: resultadoWhatsApp.sucesso
          });
        } catch (error) {
          resultados.falha++;
          resultados.detalhes.push({
            boletoId: boleto._id,
            erro: error.message
          });
        }
      }
      
      return resultados;
    } catch (error) {
      console.error('Erro ao notificar vencimentos próximos:', error);
      throw new Error('Falha ao processar notificações de vencimento');
    }
  }

  // Notificar sobre pagamentos vencidos
  async notificarPagamentosVencidos() {
    try {
      const hoje = new Date();
      
      // Buscar boletos vencidos e não notificados
      const boletos = await Boleto.find({
        dataVencimento: { $lt: hoje },
        status: 'emitido',
        notificacaoAtrasoEnviada: { $ne: true } // Não notificados ainda
      }).populate({
        path: 'contratoStorage',
        populate: { path: 'cliente' }
      });
      
      console.log(`Encontrados ${boletos.length} boletos vencidos para notificar`);
      
      const resultados = {
        total: boletos.length,
        sucesso: 0,
        falha: 0,
        detalhes: []
      };
      
      // Enviar notificações para cada boleto
      for (const boleto of boletos) {
        try {
          if (!boleto.contratoStorage || !boleto.contratoStorage.cliente) {
            throw new Error('Dados de contrato ou cliente não encontrados');
          }
          
          const cliente = boleto.contratoStorage.cliente;
          const dataVencimentoFormatada = boleto.dataVencimento.toLocaleDateString('pt-BR');
          const diasAtraso = Math.floor((hoje - boleto.dataVencimento) / (1000 * 60 * 60 * 24));
          
          // Preparar conteúdo do email
          const conteudoEmail = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
              <div style="text-align: center; margin-bottom: 20px;">
                <img src="https://vipmudancas.com.br/wp-content/uploads/2023/07/logo-vip-mudancas.png" alt="VIP Storage" style="max-width: 200px;">
              </div>
              <h2 style="color: #cc0000;">Pagamento em Atraso</h2>
              <p>Olá, <strong>${cliente.nome}</strong>!</p>
              <p>Identificamos que o pagamento do seu aluguel de Self Storage está em atraso.</p>
              <div style="background-color: #fff8f8; padding: 15px; border-radius: 5px; margin: 20px 0; border: 1px solid #ffcccc;">
                <p><strong>Referência:</strong> ${boleto.referencia}</p>
                <p><strong>Valor:</strong> R$ ${boleto.valor.toFixed(2)}</p>
                <p><strong>Data de Vencimento:</strong> ${dataVencimentoFormatada}</p>
                <p><strong>Dias em atraso:</strong> ${diasAtraso}</p>
              </div>
              <p>Para regularizar sua situação e evitar a cobrança de juros e multa, por favor efetue o pagamento o quanto antes através do boleto anexo ou acessando o link abaixo:</p>
              <div style="text-align: center; margin: 25px 0;">
                <a href="${boleto.linkBoleto}" style="background-color: #cc0000; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Pagar Agora</a>
              </div>
              <p>Se você já efetuou o pagamento nas últimas 24 horas, por favor desconsidere este aviso.</p>
              <p>Em caso de dificuldades para realizar o pagamento, entre em contato conosco pelo telefone (XX) XXXX-XXXX para negociarmos alternativas.</p>
              <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; font-size: 12px; color: #777;">
                <p>VIP Storage - Guarda de Bens e Mudanças</p>
                <p>Este é um e-mail automático, por favor não responda diretamente.</p>
              </div>
            </div>
          `;
          
          // Enviar email
          const resultadoEmail = await this.enviarEmail(
            cliente.email,
            `Pagamento em Atraso - ${diasAtraso} dias`,
            conteudoEmail
          );
          
          // Enviar SMS se tiver telefone
          let resultadoSMS = { sucesso: false, mensagem: 'SMS não enviado' };
          if (cliente.telefone) {
            const mensagemSMS = `VIP Storage: Seu pagamento de R$ ${boleto.valor.toFixed(2)} está atrasado há ${diasAtraso} dias. Regularize sua situação acessando: ${boleto.linkBoleto}`;
            resultadoSMS = await this.enviarSMS(cliente.telefone, mensagemSMS);
          }
          
          // Enviar WhatsApp se tiver telefone
          let resultadoWhatsApp = { sucesso: false, mensagem: 'WhatsApp não enviado' };
          if (cliente.telefone) {
            const mensagemWhatsApp = `*VIP Storage - Pagamento em Atraso*\n\nOlá, ${cliente.nome}!\n\nSeu pagamento de *R$ ${boleto.valor.toFixed(2)}* está atrasado há *${diasAtraso} dias*.\n\nPara regularizar sua situação, acesse: ${boleto.linkBoleto}\n\nEm caso de dificuldades, entre em contato conosco.`;
            resultadoWhatsApp = await this.enviarWhatsApp(cliente.telefone, mensagemWhatsApp);
          }
          
          // Marcar boleto como notificado
          boleto.notificacaoAtrasoEnviada = true;
          boleto.status = 'vencido';
          await boleto.save();
          
          // Atualizar status do contrato para inadimplente se estiver com mais de 5 dias de atraso
          if (diasAtraso > 5 && boleto.contratoStorage.status === 'ativo') {
            boleto.contratoStorage.status = 'inadimplente';
            await boleto.contratoStorage.save();
          }
          
          resultados.sucesso++;
          resultados.detalhes.push({
            boletoId: boleto._id,
            cliente: cliente.nome,
            diasAtraso,
            email: resultadoEmail.sucesso,
            sms: resultadoSMS.sucesso,
            whatsapp: resultadoWhatsApp.sucesso
          });
        } catch (error) {
          resultados.falha++;
          resultados.detalhes.push({
            boletoId: boleto._id,
            erro: error.message
          });
        }
      }
      
      return resultados;
    } catch (error) {
      console.error('Erro ao notificar pagamentos vencidos:', error);
      throw new Error('Falha ao processar notificações de atraso');
    }
  }

  // Executar todas as notificações
  async executarNotificacoes() {
    const resultados = {
      vencimentosProximos: await this.notificarVencimentoProximo(),
      pagamentosVencidos: await this.notificarPagamentosVencidos()
    };
    
    return resultados;
  }
}

module.exports = new NotificacaoService();
