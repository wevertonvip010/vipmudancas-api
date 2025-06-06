# INTEGRAÇÃO GOOGLE DRIVE API - DOCUMENTAÇÃO

## Informações Coletadas

### Tipos de Upload:
1. **Simple Upload** (uploadType=media) - Arquivos até 5MB sem metadata
2. **Multipart Upload** (uploadType=multipart) - Arquivos até 5MB com metadata
3. **Resumable Upload** (uploadType=resumable) - Arquivos grandes (>5MB)

### Autenticação:
- OAuth 2.0 para aplicações desktop
- Service Account para aplicações server-to-server
- Credenciais JSON necessárias

### Bibliotecas Necessárias:
```bash
npm install googleapis@105 @google-cloud/local-auth@2.1.0 --save
```

### Configuração:
1. Habilitar Google Drive API no Google Cloud Console
2. Configurar OAuth consent screen
3. Criar credenciais OAuth 2.0 ou Service Account
4. Baixar arquivo credentials.json

### Endpoints Principais:
- POST https://www.googleapis.com/upload/drive/v3/files
- GET https://www.googleapis.com/drive/v3/files
- POST https://www.googleapis.com/drive/v3/files/{fileId}/copy

### Scopes Necessários:
- https://www.googleapis.com/auth/drive.file
- https://www.googleapis.com/auth/drive

## Implementação para VIP Mudanças

### Funcionalidades:
1. Criar pasta por cliente automaticamente
2. Upload de contratos, OS e recibos
3. Gerar links de acesso direto
4. Evitar duplicação de arquivos
5. Organização por estrutura de pastas

### Estrutura de Pastas:
```
VIP Mudanças/
├── Clientes/
│   ├── Cliente_Nome_001-2025/
│   │   ├── Contrato_001-2025.pdf
│   │   ├── OS_001-2025.pdf
│   │   └── Recibo_001-2025.pdf
│   └── Cliente_Nome_002-2025/
└── Relatórios/
```

### Configuração de Ambiente:
- GOOGLE_DRIVE_CLIENT_ID
- GOOGLE_DRIVE_CLIENT_SECRET
- GOOGLE_DRIVE_REFRESH_TOKEN
- GOOGLE_DRIVE_FOLDER_ID (pasta raiz VIP Mudanças)

