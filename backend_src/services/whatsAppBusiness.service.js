const axios = require('axios');

class WhatsAppBusinessIntegration {
  constructor(apiKey, phoneNumberId, businessAccountId) {
    this.apiKey = apiKey;
    this.phoneNumberId = phoneNumberId;
    this.businessAccountId = businessAccountId;
    this.apiUrl = 'https://graph.facebook.com/v16.0';
  }
  
  /**
   * Envia mensagem de texto via WhatsApp
   */
  async sendTextMessage(to, message) {
    try {
      const response = await axios({
        method: 'POST',
        url: `${this.apiUrl}/${this.phoneNumberId}/messages`,
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        data: {
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: to,
          type: 'text',
          text: {
            body: message
          }
        }
      });
      
      return {
        success: true,
        messageId: response.data.messages[0].id,
        response: response.data
      };
    } catch (error) {
      console.error('Erro ao enviar mensagem WhatsApp:', error.response?.data || error.message);
      throw error;
    }
  }
  
  /**
   * Envia mensagem de avaliação com botões de 1 a 5 estrelas
   */
  async sendRatingRequest(to, message, orderReference) {
    try {
      // Mensagem principal
      const messageResponse = await this.sendTextMessage(to, message);
      
      // Mensagem com instruções para avaliação
      const instructionMessage = 'Por favor, responda com um número de 1 a 5 para avaliar nosso serviço (1 = ruim, 5 = excelente)';
      await this.sendTextMessage(to, instructionMessage);
      
      // Armazenar referência da ordem para associar com a resposta
      // Na implementação real, isso seria armazenado em um banco de dados
      console.log(`Solicitação de avaliação enviada para ${to}, referência: ${orderReference}`);
      
      return {
        success: true,
        messageId: messageResponse.messageId,
        orderReference: orderReference
      };
    } catch (error) {
      console.error('Erro ao enviar solicitação de avaliação:', error);
      throw error;
    }
  }
  
  /**
   * Configura webhook para receber mensagens
   */
  async setupWebhook(webhookUrl, verifyToken) {
    try {
      const response = await axios({
        method: 'POST',
        url: `${this.apiUrl}/${this.businessAccountId}/subscribed_apps`,
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        data: {
          app_id: '123456789', // ID da aplicação no Facebook Developers
          callback_url: webhookUrl,
          verify_token: verifyToken,
          fields: ['messages', 'message_deliveries', 'message_reads']
        }
      });
      
      return {
        success: true,
        response: response.data
      };
    } catch (error) {
      console.error('Erro ao configurar webhook:', error.response?.data || error.message);
      throw error;
    }
  }
  
  /**
   * Processa webhook de mensagem recebida
   */
  processWebhook(body) {
    try {
      // Verificar se é uma mensagem de texto
      if (!body.entry || !body.entry[0].changes || !body.entry[0].changes[0].value.messages) {
        return null;
      }
      
      const message = body.entry[0].changes[0].value.messages[0];
      
      if (message.type !== 'text') {
        return null;
      }
      
      // Extrair informações da mensagem
      const from = body.entry[0].changes[0].value.contacts[0].wa_id;
      const text = message.text.body;
      const timestamp = message.timestamp;
      
      // Verificar se é uma avaliação (número de 1 a 5)
      const ratingMatch = text.match(/^[1-5]$/);
      
      if (ratingMatch) {
        return {
          type: 'rating',
          from: from,
          rating: parseInt(text, 10),
          timestamp: timestamp,
          messageId: message.id
        };
      }
      
      // Mensagem normal
      return {
        type: 'message',
        from: from,
        text: text,
        timestamp: timestamp,
        messageId: message.id
      };
    } catch (error) {
      console.error('Erro ao processar webhook:', error);
      return null;
    }
  }
  
  /**
   * Envia mensagem de agradecimento após avaliação
   */
  async sendThankYouMessage(to, rating, message) {
    try {
      // Emoji baseado na avaliação
      let emoji = '';
      if (rating === 5) emoji = '⭐⭐⭐⭐⭐ 😃';
      else if (rating === 4) emoji = '⭐⭐⭐⭐ 😊';
      else if (rating === 3) emoji = '⭐⭐⭐ 🙂';
      else if (rating === 2) emoji = '⭐⭐ 😐';
      else emoji = '⭐ 😔';
      
      const thankYouMessage = `${emoji}\n\n${message}`;
      
      return await this.sendTextMessage(to, thankYouMessage);
    } catch (error) {
      console.error('Erro ao enviar mensagem de agradecimento:', error);
      throw error;
    }
  }
}

module.exports = WhatsAppBusinessIntegration;
