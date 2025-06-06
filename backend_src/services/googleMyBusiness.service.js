const axios = require('axios');
const { google } = require('googleapis');
const { OAuth2Client } = require('google-auth-library');

class GoogleMyBusinessIntegration {
  constructor(clientId, clientSecret, redirectUri) {
    this.oauth2Client = new OAuth2Client(
      clientId,
      clientSecret,
      redirectUri
    );
    
    // Escopo para acesso ao Google My Business
    this.SCOPES = [
      'https://www.googleapis.com/auth/business.manage'
    ];
  }
  
  /**
   * Gera URL para autenticação OAuth2
   */
  generateAuthUrl() {
    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: this.SCOPES,
      prompt: 'consent'
    });
  }
  
  /**
   * Obtém tokens a partir do código de autorização
   */
  async getTokens(code) {
    const { tokens } = await this.oauth2Client.getToken(code);
    return tokens;
  }
  
  /**
   * Configura cliente OAuth2 com tokens
   */
  setCredentials(tokens) {
    this.oauth2Client.setCredentials(tokens);
  }
  
  /**
   * Lista contas do usuário
   */
  async listAccounts() {
    try {
      const mybusiness = google.mybusinessaccountmanagement({
        version: 'v1',
        auth: this.oauth2Client
      });
      
      const response = await mybusiness.accounts.list();
      return response.data.accounts || [];
    } catch (error) {
      console.error('Erro ao listar contas:', error);
      throw error;
    }
  }
  
  /**
   * Lista locais de uma conta
   */
  async listLocations(accountName) {
    try {
      const mybusiness = google.mybusinessplaceactions({
        version: 'v1',
        auth: this.oauth2Client
      });
      
      const response = await mybusiness.locations.list({
        parent: accountName
      });
      
      return response.data.locations || [];
    } catch (error) {
      console.error('Erro ao listar locais:', error);
      throw error;
    }
  }
  
  /**
   * Obtém avaliações de um local
   */
  async getReviews(locationName) {
    try {
      const mybusiness = google.mybusiness({
        version: 'v4',
        auth: this.oauth2Client
      });
      
      const response = await mybusiness.accounts.locations.reviews.list({
        parent: locationName
      });
      
      return response.data.reviews || [];
    } catch (error) {
      console.error('Erro ao obter avaliações:', error);
      throw error;
    }
  }
  
  /**
   * Responde a uma avaliação
   */
  async replyToReview(reviewName, comment) {
    try {
      const mybusiness = google.mybusiness({
        version: 'v4',
        auth: this.oauth2Client
      });
      
      const response = await mybusiness.accounts.locations.reviews.updateReply({
        name: `${reviewName}/reply`,
        resource: {
          comment: comment
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Erro ao responder avaliação:', error);
      throw error;
    }
  }
  
  /**
   * Configura webhook para receber notificações de novas avaliações
   */
  async setupWebhook(accountName, webhookUrl) {
    // Nota: Esta é uma implementação simplificada
    // A API do Google My Business não oferece suporte nativo a webhooks
    // Na prática, seria necessário implementar uma solução de polling
    
    console.log(`Configurando webhook para ${accountName} em ${webhookUrl}`);
    return {
      success: true,
      message: 'Webhook configurado com sucesso (simulação)'
    };
  }
}

module.exports = GoogleMyBusinessIntegration;
