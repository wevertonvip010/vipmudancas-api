# VIP MUDANÇAS v2.5 - PLANO DE IMPLEMENTAÇÃO

## 🎯 OBJETIVO GERAL
Implementar sistema de gamificação, formulário inteligente, integração Google Drive e avaliação pós-serviço, mantendo total compatibilidade com funcionalidades existentes.

## 🔧 FUNCIONALIDADES A IMPLEMENTAR

### 1. 🏆 SISTEMA DE GAMIFICAÇÃO PARA VENDEDORES

#### Backend:
- **Model:** `gamificacao.model.js`
  - Pontuação por vendedor
  - Histórico semanal/mensal
  - Recordes e conquistas

- **Controller:** `gamificacao.controller.js`
  - Cálculo automático de pontos
  - Ranking semanal
  - Estatísticas de performance

- **Routes:** `gamificacao.routes.js`
  - GET /api/gamificacao/ranking
  - GET /api/gamificacao/vendedor/:id
  - POST /api/gamificacao/atualizar-pontos

#### Regras de Pontuação:
- Proposta enviada: +5 pontos
- Contrato fechado: +20 pontos
- Avaliação 4+ estrelas: +10 pontos

#### Frontend:
- Painel na aba "Vendas"
- Ranking visual com posições
- Destaques: Vendedor da Semana, Recordes
- Exportação PDF

### 2. 🎯 FORMULÁRIO INTELIGENTE DE CAPTAÇÃO

#### Backend:
- **Model:** `leadSite.model.js`
  - Dados do formulário
  - Estimativa automática
  - Status de qualificação

- **Controller:** `leadSite.controller.js`
  - Processamento do formulário
  - Cálculo de estimativa
  - Notificação para vendedores

#### Campos do Formulário:
- Tipo de imóvel (casa/apartamento)
- Volume (baixo/médio/alto)
- Andares origem/destino
- Necessita içamento (sim/não)
- Data da mudança
- Bairros origem/destino
- Dados de contato

#### Estimativa Automática:
- Base: R$ 800 (casa) / R$ 1.200 (apartamento)
- Volume baixo: +0% / médio: +30% / alto: +60%
- Andar adicional: +R$ 150
- Içamento: +R$ 300

### 3. ☁️ INTEGRAÇÃO GOOGLE DRIVE

#### Backend:
- **Service:** `googleDrive.service.js`
  - Autenticação OAuth2
  - Criação de pastas
  - Upload de documentos

- **Controller:** `googleDrive.controller.js`
  - Gerenciamento de arquivos
  - Links de acesso
  - Sincronização

#### Funcionalidades:
- Pasta automática por cliente
- Upload: Contrato, OS, Recibo
- Links diretos para acesso
- Prevenção de duplicação

### 4. ⭐ MÓDULO DE AVALIAÇÃO PÓS-SERVIÇO

#### Backend:
- **Model:** `avaliacao.model.js`
  - Nota (1-5 estrelas)
  - Comentário livre
  - Data da avaliação
  - Cliente/Vendedor

- **Controller:** `avaliacao.controller.js`
  - Geração de links
  - Processamento de avaliações
  - Relatórios mensais

#### Frontend:
- Página pública de avaliação
- Integração com ranking
- Relatórios no painel admin

## 🔒 PADRÕES TÉCNICOS OBRIGATÓRIOS

### Codificação:
- UTF-8 com quebras Unix (\n)
- Async/await + try/catch
- Respostas: res.status(x).json({ sucesso, dados, erro })

### Estrutura:
- backend_src/controllers/
- backend_src/routes/
- backend_src/models/
- frontend_src/src/

### Testes:
- npm install && node server.js (backend)
- pnpm run dev (frontend)

## 📋 CRONOGRAMA DE IMPLEMENTAÇÃO

### Fase 1: Análise e Planejamento ✅
- Estrutura atual analisada
- Plano detalhado criado

### Fase 2: Sistema de Gamificação
- Models e Controllers
- Lógica de pontuação
- Interface de ranking

### Fase 3: Formulário Inteligente
- Página de captação
- Cálculo de estimativas
- Integração com vendas

### Fase 4: Google Drive API
- Configuração OAuth2
- Upload automático
- Gerenciamento de pastas

### Fase 5: Avaliação Pós-Serviço
- Sistema de avaliação
- Links automáticos
- Relatórios

### Fase 6: Testes e Validação
- Testes locais completos
- Validação de compatibilidade
- Empacotamento final

## 🎯 ENTREGÁVEIS

### Arquivo Final:
`vip-mudancas-v2.5-final.zip`

### Conteúdo:
- Backend completo atualizado
- Frontend com novas funcionalidades
- Documentação técnica
- Guia de instalação
- Scripts de teste

## ⚠️ REGRAS DE COMPATIBILIDADE

### Não Alterar:
- IA VIP Assistant
- Integração Google Agenda
- Layout atual do sistema
- Funcionalidades existentes

### Manter:
- Estrutura de dados atual
- APIs existentes
- Fluxos de trabalho
- Autenticação JWT

## 🚀 PRÓXIMOS PASSOS

1. Implementar sistema de gamificação
2. Desenvolver formulário inteligente
3. Configurar Google Drive API
4. Criar módulo de avaliação
5. Testes e validação final
6. Empacotamento e entrega

---

**Status:** Em desenvolvimento
**Versão:** 2.5
**Data:** Janeiro 2025

