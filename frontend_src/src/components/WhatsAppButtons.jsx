import React, { useState, useEffect } from 'react';
import { MessageCircle, FileText, Star, ExternalLink } from 'lucide-react';

const WhatsAppButtons = ({ contratoId, onError, onSuccess }) => {
  const [dadosBotoes, setDadosBotoes] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processando, setProcessando] = useState({});

  // Carregar dados dos botões
  useEffect(() => {
    if (contratoId) {
      carregarDadosBotoes();
    }
  }, [contratoId]);

  const carregarDadosBotoes = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/whatsapp/contrato/${contratoId}/botoes`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setDadosBotoes(data.dados);
      } else {
        throw new Error('Erro ao carregar dados dos botões');
      }
    } catch (error) {
      console.error('Erro ao carregar dados dos botões:', error);
      onError && onError('Erro ao carregar dados dos botões WhatsApp');
    } finally {
      setLoading(false);
    }
  };

  const abrirWhatsApp = (url, tipo) => {
    try {
      // Abrir em nova aba
      window.open(url, '_blank', 'noopener,noreferrer');
      
      // Log de sucesso
      onSuccess && onSuccess(`Link do WhatsApp aberto para ${tipo}`);
    } catch (error) {
      console.error('Erro ao abrir WhatsApp:', error);
      onError && onError('Erro ao abrir WhatsApp');
    }
  };

  const handleEnviarDocumentos = async () => {
    try {
      setProcessando(prev => ({ ...prev, documentos: true }));
      
      const response = await fetch(`/api/whatsapp/contrato/${contratoId}/documentos`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        abrirWhatsApp(data.dados.linkWhatsApp, 'envio de documentos');
      } else {
        throw new Error('Erro ao gerar link de documentos');
      }
    } catch (error) {
      console.error('Erro ao enviar documentos:', error);
      onError && onError('Erro ao gerar link para envio de documentos');
    } finally {
      setProcessando(prev => ({ ...prev, documentos: false }));
    }
  };

  const handleEnviarAvaliacaoInterna = async () => {
    try {
      setProcessando(prev => ({ ...prev, avaliacaoInterna: true }));
      
      const response = await fetch(`/api/whatsapp/contrato/${contratoId}/avaliacao-interna`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        abrirWhatsApp(data.dados.linkWhatsApp, 'avaliação interna');
        
        // Recarregar dados após envio
        setTimeout(() => {
          carregarDadosBotoes();
        }, 1000);
      } else {
        throw new Error('Erro ao gerar link de avaliação interna');
      }
    } catch (error) {
      console.error('Erro ao enviar avaliação interna:', error);
      onError && onError('Erro ao gerar link para avaliação interna');
    } finally {
      setProcessando(prev => ({ ...prev, avaliacaoInterna: false }));
    }
  };

  const handleEnviarAvaliacaoGoogle = async () => {
    try {
      setProcessando(prev => ({ ...prev, avaliacaoGoogle: true }));
      
      const response = await fetch(`/api/whatsapp/avaliacao/${dadosBotoes.avaliacao.id}/google`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        abrirWhatsApp(data.dados.linkWhatsApp, 'avaliação no Google');
      } else {
        throw new Error('Erro ao gerar link de avaliação Google');
      }
    } catch (error) {
      console.error('Erro ao enviar avaliação Google:', error);
      onError && onError('Erro ao gerar link para avaliação no Google');
    } finally {
      setProcessando(prev => ({ ...prev, avaliacaoGoogle: false }));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-500"></div>
        <span className="ml-2 text-gray-600">Carregando botões WhatsApp...</span>
      </div>
    );
  }

  if (!dadosBotoes) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-600">Erro ao carregar dados dos botões WhatsApp</p>
      </div>
    );
  }

  const { cliente, botoes, avaliacao } = dadosBotoes;

  return (
    <div className="space-y-3">
      {/* Informações do cliente */}
      <div className="bg-gray-50 p-3 rounded-lg">
        <h4 className="font-medium text-gray-900 mb-1">Cliente: {cliente.nome}</h4>
        <p className="text-sm text-gray-600">
          Telefone: {cliente.telefone}
          {!cliente.telefoneValido && (
            <span className="ml-2 text-red-500 text-xs">(Inválido)</span>
          )}
        </p>
      </div>

      {/* Botão Enviar Documentos */}
      <div className="relative">
        <button
          onClick={handleEnviarDocumentos}
          disabled={!botoes.enviarDocumentos.disponivel || processando.documentos}
          className={`
            w-full flex items-center justify-center px-4 py-3 rounded-lg font-medium transition-all
            ${botoes.enviarDocumentos.disponivel
              ? 'bg-green-500 hover:bg-green-600 text-white shadow-md hover:shadow-lg'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }
            ${processando.documentos ? 'opacity-50' : ''}
          `}
          title={botoes.enviarDocumentos.motivo || 'Enviar documentos via WhatsApp'}
        >
          {processando.documentos ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
          ) : (
            <MessageCircle className="w-5 h-5 mr-2" />
          )}
          Enviar por WhatsApp
          <ExternalLink className="w-4 h-4 ml-2" />
        </button>
        
        {!botoes.enviarDocumentos.disponivel && (
          <p className="text-xs text-red-500 mt-1">{botoes.enviarDocumentos.motivo}</p>
        )}
      </div>

      {/* Botão Avaliação Interna */}
      <div className="relative">
        <button
          onClick={handleEnviarAvaliacaoInterna}
          disabled={!botoes.enviarAvaliacaoInterna.disponivel || processando.avaliacaoInterna}
          className={`
            w-full flex items-center justify-center px-4 py-3 rounded-lg font-medium transition-all border-2
            ${botoes.enviarAvaliacaoInterna.disponivel
              ? 'border-blue-500 text-blue-600 hover:bg-blue-50'
              : 'border-gray-300 text-gray-500 cursor-not-allowed'
            }
            ${processando.avaliacaoInterna ? 'opacity-50' : ''}
          `}
          title={botoes.enviarAvaliacaoInterna.motivo || 'Enviar avaliação interna via WhatsApp'}
        >
          {processando.avaliacaoInterna ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500 mr-2"></div>
          ) : (
            <FileText className="w-5 h-5 mr-2" />
          )}
          Enviar avaliação por WhatsApp
          <ExternalLink className="w-4 h-4 ml-2" />
        </button>
        
        {!botoes.enviarAvaliacaoInterna.disponivel && (
          <p className="text-xs text-red-500 mt-1">{botoes.enviarAvaliacaoInterna.motivo}</p>
        )}
      </div>

      {/* Botão Avaliação Google (só aparece se nota = 5) */}
      {botoes.enviarAvaliacaoGoogle.disponivel && (
        <div className="relative">
          <button
            onClick={handleEnviarAvaliacaoGoogle}
            disabled={processando.avaliacaoGoogle}
            className={`
              w-full flex items-center justify-center px-4 py-3 rounded-lg font-medium transition-all
              bg-yellow-500 hover:bg-yellow-600 text-white shadow-md hover:shadow-lg
              ${processando.avaliacaoGoogle ? 'opacity-50' : ''}
            `}
            title="Enviar link para avaliação no Google"
          >
            {processando.avaliacaoGoogle ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
            ) : (
              <Star className="w-5 h-5 mr-2" />
            )}
            Enviar Avaliação no Google
            <ExternalLink className="w-4 h-4 ml-2" />
          </button>
          
          <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
            <p className="text-xs text-yellow-700">
              ⭐ Cliente avaliou com {avaliacao?.nota} estrelas! 
              Perfeito para solicitar avaliação pública.
            </p>
          </div>
        </div>
      )}

      {/* Status da Avaliação */}
      {avaliacao && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <h5 className="font-medium text-blue-900 mb-1">Status da Avaliação</h5>
          <div className="text-sm text-blue-700">
            <p>Nota: {avaliacao.nota}/5 ⭐</p>
            <p>Status: {avaliacao.status}</p>
            {avaliacao.dataResposta && (
              <p>Respondida em: {new Date(avaliacao.dataResposta).toLocaleDateString('pt-BR')}</p>
            )}
          </div>
        </div>
      )}

      {/* Informações de Ajuda */}
      <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
        <h5 className="font-medium text-gray-900 mb-2">ℹ️ Como funciona</h5>
        <ul className="text-xs text-gray-600 space-y-1">
          <li>• <strong>Documentos:</strong> Disponível após contrato ativo</li>
          <li>• <strong>Avaliação Interna:</strong> Disponível após serviço concluído</li>
          <li>• <strong>Avaliação Google:</strong> Só aparece para notas 5 estrelas</li>
          <li>• Todos os links abrem o WhatsApp Web automaticamente</li>
        </ul>
      </div>
    </div>
  );
};

export default WhatsAppButtons;

