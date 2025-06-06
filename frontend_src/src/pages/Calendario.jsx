import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';

const eventos = {
  1: [
    { tipo: 'visita', titulo: 'Visita - Carlos Silva', cor: 'bg-red-500' },
    { tipo: 'financeiro', titulo: 'Pagamento - Contrato #1082', cor: 'bg-green-500' }
  ],
  2: [
    { tipo: 'mudanca', titulo: 'Mudança - Família Oliveira', cor: 'bg-blue-500' }
  ],
  3: [
    { tipo: 'storage', titulo: 'Contrato Storage - Ana Paula', cor: 'bg-orange-500' }
  ],
  4: [
    { tipo: 'marketing', titulo: 'Campanha - Google Ads', cor: 'bg-red-600' }
  ],
  7: [
    { tipo: 'visita', titulo: 'Visita - Empresa XYZ', cor: 'bg-red-500' }
  ],
  8: [
    { tipo: 'mudanca', titulo: 'Mudança - Escritório Central', cor: 'bg-blue-500' }
  ],
  10: [
    { tipo: 'financeiro', titulo: 'Fechamento Mensal', cor: 'bg-green-500' }
  ],
  11: [
    { tipo: 'storage', titulo: 'Renovação - Box 42', cor: 'bg-orange-500' }
  ],
  14: [
    { tipo: 'marketing', titulo: 'Reunião - Estratégia', cor: 'bg-red-600' }
  ],
  15: [
    { tipo: 'financeiro', titulo: 'Pagamentos - Fornecedores', cor: 'bg-green-500' }
  ],
  16: [
    { tipo: 'visita', titulo: 'Visita - Condomínio Jardins', cor: 'bg-red-500' }
  ],
  18: [
    { tipo: 'mudanca', titulo: 'Mudança - Família Santos', cor: 'bg-blue-500' }
  ],
  21: [
    { tipo: 'visita', titulo: 'Visita - Pedro Almeida', cor: 'bg-red-500' },
    { tipo: 'mudanca', titulo: 'Mudança - Apartamento 302', cor: 'bg-blue-500' },
    { tipo: 'financeiro', titulo: 'Reunião - Investimentos', cor: 'bg-green-500' }
  ],
  22: [
    { tipo: 'marketing', titulo: 'Lançamento - Campanha', cor: 'bg-red-600' }
  ],
  23: [
    { tipo: 'storage', titulo: 'Contrato - Novo Cliente', cor: 'bg-orange-500' }
  ],
  25: [
    { tipo: 'visita', titulo: 'Visita - Empresa ABC', cor: 'bg-red-500' }
  ],
  28: [
    { tipo: 'mudanca', titulo: 'Mudança - Residencial', cor: 'bg-blue-500' }
  ],
  29: [
    { tipo: 'financeiro', titulo: 'Pagamento - Funcionários', cor: 'bg-green-500' }
  ],
  30: [
    { tipo: 'marketing', titulo: 'Análise - Resultados', cor: 'bg-red-600' }
  ]
};

const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

export default function Calendario() {
  const [mesAtual, setMesAtual] = useState(3); // Abril = 3 (0-indexed)
  const [anoAtual, setAnoAtual] = useState(2025);

  const getDiasDoMes = (mes, ano) => {
    const primeiroDia = new Date(ano, mes, 1);
    const ultimoDia = new Date(ano, mes + 1, 0);
    const diasNoMes = ultimoDia.getDate();
    const diaSemanaInicio = primeiroDia.getDay();
    
    const dias = [];
    
    // Dias do mês anterior
    const ultimoDiaMesAnterior = new Date(ano, mes, 0).getDate();
    for (let i = diaSemanaInicio - 1; i >= 0; i--) {
      dias.push({
        dia: ultimoDiaMesAnterior - i,
        mesAtual: false,
        eventos: []
      });
    }
    
    // Dias do mês atual
    for (let dia = 1; dia <= diasNoMes; dia++) {
      dias.push({
        dia,
        mesAtual: true,
        eventos: eventos[dia] || []
      });
    }
    
    // Dias do próximo mês
    const diasRestantes = 42 - dias.length;
    for (let dia = 1; dia <= diasRestantes; dia++) {
      dias.push({
        dia,
        mesAtual: false,
        eventos: []
      });
    }
    
    return dias;
  };

  const dias = getDiasDoMes(mesAtual, anoAtual);

  const navegarMes = (direcao) => {
    if (direcao === 'anterior') {
      if (mesAtual === 0) {
        setMesAtual(11);
        setAnoAtual(anoAtual - 1);
      } else {
        setMesAtual(mesAtual - 1);
      }
    } else {
      if (mesAtual === 11) {
        setMesAtual(0);
        setAnoAtual(anoAtual + 1);
      } else {
        setMesAtual(mesAtual + 1);
      }
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Calendário</h1>
        <div className="text-sm text-gray-600">Olá, Administrador</div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              Calendário de Atividades
            </CardTitle>
            <div className="flex items-center gap-4">
              <button 
                onClick={() => navegarMes('anterior')}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <span className="font-medium text-lg">
                {meses[mesAtual]} {anoAtual}
              </span>
              <button 
                onClick={() => navegarMes('proximo')}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Cabeçalho dos dias da semana */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {diasSemana.map((dia) => (
              <div key={dia} className="p-2 text-center font-medium text-gray-600 text-sm">
                {dia}
              </div>
            ))}
          </div>

          {/* Grade do calendário */}
          <div className="grid grid-cols-7 gap-1">
            {dias.map((diaObj, index) => (
              <div 
                key={index} 
                className={`min-h-[120px] p-1 border border-gray-200 ${
                  !diaObj.mesAtual ? 'bg-gray-50 text-gray-400' : 'bg-white'
                } ${diaObj.dia === 21 ? 'ring-2 ring-blue-500' : ''}`}
              >
                <div className="text-sm font-medium mb-1">{diaObj.dia}</div>
                <div className="space-y-1">
                  {diaObj.eventos.map((evento, eventIndex) => (
                    <div 
                      key={eventIndex}
                      className={`text-xs p-1 rounded text-white ${evento.cor} truncate`}
                      title={evento.titulo}
                    >
                      {evento.titulo}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Legenda */}
          <div className="mt-6 flex flex-wrap gap-4 justify-center text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-500 rounded"></div>
              <span>Visitas</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-500 rounded"></div>
              <span>Mudanças</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500 rounded"></div>
              <span>Financeiro</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-orange-500 rounded"></div>
              <span>Self Storage</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-600 rounded"></div>
              <span>Marketing</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

