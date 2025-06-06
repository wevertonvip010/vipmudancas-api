import { useState, useCallback } from 'react';

export const useWhatsApp = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Função para fazer requisições à API
  const apiRequest = useCallback(async (url, options = {}) => {
    const token = localStorage.getItem('token');
    
    const defaultOptions = {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers
      }
    };

    const response = await fetch(url, { ...defaultOptions, ...options });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.erro || `Erro HTTP: ${response.status}`);
    }

    return response.json();
  }, []);

  // Gerar link para envio de documentos
  const gerarLinkDocumentos = useCallback(async (contratoId) => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await apiRequest(`/api/whatsapp/contrato/${contratoId}/documentos`);
      return data.dados;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [apiRequest]);

  // Gerar link para avaliação interna
  const gerarLinkAvaliacaoInterna = useCallback(async (contratoId) => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await apiRequest(`/api/whatsapp/contrato/${contratoId}/avaliacao-interna`);
      return data.dados;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [apiRequest]);

  // Gerar link para avaliação no Google
  const gerarLinkAvaliacaoGoogle = useCallback(async (avaliacaoId) => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await apiRequest(`/api/whatsapp/avaliacao/${avaliacaoId}/google`);
      return data.dados;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [apiRequest]);

  // Obter dados dos botões
  const obterDadosBotoes = useCallback(async (contratoId) => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await apiRequest(`/api/whatsapp/contrato/${contratoId}/botoes`);
      return data.dados;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [apiRequest]);

  // Gerar link personalizado
  const gerarLinkPersonalizado = useCallback(async (telefone, mensagem) => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await apiRequest('/api/whatsapp/link-personalizado', {
        method: 'POST',
        body: JSON.stringify({ telefone, mensagem })
      });
      
      return data.dados;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [apiRequest]);

  // Validar telefone
  const validarTelefone = useCallback(async (telefone) => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await apiRequest('/api/whatsapp/validar-telefone', {
        method: 'POST',
        body: JSON.stringify({ telefone })
      });
      
      return data.dados;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [apiRequest]);

  // Abrir WhatsApp
  const abrirWhatsApp = useCallback((url, novaAba = true) => {
    try {
      if (novaAba) {
        window.open(url, '_blank', 'noopener,noreferrer');
      } else {
        window.location.href = url;
      }
      return true;
    } catch (err) {
      setError('Erro ao abrir WhatsApp');
      return false;
    }
  }, []);

  // Formatar número de telefone
  const formatarTelefone = useCallback((telefone) => {
    if (!telefone) return '';
    
    // Remover caracteres não numéricos
    let numero = telefone.replace(/\D/g, '');
    
    // Aplicar formatação brasileira
    if (numero.length === 11) {
      return numero.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    } else if (numero.length === 10) {
      return numero.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    }
    
    return telefone;
  }, []);

  // Obter estatísticas
  const obterEstatisticas = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await apiRequest('/api/whatsapp/estatisticas');
      return data.dados;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [apiRequest]);

  // Testar conectividade
  const testarConectividade = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await apiRequest('/api/whatsapp/teste-conectividade');
      return data.dados;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [apiRequest]);

  // Limpar erro
  const limparError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // Estados
    loading,
    error,
    
    // Funções principais
    gerarLinkDocumentos,
    gerarLinkAvaliacaoInterna,
    gerarLinkAvaliacaoGoogle,
    obterDadosBotoes,
    gerarLinkPersonalizado,
    validarTelefone,
    abrirWhatsApp,
    
    // Funções utilitárias
    formatarTelefone,
    obterEstatisticas,
    testarConectividade,
    limparError
  };
};

// Hook para templates de mensagens
export const useWhatsAppTemplates = () => {
  const templates = {
    documentos: (nomeCliente, links) => `Olá ${nomeCliente}, segue os documentos da sua mudança com a VIP Mudanças:

📄 Contrato: ${links.contratoLink}
📦 Ordem de Serviço: ${links.osLink}
💰 Recibo: ${links.reciboLink}

Qualquer dúvida, estamos à disposição!
Equipe VIP Mudanças`,

    avaliacaoInterna: (nomeCliente) => `Olá ${nomeCliente}, agora que finalizamos sua mudança, gostaríamos de saber como foi sua experiência com a VIP Mudanças.

🙏 Por favor, avalie nosso serviço clicando no link abaixo:
🔗 https://docs.google.com/forms/d/e/1FAIpQLSe5gHxNCipSou_OndLqm015iFds8eWYgXEdHq9A7C5GSjUg7g/viewform?usp=header

Sua opinião é muito importante para melhorarmos cada dia mais!
Obrigado!
Equipe VIP Mudanças 💙📦`,

    avaliacaoGoogle: () => `Ficamos muito felizes com sua avaliação!
Se puder nos ajudar com uma recomendação pública, basta clicar aqui:

⭐ Avalie no Google: https://g.page/r/CfT7q6iOe1JfEB0/review

Muito obrigado!
Equipe VIP Mudanças`,

    personalizada: (template, dados) => {
      let mensagem = template;
      Object.keys(dados).forEach(chave => {
        const placeholder = `[${chave.toUpperCase()}]`;
        mensagem = mensagem.replace(new RegExp(placeholder, 'g'), dados[chave]);
      });
      return mensagem;
    }
  };

  const gerarMensagem = useCallback((tipo, dados) => {
    switch (tipo) {
      case 'documentos':
        return templates.documentos(dados.nomeCliente, dados.links);
      case 'avaliacaoInterna':
        return templates.avaliacaoInterna(dados.nomeCliente);
      case 'avaliacaoGoogle':
        return templates.avaliacaoGoogle();
      case 'personalizada':
        return templates.personalizada(dados.template, dados.variaveis);
      default:
        return '';
    }
  }, []);

  const obterTemplate = useCallback((tipo) => {
    return templates[tipo] || null;
  }, []);

  return {
    templates,
    gerarMensagem,
    obterTemplate
  };
};

// Hook para validações
export const useWhatsAppValidation = () => {
  const validarTelefone = useCallback((telefone) => {
    if (!telefone) return { valido: false, erro: 'Telefone é obrigatório' };
    
    const numero = telefone.replace(/\D/g, '');
    
    if (numero.length < 10) {
      return { valido: false, erro: 'Telefone deve ter pelo menos 10 dígitos' };
    }
    
    if (numero.length > 13) {
      return { valido: false, erro: 'Telefone não pode ter mais de 13 dígitos' };
    }
    
    return { valido: true, erro: null };
  }, []);

  const validarMensagem = useCallback((mensagem) => {
    if (!mensagem) return { valido: false, erro: 'Mensagem é obrigatória' };
    
    if (mensagem.length > 4096) {
      return { valido: false, erro: 'Mensagem muito longa (máximo 4096 caracteres)' };
    }
    
    return { valido: true, erro: null };
  }, []);

  const validarDados = useCallback((dados) => {
    const erros = [];
    
    if (dados.telefone) {
      const validacaoTelefone = validarTelefone(dados.telefone);
      if (!validacaoTelefone.valido) {
        erros.push(validacaoTelefone.erro);
      }
    }
    
    if (dados.mensagem) {
      const validacaoMensagem = validarMensagem(dados.mensagem);
      if (!validacaoMensagem.valido) {
        erros.push(validacaoMensagem.erro);
      }
    }
    
    return {
      valido: erros.length === 0,
      erros
    };
  }, [validarTelefone, validarMensagem]);

  return {
    validarTelefone,
    validarMensagem,
    validarDados
  };
};

