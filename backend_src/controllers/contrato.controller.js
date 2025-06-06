const Contrato = require('../models/contrato.model');
const Orcamento = require('../models/orcamento.model');
const Cliente = require('../models/cliente.model');
const NumeracaoContrato = require('../models/numeracaoContrato.model');
const fs = require('fs').promises;
const path = require('path');

// Criar novo contrato a partir de orçamento aprovado
exports.createContratoFromOrcamento = async (req, res) => {
  try {
    const { orcamentoId } = req.params;
    const {
      dataAssinatura,
      dataInicio,
      dataTermino,
      formaPagamento,
      condicoesPagamento,
      termos,
      observacoes
    } = req.body;

    // Verificar se o orçamento existe e está aprovado
    const orcamento = await Orcamento.findById(orcamentoId)
      .populate('clienteId', 'nome email telefone')
      .populate('responsavelId', 'nome cargo');

    if (!orcamento) {
      return res.status(404).json({
        sucesso: false,
        dados: null,
        erro: 'Orçamento não encontrado.'
      });
    }

    if (orcamento.status !== 'aprovado') {
      return res.status(400).json({
        sucesso: false,
        dados: null,
        erro: 'Apenas orçamentos aprovados podem gerar contratos.'
      });
    }

    // Verificar se já existe contrato para este orçamento
    const contratoExistente = await Contrato.findOne({ orcamentoId });
    if (contratoExistente) {
      return res.status(400).json({
        sucesso: false,
        dados: null,
        erro: 'Já existe um contrato para este orçamento.'
      });
    }

    // Criar novo contrato (número será gerado automaticamente)
    const contrato = new Contrato({
      orcamentoId,
      clienteId: orcamento.clienteId._id,
      responsavelId: orcamento.responsavelId._id,
      dataAssinatura: dataAssinatura || Date.now(),
      dataInicio,
      dataTermino,
      valorTotal: orcamento.valorFinal,
      formaPagamento,
      condicoesPagamento,
      termos,
      observacoes,
      status: 'ativo'
    });

    await contrato.save();

    // Iniciar automação de documentos
    await this.gerarDocumentosAutomaticos(contrato._id);

    // Recarregar com populate
    const contratoCompleto = await Contrato.findById(contrato._id)
      .populate('clienteId', 'nome email telefone')
      .populate('orcamentoId')
      .populate('responsavelId', 'nome cargo');

    res.status(201).json({
      sucesso: true,
      dados: {
        message: 'Contrato criado com sucesso',
        contrato: contratoCompleto,
        numeroContrato: contrato.numeroContrato
      },
      erro: null
    });
  } catch (error) {
    console.error('Erro ao criar contrato:', error);
    res.status(500).json({
      sucesso: false,
      dados: null,
      erro: 'Erro ao criar contrato.'
    });
  }
};

// Gerar documentos automaticamente
exports.gerarDocumentosAutomaticos = async (contratoId) => {
  try {
    const contrato = await Contrato.findById(contratoId)
      .populate('clienteId', 'nome email telefone')
      .populate('orcamentoId')
      .populate('responsavelId', 'nome cargo');

    if (!contrato) {
      throw new Error('Contrato não encontrado');
    }

    // Criar pasta do cliente
    const caminhoDocumentos = contrato.obterCaminhoDocumentos();
    const caminhoCompleto = path.join(process.cwd(), caminhoDocumentos);
    
    await fs.mkdir(caminhoCompleto, { recursive: true });
    contrato.documentos.pastaClienteCriada = true;
    contrato.documentos.caminhoDocumentos = caminhoDocumentos;

    // Gerar contrato PDF
    await this.gerarContratoPDF(contrato, caminhoCompleto);
    contrato.documentos.contratoGerado = true;

    // Gerar ordem de serviço
    await this.gerarOrdemServicoPDF(contrato, caminhoCompleto);
    contrato.documentos.ordemServicoGerada = true;

    // Gerar recibo
    await this.gerarReciboPDF(contrato, caminhoCompleto);
    contrato.documentos.reciboGerado = true;

    await contrato.save();

    return {
      sucesso: true,
      caminhoDocumentos: caminhoCompleto,
      documentosGerados: {
        contrato: true,
        ordemServico: true,
        recibo: true
      }
    };
  } catch (error) {
    console.error('Erro ao gerar documentos automáticos:', error);
    throw error;
  }
};

// Gerar contrato em PDF
exports.gerarContratoPDF = async (contrato, caminhoDestino) => {
  try {
    const nomeArquivo = `contrato_${contrato.numeroContrato.replace('/', '_')}.pdf`;
    const caminhoArquivo = path.join(caminhoDestino, nomeArquivo);

    // Template básico do contrato
    const conteudoContrato = `
CONTRATO DE PRESTAÇÃO DE SERVIÇOS DE MUDANÇA
Número: ${contrato.numeroContrato}

CONTRATANTE:
Nome: ${contrato.clienteId.nome}
Email: ${contrato.clienteId.email}
Telefone: ${contrato.clienteId.telefone}

CONTRATADA:
VIP Mudanças
Responsável: ${contrato.responsavelId.nome}

VALOR TOTAL: R$ ${contrato.valorTotal.toFixed(2)}
FORMA DE PAGAMENTO: ${contrato.formaPagamento}
CONDIÇÕES: ${contrato.condicoesPagamento}

DATA DE INÍCIO: ${new Date(contrato.dataInicio).toLocaleDateString('pt-BR')}
DATA DE TÉRMINO: ${new Date(contrato.dataTermino).toLocaleDateString('pt-BR')}

TERMOS E CONDIÇÕES:
${contrato.termos}

OBSERVAÇÕES:
${contrato.observacoes || 'Nenhuma observação adicional.'}

Data de Assinatura: ${new Date(contrato.dataAssinatura).toLocaleDateString('pt-BR')}

_________________________                    _________________________
    CONTRATANTE                                  CONTRATADA
`;

    // Salvar como arquivo de texto (em produção, usar biblioteca PDF)
    await fs.writeFile(caminhoArquivo.replace('.pdf', '.txt'), conteudoContrato, 'utf8');
    
    return caminhoArquivo;
  } catch (error) {
    console.error('Erro ao gerar contrato PDF:', error);
    throw error;
  }
};

// Gerar ordem de serviço em PDF
exports.gerarOrdemServicoPDF = async (contrato, caminhoDestino) => {
  try {
    const nomeArquivo = `ordem_servico_${contrato.numeroContrato.replace('/', '_')}.pdf`;
    const caminhoArquivo = path.join(caminhoDestino, nomeArquivo);

    const conteudoOS = `
ORDEM DE SERVIÇO
Número: OS-${contrato.numeroContrato}

CLIENTE: ${contrato.clienteId.nome}
CONTRATO: ${contrato.numeroContrato}
RESPONSÁVEL: ${contrato.responsavelId.nome}

SERVIÇO: Mudança Residencial/Comercial
VALOR: R$ ${contrato.valorTotal.toFixed(2)}

DATA DE EXECUÇÃO: ${new Date(contrato.dataInicio).toLocaleDateString('pt-BR')}
PRAZO: ${new Date(contrato.dataTermino).toLocaleDateString('pt-BR')}

INSTRUÇÕES ESPECIAIS:
${contrato.observacoes || 'Seguir procedimentos padrão da empresa.'}

Gerado automaticamente em: ${new Date().toLocaleString('pt-BR')}
`;

    await fs.writeFile(caminhoArquivo.replace('.pdf', '.txt'), conteudoOS, 'utf8');
    
    return caminhoArquivo;
  } catch (error) {
    console.error('Erro ao gerar ordem de serviço PDF:', error);
    throw error;
  }
};

// Gerar recibo em PDF
exports.gerarReciboPDF = async (contrato, caminhoDestino) => {
  try {
    const nomeArquivo = `recibo_${contrato.numeroContrato.replace('/', '_')}.pdf`;
    const caminhoArquivo = path.join(caminhoDestino, nomeArquivo);

    const conteudoRecibo = `
RECIBO DE PRESTAÇÃO DE SERVIÇOS
Número: REC-${contrato.numeroContrato}

Recebi de: ${contrato.clienteId.nome}
A quantia de: R$ ${contrato.valorTotal.toFixed(2)}
Referente a: Serviços de mudança conforme contrato ${contrato.numeroContrato}

Forma de Pagamento: ${contrato.formaPagamento}
Condições: ${contrato.condicoesPagamento}

Data: ${new Date().toLocaleDateString('pt-BR')}

_________________________
VIP Mudanças
${contrato.responsavelId.nome}
`;

    await fs.writeFile(caminhoArquivo.replace('.pdf', '.txt'), conteudoRecibo, 'utf8');
    
    return caminhoArquivo;
  } catch (error) {
    console.error('Erro ao gerar recibo PDF:', error);
    throw error;
  }
};

// Listar todos os contratos
exports.getAllContratos = async (req, res) => {
  try {
    const contratos = await Contrato.find()
      .populate('clienteId', 'nome email telefone')
      .populate('orcamentoId', 'numero valorFinal')
      .populate('responsavelId', 'nome cargo')
      .sort({ dataCriacao: -1 });

    res.status(200).json({
      sucesso: true,
      dados: contratos,
      erro: null
    });
  } catch (error) {
    console.error('Erro ao listar contratos:', error);
    res.status(500).json({
      sucesso: false,
      dados: null,
      erro: 'Erro ao listar contratos.'
    });
  }
};

// Obter contrato por ID
exports.getContratoById = async (req, res) => {
  try {
    const contrato = await Contrato.findById(req.params.id)
      .populate('clienteId', 'nome email telefone')
      .populate('orcamentoId')
      .populate('responsavelId', 'nome cargo');

    if (!contrato) {
      return res.status(404).json({
        sucesso: false,
        dados: null,
        erro: 'Contrato não encontrado.'
      });
    }

    res.status(200).json({
      sucesso: true,
      dados: contrato,
      erro: null
    });
  } catch (error) {
    console.error('Erro ao buscar contrato:', error);
    res.status(500).json({
      sucesso: false,
      dados: null,
      erro: 'Erro ao buscar contrato.'
    });
  }
};

// Obter próximo número de contrato (para preview)
exports.getProximoNumeroContrato = async (req, res) => {
  try {
    const proximoNumero = await NumeracaoContrato.obterProximoNumero();
    
    // Reverter o incremento (apenas para preview)
    const anoAtual = new Date().getFullYear();
    const numeracao = await NumeracaoContrato.findOne({ ano: anoAtual });
    if (numeracao && numeracao.ultimoNumero > 0) {
      numeracao.ultimoNumero -= 1;
      await numeracao.save();
    }

    res.status(200).json({
      sucesso: true,
      dados: { proximoNumero },
      erro: null
    });
  } catch (error) {
    console.error('Erro ao obter próximo número:', error);
    res.status(500).json({
      sucesso: false,
      dados: null,
      erro: 'Erro ao obter próximo número.'
    });
  }
};

// Listar documentos de um contrato
exports.getDocumentosContrato = async (req, res) => {
  try {
    const contrato = await Contrato.findById(req.params.id)
      .populate('clienteId', 'nome');

    if (!contrato) {
      return res.status(404).json({
        sucesso: false,
        dados: null,
        erro: 'Contrato não encontrado.'
      });
    }

    const caminhoDocumentos = contrato.obterCaminhoDocumentos();
    const caminhoCompleto = path.join(process.cwd(), caminhoDocumentos);

    try {
      const arquivos = await fs.readdir(caminhoCompleto);
      const documentos = arquivos.map(arquivo => ({
        nome: arquivo,
        caminho: path.join(caminhoDocumentos, arquivo),
        tipo: path.extname(arquivo),
        tamanho: 0 // Em produção, obter tamanho real
      }));

      res.status(200).json({
        sucesso: true,
        dados: {
          contrato: {
            id: contrato._id,
            numeroContrato: contrato.numeroContrato,
            cliente: contrato.clienteId.nome
          },
          caminhoDocumentos,
          documentos,
          statusDocumentos: contrato.documentos
        },
        erro: null
      });
    } catch (error) {
      res.status(200).json({
        sucesso: true,
        dados: {
          contrato: {
            id: contrato._id,
            numeroContrato: contrato.numeroContrato,
            cliente: contrato.clienteId.nome
          },
          caminhoDocumentos,
          documentos: [],
          statusDocumentos: contrato.documentos,
          aviso: 'Pasta de documentos ainda não foi criada.'
        },
        erro: null
      });
    }
  } catch (error) {
    console.error('Erro ao listar documentos do contrato:', error);
    res.status(500).json({
      sucesso: false,
      dados: null,
      erro: 'Erro ao listar documentos do contrato.'
    });
  }
};

