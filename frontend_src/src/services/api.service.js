// Utilitário para chamadas API assíncronas
class ApiService {
  constructor() {
    this.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    this.token = localStorage.getItem('token');
  }

  // Configurar headers padrão
  getHeaders() {
    const headers = {
      'Content-Type': 'application/json',
    };
    
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    
    return headers;
  }

  // Método genérico para requisições
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: this.getHeaders(),
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.erro || `Erro HTTP: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('❌ Erro na requisição:', error);
      throw error;
    }
  }

  // Métodos CRUD
  async get(endpoint) {
    return this.request(endpoint, { method: 'GET' });
  }

  async post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async put(endpoint, data) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }

  // Upload de arquivos
  async upload(endpoint, formData) {
    const headers = {};
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    return this.request(endpoint, {
      method: 'POST',
      headers,
      body: formData,
    });
  }

  // Métodos específicos do sistema

  // Dashboard
  async getDashboardMetrics() {
    return this.get('/dashboard/metricas');
  }

  async getDashboardCharts(periodo = '30d') {
    return this.get(`/dashboard/graficos?periodo=${periodo}`);
  }

  async getNotifications(unreadOnly = false) {
    return this.get(`/dashboard/notificacoes?naoLidas=${unreadOnly}`);
  }

  async markNotificationRead(id) {
    return this.put(`/dashboard/notificacoes/${id}/lida`);
  }

  // Clientes
  async getClients() {
    return this.get('/clients');
  }

  async createClient(clientData) {
    return this.post('/clients', clientData);
  }

  async updateClient(id, clientData) {
    return this.put(`/clients/${id}`, clientData);
  }

  async deleteClient(id) {
    return this.delete(`/clients/${id}`);
  }

  // Orçamentos
  async getBudgets() {
    return this.get('/budgets');
  }

  async createBudget(budgetData) {
    return this.post('/budgets', budgetData);
  }

  async updateBudget(id, budgetData) {
    return this.put(`/budgets/${id}`, budgetData);
  }

  async deleteBudget(id) {
    return this.delete(`/budgets/${id}`);
  }

  // Contratos
  async getContracts() {
    return this.get('/contracts');
  }

  async createContract(contractData) {
    return this.post('/contracts', contractData);
  }

  async updateContract(id, contractData) {
    return this.put(`/contracts/${id}`, contractData);
  }

  async deleteContract(id) {
    return this.delete(`/contracts/${id}`);
  }

  // Visitas
  async getVisits() {
    return this.get('/visits');
  }

  async createVisit(visitData) {
    return this.post('/visits', visitData);
  }

  async updateVisit(id, visitData) {
    return this.put(`/visits/${id}`, visitData);
  }

  async deleteVisit(id) {
    return this.delete(`/visits/${id}`);
  }

  // Financeiro
  async getFinancialData() {
    return this.get('/financial');
  }

  async createFinancialEntry(entryData) {
    return this.post('/financial', entryData);
  }

  async updateFinancialEntry(id, entryData) {
    return this.put(`/financial/${id}`, entryData);
  }

  async deleteFinancialEntry(id) {
    return this.delete(`/financial/${id}`);
  }

  // Estoque
  async getInventory() {
    return this.get('/inventory');
  }

  async updateInventoryItem(id, itemData) {
    return this.put(`/inventory/${id}`, itemData);
  }

  // Equipe
  async getTeam() {
    return this.get('/teams');
  }

  async updateTeamMember(id, memberData) {
    return this.put(`/teams/${id}`, memberData);
  }

  // Autentique
  async sendDocumentForSignature(documentData) {
    return this.post('/autentique/enviar', documentData);
  }

  async getDocumentStatus(documentId) {
    return this.get(`/autentique/status/${documentId}`);
  }

  // Relatórios
  async generateReport(type, filters = {}) {
    return this.post('/reports/generate', { type, filters });
  }

  async downloadReport(reportId) {
    return this.get(`/reports/download/${reportId}`);
  }

  // Permissões
  async getUserPermissions() {
    return this.get('/permissoes/minhas');
  }

  async getRoles() {
    return this.get('/roles');
  }

  // Autenticação
  async login(credentials) {
    const response = await this.post('/auth/login', credentials);
    if (response.sucesso && response.dados.token) {
      this.token = response.dados.token;
      localStorage.setItem('token', this.token);
    }
    return response;
  }

  async logout() {
    this.token = null;
    localStorage.removeItem('token');
    return this.post('/auth/logout');
  }

  async refreshToken() {
    const response = await this.post('/auth/refresh');
    if (response.sucesso && response.dados.token) {
      this.token = response.dados.token;
      localStorage.setItem('token', this.token);
    }
    return response;
  }
}

// Instância global do serviço
const apiService = new ApiService();

export default apiService;

