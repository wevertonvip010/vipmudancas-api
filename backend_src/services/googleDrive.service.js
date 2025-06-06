const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

class GoogleDriveService {
  constructor() {
    this.drive = null;
    this.auth = null;
    this.rootFolderId = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID || null;
    this.initialized = false;
  }

  // Inicializar autenticação
  async initialize() {
    try {
      if (this.initialized) {
        return true;
      }

      // Configurar autenticação OAuth2
      this.auth = new google.auth.OAuth2(
        process.env.GOOGLE_DRIVE_CLIENT_ID,
        process.env.GOOGLE_DRIVE_CLIENT_SECRET,
        'urn:ietf:wg:oauth:2.0:oob' // Para aplicações server-side
      );

      // Definir refresh token se disponível
      if (process.env.GOOGLE_DRIVE_REFRESH_TOKEN) {
        this.auth.setCredentials({
          refresh_token: process.env.GOOGLE_DRIVE_REFRESH_TOKEN
        });
      }

      // Inicializar cliente Drive
      this.drive = google.drive({ version: 'v3', auth: this.auth });

      // Verificar se a pasta raiz existe, senão criar
      if (!this.rootFolderId) {
        this.rootFolderId = await this.criarPastaRaiz();
      }

      this.initialized = true;
      console.log('Google Drive Service inicializado com sucesso');
      return true;

    } catch (error) {
      console.error('Erro ao inicializar Google Drive Service:', error);
      return false;
    }
  }

  // Criar pasta raiz "VIP Mudanças"
  async criarPastaRaiz() {
    try {
      const folderMetadata = {
        name: 'VIP Mudanças - Sistema',
        mimeType: 'application/vnd.google-apps.folder'
      };

      const folder = await this.drive.files.create({
        resource: folderMetadata,
        fields: 'id'
      });

      console.log('Pasta raiz criada:', folder.data.id);
      return folder.data.id;

    } catch (error) {
      console.error('Erro ao criar pasta raiz:', error);
      throw error;
    }
  }

  // Criar pasta para cliente
  async criarPastaCliente(nomeCliente, numeroContrato) {
    try {
      await this.initialize();

      const nomePasta = `${nomeCliente.replace(/[^a-zA-Z0-9\s]/g, '')}_${numeroContrato}`;

      // Verificar se a pasta já existe
      const pastaExistente = await this.buscarPasta(nomePasta, this.rootFolderId);
      if (pastaExistente) {
        return pastaExistente.id;
      }

      const folderMetadata = {
        name: nomePasta,
        mimeType: 'application/vnd.google-apps.folder',
        parents: [this.rootFolderId]
      };

      const folder = await this.drive.files.create({
        resource: folderMetadata,
        fields: 'id, name, webViewLink'
      });

      console.log(`Pasta criada para cliente ${nomeCliente}:`, folder.data.id);
      return folder.data.id;

    } catch (error) {
      console.error('Erro ao criar pasta do cliente:', error);
      throw error;
    }
  }

  // Buscar pasta por nome
  async buscarPasta(nomePasta, parentId = null) {
    try {
      let query = `name='${nomePasta}' and mimeType='application/vnd.google-apps.folder' and trashed=false`;
      
      if (parentId) {
        query += ` and '${parentId}' in parents`;
      }

      const response = await this.drive.files.list({
        q: query,
        fields: 'files(id, name, webViewLink)'
      });

      return response.data.files.length > 0 ? response.data.files[0] : null;

    } catch (error) {
      console.error('Erro ao buscar pasta:', error);
      return null;
    }
  }

  // Upload de arquivo
  async uploadArquivo(caminhoArquivo, nomeArquivo, pastaId, mimeType = null) {
    try {
      await this.initialize();

      // Verificar se o arquivo existe
      if (!fs.existsSync(caminhoArquivo)) {
        throw new Error(`Arquivo não encontrado: ${caminhoArquivo}`);
      }

      // Detectar MIME type se não fornecido
      if (!mimeType) {
        const extensao = path.extname(nomeArquivo).toLowerCase();
        switch (extensao) {
          case '.pdf':
            mimeType = 'application/pdf';
            break;
          case '.docx':
            mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
            break;
          case '.doc':
            mimeType = 'application/msword';
            break;
          default:
            mimeType = 'application/octet-stream';
        }
      }

      // Verificar se arquivo já existe na pasta
      const arquivoExistente = await this.buscarArquivo(nomeArquivo, pastaId);
      if (arquivoExistente) {
        console.log(`Arquivo ${nomeArquivo} já existe. Atualizando...`);
        return await this.atualizarArquivo(arquivoExistente.id, caminhoArquivo, mimeType);
      }

      const fileMetadata = {
        name: nomeArquivo,
        parents: [pastaId]
      };

      const media = {
        mimeType: mimeType,
        body: fs.createReadStream(caminhoArquivo)
      };

      const file = await this.drive.files.create({
        resource: fileMetadata,
        media: media,
        fields: 'id, name, webViewLink, webContentLink'
      });

      console.log(`Arquivo ${nomeArquivo} enviado com sucesso:`, file.data.id);
      return file.data;

    } catch (error) {
      console.error('Erro ao fazer upload do arquivo:', error);
      throw error;
    }
  }

  // Buscar arquivo por nome na pasta
  async buscarArquivo(nomeArquivo, pastaId) {
    try {
      const query = `name='${nomeArquivo}' and '${pastaId}' in parents and trashed=false`;

      const response = await this.drive.files.list({
        q: query,
        fields: 'files(id, name, webViewLink, webContentLink)'
      });

      return response.data.files.length > 0 ? response.data.files[0] : null;

    } catch (error) {
      console.error('Erro ao buscar arquivo:', error);
      return null;
    }
  }

  // Atualizar arquivo existente
  async atualizarArquivo(fileId, caminhoArquivo, mimeType) {
    try {
      const media = {
        mimeType: mimeType,
        body: fs.createReadStream(caminhoArquivo)
      };

      const file = await this.drive.files.update({
        fileId: fileId,
        media: media,
        fields: 'id, name, webViewLink, webContentLink'
      });

      console.log('Arquivo atualizado:', file.data.id);
      return file.data;

    } catch (error) {
      console.error('Erro ao atualizar arquivo:', error);
      throw error;
    }
  }

  // Listar arquivos de uma pasta
  async listarArquivos(pastaId) {
    try {
      await this.initialize();

      const response = await this.drive.files.list({
        q: `'${pastaId}' in parents and trashed=false`,
        fields: 'files(id, name, mimeType, size, createdTime, webViewLink, webContentLink)',
        orderBy: 'createdTime desc'
      });

      return response.data.files;

    } catch (error) {
      console.error('Erro ao listar arquivos:', error);
      throw error;
    }
  }

  // Excluir arquivo
  async excluirArquivo(fileId) {
    try {
      await this.initialize();

      await this.drive.files.delete({
        fileId: fileId
      });

      console.log('Arquivo excluído:', fileId);
      return true;

    } catch (error) {
      console.error('Erro ao excluir arquivo:', error);
      throw error;
    }
  }

  // Compartilhar arquivo/pasta
  async compartilharArquivo(fileId, email = null, role = 'reader') {
    try {
      await this.initialize();

      const permission = {
        role: role, // 'reader', 'writer', 'commenter'
        type: email ? 'user' : 'anyone'
      };

      if (email) {
        permission.emailAddress = email;
      }

      const response = await this.drive.permissions.create({
        fileId: fileId,
        resource: permission,
        fields: 'id'
      });

      console.log('Permissão criada:', response.data.id);
      return response.data;

    } catch (error) {
      console.error('Erro ao compartilhar arquivo:', error);
      throw error;
    }
  }

  // Obter link de download direto
  async obterLinkDownload(fileId) {
    try {
      await this.initialize();

      const file = await this.drive.files.get({
        fileId: fileId,
        fields: 'webContentLink, webViewLink'
      });

      return {
        downloadLink: file.data.webContentLink,
        viewLink: file.data.webViewLink
      };

    } catch (error) {
      console.error('Erro ao obter link de download:', error);
      throw error;
    }
  }

  // Método principal para processar documentos do cliente
  async processarDocumentosCliente(clienteData, documentos) {
    try {
      const resultados = [];

      // Criar pasta do cliente
      const pastaId = await this.criarPastaCliente(
        clienteData.nome,
        clienteData.numeroContrato
      );

      // Upload de cada documento
      for (const documento of documentos) {
        try {
          const arquivo = await this.uploadArquivo(
            documento.caminho,
            documento.nome,
            pastaId,
            documento.mimeType
          );

          // Compartilhar arquivo para acesso público (opcional)
          if (processo.env.GOOGLE_DRIVE_PUBLIC_SHARE === 'true') {
            await this.compartilharArquivo(arquivo.id);
          }

          resultados.push({
            sucesso: true,
            documento: documento.nome,
            fileId: arquivo.id,
            viewLink: arquivo.webViewLink,
            downloadLink: arquivo.webContentLink
          });

        } catch (error) {
          resultados.push({
            sucesso: false,
            documento: documento.nome,
            erro: error.message
          });
        }
      }

      return {
        pastaId,
        pastaLink: `https://drive.google.com/drive/folders/${pastaId}`,
        documentos: resultados
      };

    } catch (error) {
      console.error('Erro ao processar documentos do cliente:', error);
      throw error;
    }
  }

  // Verificar status da conexão
  async verificarConexao() {
    try {
      await this.initialize();

      const response = await this.drive.about.get({
        fields: 'user, storageQuota'
      });

      return {
        conectado: true,
        usuario: response.data.user.displayName,
        email: response.data.user.emailAddress,
        armazenamento: response.data.storageQuota
      };

    } catch (error) {
      console.error('Erro ao verificar conexão:', error);
      return {
        conectado: false,
        erro: error.message
      };
    }
  }

  // Obter estatísticas de uso
  async obterEstatisticas() {
    try {
      await this.initialize();

      // Contar arquivos na pasta raiz
      const response = await this.drive.files.list({
        q: `'${this.rootFolderId}' in parents and trashed=false`,
        fields: 'files(id, mimeType, size)'
      });

      const arquivos = response.data.files;
      const totalArquivos = arquivos.length;
      const tamanhoTotal = arquivos.reduce((total, arquivo) => {
        return total + (parseInt(arquivo.size) || 0);
      }, 0);

      return {
        totalArquivos,
        tamanhoTotal,
        tamanhoTotalMB: Math.round(tamanhoTotal / (1024 * 1024)),
        pastaRaizId: this.rootFolderId
      };

    } catch (error) {
      console.error('Erro ao obter estatísticas:', error);
      throw error;
    }
  }
}

module.exports = new GoogleDriveService();

