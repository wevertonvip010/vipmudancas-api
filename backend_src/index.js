// Arquivo principal para integração dos módulos SAP Business One
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

// Importação dos modelos SAP Business One
const FinanceiroSAP = require('./models/FinanceiroSAP');
const VendasCRM = require('./models/VendasCRM');
const ComprasEstoque = require('./models/ComprasEstoque');
const ProducaoMRP = require('./models/ProducaoMRP');
const RelatoriosBI = require('./models/RelatoriosBI');
const Mobilidade = require('./models/Mobilidade');
const Personalizacao = require('./models/Personalizacao');

// Configuração do ambiente
dotenv.config();
const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Conexão com o banco de dados
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sistema_mudancas', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('Conexão com MongoDB estabelecida com sucesso'))
.catch(err => console.error('Erro ao conectar ao MongoDB:', err));

// Rotas básicas para teste
app.get('/api/sap/status', (req, res) => {
  res.json({
    status: 'online',
    modulos: [
      'Financeiro',
      'Vendas e CRM',
      'Compras e Estoques',
      'Produção e MRP',
      'Relatórios e BI',
      'Mobilidade',
      'Personalização'
    ],
    versao: '1.0.0',
    data_atualizacao: new Date()
  });
});

// Inicialização do servidor
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
  console.log('Integração SAP Business One inicializada com sucesso');
});

module.exports = app;
