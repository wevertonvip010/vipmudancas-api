const googleDriveService = require('../services/googleDrive.service');
const path = require('path');
const fs = require('fs');

class GoogleDriveController {

  // Verificar status da conexão com Google Drive
  async verificarConexao(req, res) {
    try {
      const status = await googleDriveService.verificarConexao();
      
      res.status(200).json({
        sucesso: true,
        dados: status,
        erro: null
      });
      
    } catch (error) {
      console.error('Erro ao verificar conexão Google Drive:', error);
      res.status(500).json({
        sucesso: false,
        dados: null,
        erro: 'Erro interno do servidor ao verificar conexão'
      });
    }
  }

  // Criar pasta para cliente
  async criarPastaCliente(req, res) {
    try {
      const { nomeCliente, numeroContrato } = req.body;
      
      if (!nomeCliente || !numeroContrato) {
        return res.status(400).json({
          sucesso: false,
          dados: null,
          erro: 'nomeCliente e numeroContrato são obrigatórios'
        });
      }
      
      const pastaId = await googleDriveService.criarPastaCliente(nomeCliente, numeroContrato);
      
      res.status(201).json({
        sucesso: true,
        dados: {
          pastaId,
          pastaLink: `https://drive.google.com/drive/folders/${pastaId}`,
          nomeCliente,
          numeroContrato
        },
        erro: null
      });
      
    } catch (error) {
      console.error('Erro ao criar pasta do cliente:', error);
      res.status(500).json({
        sucesso: false,
        dados: null,
        erro: 'Erro interno do servidor ao criar pasta'
      });
    }
  }

  // Upload de arquivo
  async uploadArquivo(req, res) {
    try {
      const { pastaId, nomeArquivo, mimeType } = req.body;
      const arquivo = req.file;
      
      if (!arquivo) {
        return res.status(400).json({
          sucesso: false,
          dados: null,
          erro: 'Arquivo é obrigatório'
        });
      }
      
      if (!pastaId) {
        return res.status(400).json({
          sucesso: false,
          dados: null,
          erro: 'pastaId é obrigatório'
        });
      }
      
      const nomeArquivoFinal = nomeArquivo || arquivo.originalname;
      const mimeTypeFinal = mimeType || arquivo.mimetype;
      
      const resultado = await googleDriveService.uploadArquivo(
        arquivo.path,
        nomeArquivoFinal,
        pastaId,
        mimeTypeFinal
      );
      
      // Limpar arquivo temporário
      if (fs.existsSync(arquivo.path)) {
        fs.unlinkSync(arquivo.path);
      }
      
      res.status(201).json({
        sucesso: true,
        dados: {
          fileId: resultado.id,
          nome: resultado.name,
          viewLink: resultado.webViewLink,
          downloadLink: resultado.webContentLink
        },
        erro: null
      });
      
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      
      // Limpar arquivo temporário em caso de erro
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      
      res.status(500).json({
        sucesso: false,
        dados: null,
        erro: 'Erro interno do servidor ao fazer upload'
      });
    }
  }

  // Processar documentos completos do cliente
  async processarDocumentosCliente(req, res) {
    try {
      const { clienteData, documentos } = req.body;
      
      if (!clienteData || !clienteData.nome || !clienteData.numeroContrato) {
        return res.status(400).json({
          sucesso: false,
          dados: null,
          erro: 'Dados do cliente (nome e numeroContrato) são obrigatórios'
        });
      }
      
      if (!documentos || !Array.isArray(documentos) || documentos.length === 0) {
        return res.status(400).json({
          sucesso: false,
          dados: null,
          erro: 'Lista de documentos é obrigatória'
        });
      }
      
      const resultado = await googleDriveService.processarDocumentosCliente(clienteData, documentos);
      
      res.status(201).json({
        sucesso: true,
        dados: resultado,
        erro: null
      });
      
    } catch (error) {
      console.error('Erro ao processar documentos:', error);
      res.status(500).json({
        sucesso: false,
        dados: null,
        erro: 'Erro interno do servidor ao processar documentos'
      });
    }
  }

  // Listar arquivos de uma pasta
  async listarArquivos(req, res) {
    try {
      const { pastaId } = req.params;
      
      if (!pastaId) {
        return res.status(400).json({
          sucesso: false,
          dados: null,
          erro: 'pastaId é obrigatório'
        });
      }
      
      const arquivos = await googleDriveService.listarArquivos(pastaId);
      
      res.status(200).json({
        sucesso: true,
        dados: {
          pastaId,
          totalArquivos: arquivos.length,
          arquivos
        },
        erro: null
      });
      
    } catch (error) {
      console.error('Erro ao listar arquivos:', error);
      res.status(500).json({
        sucesso: false,
        dados: null,
        erro: 'Erro interno do servidor ao listar arquivos'
      });
    }
  }

  // Excluir arquivo
  async excluirArquivo(req, res) {
    try {
      const { fileId } = req.params;
      
      if (!fileId) {
        return res.status(400).json({
          sucesso: false,
          dados: null,
          erro: 'fileId é obrigatório'
        });
      }
      
      await googleDriveService.excluirArquivo(fileId);
      
      res.status(200).json({
        sucesso: true,
        dados: {
          fileId,
          mensagem: 'Arquivo excluído com sucesso'
        },
        erro: null
      });
      
    } catch (error) {
      console.error('Erro ao excluir arquivo:', error);
      res.status(500).json({
        sucesso: false,
        dados: null,
        erro: 'Erro interno do servidor ao excluir arquivo'
      });
    }
  }

  // Compartilhar arquivo
  async compartilharArquivo(req, res) {
    try {
      const { fileId } = req.params;
      const { email, role = 'reader' } = req.body;
      
      if (!fileId) {
        return res.status(400).json({
          sucesso: false,
          dados: null,
          erro: 'fileId é obrigatório'
        });
      }
      
      const permissao = await googleDriveService.compartilharArquivo(fileId, email, role);
      
      res.status(200).json({
        sucesso: true,
        dados: {
          fileId,
          permissaoId: permissao.id,
          email: email || 'público',
          role
        },
        erro: null
      });
      
    } catch (error) {
      console.error('Erro ao compartilhar arquivo:', error);
      res.status(500).json({
        sucesso: false,
        dados: null,
        erro: 'Erro interno do servidor ao compartilhar arquivo'
      });
    }
  }

  // Obter links de download
  async obterLinksDownload(req, res) {
    try {
      const { fileId } = req.params;
      
      if (!fileId) {
        return res.status(400).json({
          sucesso: false,
          dados: null,
          erro: 'fileId é obrigatório'
        });
      }
      
      const links = await googleDriveService.obterLinkDownload(fileId);
      
      res.status(200).json({
        sucesso: true,
        dados: {
          fileId,
          ...links
        },
        erro: null
      });
      
    } catch (error) {
      console.error('Erro ao obter links:', error);
      res.status(500).json({
        sucesso: false,
        dados: null,
        erro: 'Erro interno do servidor ao obter links'
      });
    }
  }

  // Obter estatísticas de uso
  async obterEstatisticas(req, res) {
    try {
      const estatisticas = await googleDriveService.obterEstatisticas();
      
      res.status(200).json({
        sucesso: true,
        dados: estatisticas,
        erro: null
      });
      
    } catch (error) {
      console.error('Erro ao obter estatísticas:', error);
      res.status(500).json({
        sucesso: false,
        dados: null,
        erro: 'Erro interno do servidor ao obter estatísticas'
      });
    }
  }

  // Gerar documentos automáticos e fazer upload
  async gerarEUploadDocumentos(req, res) {
    try {
      const { 
        clienteId, 
        contratoId, 
        tiposDocumento = ['contrato', 'os', 'recibo'] 
      } = req.body;
      
      if (!clienteId || !contratoId) {
        return res.status(400).json({
          sucesso: false,
          dados: null,
          erro: 'clienteId e contratoId são obrigatórios'
        });
      }
      
      // Aqui seria implementada a lógica para:
      // 1. Buscar dados do cliente e contrato
      // 2. Gerar PDFs dos documentos
      // 3. Fazer upload para Google Drive
      // 4. Retornar links de acesso
      
      // Por enquanto, retornamos uma resposta simulada
      const resultadoSimulado = {
        clienteId,
        contratoId,
        pastaId: 'pasta_simulada_123',
        pastaLink: 'https://drive.google.com/drive/folders/pasta_simulada_123',
        documentos: tiposDocumento.map(tipo => ({
          tipo,
          nome: `${tipo}_${contratoId}.pdf`,
          fileId: `file_${tipo}_${contratoId}`,
          viewLink: `https://drive.google.com/file/d/file_${tipo}_${contratoId}/view`,
          downloadLink: `https://drive.google.com/file/d/file_${tipo}_${contratoId}/export?format=pdf`
        }))
      };
      
      res.status(201).json({
        sucesso: true,
        dados: resultadoSimulado,
        erro: null
      });
      
    } catch (error) {
      console.error('Erro ao gerar e fazer upload de documentos:', error);
      res.status(500).json({
        sucesso: false,
        dados: null,
        erro: 'Erro interno do servidor ao gerar documentos'
      });
    }
  }

  // Sincronizar documentos existentes
  async sincronizarDocumentos(req, res) {
    try {
      const { clienteId } = req.params;
      
      if (!clienteId) {
        return res.status(400).json({
          sucesso: false,
          dados: null,
          erro: 'clienteId é obrigatório'
        });
      }
      
      // Implementar lógica de sincronização:
      // 1. Buscar documentos locais do cliente
      // 2. Verificar quais já estão no Drive
      // 3. Fazer upload dos faltantes
      // 4. Atualizar banco de dados com links
      
      res.status(200).json({
        sucesso: true,
        dados: {
          clienteId,
          mensagem: 'Sincronização concluída',
          documentosSincronizados: 0,
          documentosNovos: 0
        },
        erro: null
      });
      
    } catch (error) {
      console.error('Erro ao sincronizar documentos:', error);
      res.status(500).json({
        sucesso: false,
        dados: null,
        erro: 'Erro interno do servidor ao sincronizar'
      });
    }
  }
}

module.exports = new GoogleDriveController();

