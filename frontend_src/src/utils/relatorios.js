// Utilitário para geração de relatórios PDF
// Localização: /home/ubuntu/vip-mudancas-identico/src/utils/relatorios.js

export const gerarRelatorioPDF = (tipo, dados, nomeUsuario = 'Usuario') => {
  const agora = new Date();
  const dataFormatada = agora.toLocaleDateString('pt-BR');
  const horaFormatada = agora.toLocaleTimeString('pt-BR');
  const nomeArquivo = `${tipo}_${dataFormatada.replace(/\//g, '-')}_${nomeUsuario.replace(/\s+/g, '_')}`;

  // Criar janela de impressão
  const janelaImpressao = window.open('', '_blank');
  
  let conteudoHTML = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Relatório ${tipo} - VIP Mudanças</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 210mm;
          margin: 0 auto;
          padding: 20mm;
          background: white;
        }
        
        .cabecalho {
          text-align: center;
          margin-bottom: 30px;
          border-bottom: 2px solid #2563eb;
          padding-bottom: 20px;
        }
        
        .logo {
          font-size: 24px;
          font-weight: bold;
          color: #2563eb;
          margin-bottom: 10px;
        }
        
        .info-relatorio {
          display: flex;
          justify-content: space-between;
          margin-bottom: 30px;
          font-size: 14px;
          color: #666;
        }
        
        .titulo-secao {
          font-size: 18px;
          font-weight: bold;
          color: #2563eb;
          margin: 20px 0 10px 0;
          border-left: 4px solid #2563eb;
          padding-left: 10px;
        }
        
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
        }
        
        th, td {
          border: 1px solid #ddd;
          padding: 12px;
          text-align: left;
        }
        
        th {
          background-color: #f8f9fa;
          font-weight: bold;
          color: #2563eb;
        }
        
        tr:nth-child(even) {
          background-color: #f8f9fa;
        }
        
        .resumo {
          background-color: #e3f2fd;
          padding: 15px;
          border-radius: 5px;
          margin-bottom: 20px;
        }
        
        .resumo h3 {
          color: #1976d2;
          margin-bottom: 10px;
        }
        
        .rodape {
          margin-top: 40px;
          text-align: center;
          font-size: 12px;
          color: #666;
          border-top: 1px solid #ddd;
          padding-top: 20px;
        }
        
        @media print {
          body {
            margin: 0;
            padding: 15mm;
          }
          
          .no-print {
            display: none;
          }
        }
      </style>
    </head>
    <body>
      <div class="cabecalho">
        <div class="logo">🚚 VIP MUDANÇAS</div>
        <h1>Relatório de ${tipo}</h1>
      </div>
      
      <div class="info-relatorio">
        <div>
          <strong>Data:</strong> ${dataFormatada}<br>
          <strong>Hora:</strong> ${horaFormatada}
        </div>
        <div>
          <strong>Gerado por:</strong> ${nomeUsuario}<br>
          <strong>Sistema:</strong> VIP Mudanças v2.0
        </div>
      </div>
  `;

  // Gerar conteúdo específico baseado no tipo
  switch (tipo) {
    case 'Clientes':
      conteudoHTML += gerarRelatorioClientes(dados);
      break;
    case 'Orçamentos':
      conteudoHTML += gerarRelatorioOrcamentos(dados);
      break;
    case 'Financeiro':
      conteudoHTML += gerarRelatorioFinanceiro(dados);
      break;
    default:
      conteudoHTML += '<p>Tipo de relatório não reconhecido.</p>';
  }

  conteudoHTML += `
      <div class="rodape">
        <p>Este relatório foi gerado automaticamente pelo Sistema VIP Mudanças</p>
        <p>📧 contato@vipmudancas.com.br | 📞 (11) 99999-9999 | 🌐 www.vipmudancas.com.br</p>
      </div>
      
      <script>
        window.onload = function() {
          window.print();
        }
      </script>
    </body>
    </html>
  `;

  janelaImpressao.document.write(conteudoHTML);
  janelaImpressao.document.close();
  
  return nomeArquivo;
};

// Função para gerar relatório de clientes
const gerarRelatorioClientes = (clientes) => {
  const totalClientes = clientes.length;
  const clientesAtivos = clientes.filter(c => c.status === 'Ativo').length;
  const clientesPendentes = clientes.filter(c => c.status === 'Pendente').length;

  return `
    <div class="resumo">
      <h3>📊 Resumo Executivo</h3>
      <p><strong>Total de Clientes:</strong> ${totalClientes}</p>
      <p><strong>Clientes Ativos:</strong> ${clientesAtivos}</p>
      <p><strong>Clientes Pendentes:</strong> ${clientesPendentes}</p>
    </div>
    
    <div class="titulo-secao">👥 Lista Completa de Clientes</div>
    <table>
      <thead>
        <tr>
          <th>Cliente</th>
          <th>Contato</th>
          <th>Serviço</th>
          <th>Status</th>
          <th>Último Contato</th>
        </tr>
      </thead>
      <tbody>
        ${clientes.map(cliente => `
          <tr>
            <td>
              <strong>${cliente.nome}</strong><br>
              <small>${cliente.endereco}</small>
            </td>
            <td>
              ${cliente.email}<br>
              ${cliente.telefone}
            </td>
            <td>${cliente.servico}</td>
            <td>
              <span style="color: ${cliente.status === 'Ativo' ? 'green' : cliente.status === 'Pendente' ? 'orange' : 'red'}">
                ${cliente.status}
              </span>
            </td>
            <td>${cliente.ultimoContato}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
};

// Função para gerar relatório de orçamentos
const gerarRelatorioOrcamentos = (orcamentos) => {
  const totalOrcamentos = orcamentos.length;
  const valorTotal = orcamentos.reduce((sum, orc) => sum + (orc.valor || 0), 0);
  const aprovados = orcamentos.filter(o => o.status === 'Aprovado').length;

  return `
    <div class="resumo">
      <h3>📊 Resumo Executivo</h3>
      <p><strong>Total de Orçamentos:</strong> ${totalOrcamentos}</p>
      <p><strong>Valor Total:</strong> R$ ${valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
      <p><strong>Orçamentos Aprovados:</strong> ${aprovados}</p>
      <p><strong>Taxa de Conversão:</strong> ${totalOrcamentos > 0 ? ((aprovados / totalOrcamentos) * 100).toFixed(1) : 0}%</p>
    </div>
    
    <div class="titulo-secao">📄 Lista de Orçamentos</div>
    <table>
      <thead>
        <tr>
          <th>Nº</th>
          <th>Cliente</th>
          <th>Serviço</th>
          <th>Valor</th>
          <th>Status</th>
          <th>Data</th>
        </tr>
      </thead>
      <tbody>
        ${orcamentos.map((orcamento, index) => `
          <tr>
            <td>#${String(index + 1).padStart(3, '0')}</td>
            <td>${orcamento.cliente}</td>
            <td>${orcamento.servico}</td>
            <td>R$ ${(orcamento.valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
            <td>
              <span style="color: ${orcamento.status === 'Aprovado' ? 'green' : orcamento.status === 'Pendente' ? 'orange' : 'red'}">
                ${orcamento.status}
              </span>
            </td>
            <td>${orcamento.data}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
};

// Função para gerar relatório financeiro
const gerarRelatorioFinanceiro = (dados) => {
  const { receitas, despesas, periodo } = dados;
  const totalReceitas = receitas.reduce((sum, r) => sum + r.valor, 0);
  const totalDespesas = despesas.reduce((sum, d) => sum + d.valor, 0);
  const lucroLiquido = totalReceitas - totalDespesas;
  const margemLucro = totalReceitas > 0 ? ((lucroLiquido / totalReceitas) * 100) : 0;

  return `
    <div class="resumo">
      <h3>📊 Resumo Financeiro - ${periodo}</h3>
      <p><strong>Total de Receitas:</strong> R$ ${totalReceitas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
      <p><strong>Total de Despesas:</strong> R$ ${totalDespesas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
      <p><strong>Lucro Líquido:</strong> 
        <span style="color: ${lucroLiquido >= 0 ? 'green' : 'red'}">
          R$ ${lucroLiquido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
        </span>
      </p>
      <p><strong>Margem de Lucro:</strong> ${margemLucro.toFixed(1)}%</p>
    </div>
    
    <div class="titulo-secao">💰 Receitas</div>
    <table>
      <thead>
        <tr>
          <th>Descrição</th>
          <th>Categoria</th>
          <th>Valor</th>
          <th>Data</th>
        </tr>
      </thead>
      <tbody>
        ${receitas.map(receita => `
          <tr>
            <td>${receita.descricao}</td>
            <td>${receita.categoria}</td>
            <td style="color: green">R$ ${receita.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
            <td>${receita.data}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
    
    <div class="titulo-secao">💸 Despesas</div>
    <table>
      <thead>
        <tr>
          <th>Descrição</th>
          <th>Categoria</th>
          <th>Valor</th>
          <th>Data</th>
        </tr>
      </thead>
      <tbody>
        ${despesas.map(despesa => `
          <tr>
            <td>${despesa.descricao}</td>
            <td>${despesa.categoria}</td>
            <td style="color: red">R$ ${despesa.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
            <td>${despesa.data}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
};

export default gerarRelatorioPDF;

