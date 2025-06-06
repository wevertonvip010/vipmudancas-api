import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Trophy, TrendingUp, Target, Medal } from 'lucide-react';

export default function ProgramaPontos() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Programa de Pontos</h1>
        <div className="text-sm text-gray-600">Olá, Administrador</div>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-gray-900">1.250</p>
                <p className="text-sm text-gray-600">Seus Pontos Atuais</p>
              </div>
              <Trophy className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-gray-900">320</p>
                <p className="text-sm text-gray-600">Pontos Este Mês</p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-gray-900">75%</p>
                <p className="text-sm text-gray-600">Da Meta Mensal</p>
              </div>
              <Target className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-gray-900">3º</p>
                <p className="text-sm text-gray-600">Sua Posição no Ranking</p>
              </div>
              <Medal className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Abas de Navegação */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button className="border-b-2 border-blue-500 py-2 px-1 text-sm font-medium text-blue-600">
            Meu Progresso
          </button>
          <button className="border-b-2 border-transparent py-2 px-1 text-sm font-medium text-gray-500 hover:text-gray-700">
            Recompensas
          </button>
          <button className="border-b-2 border-transparent py-2 px-1 text-sm font-medium text-gray-500 hover:text-gray-700">
            Ranking
          </button>
          <button className="border-b-2 border-transparent py-2 px-1 text-sm font-medium text-gray-500 hover:text-gray-700">
            Conquistas
          </button>
          <button className="border-b-2 border-transparent py-2 px-1 text-sm font-medium text-gray-500 hover:text-gray-700">
            Histórico
          </button>
        </nav>
      </div>

      {/* Progresso para Próximo Nível */}
      <Card>
        <CardHeader>
          <CardTitle>Progresso para Próximo Nível</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700">Nível Prata</span>
            <span className="text-sm text-gray-600">1.250 / 2.000 pontos</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className="bg-blue-600 h-3 rounded-full transition-all duration-300" 
              style={{ width: '62.5%' }}
            ></div>
          </div>
          <p className="text-sm text-gray-600">Faltam 750 pontos para atingir o Nível Ouro</p>
        </CardContent>
      </Card>

      {/* Metas do Mês */}
      <Card>
        <CardHeader>
          <CardTitle>Metas do Mês</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Mudanças Residenciais */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">Mudanças Residenciais</span>
              <span className="text-sm text-gray-600">8 / 10</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                style={{ width: '80%' }}
              ></div>
            </div>
          </div>

          {/* Contratos Self Storage */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">Contratos Self Storage</span>
              <span className="text-sm text-gray-600">5 / 8</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                style={{ width: '62.5%' }}
              ></div>
            </div>
          </div>

          {/* Avaliações 5 Estrelas */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">Avaliações 5 Estrelas</span>
              <span className="text-sm text-gray-600">12 / 15</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                style={{ width: '80%' }}
              ></div>
            </div>
          </div>

          {/* Valor Total em Vendas */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">Valor Total em Vendas</span>
              <span className="text-sm text-gray-600">R$ 85.000 / R$ 100.000</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                style={{ width: '85%' }}
              ></div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

