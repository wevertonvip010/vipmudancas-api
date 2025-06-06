import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Package, AlertTriangle, X, RotateCcw, Plus, Search, Filter, FileText, Edit, Eye, TrendingDown } from 'lucide-react';

// Dados simulados de movimentações para cálculo de projeção
const movimentacoesEstoque = [
  { codigo: 'CX-001', data: '2025-05-15', tipo: 'saida', quantidade: 10 },
  { codigo: 'CX-001', data: '2025-05-10', tipo: 'saida', quantidade: 15 },
  { codigo: 'CX-001', data: '2025-05-05', tipo: 'entrada', quantidade: 50 },
  { codigo: 'PL-005', data: '2025-05-12', tipo: 'saida', quantidade: 5 },
  { codigo: 'PL-005', data: '2025-05-08', tipo: 'saida', quantidade: 3 },
  { codigo: 'FT-012', data: '2025-05-14', tipo: 'saida', quantidade: 8 },
  { codigo: 'FT-012', data: '2025-05-07', tipo: 'saida', quantidade: 12 },
  { codigo: 'CR-003', data: '2025-05-11', tipo: 'saida', quantidade: 1 },
  { codigo: 'LV-008', data: '2025-05-13', tipo: 'saida', quantidade: 15 },
  { codigo: 'LV-008', data: '2025-05-06', tipo: 'saida', quantidade: 10 }
];

const itensEstoque = [
  {
    codigo: 'CX-001',
    item: 'Caixa de Papelão Grande',
    categoria: 'Materiais de Embalagem',
    estoqueAtual: 25,
    estoqueMinimo: 50,
    quantidadeTotal: 100, // Total inicial
    retiradas: 75, // Total de retiradas
    status: 'Baixo Estoque'
  },
  {
    codigo: 'PL-005',
    item: 'Plástico Bolha (Rolo 50m)',
    categoria: 'Materiais de Embalagem',
    estoqueAtual: 8,
    estoqueMinimo: 15,
    quantidadeTotal: 30,
    retiradas: 22,
    status: 'Baixo Estoque'
  },
  {
    codigo: 'FT-012',
    item: 'Fita Adesiva Transparente',
    categoria: 'Materiais de Embalagem',
    estoqueAtual: 12,
    estoqueMinimo: 30,
    quantidadeTotal: 50,
    retiradas: 38,
    status: 'Baixo Estoque'
  },
  {
    codigo: 'CR-003',
    item: 'Carrinho de Carga',
    categoria: 'Equipamentos',
    estoqueAtual: 2,
    estoqueMinimo: 5,
    quantidadeTotal: 8,
    retiradas: 6,
    status: 'Baixo Estoque'
  },
  {
    codigo: 'LV-008',
    item: 'Luvas de Proteção',
    categoria: 'Suprimentos',
    estoqueAtual: 10,
    estoqueMinimo: 20,
    quantidadeTotal: 50,
    retiradas: 40,
    status: 'Baixo Estoque'
  }
];

export default function Estoque() {
  // Função para calcular saldo atual (quantidade total - retiradas)
  const calcularSaldoAtual = (quantidadeTotal, retiradas) => {
    return quantidadeTotal - retiradas;
  };

  // Função para verificar se item está abaixo do mínimo
  const isAbaixoMinimo = (estoqueAtual, estoqueMinimo) => {
    return estoqueAtual < estoqueMinimo;
  };

  // Função para calcular projeção de consumo mensal baseado nos últimos 30 dias
  const calcularProjecaoConsumo = (codigo) => {
    const hoje = new Date();
    const trintaDiasAtras = new Date(hoje.getTime() - (30 * 24 * 60 * 60 * 1000));
    
    // Filtrar movimentações de saída dos últimos 30 dias para o item específico
    const saidasRecentes = movimentacoesEstoque.filter(mov => {
      const dataMovimentacao = new Date(mov.data);
      return mov.codigo === codigo && 
             mov.tipo === 'saida' && 
             dataMovimentacao >= trintaDiasAtras;
    });
    
    // Somar total de saídas
    const totalSaidas = saidasRecentes.reduce((total, mov) => total + mov.quantidade, 0);
    
    // Calcular média mensal (considerando que temos dados de 30 dias)
    return Math.round(totalSaidas);
  };

  // Função para determinar a cor do status baseado no estoque
  const getStatusColor = (estoqueAtual, estoqueMinimo) => {
    if (estoqueAtual === 0) {
      return 'bg-red-100 text-red-800'; // Esgotado
    } else if (estoqueAtual < estoqueMinimo) {
      return 'bg-red-100 text-red-800'; // Baixo estoque - VERMELHO conforme solicitado
    } else {
      return 'bg-green-100 text-green-800'; // Estoque normal
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Gerenciamento de Estoque</h1>
        <div className="text-sm text-gray-600">Olá, Administrador</div>
      </div>

      {/* Botões de Ação */}
      <div className="flex gap-3">
        <button className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Novo Item
        </button>
        <button className="border border-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm font-medium">
          Registrar Movimentação
        </button>
        <button className="border border-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm font-medium">
          Gerar Relatório
        </button>
        <button className="border border-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm font-medium">
          Inventário
        </button>
      </div>

      {/* Barra de Busca e Filtros */}
      <div className="flex gap-4 items-center">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            type="text"
            placeholder="Buscar item por nome, código ou categoria..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm"
          />
        </div>
        <select className="border border-gray-300 rounded-md px-3 py-2 text-sm">
          <option>Todas as Categorias</option>
          <option>Materiais de Embalagem</option>
          <option>Equipamentos</option>
          <option>Ferramentas</option>
          <option>Veículos</option>
          <option>Suprimentos</option>
        </select>
        <select className="border border-gray-300 rounded-md px-3 py-2 text-sm">
          <option>Todos os Status</option>
          <option>Baixo Estoque</option>
          <option>Estoque Normal</option>
          <option>Esgotado</option>
        </select>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-gray-900">248</p>
                <p className="text-sm text-gray-600">Total de Itens</p>
              </div>
              <Package className="h-8 w-8 text-brown-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-gray-900">15</p>
                <p className="text-sm text-gray-600">Itens em Baixo Estoque</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-gray-900">5</p>
                <p className="text-sm text-gray-600">Itens Esgotados</p>
              </div>
              <X className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-gray-900">42</p>
                <p className="text-sm text-gray-600">Movimentações Recentes</p>
              </div>
              <RotateCcw className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Abas de Navegação */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button className="border-b-2 border-blue-500 py-2 px-1 text-sm font-medium text-blue-600">
            Visão Geral
          </button>
          <button className="border-b-2 border-transparent py-2 px-1 text-sm font-medium text-gray-500 hover:text-gray-700">
            Materiais de Embalagem
          </button>
          <button className="border-b-2 border-transparent py-2 px-1 text-sm font-medium text-gray-500 hover:text-gray-700">
            Equipamentos
          </button>
          <button className="border-b-2 border-transparent py-2 px-1 text-sm font-medium text-gray-500 hover:text-gray-700">
            Ferramentas
          </button>
          <button className="border-b-2 border-transparent py-2 px-1 text-sm font-medium text-gray-500 hover:text-gray-700">
            Veículos
          </button>
          <button className="border-b-2 border-transparent py-2 px-1 text-sm font-medium text-gray-500 hover:text-gray-700">
            Suprimentos
          </button>
        </nav>
      </div>

      {/* Tabela de Itens em Baixo Estoque - MELHORADA COM FÓRMULAS */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Itens em Baixo Estoque
            </CardTitle>
            <div className="flex gap-2">
              <button className="text-gray-400 hover:text-gray-600">
                <Filter className="h-4 w-4" />
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Código</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Item</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Categoria</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Saldo Atual</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Estoque Mínimo</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Projeção Mensal</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Ações</th>
                </tr>
              </thead>
              <tbody>
                {itensEstoque.map((item, index) => {
                  // Calcular saldo atual usando a fórmula
                  const saldoCalculado = calcularSaldoAtual(item.quantidadeTotal, item.retiradas);
                  const abaixoMinimo = isAbaixoMinimo(saldoCalculado, item.estoqueMinimo);
                  const projecaoConsumo = calcularProjecaoConsumo(item.codigo);
                  
                  return (
                    <tr key={index} className={`border-b border-gray-100 hover:bg-gray-50 ${abaixoMinimo ? 'bg-red-50' : ''}`}>
                      <td className="py-3 px-4 text-sm font-medium text-gray-900">{item.codigo}</td>
                      <td className="py-3 px-4 text-sm text-gray-900">{item.item}</td>
                      <td className="py-3 px-4 text-sm text-gray-600">{item.categoria}</td>
                      
                      {/* SALDO ATUAL CALCULADO - Fórmula: quantidade total - retiradas */}
                      <td className="py-3 px-4 text-sm">
                        <div className="flex flex-col">
                          <span className={`font-medium ${abaixoMinimo ? 'text-red-600' : 'text-gray-900'}`}>
                            {saldoCalculado}
                          </span>
                          <span className="text-xs text-gray-500">
                            ({item.quantidadeTotal} - {item.retiradas})
                          </span>
                        </div>
                      </td>
                      
                      <td className="py-3 px-4 text-sm text-gray-900">{item.estoqueMinimo}</td>
                      
                      {/* PROJEÇÃO DE CONSUMO MENSAL - Baseado nos últimos 30 dias */}
                      <td className="py-3 px-4 text-sm">
                        <div className="flex items-center gap-1">
                          <TrendingDown className="h-3 w-3 text-orange-500" />
                          <span className="text-orange-600 font-medium">{projecaoConsumo}/mês</span>
                        </div>
                      </td>
                      
                      {/* STATUS COM ALERTA VISUAL EM VERMELHO */}
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(saldoCalculado, item.estoqueMinimo)}`}>
                          {abaixoMinimo && <AlertTriangle className="h-3 w-3 mr-1" />}
                          {item.status}
                        </span>
                      </td>
                      
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          <button className="text-orange-600 hover:text-orange-800">
                            <Edit className="h-4 w-4" />
                          </button>
                          <button className="text-blue-600 hover:text-blue-800">
                            <Eye className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          
          {/* Legenda explicativa das fórmulas */}
          <div className="mt-4 p-3 bg-blue-50 rounded-md">
            <h4 className="text-sm font-medium text-blue-900 mb-2">📊 Fórmulas Aplicadas:</h4>
            <ul className="text-xs text-blue-800 space-y-1">
              <li><strong>Saldo Atual:</strong> Quantidade Total - Total de Retiradas</li>
              <li><strong>Alerta Vermelho:</strong> Exibido quando Saldo Atual {'<'} Estoque Mínimo</li>
              <li><strong>Projeção Mensal:</strong> Baseada no consumo dos últimos 30 dias</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Seção de Itens Esgotados */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <X className="h-5 w-5" />
              Itens Esgotados
            </CardTitle>
            <div className="flex gap-2">
              <button className="text-gray-400 hover:text-gray-600">
                <Filter className="h-4 w-4" />
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 text-sm">Nenhum item esgotado no momento.</p>
        </CardContent>
      </Card>
    </div>
  );
}

