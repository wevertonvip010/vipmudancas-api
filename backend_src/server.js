const http = require('http');
const app = require('./app');

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

server.listen(PORT, () => {
  console.log('✅ Servidor VIP Mudanças rodando na porta', PORT);
  console.log('📊 Dashboard: http://localhost:' + PORT);
  console.log('📚 API Docs: http://localhost:' + PORT + '/api/docs');
  console.log('🩺 Health Check: http://localhost:' + PORT + '/health');
});
