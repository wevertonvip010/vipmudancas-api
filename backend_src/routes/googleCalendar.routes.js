const express = require('express');
const router = express.Router();
const { google } = require('googleapis');
const { OAuth2Client } = require('google-auth-library');
const mongoose = require('mongoose');
const auth = require('../middleware/auth.middleware');

// Modelos
const Usuario = require('../models/user.model');
const Visita = require('../models/visita.model');
const OrdemServico = require('../models/ordemServico.model');
const GoogleCalendarConfig = require('../models/googleCalendarConfig.model');

// Configurações do OAuth2
const oauth2Client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

// Escopo de acesso ao Google Calendar
const SCOPES = ['https://www.googleapis.com/auth/calendar'];

// Rota para obter URL de autenticação
router.get('/auth-url', auth, async (req, res) => {
  try {
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
      prompt: 'consent'
    });
    
    return res.status(200).json({ url: authUrl });
  } catch (error) {
    console.error('Erro ao gerar URL de autenticação:', error);
    return res.status(500).json({ message: 'Erro ao gerar URL de autenticação' });
  }
});

// Rota de callback para o OAuth2
router.get('/oauth2callback', async (req, res) => {
  const { code } = req.query;
  
  try {
    const { tokens } = await oauth2Client.getToken(code);
    
    // Armazenar tokens no banco de dados para o usuário atual
    // Nota: Em uma implementação real, você precisaria identificar o usuário correto
    // Aqui estamos apenas salvando para o primeiro usuário admin como exemplo
    const admin = await Usuario.findOne({ role: 'admin' });
    
    if (!admin) {
      return res.status(404).json({ message: 'Usuário administrador não encontrado' });
    }
    
    admin.googleTokens = tokens;
    await admin.save();
    
    // Redirecionar para a página de integração
    return res.redirect('/google-agenda');
  } catch (error) {
    console.error('Erro ao obter tokens:', error);
    return res.status(500).json({ message: 'Erro ao obter tokens de autenticação' });
  }
});

// Verificar status de autenticação
router.get('/auth-status', auth, async (req, res) => {
  try {
    const usuario = await Usuario.findById(req.usuario.id);
    
    if (!usuario) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }
    
    const authenticated = !!(usuario.googleTokens && usuario.googleTokens.access_token);
    
    return res.status(200).json({ authenticated });
  } catch (error) {
    console.error('Erro ao verificar status de autenticação:', error);
    return res.status(500).json({ message: 'Erro ao verificar status de autenticação' });
  }
});

// Obter lista de calendários
router.get('/calendars', auth, async (req, res) => {
  try {
    const usuario = await Usuario.findById(req.usuario.id);
    
    if (!usuario || !usuario.googleTokens) {
      return res.status(401).json({ message: 'Usuário não autenticado no Google Calendar' });
    }
    
    // Configurar cliente OAuth2 com os tokens do usuário
    oauth2Client.setCredentials(usuario.googleTokens);
    
    // Criar cliente do Calendar
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    
    // Obter lista de calendários
    const response = await calendar.calendarList.list();
    
    return res.status(200).json(response.data.items);
  } catch (error) {
    console.error('Erro ao obter calendários:', error);
    return res.status(500).json({ message: 'Erro ao obter calendários' });
  }
});

// Obter eventos de um calendário
router.get('/events', auth, async (req, res) => {
  const { calendarId } = req.query;
  
  if (!calendarId) {
    return res.status(400).json({ message: 'ID do calendário é obrigatório' });
  }
  
  try {
    const usuario = await Usuario.findById(req.usuario.id);
    
    if (!usuario || !usuario.googleTokens) {
      return res.status(401).json({ message: 'Usuário não autenticado no Google Calendar' });
    }
    
    // Configurar cliente OAuth2 com os tokens do usuário
    oauth2Client.setCredentials(usuario.googleTokens);
    
    // Criar cliente do Calendar
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    
    // Definir datas para busca (próximos 30 dias)
    const now = new Date();
    const timeMin = now.toISOString();
    const timeMax = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
    
    // Obter eventos
    const response = await calendar.events.list({
      calendarId,
      timeMin,
      timeMax,
      singleEvents: true,
      orderBy: 'startTime'
    });
    
    return res.status(200).json(response.data.items);
  } catch (error) {
    console.error('Erro ao obter eventos:', error);
    return res.status(500).json({ message: 'Erro ao obter eventos do calendário' });
  }
});

// Sincronizar visitas com o Google Calendar
router.post('/sync-visitas', auth, async (req, res) => {
  const { calendarId } = req.body;
  
  if (!calendarId) {
    return res.status(400).json({ message: 'ID do calendário é obrigatório' });
  }
  
  try {
    const usuario = await Usuario.findById(req.usuario.id);
    
    if (!usuario || !usuario.googleTokens) {
      return res.status(401).json({ message: 'Usuário não autenticado no Google Calendar' });
    }
    
    // Configurar cliente OAuth2 com os tokens do usuário
    oauth2Client.setCredentials(usuario.googleTokens);
    
    // Criar cliente do Calendar
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    
    // Buscar visitas agendadas
    const visitas = await Visita.find({ status: { $in: ['agendada', 'confirmada'] } })
      .populate('clienteId');
    
    // Obter configurações de notificação
    let config = await GoogleCalendarConfig.findOne({ usuarioId: req.usuario.id });
    
    if (!config) {
      config = {
        notificacaoEmail: true,
        notificacaoMinutos: 30
      };
    }
    
    // Criar ou atualizar eventos para cada visita
    const syncResults = [];
    
    for (const visita of visitas) {
      // Verificar se a visita já tem um eventId
      let eventId = visita.googleEventId;
      let method = 'insert';
      
      // Criar objeto do evento
      const event = {
        summary: `Visita: ${visita.clienteId.nome}`,
        location: `${visita.endereco}, ${visita.cidade}/${visita.estado}`,
        description: `Visita técnica para orçamento de mudança.\n\nDetalhes: ${visita.observacoes || 'Nenhuma observação adicional'}`,
        start: {
          dateTime: new Date(`${visita.data}T${visita.horario}`).toISOString(),
          timeZone: 'America/Sao_Paulo',
        },
        end: {
          // Duração padrão de 1 hora para visitas
          dateTime: new Date(new Date(`${visita.data}T${visita.horario}`).getTime() + 60 * 60 * 1000).toISOString(),
          timeZone: 'America/Sao_Paulo',
        },
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'popup', minutes: config.notificacaoMinutos },
          ],
        },
        // Adicionar metadados para identificar o tipo de evento
        extendedProperties: {
          private: {
            type: 'visita',
            visitaId: visita._id.toString(),
            systemEvent: 'true'
          }
        }
      };
      
      // Adicionar notificação por email se configurado
      if (config.notificacaoEmail) {
        event.reminders.overrides.push({ method: 'email', minutes: config.notificacaoMinutos });
      }
      
      try {
        let response;
        
        if (eventId) {
          // Atualizar evento existente
          method = 'update';
          response = await calendar.events.update({
            calendarId,
            eventId,
            resource: event,
          });
        } else {
          // Criar novo evento
          response = await calendar.events.insert({
            calendarId,
            resource: event,
          });
          
          // Salvar ID do evento no registro da visita
          visita.googleEventId = response.data.id;
          await visita.save();
        }
        
        syncResults.push({
          visitaId: visita._id,
          eventId: response.data.id,
          method,
          success: true
        });
      } catch (error) {
        console.error(`Erro ao sincronizar visita ${visita._id}:`, error);
        syncResults.push({
          visitaId: visita._id,
          method,
          success: false,
          error: error.message
        });
      }
    }
    
    // Atualizar status de sincronização
    await updateSyncStatus(req.usuario.id, { visitas: true });
    
    return res.status(200).json({
      message: `${syncResults.filter(r => r.success).length} visitas sincronizadas com sucesso`,
      results: syncResults
    });
  } catch (error) {
    console.error('Erro ao sincronizar visitas:', error);
    return res.status(500).json({ message: 'Erro ao sincronizar visitas com o Google Calendar' });
  }
});

// Sincronizar ordens de serviço com o Google Calendar
router.post('/sync-ordens', auth, async (req, res) => {
  const { calendarId } = req.body;
  
  if (!calendarId) {
    return res.status(400).json({ message: 'ID do calendário é obrigatório' });
  }
  
  try {
    const usuario = await Usuario.findById(req.usuario.id);
    
    if (!usuario || !usuario.googleTokens) {
      return res.status(401).json({ message: 'Usuário não autenticado no Google Calendar' });
    }
    
    // Configurar cliente OAuth2 com os tokens do usuário
    oauth2Client.setCredentials(usuario.googleTokens);
    
    // Criar cliente do Calendar
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    
    // Buscar ordens de serviço agendadas
    const ordens = await OrdemServico.find({ status: { $in: ['agendado', 'preparacao', 'transporte'] } })
      .populate('contratoId')
      .populate({
        path: 'contratoId',
        populate: {
          path: 'clienteId',
          model: 'Cliente'
        }
      });
    
    // Obter configurações de notificação
    let config = await GoogleCalendarConfig.findOne({ usuarioId: req.usuario.id });
    
    if (!config) {
      config = {
        notificacaoEmail: true,
        notificacaoMinutos: 30
      };
    }
    
    // Criar ou atualizar eventos para cada ordem de serviço
    const syncResults = [];
    
    for (const ordem of ordens) {
      // Verificar se a ordem já tem um eventId
      let eventId = ordem.googleEventId;
      let method = 'insert';
      
      // Criar objeto do evento
      const event = {
        summary: `Mudança: ${ordem.contratoId.clienteId.nome}`,
        location: `${ordem.enderecoOrigem}, ${ordem.cidadeOrigem}/${ordem.estadoOrigem} → ${ordem.enderecoDestino}, ${ordem.cidadeDestino}/${ordem.estadoDestino}`,
        description: `Serviço de mudança.\n\nDetalhes: ${ordem.observacoes || 'Nenhuma observação adicional'}`,
        start: {
          dateTime: new Date(`${ordem.dataAgendamento}T${ordem.horarioInicio}`).toISOString(),
          timeZone: 'America/Sao_Paulo',
        },
        end: {
          dateTime: new Date(`${ordem.dataAgendamento}T${ordem.horarioFim}`).toISOString(),
          timeZone: 'America/Sao_Paulo',
        },
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'popup', minutes: config.notificacaoMinutos },
          ],
        },
        // Adicionar metadados para identificar o tipo de evento
        extendedProperties: {
          private: {
            type: 'ordem',
            ordemId: ordem._id.toString(),
            systemEvent: 'true'
          }
        }
      };
      
      // Adicionar notificação por email se configurado
      if (config.notificacaoEmail) {
        event.reminders.overrides.push({ method: 'email', minutes: config.notificacaoMinutos });
      }
      
      try {
        let response;
        
        if (eventId) {
          // Atualizar evento existente
          method = 'update';
          response = await calendar.events.update({
            calendarId,
            eventId,
            resource: event,
          });
        } else {
          // Criar novo evento
          response = await calendar.events.insert({
            calendarId,
            resource: event,
          });
          
          // Salvar ID do evento no registro da ordem
          ordem.googleEventId = response.data.id;
          await ordem.save();
        }
        
        syncResults.push({
          ordemId: ordem._id,
          eventId: response.data.id,
          method,
          success: true
        });
      } catch (error) {
        console.error(`Erro ao sincronizar ordem ${ordem._id}:`, error);
        syncResults.push({
          ordemId: ordem._id,
          method,
          success: false,
          error: error.message
        });
      }
    }
    
    // Atualizar status de sincronização
    await updateSyncStatus(req.usuario.id, { ordensServico: true });
    
    return res.status(200).json({
      message: `${syncResults.filter(r => r.success).length} ordens de serviço sincronizadas com sucesso`,
      results: syncResults
    });
  } catch (error) {
    console.error('Erro ao sincronizar ordens de serviço:', error);
    return res.status(500).json({ message: 'Erro ao sincronizar ordens de serviço com o Google Calendar' });
  }
});

// Sincronizar tudo
router.post('/sync-all', auth, async (req, res) => {
  const { calendarId } = req.body;
  
  if (!calendarId) {
    return res.status(400).json({ message: 'ID do calendário é obrigatório' });
  }
  
  try {
    // Sincronizar visitas
    const visitasResponse = await syncVisitas(req.usuario.id, calendarId);
    
    // Sincronizar ordens de serviço
    const ordensResponse = await syncOrdens(req.usuario.id, calendarId);
    
    // Atualizar status de sincronização
    await updateSyncStatus(req.usuario.id, { 
      visitas: true, 
      ordensServico: true,
      lastSync: new Date()
    });
    
    return res.status(200).json({
      visitas: visitasResponse,
      ordens: ordensResponse
    });
  } catch (error) {
    console.error('Erro ao sincronizar tudo:', error);
    return res.status(500).json({ message: 'Erro ao sincronizar com o Google Calendar' });
  }
});

// Obter status de sincronização
router.get('/sync-status', auth, async (req, res) => {
  try {
    let syncStatus = await GoogleCalendarConfig.findOne(
      { usuarioId: req.usuario.id },
      { visitas: 1, ordensServico: 1, lastSync: 1 }
    );
    
    if (!syncStatus) {
      syncStatus = {
        visitas: false,
        ordensServico: false,
        lastSync: null
      };
    }
    
    return res.status(200).json(syncStatus);
  } catch (error) {
    console.error('Erro ao obter status de sincronização:', error);
    return res.status(500).json({ message: 'Erro ao obter status de sincronização' });
  }
});

// Obter configurações
router.get('/config', auth, async (req, res) => {
  try {
    let config = await GoogleCalendarConfig.findOne({ usuarioId: req.usuario.id });
    
    if (!config) {
      config = {
        defaultCalendarId: '',
        syncVisitas: true,
        syncOrdensServico: true,
        notificacaoEmail: true,
        notificacaoMinutos: 30
      };
    }
    
    return res.status(200).json(config);
  } catch (error) {
    console.error('Erro ao obter configurações:', error);
    return res.status(500).json({ message: 'Erro ao obter configurações' });
  }
});

// Salvar configurações
router.post('/config', auth, async (req, res) => {
  try {
    const { 
      defaultCalendarId, 
      syncVisitas, 
      syncOrdensServico, 
      notificacaoEmail, 
      notificacaoMinutos 
    } = req.body;
    
    let config = await GoogleCalendarConfig.findOne({ usuarioId: req.usuario.id });
    
    if (config) {
      // Atualizar configuração existente
      config.defaultCalendarId = defaultCalendarId;
      config.syncVisitas = syncVisitas;
      config.syncOrdensServico = syncOrdensServico;
      config.notificacaoEmail = notificacaoEmail;
      config.notificacaoMinutos = notificacaoMinutos;
    } else {
      // Criar nova configuração
      config = new GoogleCalendarConfig({
        usuarioId: req.usuario.id,
        defaultCalendarId,
        syncVisitas,
        syncOrdensServico,
        notificacaoEmail,
        notificacaoMinutos
      });
    }
    
    await config.save();
    
    return res.status(200).json({ message: 'Configurações salvas com sucesso', config });
  } catch (error) {
    console.error('Erro ao salvar configurações:', error);
    return res.status(500).json({ message: 'Erro ao salvar configurações' });
  }
});

// Função auxiliar para sincronizar visitas
async function syncVisitas(usuarioId, calendarId) {
  // Implementação similar à rota /sync-visitas
  // Retorna resultados da sincronização
}

// Função auxiliar para sincronizar ordens de serviço
async function syncOrdens(usuarioId, calendarId) {
  // Implementação similar à rota /sync-ordens
  // Retorna resultados da sincronização
}

// Função auxiliar para atualizar status de sincronização
async function updateSyncStatus(usuarioId, updates) {
  try {
    let config = await GoogleCalendarConfig.findOne({ usuarioId });
    
    if (config) {
      // Atualizar campos existentes
      Object.assign(config, updates);
    } else {
      // Criar nova configuração
      config = new GoogleCalendarConfig({
        usuarioId,
        ...updates
      });
    }
    
    await config.save();
    return true;
  } catch (error) {
    console.error('Erro ao atualizar status de sincronização:', error);
    return false;
  }
}

module.exports = router;
