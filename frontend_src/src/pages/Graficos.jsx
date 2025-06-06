import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { DollarSign, Truck, Building, Star, BarChart3, PieChart } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell } from 'recharts';

const faturamentoMensal = [
  { mes: 'Jan', valor: 85 },
  { mes: 'Fev', valor: 92 },
  { mes: 'Mar', valor: 105 },
  { mes: 'Abr', valor: 110 },
  { mes: 'Mai', valor: 98 },
  { mes: 'Jun', valor: 115 },
  { mes: 'Jul', valor: 120 },
  { mes: 'Ago', valor: 108 },
  { mes: 'Set', valor: 112 },
  { mes: 'Out', valor: 118 },
  { mes: 'Nov', valor: 125 },
  { mes: 'Dez', valor: 135 }
];

const distribuicaoReceita = [
  { name: 'Mudanças Residenciais', value: 40, color: '#3b82f6' },
  { name: 'Mudanças Comerciais', value: 25, color: '#10b981' },
  { name: 'Self Storage', value: 20, color: '#f59e0b' },
  { name: 'Outros Serviços', value: 15, color: '#ef4444' }
];

const comparativoData = [
  { mes: 'Jan', vipMudancas: 85, vipStorage: 25 },
  { mes: 'Fev', vipMudancas: 92, vipStorage: 28 },
  { mes: 'Mar', vipMudancas: 105, vipStorage: 32 },
  { mes: 'Abr', vipMudancas: 110, vipStorage: 35 },
  { mes: 'Mai', vipMudancas: 98, vipStorage: 30 },
  { mes: 'Jun', vipMudancas: 115, vipStorage: 38 }
];

export default function Graficos() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Gráficos e Análises</h1>
        <div className="text-sm text-gray-600">Olá, Administrador</div>
      </div>

      {/* Filtros */}
      <div className="flex gap-4 items-center">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">Período:</label>
          <select className="border border-gray-300 rounded-md px-3 py-1 text-sm">
            <option>Último Ano</option>
            <option>Últimos 6 meses</option>
            <option>Últimos 3 meses</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">Negócio:</label>
          <select className="border border-gray-300 rounded-md px-3 py-1 text-sm">
            <option>Todos</option>
            <option>VIP Mudanças</option>
            <option>VIP Storage</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">Região:</label>
          <select className="border border-gray-300 rounded-md px-3 py-1 text-sm">
            <option>Todas</option>
            <option>São Paulo</option>
            <option>Rio de Janeiro</option>
          </select>
        </div>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-gray-900">R$ 1.2M</p>
                <p className="text-sm text-gray-600">Faturamento Total</p>
                <p className="text-xs text-green-600">↑ 12% vs. ano anterior</p>
              </div>
              <DollarSign className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-gray-900">342</p>
                <p className="text-sm text-gray-600">Mudanças Realizadas</p>
                <p className="text-xs text-green-600">↑ 8% vs. ano anterior</p>
              </div>
              <Truck className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-gray-900">56</p>
                <p className="text-sm text-gray-600">Boxes Ocupados</p>
                <p className="text-xs text-green-600">↑ 15% vs. ano anterior</p>
              </div>
              <Building className="h-8 w-8 text-gray-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-gray-900">4.8</p>
                <p className="text-sm text-gray-600">Avaliação Média</p>
                <p className="text-xs text-green-600">↑ 0.3 vs. ano anterior</p>
              </div>
              <Star className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Faturamento Mensal */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Faturamento Mensal
              </CardTitle>
              <div className="flex gap-2">
                <button className="text-xs px-2 py-1 bg-blue-100 text-blue-600 rounded">Gráfico</button>
                <button className="text-xs px-2 py-1 text-gray-600">Tabela</button>
                <button className="text-xs px-2 py-1 text-gray-600">Exportar</button>
                <button className="text-xs px-2 py-1 text-gray-600">Detalhes</button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={faturamentoMensal}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" />
                <YAxis />
                <Tooltip formatter={(value) => [`R$ ${value}K`, 'Faturamento']} />
                <Bar dataKey="valor" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Distribuição de Receita */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5" />
                Distribuição de Receita
              </CardTitle>
              <div className="flex gap-2">
                <button className="text-xs px-2 py-1 text-gray-600">Exportar</button>
                <button className="text-xs px-2 py-1 text-gray-600">Detalhes</button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RechartsPieChart>
                <Pie
                  data={distribuicaoReceita}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={120}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {distribuicaoReceita.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </RechartsPieChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-2">
              {distribuicaoReceita.map((item, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded" style={{ backgroundColor: item.color }}></div>
                    <span>{item.name}</span>
                  </div>
                  <span className="font-medium">{item.value}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Comparativo VIP Mudanças vs. VIP Storage */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Comparativo VIP Mudanças vs. VIP Storage</CardTitle>
            <div className="flex gap-2">
              <button className="text-xs px-2 py-1 text-gray-600">Exportar</button>
              <button className="text-xs px-2 py-1 text-gray-600">Detalhes</button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={comparativoData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="mes" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="vipMudancas" fill="#3b82f6" name="VIP Mudanças" />
              <Bar dataKey="vipStorage" fill="#f59e0b" name="VIP Storage" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}

