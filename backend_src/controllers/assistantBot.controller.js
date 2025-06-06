const AssistantBot = require('../models/assistantBot.model');
const User = require('../models/user.model');
const OpenAI = require('openai');

// Configuração da API OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'sk-sua-chave-aqui', // Substituir em produção
});

// Obter configuração do assistente
exports.getAssistantConfig = async (req, res) => {
  try {
    let assistant = await AssistantBot.findOne();
    
    // Se não existir, criar uma configuração padrão
    if (!assistant) {
      assistant = await createDefaultAssistant();
    }
    
    res.json(assistant);
  } catch (error) {
    console.error('Erro ao obter configuração do assistente:', error);
    res.status(500).json({ message: 'Erro ao obter configuração do assistente.' });
  }
};

// Atualizar configuração geral do assistente
exports.updateAssistantConfig = async (req, res) => {
  try {
    const { nome, ativo, configuracoes } = req.body;
    
    let assistant = await AssistantBot.findOne();
    
    // Se não existir, criar uma configuração padrão
    if (!assistant) {
      assistant = await createDefaultAssistant();
    }
    
    // Atualizar campos
    if (nome) assistant.nome = nome;
    if (ativo !== undefined) assistant.ativo = ativo;
    if (configuracoes) {
      assistant.configuracoes = {
        ...assistant.configuracoes,
        ...configuracoes
      };
    }
    
    assistant.ultimaAtualizacao = Date.now();
    await assistant.save();
    
    res.json({
      message: 'Configuração do assistente atualizada com sucesso',
      assistant
    });
  } catch (error) {
    console.error('Erro ao atualizar configuração do assistente:', error);
    res.status(500).json({ message: 'Erro ao atualizar configuração do assistente.' });
  }
};

// Adicionar ou atualizar departamento
exports.upsertDepartamento = async (req, res) => {
  try {
    const { nome, ativo, configuracoes } = req.body;
    
    if (!nome) {
      return res.status(400).json({ message: 'Nome do departamento é obrigatório.' });
    }
    
    let assistant = await AssistantBot.findOne();
    
    // Se não existir, criar uma configuração padrão
    if (!assistant) {
      assistant = await createDefaultAssistant();
    }
    
    // Verificar se o departamento já existe
    const depIndex = assistant.departamentos.findIndex(d => d.nome === nome);
    
    if (depIndex >= 0) {
      // Atualizar departamento existente
      if (ativo !== undefined) assistant.departamentos[depIndex].ativo = ativo;
      if (configuracoes) {
        assistant.departamentos[depIndex].configuracoes = new Map(Object.entries(configuracoes));
      }
    } else {
      // Adicionar novo departamento
      assistant.departamentos.push({
        nome,
        ativo: ativo !== undefined ? ativo : true,
        configuracoes: configuracoes ? new Map(Object.entries(configuracoes)) : new Map(),
        baseConhecimento: []
      });
    }
    
    assistant.ultimaAtualizacao = Date.now();
    await assistant.save();
    
    res.json({
      message: depIndex >= 0 ? 'Departamento atualizado com sucesso' : 'Departamento adicionado com sucesso',
      assistant
    });
  } catch (error) {
    console.error('Erro ao gerenciar departamento:', error);
    res.status(500).json({ message: 'Erro ao gerenciar departamento.' });
  }
};

// Adicionar item à base de conhecimento de um departamento
exports.addKnowledgeItem = async (req, res) => {
  try {
    const { departamento, tipo, titulo, conteudo, tags, contexto } = req.body;
    
    if (!departamento || !tipo || !titulo || !conteudo) {
      return res.status(400).json({ 
        message: 'Departamento, tipo, título e conteúdo são obrigatórios.' 
      });
    }
    
    let assistant = await AssistantBot.findOne();
    
    // Se não existir, criar uma configuração padrão
    if (!assistant) {
      assistant = await createDefaultAssistant();
    }
    
    // Verificar se o departamento existe
    const depIndex = assistant.departamentos.findIndex(d => d.nome === departamento);
    
    if (depIndex < 0) {
      return res.status(404).json({ message: 'Departamento não encontrado.' });
    }
    
    // Adicionar item à base de conhecimento
    assistant.departamentos[depIndex].baseConhecimento.push({
      tipo,
      titulo,
      conteudo,
      tags: tags || [],
      contexto: contexto || '',
      dataCriacao: Date.now(),
      ultimaAtualizacao: Date.now(),
      criadoPor: req.userId
    });
    
    assistant.ultimaAtualizacao = Date.now();
    await assistant.save();
    
    res.status(201).json({
      message: 'Item adicionado à base de conhecimento com sucesso',
      item: assistant.departamentos[depIndex].baseConhecimento[
        assistant.departamentos[depIndex].baseConhecimento.length - 1
      ]
    });
  } catch (error) {
    console.error('Erro ao adicionar item à base de conhecimento:', error);
    res.status(500).json({ message: 'Erro ao adicionar item à base de conhecimento.' });
  }
};

// Consultar o assistente
exports.consultarAssistente = async (req, res) => {
  try {
    const { consulta, departamento, contexto } = req.body;
    
    if (!consulta) {
      return res.status(400).json({ message: 'Consulta é obrigatória.' });
    }
    
    let assistant = await AssistantBot.findOne();
    
    // Se não existir, criar uma configuração padrão
    if (!assistant) {
      assistant = await createDefaultAssistant();
    }
    
    // Verificar se o assistente está ativo
    if (!assistant.ativo) {
      return res.status(403).json({ message: 'O assistente está desativado no momento.' });
    }
    
    // Se um departamento foi especificado, verificar se existe e está ativo
    let depIndex = -1;
    if (departamento) {
      depIndex = assistant.departamentos.findIndex(d => d.nome === departamento);
      
      if (depIndex < 0) {
        return res.status(404).json({ message: 'Departamento não encontrado.' });
      }
      
      if (!assistant.departamentos[depIndex].ativo) {
        return res.status(403).json({ message: 'O assistente está desativado para este departamento.' });
      }
    }
    
    // Construir o contexto para a consulta
    let promptContext = '';
    
    // Adicionar informações do departamento se especificado
    if (depIndex >= 0) {
      // Adicionar base de conhecimento relevante
      const baseConhecimento = assistant.departamentos[depIndex].baseConhecimento;
      
      // Filtrar itens relevantes com base em tags ou conteúdo
      const palavrasChave = consulta.toLowerCase().split(' ');
      const itensRelevantes = baseConhecimento.filter(item => {
        // Verificar se alguma tag corresponde às palavras-chave
        const temTagRelevante = item.tags.some(tag => 
          palavrasChave.some(palavra => tag.toLowerCase().includes(palavra))
        );
        
        // Verificar se o título ou conteúdo contém palavras-chave
        const temConteudoRelevante = 
          palavrasChave.some(palavra => 
            item.titulo.toLowerCase().includes(palavra) || 
            item.conteudo.toLowerCase().includes(palavra)
          );
        
        return temTagRelevante || temConteudoRelevante;
      });
      
      // Adicionar itens relevantes ao contexto
      if (itensRelevantes.length > 0) {
        promptContext += `\nBase de conhecimento do departamento ${departamento}:\n`;
        
        itensRelevantes.forEach(item => {
          promptContext += `\n[${item.tipo.toUpperCase()}] ${item.titulo}\n${item.conteudo}\n`;
        });
      }
    }
    
    // Adicionar contexto específico da aplicação, se fornecido
    if (contexto) {
      promptContext += `\nContexto atual: ${JSON.stringify(contexto)}\n`;
    }
    
    // Construir o prompt completo
    const prompt = `Você é o VIP Assistant, um assistente inteligente para a empresa VIP Mudanças e VIP Storage.
${departamento ? `Você está ajudando um usuário do departamento de ${departamento}.` : ''}

${promptContext}

Por favor, forneça uma resposta útil, prática e técnica para a seguinte consulta:
${consulta}

${departamento === 'vendas' ? 'Se a consulta estiver relacionada a um orçamento não fechado, forneça quebras de objeções específicas para ajudar o vendedor a ter êxito em futuras negociações.' : ''}
${departamento === 'financeiro' ? 'Se a consulta estiver relacionada a análise financeira, forneça insights práticos e sugestões de otimização.' : ''}
${departamento === 'operacional' ? 'Se a consulta estiver relacionada a operações, forneça dicas práticas para melhorar a eficiência e qualidade do serviço.' : ''}
${departamento === 'storage' ? 'Se a consulta estiver relacionada ao self storage, forneça informações sobre melhores práticas de gestão e atendimento ao cliente.' : ''}

Sua resposta deve ser:
1. Prática e aplicável imediatamente
2. Específica para o contexto da empresa
3. Baseada em conhecimento técnico do setor
4. Formatada de maneira clara e organizada`;

    // Chamar a API da OpenAI para gerar a resposta
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: prompt },
        { role: "user", content: consulta }
      ],
      max_tokens: 1000,
      temperature: 0.7,
    });
    
    const resposta = completion.choices[0].message.content;
    
    // Registrar a interação
    assistant.historicoInteracoes.push({
      usuario: req.userId,
      departamento: departamento || 'geral',
      consulta,
      resposta,
      data: Date.now(),
      contexto: contexto || {}
    });
    
    // Atualizar estatísticas
    assistant.estatisticas.totalConsultas += 1;
    
    // Atualizar contagem por departamento
    const depName = departamento || 'geral';
    const depCount = assistant.estatisticas.consultasPorDepartamento.get(depName) || 0;
    assistant.estatisticas.consultasPorDepartamento.set(depName, depCount + 1);
    
    // Atualizar top consultas
    const consultaSimplificada = consulta.toLowerCase().trim();
    const topConsultaIndex = assistant.estatisticas.topConsultas.findIndex(
      tc => tc.consulta.toLowerCase() === consultaSimplificada
    );
    
    if (topConsultaIndex >= 0) {
      assistant.estatisticas.topConsultas[topConsultaIndex].contagem += 1;
    } else {
      assistant.estatisticas.topConsultas.push({
        consulta: consultaSimplificada,
        contagem: 1
      });
    }
    
    // Ordenar top consultas
    assistant.estatisticas.topConsultas.sort((a, b) => b.contagem - a.contagem);
    
    // Limitar a 20 top consultas
    if (assistant.estatisticas.topConsultas.length > 20) {
      assistant.estatisticas.topConsultas = assistant.estatisticas.topConsultas.slice(0, 20);
    }
    
    assistant.ultimaAtualizacao = Date.now();
    await assistant.save();
    
    res.json({
      resposta,
      interacaoId: assistant.historicoInteracoes[assistant.historicoInteracoes.length - 1]._id
    });
  } catch (error) {
    console.error('Erro ao consultar assistente:', error);
    res.status(500).json({ message: 'Erro ao consultar assistente.' });
  }
};

// Avaliar resposta do assistente
exports.avaliarResposta = async (req, res) => {
  try {
    const { interacaoId, util, comentario } = req.body;
    
    if (!interacaoId) {
      return res.status(400).json({ message: 'ID da interação é obrigatório.' });
    }
    
    let assistant = await AssistantBot.findOne();
    
    if (!assistant) {
      return res.status(404).json({ message: 'Assistente não encontrado.' });
    }
    
    // Encontrar a interação
    const interacaoIndex = assistant.historicoInteracoes.findIndex(
      i => i._id.toString() === interacaoId
    );
    
    if (interacaoIndex < 0) {
      return res.status(404).json({ message: 'Interação não encontrada.' });
    }
    
    // Atualizar avaliação
    assistant.historicoInteracoes[interacaoIndex].avaliacao = {
      util: util !== undefined ? util : null,
      comentario: comentario || ''
    };
    
    // Atualizar estatísticas
    if (util !== undefined) {
      if (util) {
        assistant.estatisticas.avaliacoesPositivas += 1;
      } else {
        assistant.estatisticas.avaliacoesNegativas += 1;
      }
    }
    
    assistant.ultimaAtualizacao = Date.now();
    await assistant.save();
    
    res.json({
      message: 'Avaliação registrada com sucesso',
      avaliacao: assistant.historicoInteracoes[interacaoIndex].avaliacao
    });
  } catch (error) {
    console.error('Erro ao avaliar resposta:', error);
    res.status(500).json({ message: 'Erro ao avaliar resposta.' });
  }
};

// Obter estatísticas do assistente
exports.getEstatisticas = async (req, res) => {
  try {
    const assistant = await AssistantBot.findOne();
    
    if (!assistant) {
      return res.status(404).json({ message: 'Assistente não encontrado.' });
    }
    
    res.json(assistant.estatisticas);
  } catch (error) {
    console.error('Erro ao obter estatísticas:', error);
    res.status(500).json({ message: 'Erro ao obter estatísticas.' });
  }
};

// Função auxiliar para criar assistente com configuração padrão
async function createDefaultAssistant() {
  const departamentosDefault = [
    {
      nome: 'vendas',
      ativo: true,
      configuracoes: new Map(),
      baseConhecimento: [
        {
          tipo: 'objecao',
          titulo: 'Preço alto',
          conteudo: 'Quando o cliente diz que o preço está alto, destaque o valor agregado do serviço premium, a segurança e a garantia oferecida. Compare com o custo de problemas que podem ocorrer com empresas mais baratas.',
          tags: ['preço', 'caro', 'valor', 'orçamento'],
          dataCriacao: Date.now(),
          ultimaAtualizacao: Date.now()
        },
        {
          tipo: 'objecao',
          titulo: 'Preciso pensar mais',
          conteudo: 'Quando o cliente diz que precisa pensar mais, ofereça um desconto por tempo limitado ou um serviço adicional gratuito para incentivar a decisão imediata. Pergunte quais são as dúvidas específicas para poder esclarecê-las.',
          tags: ['indecisão', 'pensar', 'tempo', 'decidir'],
          dataCriacao: Date.now(),
          ultimaAtualizacao: Date.now()
        },
        {
          tipo: 'script',
          titulo: 'Apresentação de orçamento',
          conteudo: 'Ao apresentar o orçamento, sempre destaque primeiro os benefícios e diferenciais do serviço antes de mencionar o valor. Explique detalhadamente o que está incluso e por que nosso serviço vale o investimento.',
          tags: ['orçamento', 'apresentação', 'valor'],
          dataCriacao: Date.now(),
          ultimaAtualizacao: Date.now()
        }
      ]
    },
    {
      nome: 'financeiro',
      ativo: true,
      configuracoes: new Map(),
      baseConhecimento: [
        {
          tipo: 'procedimento',
          titulo: 'Análise de inadimplência',
          conteudo: 'Para reduzir a inadimplência, analise o histórico de pagamentos dos clientes, identifique padrões e implemente políticas preventivas como descontos para pagamento antecipado e comunicação proativa antes do vencimento.',
          tags: ['inadimplência', 'pagamento', 'atraso'],
          dataCriacao: Date.now(),
          ultimaAtualizacao: Date.now()
        }
      ]
    },
    {
      nome: 'operacional',
      ativo: true,
      configuracoes: new Map(),
      baseConhecimento: [
        {
          tipo: 'procedimento',
          titulo: 'Otimização de rotas',
          conteudo: 'Para otimizar rotas de mudança, utilize o sistema de planejamento para agrupar serviços por região, considere o horário de tráfego e mantenha comunicação constante com a equipe em campo para ajustes em tempo real.',
          tags: ['rota', 'otimização', 'planejamento'],
          dataCriacao: Date.now(),
          ultimaAtualizacao: Date.now()
        }
      ]
    },
    {
      nome: 'storage',
      ativo: true,
      configuracoes: new Map(),
      baseConhecimento: [
        {
          tipo: 'procedimento',
          titulo: 'Gestão de ocupação',
          conteudo: 'Para maximizar a ocupação do self storage, implemente uma política de preços dinâmicos baseada na demanda sazonal, ofereça promoções para contratos de longo prazo e mantenha um programa de indicação com benefícios para clientes atuais.',
          tags: ['ocupação', 'gestão', 'boxes'],
          dataCriacao: Date.now(),
          ultimaAtualizacao: Date.now()
        }
      ]
    }
  ];

  const assistant = new AssistantBot({
    nome: 'VIP Assistant',
    ativo: true,
    configuracoes: {
      respostasAutomaticas: true,
      notificacoesProativas: true,
      frequenciaAnalise: 'emTempo',
      limiarAlerta: 80
    },
    departamentos: departamentosDefault,
    historicoInteracoes: [],
    estatisticas: {
      totalConsultas: 0,
      consultasPorDepartamento: new Map(),
      avaliacoesPositivas: 0,
      avaliacoesNegativas: 0,
      topConsultas: []
    }
  });

  return await assistant.save();
}
