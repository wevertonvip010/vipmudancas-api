# 🚀 GUIA DE INSTALAÇÃO RÁPIDA

## ⚡ **EXECUÇÃO RÁPIDA (5 MINUTOS)**

### **1. Pré-requisitos**
```bash
# Verificar Node.js
node --version  # Deve ser 16+

# Instalar/Iniciar MongoDB
sudo systemctl start mongod
# ou
mongod
```

### **2. Configurar Backend**
```bash
# Navegar para backend
cd backend_src

# Instalar dependências
npm install

# Configurar ambiente
cp ../backend.env.example .env

# Editar .env (mínimo necessário):
# MONGODB_URI=mongodb://localhost:27017/sistema-mudancas
# JWT_SECRET=sua_chave_secreta_aqui
# PORT=5000

# Iniciar backend
npm start
```

### **3. Configurar Frontend**
```bash
# Abrir novo 
# Navegar para frontend
cd frontend_src

# Instalar dependências
npm install

# Iniciar frontend
npm run dev
```

### **4. Acessar Sistema**
- **Frontend:** http://localhost:5173
- **Backend:** http://localhost:5000

---

## 🔧 **CONFIGURAÇÃO MÍNIMA (.env)**

### **backend_src/.env**
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/sistema-mudancas
JWT_SECRET=vip_mudancas_2024_super_secret_key
```

### **frontend_src/.env (opcional)**
```env
VITE_GA_TRACKING_ID=G-DEVELOPMENT
VITE_API_URL=http://localhost:5000/api
```

---

## ✅ **VERIFICAÇÃO RÁPIDA**

### **Testar Backend:**
```bash
curl http://localhost:5000/health
# Deve retornar: {"status":"OK"}
```

### **Testar Frontend:**
- Acessar http://localhost:5173
- Verificar se carrega sem erros

---

## 🚨 **SOLUÇÃO DE PROBLEMAS**

### **MongoDB não conecta:**
```bash
# Ubuntu/Debian:
sudo systemctl start mongod
sudo systemctl enable mongod

# macOS:
brew services start mongodb-community

# Windows:
net start MongoDB
```

### **Porta ocupada:**
```bash
# Verificar processo na porta
lsof -i :5000
lsof -i :5173

# Matar processo se necessário
kill -9 <PID>
```

### **Dependências com erro:**
```bash
# Limpar cache e reinstalar
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

---

## 🎯 **PRÓXIMOS PASSOS**

1. ✅ **Sistema funcionando** - Frontend + Backend
2. 🔧 **Personalizar dados** conforme sua empresa
3. 📊 **Configurar Google Analytics** (opcional)
4. 📅 **Integrar Google Agenda** (próxima etapa)
5. 🤖 **Testes com IA** (próxima etapa)

---

## 📞 **SUPORTE RÁPIDO**

**Problemas mais comuns:**
- MongoDB não instalado → `sudo apt install mongodb`
- Node.js desatualizado → Atualizar para 16+
- Portas ocupadas → Verificar com `lsof -i :PORTA`
- Permissões → `sudo chown -R $USER:$USER .`

**Sistema pronto em 5 minutos!** 🚀

