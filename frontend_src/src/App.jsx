import { useState, useEffect, useRef } from 'react'
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom'
import { 
  Home, Users, Calendar, FileText, Truck, Package, 
  DollarSign, TrendingUp, BarChart3, Settings, 
  MessageCircle, X, User, Bell, Search, Menu
} from 'lucide-react'
import './App.css'

// Importar páginas específicas
import Estoque from './pages/Estoque'

// Componente Sidebar
function Sidebar({ isOpen, setIsOpen, temPermissao, usuarioAtual }) {
  const location = useLocation()
  
  const menuItems = [
    { path: '/', icon: Home, label: 'Dashboard', permissao: 'dashboard' },
    { path: '/clientes', icon: Users, label: 'Clientes', permissao: 'clientes' },
    { path: '/visitas', icon: Calendar, label: 'Visitas', permissao: 'visitas' },
    { path: '/orcamentos', icon: FileText, label: 'Orçamentos', permissao: 'orcamentos' },
    { path: '/contratos', icon: FileText, label: 'Contratos', permissao: 'contratos' },
    { path: '/ordens-servico', icon: Truck, label: 'Ordens de Serviço', permissao: 'ordens-servico' },
    { path: '/self-storage', icon: Package, label: 'Self Storage', permissao: 'self-storage' },
    { path: '/financeiro', icon: DollarSign, label: 'Financeiro', permissao: 'financeiro' },
    { path: '/marketing', icon: TrendingUp, label: 'Marketing', permissao: 'marketing' },
    { path: '/vendas', icon: BarChart3, label: 'Vendas', permissao: 'vendas' },
    { path: '/estoque', icon: Package, label: 'Estoque', permissao: 'estoque' },
    { path: '/programa-pontos', icon: TrendingUp, label: 'Programa de Pontos', permissao: 'programa-pontos' },
    { path: '/calendario', icon: Calendar, label: 'Calendário', permissao: 'calendario' },
    { path: '/graficos', icon: BarChart3, label: 'Gráficos', permissao: 'graficos' },
    { path: '/equipe', icon: Users, label: 'Equipe', permissao: 'equipe' },
    { path: '/configuracoes', icon: Settings, label: 'Configurações', permissao: 'configuracoes' }
  ]

  // Filtrar atalhos baseado em permissões
  const atalhosRapidos = [
    { 
      path: '/visitas/nova', 
      icon: Calendar, 
      label: 'Nova Visita',
      cor: 'bg-green-100 text-green-700 hover:bg-green-200',
      permissao: 'visitas'
    },
    { 
      path: '/orcamentos/novo', 
      icon: FileText, 
      label: 'Novo Orçamento',
      cor: 'bg-blue-100 text-blue-700 hover:bg-blue-200',
      permissao: 'orcamentos'
    },
    { 
      path: '/clientes/novo', 
      icon: Users, 
      label: 'Novo Cliente',
      cor: 'bg-purple-100 text-purple-700 hover:bg-purple-200',
      permissao: 'clientes'
    }
  ].filter(atalho => temPermissao && temPermissao(atalho.permissao));

  // Filtrar itens do menu baseado em permissões
  const menuItemsFiltrados = menuItems.filter(item => 
    !temPermissao || temPermissao(item.permissao)
  );

  return (
    <div className={`vip-sidebar fixed left-0 top-0 h-full w-48 z-50 transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 overflow-y-auto`}>
      <div className="p-4">
        <h1 className="text-white text-lg font-bold">VIP Mudanças</h1>
      </div>
      
      {/* ATALHOS RÁPIDOS - NOVA FUNCIONALIDADE */}
      <div className="px-4 mb-6">
        <h3 className="text-white text-xs font-semibold uppercase tracking-wider mb-3 opacity-75">
          ⚡ Atalhos Rápidos
        </h3>
        <div className="space-y-2">
          {atalhosRapidos.map((atalho) => {
            const Icon = atalho.icon;
            return (
              <Link
                key={atalho.path}
                to={atalho.path}
                className={`flex items-center px-3 py-2 rounded-lg text-xs font-medium transition-colors ${atalho.cor}`}
                onClick={() => setIsOpen(false)}
              >
                <Icon className="w-4 h-4 mr-2" />
                {atalho.label}
              </Link>
            );
          })}
        </div>
        
        {/* Separador */}
        <div className="border-t border-white border-opacity-20 mt-4 pt-4">
          <div className="text-white text-xs opacity-50 text-center">
            Acesso rápido aos formulários
          </div>
        </div>
      </div>
      
      <nav className="mt-4">
        {menuItemsFiltrados.map((item) => {
          const Icon = item.icon
          const isActive = location.pathname === item.path
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`vip-sidebar-item flex items-center px-4 py-3 text-sm ${isActive ? 'active' : ''}`}
              onClick={() => setIsOpen(false)}
            >
              <Icon className="w-4 h-4 mr-3" />
              {item.label}
            </Link>
          )
        })}
        
        {/* Indicador de perfil no final do menu */}
        <div className="mt-6 px-4 py-3 border-t border-white border-opacity-20">
          <div className="text-white text-xs opacity-75 mb-1">Perfil Ativo:</div>
          <div className="text-white text-sm font-medium">
            {usuarioAtual?.perfil === 'administrador' && '👑 Administrador'}
            {usuarioAtual?.perfil === 'vendas' && '💼 Vendas'}
            {usuarioAtual?.perfil === 'operacional' && '🔧 Operacional'}
          </div>
        </div>
      </nav>
    </div>
  )
}

// Componente Header
function Header({ onMenuClick, currentUser = 'Administrador' }) {
  // Estado das notificações - NOVA FUNCIONALIDADE
  const [notificacoes, setNotificacoes] = useState([
    {
      id: 1,
      tipo: 'visita',
      titulo: 'Visita agendada para hoje',
      descricao: 'Visita com João Silva às 14:00',
      data: new Date(),
      lida: false,
      icone: Calendar,
      cor: 'text-blue-600'
    },
    {
      id: 2,
      tipo: 'contrato',
      titulo: 'Contrato vencendo',
      descricao: 'Contrato #1082 vence em 3 dias',
      data: new Date(Date.now() - 2 * 60 * 60 * 1000),
      lida: false,
      icone: FileText,
      cor: 'text-orange-600'
    },
    {
      id: 3,
      tipo: 'estoque',
      titulo: 'Estoque baixo',
      descricao: 'Caixas de papelão: apenas 12 unidades',
      data: new Date(Date.now() - 4 * 60 * 60 * 1000),
      lida: false,
      icone: Package,
      cor: 'text-red-600'
    },
    {
      id: 4,
      tipo: 'lead',
      titulo: 'Novo lead no sistema',
      descricao: 'Maria Santos solicitou orçamento',
      data: new Date(Date.now() - 6 * 60 * 60 * 1000),
      lida: true,
      icone: Users,
      cor: 'text-green-600'
    }
  ]);

  const [mostrarNotificacoes, setMostrarNotificacoes] = useState(false);
  const notificacaoRef = useRef(null);

  // Contar notificações não lidas
  const naoLidas = notificacoes.filter(n => !n.lida).length;

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    function handleClickOutside(event) {
      if (notificacaoRef.current && !notificacaoRef.current.contains(event.target)) {
        setMostrarNotificacoes(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Marcar notificação como lida
  const marcarComoLida = (id) => {
    setNotificacoes(prev => 
      prev.map(notif => 
        notif.id === id ? { ...notif, lida: true } : notif
      )
    );
  };

  // Visualizar notificação
  const visualizarNotificacao = (notificacao) => {
    marcarComoLida(notificacao.id);
    
    // Redirecionar baseado no tipo
    switch(notificacao.tipo) {
      case 'visita':
        // Navegar para visitas
        break;
      case 'contrato':
        // Navegar para contratos
        break;
      case 'estoque':
        // Navegar para estoque
        break;
      case 'lead':
        // Navegar para clientes
        break;
    }
    
    setMostrarNotificacoes(false);
  };

  // Formatar tempo relativo
  const formatarTempo = (data) => {
    const agora = new Date();
    const diff = agora - data;
    const horas = Math.floor(diff / (1000 * 60 * 60));
    
    if (horas < 1) return 'Agora';
    if (horas === 1) return '1 hora atrás';
    if (horas < 24) return `${horas} horas atrás`;
    
    const dias = Math.floor(horas / 24);
    if (dias === 1) return '1 dia atrás';
    return `${dias} dias atrás`;
  };

  return (
    <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
      <div className="flex items-center">
        <button 
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-md hover:bg-gray-100"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>
      
      <div className="flex items-center space-x-4">
        {/* SISTEMA DE NOTIFICAÇÕES - NOVA FUNCIONALIDADE */}
        <div className="relative" ref={notificacaoRef}>
          <button
            onClick={() => setMostrarNotificacoes(!mostrarNotificacoes)}
            className="relative p-2 rounded-md hover:bg-gray-100 transition-colors"
          >
            <Bell className="w-5 h-5 text-gray-600" />
            {naoLidas > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
                {naoLidas > 9 ? '9+' : naoLidas}
              </span>
            )}
          </button>

          {/* Dropdown de Notificações */}
          {mostrarNotificacoes && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Notificações</h3>
                  {naoLidas > 0 && (
                    <span className="bg-red-100 text-red-800 text-xs font-medium px-2 py-1 rounded-full">
                      {naoLidas} nova{naoLidas !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              </div>

              <div className="max-h-96 overflow-y-auto">
                {notificacoes.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    <Bell className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                    <p>Nenhuma notificação</p>
                  </div>
                ) : (
                  notificacoes.map((notificacao) => {
                    const IconeNotificacao = notificacao.icone;
                    return (
                      <div
                        key={notificacao.id}
                        className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors ${
                          !notificacao.lida ? 'bg-blue-50' : ''
                        }`}
                        onClick={() => visualizarNotificacao(notificacao)}
                      >
                        <div className="flex items-start space-x-3">
                          <div className={`flex-shrink-0 ${notificacao.cor}`}>
                            <IconeNotificacao className="w-5 h-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className={`text-sm font-medium ${
                                !notificacao.lida ? 'text-gray-900' : 'text-gray-700'
                              }`}>
                                {notificacao.titulo}
                              </p>
                              {!notificacao.lida && (
                                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 mt-1">
                              {notificacao.descricao}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {formatarTempo(notificacao.data)}
                            </p>
                            <button className="text-xs text-blue-600 hover:text-blue-800 mt-2 font-medium">
                              👁️ Visualizar
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {notificacoes.length > 0 && (
                <div className="p-3 border-t border-gray-200">
                  <button
                    onClick={() => {
                      setNotificacoes(prev => prev.map(n => ({ ...n, lida: true })));
                    }}
                    className="w-full text-sm text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Marcar todas como lidas
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <span className="text-sm text-gray-600">Olá, {currentUser}</span>
        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
          <User className="w-4 h-4 text-blue-600" />
        </div>
      </div>
    </header>
  )
}

// Componente VIP Assistant
function VIPAssistant() {
  const [isOpen, setIsOpen] = useState(false)
  const [message, setMessage] = useState('')

  return (
    <>
      <div 
        className="vip-assistant"
        onClick={() => setIsOpen(!isOpen)}
      >
        <MessageCircle className="w-6 h-6" />
      </div>
      
      {isOpen && (
        <div className="vip-assistant-chat">
          <div className="bg-blue-600 text-white p-4 rounded-t-xl flex items-center justify-between">
            <h3 className="font-semibold">VIP Assistant</h3>
            <button onClick={() => setIsOpen(false)}>
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <div className="p-4 h-64 overflow-y-auto">
            <div className="mb-4">
              <div className="bg-gray-100 p-3 rounded-lg mb-2">
                <p className="text-sm">Olá! Como posso ajudar você hoje?</p>
              </div>
            </div>
            
            <div className="mb-4">
              <div className="bg-blue-50 p-3 rounded-lg mb-2 ml-8">
                <p className="text-sm">Preciso de ajuda com um orçamento que não fechou.</p>
              </div>
            </div>
            
            <div className="bg-gray-100 p-3 rounded-lg">
              <p className="text-sm">Aqui estão algumas sugestões para lidar com objeções comuns em orçamentos:</p>
              <ul className="text-xs mt-2 space-y-1">
                <li>• Ofereça um desconto para pagamento à vista</li>
              </ul>
            </div>
          </div>
          
          <div className="p-4 border-t">
            <div className="flex">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Digite sua mensagem..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-l-lg text-sm"
              />
              <button className="bg-blue-600 text-white px-4 py-2 rounded-r-lg">
                <span className="text-sm">→</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// Páginas do Sistema
function Dashboard() {
  // Dados simulados para o painel de insights - NOVA FUNCIONALIDADE
  const insightsData = {
    contratosAtivos: {
      total: 87,
      variacao: '+12%',
      descricao: 'Contratos ativos este mês',
      icone: FileText,
      cor: 'text-green-600',
      corFundo: 'bg-green-50'
    },
    visitasSemanais: {
      total: 23,
      variacao: '+8%', 
      descricao: 'Visitas agendadas nesta semana',
      icone: Calendar,
      cor: 'text-blue-600',
      corFundo: 'bg-blue-50'
    },
    caixasEstoque: {
      total: 156,
      variacao: '-3%',
      descricao: 'Total de caixas em estoque',
      icone: Package,
      cor: 'text-purple-600',
      corFundo: 'bg-purple-50'
    },
    receitaMensal: {
      total: 'R$ 78.450',
      variacao: '+15%',
      descricao: 'Receita total do mês',
      icone: DollarSign,
      cor: 'text-emerald-600',
      corFundo: 'bg-emerald-50'
    }
  };

  // Função para renderizar card de insight - NOVA FUNCIONALIDADE
  const renderInsightCard = (key, data) => {
    const Icon = data.icone;
    const isPositive = data.variacao.startsWith('+');
    
    return (
      <div key={key} className="vip-card p-6 hover:shadow-lg transition-shadow duration-200">
        <div className="flex items-center justify-between mb-4">
          <div className={`p-3 rounded-full ${data.corFundo}`}>
            <Icon className={`w-6 h-6 ${data.cor}`} />
          </div>
          <span className={`text-sm font-medium px-2 py-1 rounded-full ${
            isPositive ? 'text-green-700 bg-green-100' : 'text-red-700 bg-red-100'
          }`}>
            {data.variacao}
          </span>
        </div>
        
        <div className="text-3xl font-bold text-gray-900 mb-1">
          {data.total}
        </div>
        
        <div className="text-sm text-gray-600">
          {data.descricao}
        </div>
        
        {/* Barra de progresso simulada */}
        <div className="mt-4 w-full bg-gray-200 rounded-full h-2">
          <div 
            className={`h-2 rounded-full ${data.cor.replace('text-', 'bg-')}`}
            style={{ width: `${Math.random() * 40 + 60}%` }}
          ></div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <div className="text-sm text-gray-600">Olá, Administrador</div>
      </div>
      
      {/* PAINEL DE INSIGHTS - NOVA FUNCIONALIDADE */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">📊 Painel de Insights</h2>
            <p className="text-sm text-gray-600 mt-1">Métricas importantes do seu negócio em tempo real</p>
          </div>
          <div className="text-xs text-gray-500">
            Atualizado há 5 min
          </div>
        </div>
        
        {/* Cards de Insights */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Object.entries(insightsData).map(([key, data]) => renderInsightCard(key, data))}
        </div>
        
        {/* Resumo Executivo */}
        <div className="mt-6 p-4 bg-white rounded-lg border border-gray-200">
          <h3 className="text-sm font-medium text-gray-900 mb-2">💡 Resumo Executivo:</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-gray-700">
            <div>
              <strong>Crescimento:</strong> Receita mensal cresceu 15% comparado ao mês anterior
            </div>
            <div>
              <strong>Oportunidade:</strong> 23 visitas agendadas podem gerar até R$ 45.000 em novos contratos
            </div>
            <div>
              <strong>Atenção:</strong> Estoque de caixas reduziu 3%, considere reposição
            </div>
            <div>
              <strong>Meta:</strong> 87 contratos ativos, faltam 13 para atingir meta mensal de 100
            </div>
          </div>
        </div>
      </div>
      
      {/* Cards de Estatísticas Originais - Mantidos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="vip-card p-6 text-center">
          <Truck className="w-8 h-8 text-blue-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-800">24</div>
          <div className="text-sm text-gray-600">Mudanças Agendadas</div>
        </div>
        
        <div className="vip-card p-6 text-center">
          <Calendar className="w-8 h-8 text-blue-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-800">18</div>
          <div className="text-sm text-gray-600">Visitas Pendentes</div>
        </div>
        
        <div className="vip-card p-6 text-center">
          <Package className="w-8 h-8 text-blue-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-800">42</div>
          <div className="text-sm text-gray-600">Boxes Ocupados</div>
        </div>
        
        <div className="vip-card p-6 text-center">
          <DollarSign className="w-8 h-8 text-blue-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-800">R$ 45.320</div>
          <div className="text-sm text-gray-600">Faturamento Mensal</div>
        </div>
      </div>
      
      {/* Layout Principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendário */}
        <div className="lg:col-span-2">
          <div className="vip-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">📅 Calendário de Atividades</h2>
              <div className="flex items-center space-x-2">
                <button className="p-1 hover:bg-gray-100 rounded">‹</button>
                <span className="font-medium">Abril 2025</span>
                <button className="p-1 hover:bg-gray-100 rounded">›</button>
              </div>
            </div>
            
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
                <div key={day} className="p-2 text-center text-sm font-medium text-gray-600">
                  {day}
                </div>
              ))}
            </div>
            
            <div className="grid grid-cols-7 gap-1">
              {/* Primeira semana */}
              <div className="p-2 text-center text-sm text-gray-400">30</div>
              <div className="p-2 text-center text-sm text-gray-400">31</div>
              <div className="p-2 text-center text-sm">
                <div className="font-medium">1</div>
                <div className="vip-calendar-event vip-calendar-visita">Visita - Carlos Silva</div>
                <div className="vip-calendar-event vip-calendar-pagamento">Pagamento - Contrato #1082</div>
              </div>
              <div className="p-2 text-center text-sm">
                <div className="font-medium">2</div>
                <div className="vip-calendar-event vip-calendar-mudanca">Mudança - Família Oliveira</div>
              </div>
              <div className="p-2 text-center text-sm">
                <div className="font-medium">3</div>
                <div className="vip-calendar-event vip-calendar-contrato">Contrato Storage - Ana Paula</div>
              </div>
              <div className="p-2 text-center text-sm">
                <div className="font-medium">4</div>
              </div>
              <div className="p-2 text-center text-sm">
                <div className="font-medium">5</div>
              </div>
              
              {/* Segunda semana */}
              <div className="p-2 text-center text-sm">
                <div className="font-medium">6</div>
              </div>
              <div className="p-2 text-center text-sm">
                <div className="font-medium">7</div>
                <div className="vip-calendar-event vip-calendar-visita">Visita - Empresa XYZ</div>
              </div>
              <div className="p-2 text-center text-sm">
                <div className="font-medium">8</div>
                <div className="vip-calendar-event vip-calendar-mudanca">Mudança - Escritório Central</div>
              </div>
              <div className="p-2 text-center text-sm">
                <div className="font-medium">9</div>
              </div>
              <div className="p-2 text-center text-sm">
                <div className="font-medium">10</div>
                <div className="vip-calendar-event vip-calendar-contrato">Contrato Storage</div>
              </div>
              <div className="p-2 text-center text-sm">
                <div className="font-medium">11</div>
                <div className="vip-calendar-event vip-calendar-mudanca">Mudança - Pedro</div>
              </div>
              <div className="p-2 text-center text-sm">
                <div className="font-medium">12</div>
              </div>
              
              {/* Terceira semana */}
              <div className="p-2 text-center text-sm">
                <div className="font-medium">13</div>
              </div>
              <div className="p-2 text-center text-sm">
                <div className="font-medium">14</div>
              </div>
              <div className="p-2 text-center text-sm">
                <div className="font-medium">15</div>
                <div className="vip-calendar-event vip-calendar-visita">Vistoria - Ana</div>
              </div>
              <div className="p-2 text-center text-sm">
                <div className="font-medium">16</div>
              </div>
              <div className="p-2 text-center text-sm">
                <div className="font-medium">17</div>
              </div>
              <div className="p-2 text-center text-sm">
                <div className="font-medium">18</div>
                <div className="vip-calendar-event vip-calendar-pagamento">Pagamento</div>
              </div>
              <div className="p-2 text-center text-sm">
                <div className="font-medium">19</div>
                <div className="vip-calendar-event vip-calendar-mudanca">Mudança - Carlos</div>
                <div className="vip-calendar-event vip-calendar-visita">Vistoria - Lucia</div>
              </div>
              
              {/* Quarta semana */}
              <div className="p-2 text-center text-sm">
                <div className="font-medium">20</div>
              </div>
              <div className="p-2 text-center text-sm border-2 border-blue-500">
                <div className="font-medium">21</div>
                <div className="vip-calendar-event vip-calendar-visita">Visita - Pedro Almeida</div>
                <div className="vip-calendar-event vip-calendar-mudanca">Mudança - Apartamento 302</div>
                <div className="vip-calendar-event vip-calendar-reuniao">Reunião - Investimentos</div>
              </div>
              <div className="p-2 text-center text-sm">
                <div className="font-medium">22</div>
                <div className="vip-calendar-event vip-calendar-contrato">Lançamento - Campanha</div>
              </div>
              <div className="p-2 text-center text-sm">
                <div className="font-medium">23</div>
                <div className="vip-calendar-event vip-calendar-contrato">Contrato - Novo Cliente</div>
              </div>
              <div className="p-2 text-center text-sm">
                <div className="font-medium">24</div>
                <div className="vip-calendar-event vip-calendar-mudanca">Mudança - Roberto</div>
              </div>
              <div className="p-2 text-center text-sm">
                <div className="font-medium">25</div>
                <div className="vip-calendar-event vip-calendar-visita">Visita - Empresa ABC</div>
              </div>
              <div className="p-2 text-center text-sm">
                <div className="font-medium">26</div>
                <div className="vip-calendar-event vip-calendar-visita">Vistoria - Fernanda</div>
              </div>
              
              {/* Quinta semana */}
              <div className="p-2 text-center text-sm">
                <div className="font-medium">27</div>
              </div>
              <div className="p-2 text-center text-sm">
                <div className="font-medium">28</div>
                <div className="vip-calendar-event vip-calendar-mudanca">Mudança - Residencial</div>
              </div>
              <div className="p-2 text-center text-sm">
                <div className="font-medium">29</div>
                <div className="vip-calendar-event vip-calendar-pagamento">Pagamento - Funcionários</div>
              </div>
              <div className="p-2 text-center text-sm">
                <div className="font-medium">30</div>
                <div className="vip-calendar-event vip-calendar-contrato">Análise - Resultados</div>
              </div>
              <div className="p-2 text-center text-sm text-gray-400">1</div>
              <div className="p-2 text-center text-sm text-gray-400">2</div>
              <div className="p-2 text-center text-sm text-gray-400">3</div>
            </div>
            
            {/* Legenda */}
            <div className="mt-4 flex flex-wrap gap-4 text-xs">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-red-500 rounded mr-2"></div>
                <span>Visitas</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-blue-500 rounded mr-2"></div>
                <span>Mudanças</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded mr-2"></div>
                <span>Financeiro</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-yellow-500 rounded mr-2"></div>
                <span>Self Storage</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-purple-500 rounded mr-2"></div>
                <span>Marketing</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Atividades Recentes */}
        <div className="vip-card p-6">
          <h2 className="text-lg font-semibold mb-4">⚡ Atividades Recentes</h2>
          
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <Truck className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <div className="font-medium text-sm">Mudança agendada</div>
                <div className="text-xs text-gray-600">Cliente: Carlos Silva</div>
                <div className="text-xs text-gray-500">Hoje, 10:30</div>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <DollarSign className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <div className="font-medium text-sm">Pagamento recebido</div>
                <div className="text-xs text-gray-600">R$ 2.500,00 - Contrato #1082</div>
                <div className="text-xs text-gray-500">Hoje, 09:15</div>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                <Package className="w-4 h-4 text-yellow-600" />
              </div>
              <div>
                <div className="font-medium text-sm">Novo contrato Self Storage</div>
                <div className="text-xs text-gray-600">Box 12 - Ana Paula</div>
                <div className="text-xs text-gray-500">Ontem, 16:45</div>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                <Calendar className="w-4 h-4 text-red-600" />
              </div>
              <div>
                <div className="font-medium text-sm">Vistoria agendada</div>
                <div className="text-xs text-gray-600">Empresa XYZ - Amanhã 14h</div>
                <div className="text-xs text-gray-500">Ontem, 14:20</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Outras páginas (implementação básica)
function Financeiro() {
  // Importar utilitário de relatórios - NOVA FUNCIONALIDADE
  const gerarRelatorioPDF = async (tipo, dados, nomeUsuario) => {
    const { gerarRelatorioPDF: gerarPDF } = await import('./utils/relatorios.js');
    return gerarPDF(tipo, dados, nomeUsuario);
  };

  // Dados financeiros para cálculos (simulados)
  const dadosFinanceiros = {
    abril: {
      receitas: 45320.00,
      despesas: 18750.00,
      pendente: 8450.00
    },
    maio: {
      receitas: 52180.00,
      despesas: 21300.00,
      pendente: 6200.00
    }
  };

  // Função para calcular lucro líquido (receita - despesa)
  const calcularLucroLiquido = (receitas, despesas) => {
    return receitas - despesas;
  };

  // Função para calcular margem de lucro
  const calcularMargemLucro = (receitas, despesas) => {
    if (receitas === 0) return 0;
    return ((receitas - despesas) / receitas * 100).toFixed(1);
  };

  // Função para formatar valores em moeda brasileira
  const formatarMoeda = (valor) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

  // Cálculos automáticos para abril
  const lucroAbril = calcularLucroLiquido(dadosFinanceiros.abril.receitas, dadosFinanceiros.abril.despesas);
  const margemAbril = calcularMargemLucro(dadosFinanceiros.abril.receitas, dadosFinanceiros.abril.despesas);
  
  // Cálculos automáticos para maio
  const lucroMaio = calcularLucroLiquido(dadosFinanceiros.maio.receitas, dadosFinanceiros.maio.despesas);
  const margemMaio = calcularMargemLucro(dadosFinanceiros.maio.receitas, dadosFinanceiros.maio.despesas);

  // Variação percentual entre os meses
  const variacaoReceita = (((dadosFinanceiros.maio.receitas - dadosFinanceiros.abril.receitas) / dadosFinanceiros.abril.receitas) * 100).toFixed(1);
  const variacaoDespesa = (((dadosFinanceiros.maio.despesas - dadosFinanceiros.abril.despesas) / dadosFinanceiros.abril.despesas) * 100).toFixed(1);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Financeiro</h1>
        <div className="text-sm text-gray-600">Olá, Douglas</div>
      </div>
      
      {/* TOTAIS NO TOPO - NOVA FUNCIONALIDADE */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 p-4 bg-blue-50 rounded-lg">
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">{formatarMoeda(dadosFinanceiros.abril.receitas)}</div>
          <div className="text-sm text-gray-600">Total de Receitas (Abril)</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-red-600">{formatarMoeda(dadosFinanceiros.abril.despesas)}</div>
          <div className="text-sm text-gray-600">Total de Despesas (Abril)</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">{formatarMoeda(lucroAbril)}</div>
          <div className="text-sm text-gray-600">Lucro Líquido (Receita - Despesa)</div>
        </div>
      </div>
      
      {/* Abas */}
      <div className="flex space-x-1 mb-6">
        <button className="bg-blue-600 text-white px-6 py-2 rounded-t-lg font-medium">Todos</button>
        <button className="bg-gray-100 text-gray-600 px-6 py-2 rounded-t-lg">VIP Mudanças</button>
        <button className="bg-gray-100 text-gray-600 px-6 py-2 rounded-t-lg">VIP Storage</button>
      </div>
      
      {/* Resumo Financeiro */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold">📊 Resumo Financeiro - Abril 2025</h2>
        <div className="flex space-x-2">
          {/* BOTÃO GERAR RELATÓRIO - NOVA FUNCIONALIDADE */}
          <button
            onClick={() => {
              const dadosRelatorio = {
                receitas: [
                  { descricao: 'Mudanças Residenciais', categoria: 'Serviços', valor: 32500.00, data: '2025-04-15' },
                  { descricao: 'Mudanças Comerciais', categoria: 'Serviços', valor: 12820.00, data: '2025-04-20' }
                ],
                despesas: [
                  { descricao: 'Combustível', categoria: 'Operacional', valor: 8750.00, data: '2025-04-10' },
                  { descricao: 'Salários', categoria: 'Pessoal', valor: 10000.00, data: '2025-04-30' }
                ],
                periodo: 'Abril 2025'
              };
              gerarRelatorioPDF('Financeiro', dadosRelatorio, 'Douglas');
            }}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
          >
            📄 Gerar Relatório PDF
          </button>
          <button className="px-4 py-2 border border-gray-300 rounded-lg text-sm">📥 Exportar</button>
          <button className="px-4 py-2 border border-gray-300 rounded-lg text-sm">🖨️ Imprimir</button>
        </div>
      </div>
      
      {/* Cards Financeiros - MELHORADOS COM CÁLCULOS AUTOMÁTICOS */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
        <div className="vip-card p-4 text-center">
          <div className="text-2xl font-bold text-green-600">{formatarMoeda(dadosFinanceiros.abril.receitas)}</div>
          <div className="text-sm text-gray-600">Receita Total</div>
        </div>
        <div className="vip-card p-4 text-center">
          <div className="text-2xl font-bold text-red-600">{formatarMoeda(dadosFinanceiros.abril.despesas)}</div>
          <div className="text-sm text-gray-600">Despesas</div>
        </div>
        <div className="vip-card p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">{formatarMoeda(lucroAbril)}</div>
          <div className="text-sm text-gray-600">Lucro Líquido</div>
          <div className="text-xs text-gray-500 mt-1">({formatarMoeda(dadosFinanceiros.abril.receitas)} - {formatarMoeda(dadosFinanceiros.abril.despesas)})</div>
        </div>
        <div className="vip-card p-4 text-center">
          <div className="text-2xl font-bold text-yellow-600">{formatarMoeda(dadosFinanceiros.abril.pendente)}</div>
          <div className="text-sm text-gray-600">Pendente</div>
        </div>
        <div className="vip-card p-4 text-center">
          <div className="text-2xl font-bold text-gray-800">{margemAbril}%</div>
          <div className="text-sm text-gray-600">Margem de Lucro</div>
          <div className="text-xs text-gray-500 mt-1">(Lucro ÷ Receita × 100)</div>
        </div>
      </div>
      
      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* GRÁFICO COMPARATIVO MENSAL - NOVA FUNCIONALIDADE */}
        <div className="vip-card p-6">
          <h3 className="font-semibold mb-4">📈 Comparativo Mensal (Abril x Maio)</h3>
          <div className="space-y-4">
            {/* Receitas */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">Receitas</span>
                <span className={`text-sm font-medium ${variacaoReceita >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {variacaoReceita >= 0 ? '+' : ''}{variacaoReceita}%
                </span>
              </div>
              <div className="flex space-x-2">
                <div className="flex-1">
                  <div className="bg-green-200 h-8 rounded flex items-center justify-center">
                    <span className="text-xs font-medium">Abr: {formatarMoeda(dadosFinanceiros.abril.receitas)}</span>
                  </div>
                </div>
                <div className="flex-1">
                  <div className="bg-green-400 h-8 rounded flex items-center justify-center">
                    <span className="text-xs font-medium text-white">Mai: {formatarMoeda(dadosFinanceiros.maio.receitas)}</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Despesas */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">Despesas</span>
                <span className={`text-sm font-medium ${variacaoDespesa <= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {variacaoDespesa >= 0 ? '+' : ''}{variacaoDespesa}%
                </span>
              </div>
              <div className="flex space-x-2">
                <div className="flex-1">
                  <div className="bg-red-200 h-8 rounded flex items-center justify-center">
                    <span className="text-xs font-medium">Abr: {formatarMoeda(dadosFinanceiros.abril.despesas)}</span>
                  </div>
                </div>
                <div className="flex-1">
                  <div className="bg-red-400 h-8 rounded flex items-center justify-center">
                    <span className="text-xs font-medium text-white">Mai: {formatarMoeda(dadosFinanceiros.maio.despesas)}</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Lucro Líquido */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">Lucro Líquido</span>
                <span className={`text-sm font-medium ${lucroMaio >= lucroAbril ? 'text-green-600' : 'text-red-600'}`}>
                  {formatarMoeda(lucroMaio - lucroAbril)}
                </span>
              </div>
              <div className="flex space-x-2">
                <div className="flex-1">
                  <div className="bg-blue-200 h-8 rounded flex items-center justify-center">
                    <span className="text-xs font-medium">Abr: {formatarMoeda(lucroAbril)}</span>
                  </div>
                </div>
                <div className="flex-1">
                  <div className="bg-blue-400 h-8 rounded flex items-center justify-center">
                    <span className="text-xs font-medium text-white">Mai: {formatarMoeda(lucroMaio)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Legenda das fórmulas */}
          <div className="mt-4 p-3 bg-gray-50 rounded-md">
            <h4 className="text-sm font-medium text-gray-900 mb-2">🧮 Fórmulas Aplicadas:</h4>
            <ul className="text-xs text-gray-700 space-y-1">
              <li><strong>Lucro Líquido:</strong> Receitas - Despesas</li>
              <li><strong>Margem de Lucro:</strong> (Lucro ÷ Receita) × 100</li>
              <li><strong>Variação %:</strong> ((Valor Atual - Valor Anterior) ÷ Valor Anterior) × 100</li>
            </ul>
          </div>
        </div>
        
        <div className="vip-card p-6">
          <h3 className="font-semibold mb-4">🍰 Distribuição de Receita</h3>
          <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
            <span className="text-gray-500">Gráfico Pizza - Distribuição</span>
          </div>
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-blue-500 rounded mr-2"></div>
                <span className="text-sm">VIP Mudanças</span>
              </div>
              <span className="text-sm font-medium">68% ({formatarMoeda(dadosFinanceiros.abril.receitas * 0.68)})</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-yellow-500 rounded mr-2"></div>
                <span className="text-sm">VIP Storage</span>
              </div>
              <span className="text-sm font-medium">32% ({formatarMoeda(dadosFinanceiros.abril.receitas * 0.32)})</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function SelfStorage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Self Storage</h1>
      
      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="vip-card p-6 text-center">
          <Package className="w-8 h-8 text-blue-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-800">56</div>
          <div className="text-sm text-gray-600">Total de Boxes</div>
        </div>
        
        <div className="vip-card p-6 text-center">
          <div className="w-8 h-8 text-blue-600 mx-auto mb-2">🔒</div>
          <div className="text-2xl font-bold text-gray-800">42</div>
          <div className="text-sm text-gray-600">Boxes Ocupados</div>
        </div>
        
        <div className="vip-card p-6 text-center">
          <div className="w-8 h-8 text-blue-600 mx-auto mb-2">🔓</div>
          <div className="text-2xl font-bold text-gray-800">14</div>
          <div className="text-sm text-gray-600">Boxes Disponíveis</div>
        </div>
        
        <div className="vip-card p-6 text-center">
          <DollarSign className="w-8 h-8 text-blue-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-800">R$ 14.502</div>
          <div className="text-sm text-gray-600">Faturamento Mensal</div>
        </div>
      </div>
      
      {/* Abas */}
      <div className="flex space-x-1 mb-6">
        <button className="bg-blue-600 text-white px-4 py-2 rounded-t-lg text-sm">Visão Geral</button>
        <button className="bg-gray-100 text-gray-600 px-4 py-2 rounded-t-lg text-sm">Boxes</button>
        <button className="bg-gray-100 text-gray-600 px-4 py-2 rounded-t-lg text-sm">Contratos</button>
        <button className="bg-gray-100 text-gray-600 px-4 py-2 rounded-t-lg text-sm">Pagamentos</button>
        <button className="bg-gray-100 text-gray-600 px-4 py-2 rounded-t-lg text-sm">Planejamento</button>
      </div>
      
      {/* Conteúdo Principal */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="vip-card p-6">
          <h3 className="font-semibold mb-4">📊 Ocupação por Andar</h3>
          <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
            <span className="text-gray-500">Gráfico de Barras - Ocupação por Andar</span>
          </div>
        </div>
        
        <div className="vip-card p-6">
          <h3 className="font-semibold mb-4">📅 Próximos Vencimentos</h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div>
                <div className="font-medium">Box 12 - Ana Paula</div>
                <div className="text-sm text-gray-600">Vencimento: 20/04/2025</div>
                <div className="text-sm text-gray-600">Valor: R$ 450,00</div>
              </div>
              <div className="flex flex-col space-y-1">
                <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">Ativo</span>
                <button className="text-blue-600 text-xs border border-blue-600 px-2 py-1 rounded">Enviar Lembrete</button>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
              <div>
                <div className="font-medium">Box 28 - Marcos</div>
                <div className="text-sm text-gray-600">Vencimento: 22/04/2025</div>
                <div className="text-sm text-gray-600">Valor: R$ 380,00</div>
              </div>
              <div className="flex flex-col space-y-1">
                <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs">Pendente</span>
                <button className="text-blue-600 text-xs border border-blue-600 px-2 py-1 rounded">Enviar Lembrete</button>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
              <div>
                <div className="font-medium">Box 35 - Roberto</div>
                <div className="text-sm text-gray-600">Vencimento: 18/04/2025</div>
                <div className="text-sm text-gray-600">Valor: R$ 520,00</div>
              </div>
              <div className="flex flex-col space-y-1">
                <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs">Atrasado</span>
                <button className="text-blue-600 text-xs border border-blue-600 px-2 py-1 rounded">Enviar Lembrete</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Páginas básicas para outras rotas
function Clientes() {
  // Importar utilitário de relatórios - NOVA FUNCIONALIDADE
  const gerarRelatorioPDF = async (tipo, dados, nomeUsuario) => {
    const { gerarRelatorioPDF: gerarPDF } = await import('./utils/relatorios.js');
    return gerarPDF(tipo, dados, nomeUsuario);
  };

  // Estado para gerenciar clientes e documentos - NOVA FUNCIONALIDADE
  const [clienteSelecionado, setClienteSelecionado] = useState(null);
  const [abaAtiva, setAbaAtiva] = useState('dados');
  const [documentosCliente, setDocumentosCliente] = useState({
    1: [
      {
        id: 1,
        nome: 'Contrato_Mudanca_Silva.pdf',
        tipo: 'pdf',
        tamanho: '1.2 MB',
        dataUpload: '2025-06-01',
        categoria: 'Contrato'
      },
      {
        id: 2,
        nome: 'Inventario_Bens_Silva.docx',
        tipo: 'docx',
        tamanho: '850 KB',
        dataUpload: '2025-05-28',
        categoria: 'Inventário'
      }
    ],
    2: [
      {
        id: 3,
        nome: 'Orcamento_Empresa_ABC.pdf',
        tipo: 'pdf',
        tamanho: '650 KB',
        dataUpload: '2025-06-02',
        categoria: 'Orçamento'
      }
    ]
  });

  // Dados simulados de clientes
  const clientes = [
    {
      id: 1,
      nome: 'João Silva',
      email: 'joao.silva@email.com',
      telefone: '(11) 99999-1234',
      endereco: 'Rua das Flores, 123 - São Paulo/SP',
      status: 'Ativo',
      dataUltimoContato: '2025-06-03',
      tipoServico: 'Mudança Residencial'
    },
    {
      id: 2,
      nome: 'Empresa ABC Ltda',
      email: 'contato@empresaabc.com.br',
      telefone: '(11) 3333-5678',
      endereco: 'Av. Paulista, 1000 - São Paulo/SP',
      status: 'Ativo',
      dataUltimoContato: '2025-06-02',
      tipoServico: 'Mudança Comercial'
    },
    {
      id: 3,
      nome: 'Maria Santos',
      email: 'maria.santos@email.com',
      telefone: '(11) 88888-9999',
      endereco: 'Rua dos Jardins, 456 - São Paulo/SP',
      status: 'Pendente',
      dataUltimoContato: '2025-05-30',
      tipoServico: 'Self Storage'
    }
  ];

  // Função para upload de documento - NOVA FUNCIONALIDADE
  const handleDocumentUpload = (event, clienteId) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validar tipo de arquivo (apenas PDF e DOCX)
    const tiposPermitidos = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!tiposPermitidos.includes(file.type)) {
      alert('Apenas arquivos PDF e DOCX são permitidos!');
      return;
    }

    // Validar tamanho do arquivo (máximo 10MB)
    const tamanhoMaximo = 10 * 1024 * 1024; // 10MB
    if (file.size > tamanhoMaximo) {
      alert('Arquivo muito grande! Tamanho máximo: 10MB');
      return;
    }

    // Criar novo documento
    const novoDocumento = {
      id: Date.now(),
      nome: file.name,
      tipo: file.type.includes('pdf') ? 'pdf' : 'docx',
      tamanho: formatarTamanho(file.size),
      dataUpload: new Date().toISOString().split('T')[0],
      categoria: 'Documento'
    };

    // Adicionar documento ao cliente
    setDocumentosCliente(prev => ({
      ...prev,
      [clienteId]: [...(prev[clienteId] || []), novoDocumento]
    }));

    // Simular salvamento na pasta uploads/clientes
    console.log(`Documento ${file.name} salvo em: uploads/clientes/${clienteId}/${file.name}`);
    
    // Limpar input
    event.target.value = '';
    
    alert(`Documento "${file.name}" anexado com sucesso!`);
  };

  // Função para formatar tamanho do arquivo
  const formatarTamanho = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Função para visualizar documento
  const visualizarDocumento = (documento, clienteId) => {
    const urlDocumento = `/uploads/clientes/${clienteId}/${documento.nome}`;
    alert(`Abrindo documento: ${documento.nome}\nCaminho: ${urlDocumento}`);
    // window.open(urlDocumento, '_blank');
  };

  // Função para remover documento
  const removerDocumento = (documentoId, clienteId) => {
    if (confirm('Tem certeza que deseja remover este documento?')) {
      setDocumentosCliente(prev => ({
        ...prev,
        [clienteId]: prev[clienteId].filter(doc => doc.id !== documentoId)
      }));
      alert('Documento removido com sucesso!');
    }
  };

  // Função para obter ícone do tipo de arquivo
  const obterIconeDocumento = (tipo) => {
    return tipo === 'pdf' ? '📄' : '📝';
  };

  // Função para obter cor do status
  const obterCorStatus = (status) => {
    switch (status) {
      case 'Ativo': return 'text-green-700 bg-green-100';
      case 'Pendente': return 'text-yellow-700 bg-yellow-100';
      case 'Inativo': return 'text-red-700 bg-red-100';
      default: return 'text-gray-700 bg-gray-100';
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Gestão de Clientes</h1>
        <div className="text-sm text-gray-600">Olá, Administrador</div>
      </div>

      {!clienteSelecionado ? (
        // Lista de Clientes
        <div className="space-y-6">
          {/* Filtros e Busca */}
          <div className="vip-card p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Buscar cliente por nome, email ou telefone..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <select className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                <option>Todos os Status</option>
                <option>Ativo</option>
                <option>Pendente</option>
                <option>Inativo</option>
              </select>
              <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                + Novo Cliente
              </button>
            </div>
          </div>

          {/* Lista de Clientes */}
          <div className="vip-card p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-800">👥 Lista de Clientes</h2>
              {/* BOTÃO GERAR RELATÓRIO - NOVA FUNCIONALIDADE */}
              <button
                onClick={() => {
                  const dadosRelatorio = clientes.map(cliente => ({
                    nome: cliente.nome,
                    email: cliente.email,
                    telefone: cliente.telefone,
                    endereco: cliente.endereco,
                    servico: cliente.tipoServico,
                    status: cliente.status,
                    ultimoContato: cliente.dataUltimoContato
                  }));
                  gerarRelatorioPDF('Clientes', dadosRelatorio, 'Administrador');
                }}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
              >
                📄 Gerar Relatório PDF
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Cliente</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Contato</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Serviço</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Último Contato</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {clientes.map((cliente) => (
                    <tr key={cliente.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div>
                          <div className="font-medium text-gray-900">{cliente.nome}</div>
                          <div className="text-sm text-gray-500">{cliente.endereco}</div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-sm">
                          <div>{cliente.email}</div>
                          <div className="text-gray-500">{cliente.telefone}</div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-900">{cliente.tipoServico}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${obterCorStatus(cliente.status)}`}>
                          {cliente.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {new Date(cliente.dataUltimoContato).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => setClienteSelecionado(cliente)}
                          className="bg-blue-100 text-blue-700 px-3 py-1 rounded text-xs font-medium hover:bg-blue-200 transition-colors mr-2"
                        >
                          👁️ Ver Detalhes
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        // Detalhes do Cliente com Abas
        <div className="space-y-6">
          {/* Header do Cliente */}
          <div className="vip-card p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setClienteSelecionado(null)}
                  className="text-gray-600 hover:text-gray-800"
                >
                  ← Voltar
                </button>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">{clienteSelecionado.nome}</h2>
                  <p className="text-sm text-gray-600">{clienteSelecionado.tipoServico}</p>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${obterCorStatus(clienteSelecionado.status)}`}>
                {clienteSelecionado.status}
              </span>
            </div>
          </div>

          {/* Abas de Navegação */}
          <div className="vip-card">
            <div className="border-b border-gray-200">
              <nav className="flex space-x-8 px-6">
                <button
                  onClick={() => setAbaAtiva('dados')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    abaAtiva === 'dados'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  📋 Dados do Cliente
                </button>
                <button
                  onClick={() => setAbaAtiva('documentos')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    abaAtiva === 'documentos'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  📁 Documentos ({(documentosCliente[clienteSelecionado.id] || []).length})
                </button>
              </nav>
            </div>

            <div className="p-6">
              {abaAtiva === 'dados' && (
                // Aba Dados do Cliente
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Nome Completo</label>
                      <input
                        type="text"
                        value={clienteSelecionado.nome}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        readOnly
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                      <input
                        type="email"
                        value={clienteSelecionado.email}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        readOnly
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Telefone</label>
                      <input
                        type="text"
                        value={clienteSelecionado.telefone}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        readOnly
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Serviço</label>
                      <input
                        type="text"
                        value={clienteSelecionado.tipoServico}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        readOnly
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Endereço</label>
                    <input
                      type="text"
                      value={clienteSelecionado.endereco}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      readOnly
                    />
                  </div>
                </div>
              )}

              {abaAtiva === 'documentos' && (
                // Aba Documentos - NOVA FUNCIONALIDADE
                <div className="space-y-6">
                  {/* Upload de Documentos */}
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                    <input
                      type="file"
                      id={`fileUpload-${clienteSelecionado.id}`}
                      accept=".pdf,.docx"
                      onChange={(e) => handleDocumentUpload(e, clienteSelecionado.id)}
                      className="hidden"
                    />
                    <label
                      htmlFor={`fileUpload-${clienteSelecionado.id}`}
                      className="cursor-pointer flex flex-col items-center space-y-2"
                    >
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <FileText className="w-6 h-6 text-blue-600" />
                      </div>
                      <div className="text-lg font-medium text-gray-700">Clique para anexar documento</div>
                      <div className="text-sm text-gray-500">ou arraste e solte aqui</div>
                      <div className="text-xs text-gray-400">Formatos aceitos: PDF, DOCX (máx. 10MB)</div>
                      <button
                        type="button"
                        className="mt-2 bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
                      >
                        📎 Selecionar Arquivo
                      </button>
                    </label>
                  </div>

                  {/* Lista de Documentos */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                      📋 Documentos Anexados ({(documentosCliente[clienteSelecionado.id] || []).length})
                    </h3>
                    
                    {(!documentosCliente[clienteSelecionado.id] || documentosCliente[clienteSelecionado.id].length === 0) ? (
                      <div className="text-center py-8 text-gray-500">
                        <FileText className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                        <p>Nenhum documento anexado ainda</p>
                        <p className="text-sm">Use o botão acima para anexar documentos</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {documentosCliente[clienteSelecionado.id].map((documento) => (
                          <div key={documento.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center space-x-3">
                                <span className="text-2xl">{obterIconeDocumento(documento.tipo)}</span>
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium text-gray-900 truncate">{documento.nome}</div>
                                  <div className="text-sm text-gray-500">{documento.categoria}</div>
                                </div>
                              </div>
                            </div>
                            
                            <div className="text-xs text-gray-600 mb-3">
                              <div>Tamanho: {documento.tamanho}</div>
                              <div>Upload: {new Date(documento.dataUpload).toLocaleDateString('pt-BR')}</div>
                            </div>
                            
                            <div className="flex space-x-2">
                              <button
                                onClick={() => visualizarDocumento(documento, clienteSelecionado.id)}
                                className="flex-1 bg-blue-100 text-blue-700 px-3 py-1 rounded text-xs font-medium hover:bg-blue-200 transition-colors"
                              >
                                👁️ Ver
                              </button>
                              <button
                                onClick={() => removerDocumento(documento.id, clienteSelecionado.id)}
                                className="flex-1 bg-red-100 text-red-700 px-3 py-1 rounded text-xs font-medium hover:bg-red-200 transition-colors"
                              >
                                🗑️ Remover
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Visitas() {
  return <div className="p-6"><h1 className="text-2xl font-bold">Visitas</h1></div>
}

function Orcamentos() {
  // Importar utilitário de relatórios - NOVA FUNCIONALIDADE
  const gerarRelatorioPDF = async (tipo, dados, nomeUsuario) => {
    const { gerarRelatorioPDF: gerarPDF } = await import('./utils/relatorios.js');
    return gerarPDF(tipo, dados, nomeUsuario);
  };

  // Estado para gerenciar arquivos anexados
  const [arquivosAnexados, setArquivosAnexados] = useState([
    // Dados simulados de arquivos já anexados
    {
      id: 1,
      nome: 'Orcamento_Cliente_Silva_001.pdf',
      tipo: 'pdf',
      tamanho: '245 KB',
      dataUpload: '2025-06-03',
      cliente: 'João Silva'
    },
    {
      id: 2,
      nome: 'Proposta_Mudanca_Comercial_002.docx',
      tipo: 'docx',
      tamanho: '180 KB',
      dataUpload: '2025-06-02',
      cliente: 'Empresa ABC Ltda'
    }
  ]);

  // Função para simular upload de arquivo
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validar tipo de arquivo (apenas PDF e DOCX)
    const tiposPermitidos = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!tiposPermitidos.includes(file.type)) {
      alert('Apenas arquivos PDF e DOCX são permitidos!');
      return;
    }

    // Validar tamanho do arquivo (máximo 10MB)
    const tamanhoMaximo = 10 * 1024 * 1024; // 10MB
    if (file.size > tamanhoMaximo) {
      alert('Arquivo muito grande! Tamanho máximo: 10MB');
      return;
    }

    // Simular salvamento do arquivo
    const novoArquivo = {
      id: Date.now(),
      nome: file.name,
      tipo: file.type.includes('pdf') ? 'pdf' : 'docx',
      tamanho: formatarTamanho(file.size),
      dataUpload: new Date().toISOString().split('T')[0],
      cliente: 'Novo Cliente' // Em um sistema real, seria selecionado
    };

    // Adicionar arquivo à lista
    setArquivosAnexados(prev => [novoArquivo, ...prev]);
    
    // Simular salvamento na pasta uploads/orcamentos
    console.log(`Arquivo ${file.name} salvo em: uploads/orcamentos/${file.name}`);
    
    // Limpar input
    event.target.value = '';
    
    alert(`Arquivo "${file.name}" anexado com sucesso!`);
  };

  // Função para formatar tamanho do arquivo
  const formatarTamanho = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Função para visualizar arquivo
  const visualizarArquivo = (arquivo) => {
    // Em um sistema real, abriria o arquivo em uma nova aba
    const urlArquivo = `/uploads/orcamentos/${arquivo.nome}`;
    alert(`Abrindo arquivo: ${arquivo.nome}\nCaminho: ${urlArquivo}`);
    // window.open(urlArquivo, '_blank');
  };

  // Função para remover arquivo
  const removerArquivo = (id) => {
    if (confirm('Tem certeza que deseja remover este arquivo?')) {
      setArquivosAnexados(prev => prev.filter(arquivo => arquivo.id !== id));
      alert('Arquivo removido com sucesso!');
    }
  };

  // Função para obter ícone do tipo de arquivo
  const obterIconeArquivo = (tipo) => {
    return tipo === 'pdf' ? '📄' : '📝';
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Orçamentos</h1>
        <div className="text-sm text-gray-600">Olá, Administrador</div>
      </div>

      {/* Seção de Upload de Arquivos - NOVA FUNCIONALIDADE */}
      <div className="vip-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">📎 Anexar Documentos</h2>
          <div className="text-sm text-gray-500">Formatos aceitos: PDF, DOCX (máx. 10MB)</div>
        </div>
        
        {/* Botão de Upload */}
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
          <input
            type="file"
            id="fileUpload"
            accept=".pdf,.docx"
            onChange={handleFileUpload}
            className="hidden"
          />
          <label
            htmlFor="fileUpload"
            className="cursor-pointer flex flex-col items-center space-y-2"
          >
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <div className="text-lg font-medium text-gray-700">Clique para anexar arquivo</div>
            <div className="text-sm text-gray-500">ou arraste e solte aqui</div>
            <button
              type="button"
              className="mt-2 bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              📎 Selecionar Arquivo
            </button>
          </label>
        </div>

        {/* Instruções de uso */}
        <div className="mt-4 p-3 bg-yellow-50 rounded-md">
          <h4 className="text-sm font-medium text-yellow-900 mb-2">💡 Como usar:</h4>
          <ul className="text-xs text-yellow-800 space-y-1">
            <li><strong>1.</strong> Clique no botão "Selecionar Arquivo" ou arraste o arquivo para a área</li>
            <li><strong>2.</strong> Escolha um arquivo PDF ou DOCX (máximo 10MB)</li>
            <li><strong>3.</strong> O arquivo será salvo automaticamente em uploads/orcamentos/</li>
            <li><strong>4.</strong> Use os botões de ação para visualizar ou remover arquivos</li>
          </ul>
        </div>
      </div>

      {/* Lista de Arquivos Anexados */}
      <div className="vip-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">📋 Arquivos Anexados</h2>
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-500">{arquivosAnexados.length} arquivo(s)</div>
            {/* BOTÃO GERAR RELATÓRIO - NOVA FUNCIONALIDADE */}
            <button
              onClick={() => {
                const dadosRelatorio = arquivosAnexados.map((arquivo, index) => ({
                  cliente: arquivo.cliente,
                  servico: 'Orçamento de Mudança',
                  valor: Math.floor(Math.random() * 5000) + 1000, // Valor simulado
                  status: ['Pendente', 'Aprovado', 'Rejeitado'][Math.floor(Math.random() * 3)],
                  data: arquivo.dataUpload
                }));
                gerarRelatorioPDF('Orçamentos', dadosRelatorio, 'Administrador');
              }}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
            >
              📄 Gerar Relatório PDF
            </button>
          </div>
        </div>

        {arquivosAnexados.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <FileText className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p>Nenhum arquivo anexado ainda</p>
            <p className="text-sm">Use o botão acima para anexar documentos</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Arquivo</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Cliente</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Tamanho</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Data Upload</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Ações</th>
                </tr>
              </thead>
              <tbody>
                {arquivosAnexados.map((arquivo) => (
                  <tr key={arquivo.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">{obterIconeArquivo(arquivo.tipo)}</span>
                        <div>
                          <div className="font-medium text-gray-900">{arquivo.nome}</div>
                          <div className="text-sm text-gray-500 uppercase">{arquivo.tipo}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-900">{arquivo.cliente}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">{arquivo.tamanho}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {new Date(arquivo.dataUpload).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex space-x-2">
                        {/* Botão Visualizar */}
                        <button
                          onClick={() => visualizarArquivo(arquivo)}
                          className="bg-blue-100 text-blue-700 px-3 py-1 rounded text-xs font-medium hover:bg-blue-200 transition-colors"
                          title="Visualizar arquivo"
                        >
                          👁️ Ver
                        </button>
                        {/* Botão Remover */}
                        <button
                          onClick={() => removerArquivo(arquivo.id)}
                          className="bg-red-100 text-red-700 px-3 py-1 rounded text-xs font-medium hover:bg-red-200 transition-colors"
                          title="Remover arquivo"
                        >
                          🗑️ Remover
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Seção de Orçamentos (simulada) */}
      <div className="vip-card p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">💰 Orçamentos Recentes</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 border border-gray-200 rounded-lg">
            <div className="text-sm text-gray-600">Orçamento #001</div>
            <div className="font-semibold">João Silva</div>
            <div className="text-green-600 font-medium">R$ 2.500,00</div>
            <div className="text-xs text-gray-500 mt-1">Mudança Residencial</div>
          </div>
          <div className="p-4 border border-gray-200 rounded-lg">
            <div className="text-sm text-gray-600">Orçamento #002</div>
            <div className="font-semibold">Empresa ABC</div>
            <div className="text-green-600 font-medium">R$ 8.750,00</div>
            <div className="text-xs text-gray-500 mt-1">Mudança Comercial</div>
          </div>
          <div className="p-4 border border-gray-200 rounded-lg">
            <div className="text-sm text-gray-600">Orçamento #003</div>
            <div className="font-semibold">Maria Santos</div>
            <div className="text-yellow-600 font-medium">R$ 1.800,00</div>
            <div className="text-xs text-gray-500 mt-1">Mudança Apartamento</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Contratos() {
  return <div className="p-6"><h1 className="text-2xl font-bold">Contratos</h1></div>
}

function OrdensServico() {
  return <div className="p-6"><h1 className="text-2xl font-bold">Ordens de Serviço</h1></div>
}

function Marketing() {
  // Estado para métricas de marketing e analytics
  const [metricas, setMetricas] = useState({
    visitantes: 1248,
    leads: 87,
    conversao: 6.97,
    campanhasAtivas: 3,
    cliquesWhatsApp: 156,
    cliquesOrcamento: 89,
    acessosRedesSociais: 234
  });

  // Função para rastrear eventos do Google Analytics
  const rastrearEvento = (evento, categoria, label, valor = null) => {
    if (window.trackEvent) {
      window.trackEvent(evento, categoria, label, valor);
    }
  };

  // Simular clique em botão de orçamento
  const simularCliqueBotaoOrcamento = () => {
    rastrearEvento('clique_orcamento', 'lead', 'botao_solicite_orcamento', 1);
    setMetricas(prev => ({ ...prev, cliquesOrcamento: prev.cliquesOrcamento + 1 }));
    alert('📊 Evento rastreado: Clique no botão "Solicite seu orçamento"');
  };

  // Simular clique em WhatsApp
  const simularCliqueWhatsApp = () => {
    rastrearEvento('clique_whatsapp', 'lead', 'botao_whatsapp_flutuante', 1);
    setMetricas(prev => ({ ...prev, cliquesWhatsApp: prev.cliquesWhatsApp + 1 }));
    alert('📊 Evento rastreado: Clique no WhatsApp flutuante');
  };

  // Simular clique em redes sociais
  const simularCliqueRedesSociais = (rede) => {
    rastrearEvento('clique_rede_social', 'social', `link_${rede}`, 1);
    setMetricas(prev => ({ ...prev, acessosRedesSociais: prev.acessosRedesSociais + 1 }));
    alert(`📊 Evento rastreado: Clique no link ${rede}`);
  };

  // Rastrear acesso à aba Marketing
  useEffect(() => {
    rastrearEvento('acesso_marketing', 'navegacao', 'aba_marketing', 1);
  }, []);

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">📈 Marketing & Analytics</h1>
        <div className="text-sm text-gray-600">Google Analytics Integrado</div>
      </div>

      {/* Métricas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="vip-card p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">{metricas.visitantes.toLocaleString()}</div>
          <div className="text-sm text-gray-600">Visitantes (30 dias)</div>
        </div>
        <div className="vip-card p-4 text-center">
          <div className="text-2xl font-bold text-green-600">{metricas.leads}</div>
          <div className="text-sm text-gray-600">Leads Gerados</div>
        </div>
        <div className="vip-card p-4 text-center">
          <div className="text-2xl font-bold text-purple-600">{metricas.conversao}%</div>
          <div className="text-sm text-gray-600">Taxa de Conversão</div>
        </div>
        <div className="vip-card p-4 text-center">
          <div className="text-2xl font-bold text-orange-600">{metricas.campanhasAtivas}</div>
          <div className="text-sm text-gray-600">Campanhas Ativas</div>
        </div>
      </div>

      {/* Rastreamento de Botões Estratégicos */}
      <div className="vip-card p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">🎯 Rastreamento de Botões Estratégicos</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Botão Orçamento */}
          <div className="p-4 border border-gray-200 rounded-lg">
            <div className="text-center mb-3">
              <div className="text-lg font-bold text-green-600">{metricas.cliquesOrcamento}</div>
              <div className="text-sm text-gray-600">Cliques em "Solicite Orçamento"</div>
            </div>
            <button
              onClick={simularCliqueBotaoOrcamento}
              className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              💰 Simular Clique Orçamento
            </button>
          </div>

          {/* Botão WhatsApp */}
          <div className="p-4 border border-gray-200 rounded-lg">
            <div className="text-center mb-3">
              <div className="text-lg font-bold text-green-600">{metricas.cliquesWhatsApp}</div>
              <div className="text-sm text-gray-600">Cliques no WhatsApp</div>
            </div>
            <button
              onClick={simularCliqueWhatsApp}
              className="w-full bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors"
            >
              💬 Simular Clique WhatsApp
            </button>
          </div>

          {/* Redes Sociais */}
          <div className="p-4 border border-gray-200 rounded-lg">
            <div className="text-center mb-3">
              <div className="text-lg font-bold text-blue-600">{metricas.acessosRedesSociais}</div>
              <div className="text-sm text-gray-600">Cliques Redes Sociais</div>
            </div>
            <div className="space-y-2">
              <button
                onClick={() => simularCliqueRedesSociais('instagram')}
                className="w-full bg-pink-500 text-white px-3 py-1 rounded text-sm hover:bg-pink-600 transition-colors"
              >
                📸 Instagram
              </button>
              <button
                onClick={() => simularCliqueRedesSociais('facebook')}
                className="w-full bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors"
              >
                📘 Facebook
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Relatórios Internos de Analytics */}
      <div className="vip-card p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">📊 Relatórios de Analytics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Origem do Tráfego */}
          <div>
            <h3 className="font-medium text-gray-900 mb-3">🌐 Origem do Tráfego</h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                <span className="text-sm">Google Orgânico</span>
                <span className="font-medium text-blue-600">45.2%</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                <span className="text-sm">Direto</span>
                <span className="font-medium text-green-600">28.7%</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                <span className="text-sm">Redes Sociais</span>
                <span className="font-medium text-purple-600">18.9%</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                <span className="text-sm">Referências</span>
                <span className="font-medium text-orange-600">7.2%</span>
              </div>
            </div>
          </div>

          {/* Melhores Horários */}
          <div>
            <h3 className="font-medium text-gray-900 mb-3">⏰ Melhores Horários de Acesso</h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                <span className="text-sm">14:00 - 16:00</span>
                <span className="font-medium text-blue-600">23.4%</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                <span className="text-sm">09:00 - 11:00</span>
                <span className="font-medium text-green-600">19.8%</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                <span className="text-sm">19:00 - 21:00</span>
                <span className="font-medium text-purple-600">17.2%</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                <span className="text-sm">11:00 - 13:00</span>
                <span className="font-medium text-orange-600">15.6%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Configurações do Google Analytics */}
      <div className="vip-card p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">⚙️ Configurações do Google Analytics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="font-medium text-gray-900 mb-2">📋 Status da Integração:</h3>
            <div className="text-sm text-gray-600 space-y-1">
              <div>• Tracking ID: {import.meta.env.VITE_GA_TRACKING_ID || 'Não configurado'}</div>
              <div>• Ambiente: {window.location.hostname === 'localhost' ? 'Desenvolvimento' : 'Produção'}</div>
              <div>• Status: {window.trackEvent ? '✅ Ativo' : '❌ Inativo'}</div>
            </div>
          </div>
          <div>
            <h3 className="font-medium text-gray-900 mb-2">🎯 Eventos Rastreados:</h3>
            <div className="text-sm text-gray-600 space-y-1">
              <div>• Cliques em botões de orçamento</div>
              <div>• Cliques no WhatsApp flutuante</div>
              <div>• Acessos às redes sociais</div>
              <div>• Navegação entre páginas</div>
              <div>• Acesso à aba Marketing</div>
            </div>
          </div>
        </div>
        
        <div className="mt-4 p-3 bg-blue-50 rounded-md">
          <h4 className="text-sm font-medium text-blue-900 mb-2">💡 Como configurar em produção:</h4>
          <ol className="text-xs text-blue-800 space-y-1">
            <li><strong>1.</strong> Crie uma conta no Google Analytics (analytics.google.com)</li>
            <li><strong>2.</strong> Obtenha seu Tracking ID (formato: G-XXXXXXXXXX)</li>
            <li><strong>3.</strong> Configure a variável VITE_GA_TRACKING_ID no arquivo .env</li>
            <li><strong>4.</strong> Faça deploy em um domínio de produção</li>
            <li><strong>5.</strong> Os eventos serão enviados automaticamente para o GA4</li>
          </ol>
        </div>
      </div>
    </div>
  );
}

function Vendas() {
  return <div className="p-6"><h1 className="text-2xl font-bold">Vendas</h1></div>
}

// Estoque agora é importado de ./pages/Estoque

function ProgramaPontos() {
  return <div className="p-6"><h1 className="text-2xl font-bold">Programa de Pontos</h1></div>
}

function CalendarioPage() {
  return <div className="p-6"><h1 className="text-2xl font-bold">Calendário</h1></div>
}

function Graficos() {
  return <div className="p-6"><h1 className="text-2xl font-bold">Gráficos</h1></div>
}

function Configuracoes() {
  return <div className="p-6"><h1 className="text-2xl font-bold">Configurações</h1></div>
}

// TELA DE EQUIPE COM GAMIFICAÇÃO - NOVA FUNCIONALIDADE
function Equipe() {
  // Dados da equipe VIP Mudanças com métricas de performance
  const [equipe, setEquipe] = useState([
    {
      id: 1,
      nome: 'Kenneth',
      cargo: 'Vendas',
      avatar: '👨‍💼',
      visitasAgendadas: 23,
      orcamentosFechados: 18,
      avaliacaoMedia: 4.8,
      pontuacao: 2450,
      meta: 2500,
      nivel: 'Ouro',
      conquistas: ['🏆 Top Vendedor', '⭐ 5 Estrelas', '🎯 Meta Batida'],
      tendencia: 'subindo'
    },
    {
      id: 2,
      nome: 'Douglas',
      cargo: 'Financeiro',
      avatar: '👨‍💻',
      visitasAgendadas: 0,
      orcamentosFechados: 0,
      avaliacaoMedia: 4.9,
      pontuacao: 1890,
      meta: 2000,
      nivel: 'Prata',
      conquistas: ['📊 Analista Expert', '💰 Controle Total'],
      tendencia: 'subindo'
    },
    {
      id: 3,
      nome: 'Maciel',
      cargo: 'Motorista/Embalador',
      avatar: '🚛',
      visitasAgendadas: 0,
      orcamentosFechados: 0,
      avaliacaoMedia: 4.7,
      pontuacao: 2180,
      meta: 2200,
      nivel: 'Ouro',
      conquistas: ['🚚 Motorista Seguro', '📦 Embalador Pro'],
      tendencia: 'estavel'
    },
    {
      id: 4,
      nome: 'Diego',
      cargo: 'Motorista/Embalador',
      avatar: '🚛',
      visitasAgendadas: 0,
      orcamentosFechados: 0,
      avaliacaoMedia: 4.6,
      pontuacao: 2050,
      meta: 2200,
      nivel: 'Prata',
      conquistas: ['🚚 Motorista Seguro', '⏰ Pontualidade'],
      tendencia: 'subindo'
    },
    {
      id: 5,
      nome: 'Sebastião',
      cargo: 'Montador',
      avatar: '🔧',
      visitasAgendadas: 0,
      orcamentosFechados: 0,
      avaliacaoMedia: 4.9,
      pontuacao: 2380,
      meta: 2400,
      nivel: 'Ouro',
      conquistas: ['🔧 Montador Expert', '⭐ 5 Estrelas', '🏠 Casa Perfeita'],
      tendencia: 'subindo'
    },
    {
      id: 6,
      nome: 'Agnaldo',
      cargo: 'Limpeza',
      avatar: '🧹',
      visitasAgendadas: 0,
      orcamentosFechados: 0,
      avaliacaoMedia: 4.8,
      pontuacao: 1950,
      meta: 2000,
      nivel: 'Prata',
      conquistas: ['✨ Limpeza Perfeita', '🏆 Qualidade Total'],
      tendencia: 'subindo'
    },
    {
      id: 7,
      nome: 'Barreto',
      cargo: 'Embalador',
      avatar: '📦',
      visitasAgendadas: 0,
      orcamentosFechados: 0,
      avaliacaoMedia: 4.5,
      pontuacao: 1780,
      meta: 2000,
      nivel: 'Bronze',
      conquistas: ['📦 Embalador Cuidadoso'],
      tendencia: 'estavel'
    },
    {
      id: 8,
      nome: 'Carlinhos',
      cargo: 'Embalador',
      avatar: '📦',
      visitasAgendadas: 0,
      orcamentosFechados: 0,
      avaliacaoMedia: 4.7,
      pontuacao: 2020,
      meta: 2000,
      nivel: 'Prata',
      conquistas: ['📦 Embalador Pro', '⚡ Agilidade'],
      tendencia: 'subindo'
    },
    {
      id: 9,
      nome: 'Alexandre',
      cargo: 'Embalador',
      avatar: '📦',
      visitasAgendadas: 0,
      orcamentosFechados: 0,
      avaliacaoMedia: 4.6,
      pontuacao: 1890,
      meta: 2000,
      nivel: 'Bronze',
      conquistas: ['📦 Embalador Cuidadoso', '🤝 Trabalho em Equipe'],
      tendencia: 'subindo'
    },
    {
      id: 10,
      nome: 'Alceu',
      cargo: 'Embalador',
      avatar: '📦',
      visitasAgendadas: 0,
      orcamentosFechados: 0,
      avaliacaoMedia: 4.4,
      pontuacao: 1650,
      meta: 2000,
      nivel: 'Bronze',
      conquistas: ['📦 Embalador Iniciante'],
      tendencia: 'estavel'
    },
    {
      id: 11,
      nome: 'Welison',
      cargo: 'Embalador',
      avatar: '📦',
      visitasAgendadas: 0,
      orcamentosFechados: 0,
      avaliacaoMedia: 4.8,
      pontuacao: 2150,
      meta: 2200,
      nivel: 'Ouro',
      conquistas: ['📦 Embalador Expert', '⭐ 5 Estrelas', '🚚 Ajudante Carga'],
      tendencia: 'subindo'
    }
  ]);

  // Ordenar equipe por pontuação (ranking)
  const equipeRankeada = [...equipe].sort((a, b) => b.pontuacao - a.pontuacao);

  // Função para obter cor do nível
  const obterCorNivel = (nivel) => {
    switch (nivel) {
      case 'Ouro': return 'text-yellow-600 bg-yellow-100';
      case 'Prata': return 'text-gray-600 bg-gray-100';
      case 'Bronze': return 'text-orange-600 bg-orange-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  // Função para obter ícone de tendência
  const obterIconeTendencia = (tendencia) => {
    switch (tendencia) {
      case 'subindo': return '📈';
      case 'descendo': return '📉';
      case 'estavel': return '➡️';
      default: return '➡️';
    }
  };

  // Função para calcular progresso da meta
  const calcularProgressoMeta = (pontuacao, meta) => {
    return Math.min((pontuacao / meta) * 100, 100);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">🧑‍🤝‍🧑 Equipe VIP Mudanças</h1>
        <div className="text-sm text-gray-600">Sistema de Gamificação Ativo</div>
      </div>

      {/* Estatísticas Gerais da Equipe */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="vip-card p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">{equipe.length}</div>
          <div className="text-sm text-gray-600">Total de Colaboradores</div>
        </div>
        <div className="vip-card p-4 text-center">
          <div className="text-2xl font-bold text-green-600">
            {(equipe.reduce((sum, e) => sum + e.avaliacaoMedia, 0) / equipe.length).toFixed(1)}⭐
          </div>
          <div className="text-sm text-gray-600">Avaliação Média</div>
        </div>
        <div className="vip-card p-4 text-center">
          <div className="text-2xl font-bold text-purple-600">
            {equipe.reduce((sum, e) => sum + e.pontuacao, 0).toLocaleString()}
          </div>
          <div className="text-sm text-gray-600">Pontuação Total</div>
        </div>
        <div className="vip-card p-4 text-center">
          <div className="text-2xl font-bold text-orange-600">
            {equipe.filter(e => e.pontuacao >= e.meta).length}/{equipe.length}
          </div>
          <div className="text-sm text-gray-600">Metas Atingidas</div>
        </div>
      </div>

      {/* Pódio dos Top 3 */}
      <div className="vip-card p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">🏆 Pódio dos Campeões</h2>
        <div className="flex justify-center items-end space-x-4">
          {/* 2º Lugar */}
          {equipeRankeada[1] && (
            <div className="text-center">
              <div className="w-20 h-24 bg-gray-200 rounded-lg flex flex-col items-center justify-center mb-2">
                <div className="text-2xl">{equipeRankeada[1].avatar}</div>
                <div className="text-lg font-bold text-gray-600">2º</div>
              </div>
              <div className="font-medium text-sm">{equipeRankeada[1].nome}</div>
              <div className="text-xs text-gray-500">{equipeRankeada[1].pontuacao} pts</div>
            </div>
          )}

          {/* 1º Lugar */}
          {equipeRankeada[0] && (
            <div className="text-center">
              <div className="w-24 h-32 bg-yellow-200 rounded-lg flex flex-col items-center justify-center mb-2 border-2 border-yellow-400">
                <div className="text-3xl">{equipeRankeada[0].avatar}</div>
                <div className="text-xl font-bold text-yellow-600">1º</div>
                <div className="text-lg">👑</div>
              </div>
              <div className="font-bold text-sm">{equipeRankeada[0].nome}</div>
              <div className="text-xs text-gray-500">{equipeRankeada[0].pontuacao} pts</div>
            </div>
          )}

          {/* 3º Lugar */}
          {equipeRankeada[2] && (
            <div className="text-center">
              <div className="w-20 h-20 bg-orange-200 rounded-lg flex flex-col items-center justify-center mb-2">
                <div className="text-2xl">{equipeRankeada[2].avatar}</div>
                <div className="text-lg font-bold text-orange-600">3º</div>
              </div>
              <div className="font-medium text-sm">{equipeRankeada[2].nome}</div>
              <div className="text-xs text-gray-500">{equipeRankeada[2].pontuacao} pts</div>
            </div>
          )}
        </div>
      </div>

      {/* Ranking Completo */}
      <div className="vip-card p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">📊 Ranking Completo da Equipe</h2>
        <div className="space-y-4">
          {equipeRankeada.map((colaborador, index) => (
            <div
              key={colaborador.id}
              className={`p-4 rounded-lg border transition-all hover:shadow-md ${
                index < 3 ? 'bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200' : 'bg-gray-50 border-gray-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  {/* Posição no Ranking */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                    index === 0 ? 'bg-yellow-400 text-yellow-900' :
                    index === 1 ? 'bg-gray-400 text-gray-900' :
                    index === 2 ? 'bg-orange-400 text-orange-900' :
                    'bg-blue-100 text-blue-900'
                  }`}>
                    {index + 1}
                  </div>

                  {/* Avatar e Informações */}
                  <div className="flex items-center space-x-3">
                    <div className="text-3xl">{colaborador.avatar}</div>
                    <div>
                      <div className="font-semibold text-gray-900">{colaborador.nome}</div>
                      <div className="text-sm text-gray-600">{colaborador.cargo}</div>
                    </div>
                  </div>

                  {/* Nível */}
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${obterCorNivel(colaborador.nivel)}`}>
                    {colaborador.nivel}
                  </span>
                </div>

                <div className="flex items-center space-x-6">
                  {/* Métricas */}
                  <div className="text-center">
                    <div className="text-lg font-bold text-gray-900">{colaborador.pontuacao}</div>
                    <div className="text-xs text-gray-500">Pontos</div>
                  </div>

                  <div className="text-center">
                    <div className="text-lg font-bold text-yellow-600">{colaborador.avaliacaoMedia}⭐</div>
                    <div className="text-xs text-gray-500">Avaliação</div>
                  </div>

                  {colaborador.visitasAgendadas > 0 && (
                    <div className="text-center">
                      <div className="text-lg font-bold text-blue-600">{colaborador.visitasAgendadas}</div>
                      <div className="text-xs text-gray-500">Visitas</div>
                    </div>
                  )}

                  {colaborador.orcamentosFechados > 0 && (
                    <div className="text-center">
                      <div className="text-lg font-bold text-green-600">{colaborador.orcamentosFechados}</div>
                      <div className="text-xs text-gray-500">Orçamentos</div>
                    </div>
                  )}

                  {/* Tendência */}
                  <div className="text-center">
                    <div className="text-lg">{obterIconeTendencia(colaborador.tendencia)}</div>
                    <div className="text-xs text-gray-500">Tendência</div>
                  </div>
                </div>
              </div>

              {/* Progresso da Meta */}
              <div className="mt-3">
                <div className="flex justify-between text-xs text-gray-600 mb-1">
                  <span>Progresso da Meta</span>
                  <span>{colaborador.pontuacao}/{colaborador.meta} pts</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      calcularProgressoMeta(colaborador.pontuacao, colaborador.meta) >= 100
                        ? 'bg-green-500'
                        : calcularProgressoMeta(colaborador.pontuacao, colaborador.meta) >= 80
                        ? 'bg-yellow-500'
                        : 'bg-blue-500'
                    }`}
                    style={{ width: `${calcularProgressoMeta(colaborador.pontuacao, colaborador.meta)}%` }}
                  ></div>
                </div>
              </div>

              {/* Conquistas */}
              {colaborador.conquistas.length > 0 && (
                <div className="mt-3">
                  <div className="text-xs text-gray-600 mb-1">Conquistas:</div>
                  <div className="flex flex-wrap gap-1">
                    {colaborador.conquistas.map((conquista, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                      >
                        {conquista}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Sistema de Pontuação */}
      <div className="vip-card p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">🎯 Como Funciona a Pontuação</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="font-medium text-gray-900 mb-2">📈 Ganho de Pontos:</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Avaliação 5⭐ do cliente: +100 pts</li>
              <li>• Avaliação 4⭐ do cliente: +75 pts</li>
              <li>• Mudança sem problemas: +50 pts</li>
              <li>• Pontualidade: +25 pts</li>
              <li>• Trabalho em equipe: +30 pts</li>
              <li>• Orçamento fechado (Kenneth): +200 pts</li>
            </ul>
          </div>
          <div>
            <h3 className="font-medium text-gray-900 mb-2">🏅 Níveis de Conquista:</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• 🥉 <strong>Bronze:</strong> 0 - 1.999 pontos</li>
              <li>• 🥈 <strong>Prata:</strong> 2.000 - 2.299 pontos</li>
              <li>• 🥇 <strong>Ouro:</strong> 2.300+ pontos</li>
              <li>• 👑 <strong>Diamante:</strong> 3.000+ pontos</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

// COMPONENTES DE FORMULÁRIOS PARA ATALHOS RÁPIDOS - NOVA FUNCIONALIDADE

function NovaVisita() {
  const [formData, setFormData] = useState({
    cliente: '',
    dataVisita: '',
    horaVisita: '',
    endereco: '',
    tipoServico: '',
    observacoes: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    alert('Visita agendada com sucesso!');
    console.log('Dados da visita:', formData);
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center space-x-4">
        <Link to="/visitas" className="text-gray-600 hover:text-gray-800">
          ← Voltar para Visitas
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">📅 Nova Visita</h1>
      </div>

      <div className="vip-card p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cliente *
              </label>
              <select
                name="cliente"
                value={formData.cliente}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Selecione um cliente</option>
                <option value="joao-silva">João Silva</option>
                <option value="empresa-abc">Empresa ABC Ltda</option>
                <option value="maria-santos">Maria Santos</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Serviço *
              </label>
              <select
                name="tipoServico"
                value={formData.tipoServico}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Selecione o tipo</option>
                <option value="mudanca-residencial">Mudança Residencial</option>
                <option value="mudanca-comercial">Mudança Comercial</option>
                <option value="self-storage">Self Storage</option>
                <option value="limpeza">Limpeza</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data da Visita *
              </label>
              <input
                type="date"
                name="dataVisita"
                value={formData.dataVisita}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Horário *
              </label>
              <input
                type="time"
                name="horaVisita"
                value={formData.horaVisita}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Endereço da Visita *
            </label>
            <input
              type="text"
              name="endereco"
              value={formData.endereco}
              onChange={handleChange}
              required
              placeholder="Rua, número, bairro, cidade"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Observações
            </label>
            <textarea
              name="observacoes"
              value={formData.observacoes}
              onChange={handleChange}
              rows={4}
              placeholder="Informações adicionais sobre a visita..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex space-x-4">
            <button
              type="submit"
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              📅 Agendar Visita
            </button>
            <Link
              to="/visitas"
              className="bg-gray-300 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-400 transition-colors"
            >
              Cancelar
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

function NovoOrcamento() {
  const [formData, setFormData] = useState({
    cliente: '',
    tipoServico: '',
    origem: '',
    destino: '',
    dataServico: '',
    valorEstimado: '',
    observacoes: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    alert('Orçamento criado com sucesso!');
    console.log('Dados do orçamento:', formData);
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center space-x-4">
        <Link to="/orcamentos" className="text-gray-600 hover:text-gray-800">
          ← Voltar para Orçamentos
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">📄 Novo Orçamento</h1>
      </div>

      <div className="vip-card p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cliente *
              </label>
              <select
                name="cliente"
                value={formData.cliente}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Selecione um cliente</option>
                <option value="joao-silva">João Silva</option>
                <option value="empresa-abc">Empresa ABC Ltda</option>
                <option value="maria-santos">Maria Santos</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Serviço *
              </label>
              <select
                name="tipoServico"
                value={formData.tipoServico}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Selecione o tipo</option>
                <option value="mudanca-residencial">Mudança Residencial</option>
                <option value="mudanca-comercial">Mudança Comercial</option>
                <option value="self-storage">Self Storage</option>
                <option value="limpeza">Limpeza</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Endereço de Origem *
              </label>
              <input
                type="text"
                name="origem"
                value={formData.origem}
                onChange={handleChange}
                required
                placeholder="Endereço de origem"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Endereço de Destino *
              </label>
              <input
                type="text"
                name="destino"
                value={formData.destino}
                onChange={handleChange}
                required
                placeholder="Endereço de destino"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data do Serviço
              </label>
              <input
                type="date"
                name="dataServico"
                value={formData.dataServico}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Valor Estimado (R$)
              </label>
              <input
                type="number"
                name="valorEstimado"
                value={formData.valorEstimado}
                onChange={handleChange}
                placeholder="0,00"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Observações
            </label>
            <textarea
              name="observacoes"
              value={formData.observacoes}
              onChange={handleChange}
              rows={4}
              placeholder="Detalhes do serviço, itens especiais, etc..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex space-x-4">
            <button
              type="submit"
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              📄 Criar Orçamento
            </button>
            <Link
              to="/orcamentos"
              className="bg-gray-300 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-400 transition-colors"
            >
              Cancelar
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

function NovoCliente() {
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    telefone: '',
    endereco: '',
    tipoCliente: '',
    observacoes: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    alert('Cliente cadastrado com sucesso!');
    console.log('Dados do cliente:', formData);
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center space-x-4">
        <Link to="/clientes" className="text-gray-600 hover:text-gray-800">
          ← Voltar para Clientes
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">👤 Novo Cliente</h1>
      </div>

      <div className="vip-card p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nome Completo / Razão Social *
              </label>
              <input
                type="text"
                name="nome"
                value={formData.nome}
                onChange={handleChange}
                required
                placeholder="Nome do cliente ou empresa"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="email@exemplo.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Telefone *
              </label>
              <input
                type="tel"
                name="telefone"
                value={formData.telefone}
                onChange={handleChange}
                required
                placeholder="(11) 99999-9999"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Cliente *
              </label>
              <select
                name="tipoCliente"
                value={formData.tipoCliente}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Selecione o tipo</option>
                <option value="pessoa-fisica">Pessoa Física</option>
                <option value="pessoa-juridica">Pessoa Jurídica</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Endereço Completo *
            </label>
            <input
              type="text"
              name="endereco"
              value={formData.endereco}
              onChange={handleChange}
              required
              placeholder="Rua, número, bairro, cidade, CEP"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Observações
            </label>
            <textarea
              name="observacoes"
              value={formData.observacoes}
              onChange={handleChange}
              rows={4}
              placeholder="Informações adicionais sobre o cliente..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex space-x-4">
            <button
              type="submit"
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              👤 Cadastrar Cliente
            </button>
            <Link
              to="/clientes"
              className="bg-gray-300 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-400 transition-colors"
            >
              Cancelar
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

// Layout Principal
function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  
  // SISTEMA DE PERMISSÕES - NOVA FUNCIONALIDADE
  const [usuarioAtual, setUsuarioAtual] = useState({
    nome: 'Administrador',
    perfil: 'administrador', // administrador, vendas, operacional
    email: 'admin@vipmudancas.com.br'
  });

  // Função para verificar permissões
  const temPermissao = (recurso) => {
    const permissoes = {
      administrador: ['dashboard', 'clientes', 'visitas', 'orcamentos', 'contratos', 'ordens-servico', 'self-storage', 'financeiro', 'marketing', 'vendas', 'estoque', 'programa-pontos', 'calendario', 'graficos', 'configuracoes', 'equipe'],
      vendas: ['dashboard', 'clientes', 'visitas', 'orcamentos', 'contratos', 'marketing', 'vendas', 'calendario'],
      operacional: ['dashboard', 'ordens-servico', 'estoque', 'calendario', 'self-storage']
    };

    return permissoes[usuarioAtual.perfil]?.includes(recurso) || false;
  };

  // Componente de seletor de perfil (para demonstração)
  const SeletorPerfil = () => (
    <div className="fixed top-4 right-4 z-50 bg-white p-3 rounded-lg shadow-lg border">
      <label className="block text-xs font-medium text-gray-700 mb-2">
        🔒 Perfil de Teste:
      </label>
      <select
        value={usuarioAtual.perfil}
        onChange={(e) => setUsuarioAtual({
          ...usuarioAtual,
          perfil: e.target.value,
          nome: e.target.value === 'administrador' ? 'Administrador' : 
                e.target.value === 'vendas' ? 'Kenneth (Vendas)' : 'Maciel (Operacional)'
        })}
        className="text-xs border border-gray-300 rounded px-2 py-1"
      >
        <option value="administrador">👑 Administrador</option>
        <option value="vendas">💼 Vendas</option>
        <option value="operacional">🔧 Operacional</option>
      </select>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-50">
      <SeletorPerfil />
      <Sidebar 
        isOpen={sidebarOpen} 
        setIsOpen={setSidebarOpen} 
        temPermissao={temPermissao}
        usuarioAtual={usuarioAtual}
      />
      
      <div className="flex-1 flex flex-col lg:ml-48">
        <Header 
          onMenuClick={() => setSidebarOpen(!sidebarOpen)} 
          currentUser={usuarioAtual.nome}
        />
        
        <main className="flex-1 overflow-auto">
          <Routes>
            {temPermissao('dashboard') && <Route path="/" element={<Dashboard />} />}
            {temPermissao('clientes') && <Route path="/clientes" element={<Clientes />} />}
            {temPermissao('clientes') && <Route path="/clientes/novo" element={<NovoCliente />} />}
            {temPermissao('visitas') && <Route path="/visitas" element={<Visitas />} />}
            {temPermissao('visitas') && <Route path="/visitas/nova" element={<NovaVisita />} />}
            {temPermissao('orcamentos') && <Route path="/orcamentos" element={<Orcamentos />} />}
            {temPermissao('orcamentos') && <Route path="/orcamentos/novo" element={<NovoOrcamento />} />}
            {temPermissao('contratos') && <Route path="/contratos" element={<Contratos />} />}
            {temPermissao('ordens-servico') && <Route path="/ordens-servico" element={<OrdensServico />} />}
            {temPermissao('self-storage') && <Route path="/self-storage" element={<SelfStorage />} />}
            {temPermissao('financeiro') && <Route path="/financeiro" element={<Financeiro />} />}
            {temPermissao('marketing') && <Route path="/marketing" element={<Marketing />} />}
            {temPermissao('vendas') && <Route path="/vendas" element={<Vendas />} />}
            {temPermissao('estoque') && <Route path="/estoque" element={<Estoque />} />}
            {temPermissao('programa-pontos') && <Route path="/programa-pontos" element={<ProgramaPontos />} />}
            {temPermissao('calendario') && <Route path="/calendario" element={<CalendarioPage />} />}
            {temPermissao('graficos') && <Route path="/graficos" element={<Graficos />} />}
            {temPermissao('configuracoes') && <Route path="/configuracoes" element={<Configuracoes />} />}
            {temPermissao('equipe') && <Route path="/equipe" element={<Equipe />} />}
            
            {/* Rota de acesso negado */}
            <Route path="*" element={
              <div className="p-6 text-center">
                <div className="max-w-md mx-auto">
                  <div className="text-6xl mb-4">🔒</div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Acesso Negado</h2>
                  <p className="text-gray-600 mb-4">
                    Você não tem permissão para acessar esta página com o perfil <strong>{usuarioAtual.perfil}</strong>.
                  </p>
                  <Link to="/" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
                    Voltar ao Dashboard
                  </Link>
                </div>
              </div>
            } />
          </Routes>
        </main>
      </div>
      
      <VIPAssistant />
    </div>
  )
}

// App Principal
function App() {
  return (
    <Router>
      <Layout />
    </Router>
  )
}

export default App

