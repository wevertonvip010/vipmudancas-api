class WhatsAppService {
  
  // Formatar número de telefone para padrão internacional
  static formatarTelefone(telefone) {
    if (!telefone) return null;
    
    // Remover todos os caracteres não numéricos
    let numero = telefone.replace(/\D/g, '');
    
    // Se começar com 0, remover
    if (numero.startsWith('0')) {
      numero = numero.substring(1);
    }
    
    // Se não começar com 55 (código do Brasil), adicionar
    if (!numero.startsWith('55')) {
      numero = '55' + numero;
    }
    
    // Garantir que tenha 13 dígitos (55 + DDD + 9 dígitos)
    if (numero.length === 12) {
      // Adicionar o 9 após o DDD se não tiver
      numero = numero.substring(0, 4) + '9' + numero.substring(4);
    }
    
    return numero;
  }

  // Codificar mensagem para URL
  static codificarMensagem(mensagem) {
    return encodeURIComponent(mensagem);
  }

  // Gerar link wa.me
  static gerarLinkWhatsApp(telefone, mensagem) {
    const numeroFormatado = this.formatarTelefone(telefone);
    if (!numeroFormatado) {
      throw new Error('Número de telefone inválido');
    }
    
    const mensagemCodificada = this.codificarMensagem(mensagem);
    return `https://wa.me/${numeroFormatado}?text=${mensagemCodificada}`;
  }

  // 1. ENVIO AUTOMÁTICO DE DOCUMENTOS VIA WHATSAPP
  static gerarMensagemDocumentos(cliente, documentos) {
    const { nome } = cliente;
    const { contratoLink, osLink, reciboLink } = documentos;
    
    const mensagem = `Olá ${nome}, segue os documentos da sua mudança com a VIP Mudanças:

📄 Contrato: ${contratoLink}
📦 Ordem de Serviço: ${osLink}
💰 Recibo: ${reciboLink}

Qualquer dúvida, estamos à disposição!
Equipe VIP Mudanças`;

    return mensagem;
  }

  static gerarLinkEnvioDocumentos(cliente, documentos) {
    const mensagem = this.gerarMensagemDocumentos(cliente, documentos);
    return this.gerarLinkWhatsApp(cliente.telefone, mensagem);
  }

  // 2. AVALIAÇÃO INTERNA PÓS-SERVIÇO
  static gerarMensagemAvaliacaoInterna(cliente) {
    const { nome } = cliente;
    const linkFormulario = 'https://docs.google.com/forms/d/e/1FAIpQLSe5gHxNCipSou_OndLqm015iFds8eWYgXEdHq9A7C5GSjUg7g/viewform?usp=header';
    
    const mensagem = `Olá ${nome}, agora que finalizamos sua mudança, gostaríamos de saber como foi sua experiência com a VIP Mudanças.

🙏 Por favor, avalie nosso serviço clicando no link abaixo:
🔗 ${linkFormulario}

Sua opinião é muito importante para melhorarmos cada dia mais!
Obrigado!
Equipe VIP Mudanças 💙📦`;

    return mensagem;
  }

  static gerarLinkAvaliacaoInterna(cliente) {
    const mensagem = this.gerarMensagemAvaliacaoInterna(cliente);
    return this.gerarLinkWhatsApp(cliente.telefone, mensagem);
  }

  // 3. GATILHO DE AVALIAÇÃO PÚBLICA (GOOGLE)
  static gerarMensagemAvaliacaoGoogle(cliente) {
    const linkGoogle = 'https://g.page/r/CfT7q6iOe1JfEB0/review';
    
    const mensagem = `Ficamos muito felizes com sua avaliação!
Se puder nos ajudar com uma recomendação pública, basta clicar aqui:

⭐ Avalie no Google: ${linkGoogle}

Muito obrigado!
Equipe VIP Mudanças`;

    return mensagem;
  }

  static gerarLinkAvaliacaoGoogle(cliente) {
    const mensagem = this.gerarMensagemAvaliacaoGoogle(cliente);
    return this.gerarLinkWhatsApp(cliente.telefone, mensagem);
  }

  // Método auxiliar para gerar links de documentos
  static gerarLinksDocumentos(contratoId, baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000') {
    return {
      contratoLink: `${baseUrl}/documentos/contrato/${contratoId}`,
      osLink: `${baseUrl}/documentos/os/${contratoId}`,
      reciboLink: `${baseUrl}/documentos/recibo/${contratoId}`
    };
  }

  // Validar se o número de telefone é válido
  static validarTelefone(telefone) {
    if (!telefone) return false;
    
    const numeroFormatado = this.formatarTelefone(telefone);
    return numeroFormatado && numeroFormatado.length >= 12 && numeroFormatado.length <= 13;
  }

  // Gerar mensagem personalizada
  static gerarMensagemPersonalizada(template, dados) {
    let mensagem = template;
    
    // Substituir placeholders
    Object.keys(dados).forEach(chave => {
      const placeholder = `[${chave.toUpperCase()}]`;
      mensagem = mensagem.replace(new RegExp(placeholder, 'g'), dados[chave]);
    });
    
    return mensagem;
  }

  // Método para logging de envios
  static logEnvio(tipo, cliente, sucesso = true, erro = null) {
    const log = {
      timestamp: new Date().toISOString(),
      tipo,
      cliente: {
        id: cliente.id || cliente._id,
        nome: cliente.nome,
        telefone: cliente.telefone
      },
      sucesso,
      erro
    };
    
    console.log('WhatsApp Service Log:', JSON.stringify(log, null, 2));
    
    // Aqui poderia ser implementado um sistema de logs mais robusto
    // salvando em banco de dados ou arquivo de log
    
    return log;
  }

  // Método para obter estatísticas de envios
  static obterEstatisticas() {
    // Implementar lógica para buscar estatísticas de envios
    // Por enquanto retorna dados simulados
    return {
      totalEnvios: 0,
      enviosDocumentos: 0,
      enviosAvaliacaoInterna: 0,
      enviosAvaliacaoGoogle: 0,
      taxaSucesso: 100
    };
  }

  // Método para testar conectividade
  static testarConectividade() {
    try {
      // Testar se consegue gerar um link básico
      const linkTeste = this.gerarLinkWhatsApp('11999999999', 'Teste de conectividade');
      return {
        conectado: true,
        linkTeste,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        conectado: false,
        erro: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}

module.exports = WhatsAppService;

