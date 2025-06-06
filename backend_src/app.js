const express = require('express');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger.vipmudancas_completo_20250605165109.json');
const routes = require('./routes');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 🟢 Health Check
app.get('/health', (req, res) => {
  res.status(200).json({
    sucesso: true,
    dados: {
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    },
    erro: null,
  });
});

// 🌐 Mensagem padrão na raiz
app.get('/', (req, res) => {
  res.send('🚛 API VIP Mudanças ativa! Acesse /api para usar as rotas.');
});

// 🛣️ Rotas principais
app.use('/api', routes);

// 📄 Documentação Swagger
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

module.exports = app;
