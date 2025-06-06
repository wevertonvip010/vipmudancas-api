// Implementação do fluxo de trabalho sequencial para o sistema de gerenciamento de mudanças
// Sequência: Orçamento → Cadastro → Contrato → Ordem de Serviço → Pagamento → Avaliação

// Modelo de dados para o fluxo de trabalho
const workflowSchema = {
  orcamento: {
    required: true,
    nextStep: 'cadastro',
    fields: [
      { name: 'cliente', type: 'reference', required: true },
      { name: 'itens', type: 'array', required: true },
      { name: 'valorTotal', type: 'number', required: true },
      { name: 'status', type: 'string', enum: ['pendente', 'aprovado', 'rejeitado'], default: 'pendente' },
      { name: 'justificativaRejeicao', type: 'string', required: false },
      { name: 'motivoRejeicao', type: 'string', enum: ['preco', 'prazo', 'concorrencia', 'desistencia', 'outro'], required: false }
    ]
  },
  cadastro: {
    required: true,
    previousStep: 'orcamento',
    nextStep: 'contrato',
    fields: [
      { name: 'nome', type: 'string', required: true },
      { name: 'email', type: 'string', required: true },
      { name: 'telefone', type: 'string', required: true },
      { name: 'endereco', type: 'object', required: true },
      { name: 'documentos', type: 'array', required: true }
    ]
  },
  contrato: {
    required: true,
    previousStep: 'cadastro',
    nextStep: 'ordemServico',
    fields: [
      { name: 'numero', type: 'string', required: true },
      { name: 'dataAssinatura', type: 'date', required: true },
      { name: 'valorTotal', type: 'number', required: true },
      { name: 'formaPagamento', type: 'string', required: true },
      { name: 'termos', type: 'string', required: true },
      { name: 'status', type: 'string', enum: ['pendente', 'assinado', 'cancelado'], default: 'pendente' }
    ]
  },
  ordemServico: {
    required: true,
    previousStep: 'contrato',
    nextStep: 'pagamento',
    fields: [
      { name: 'numero', type: 'string', required: true },
      { name: 'dataAgendada', type: 'date', required: true },
      { name: 'equipe', type: 'array', required: true },
      { name: 'veiculos', type: 'array', required: true },
      { name: 'materiais', type: 'array', required: true },
      { name: 'status', type: 'string', enum: ['agendado', 'emPreparacao', 'emTransporte', 'entrega', 'finalizado'], default: 'agendado' }
    ]
  },
  pagamento: {
    required: true,
    previousStep: 'ordemServico',
    nextStep: 'avaliacao',
    fields: [
      { name: 'numero', type: 'string', required: true },
      { name: 'valor', type: 'number', required: true },
      { name: 'metodo', type: 'string', required: true },
      { name: 'dataPagamento', type: 'date', required: true },
      { name: 'status', type: 'string', enum: ['pendente', 'parcial', 'completo'], default: 'pendente' }
    ]
  },
  avaliacao: {
    required: true,
    previousStep: 'pagamento',
    fields: [
      { name: 'pontuacao', type: 'number', min: 1, max: 5, required: true },
      { name: 'comentario', type: 'string', required: false },
      { name: 'dataAvaliacao', type: 'date', required: true },
      { name: 'origem', type: 'string', enum: ['sistema', 'google', 'whatsapp'], default: 'sistema' }
    ]
  }
};

// Classe para gerenciar o fluxo de trabalho
class WorkflowManager {
  constructor() {
    this.schema = workflowSchema;
  }

  // Verifica se pode avançar para a próxima etapa
  canAdvance(currentStep, data) {
    const stepConfig = this.schema[currentStep];
    
    // Verifica se todos os campos obrigatórios estão preenchidos
    for (const field of stepConfig.fields) {
      if (field.required && !data[field.name]) {
        return {
          success: false,
          message: `Campo obrigatório não preenchido: ${field.name}`
        };
      }
    }
    
    // Verificações específicas para cada etapa
    switch (currentStep) {
      case 'orcamento':
        if (data.status === 'rejeitado' && !data.justificativaRejeicao) {
          return {
            success: false,
            message: 'É necessário fornecer uma justificativa para orçamentos rejeitados'
          };
        }
        if (data.status === 'rejeitado' && !data.motivoRejeicao) {
          return {
            success: false,
            message: 'É necessário selecionar o motivo da rejeição'
          };
        }
        if (data.status !== 'aprovado') {
          return {
            success: false,
            message: 'Só é possível avançar com orçamentos aprovados'
          };
        }
        break;
        
      case 'cadastro':
        // Verificações específicas para cadastro
        break;
        
      case 'contrato':
        if (data.status !== 'assinado') {
          return {
            success: false,
            message: 'Só é possível avançar com contratos assinados'
          };
        }
        break;
        
      case 'ordemServico':
        if (data.status !== 'finalizado') {
          return {
            success: false,
            message: 'Só é possível avançar com ordens de serviço finalizadas'
          };
        }
        break;
        
      case 'pagamento':
        if (data.status !== 'completo') {
          return {
            success: false,
            message: 'Só é possível avançar com pagamentos completos'
          };
        }
        break;
    }
    
    return {
      success: true,
      nextStep: stepConfig.nextStep
    };
  }
  
  // Obtém o próximo passo no fluxo
  getNextStep(currentStep) {
    return this.schema[currentStep].nextStep;
  }
  
  // Obtém o passo anterior no fluxo
  getPreviousStep(currentStep) {
    return this.schema[currentStep].previousStep;
  }
  
  // Valida os dados de uma etapa
  validateStepData(step, data) {
    const stepConfig = this.schema[step];
    const errors = [];
    
    for (const field of stepConfig.fields) {
      // Verifica campos obrigatórios
      if (field.required && !data[field.name]) {
        errors.push(`Campo obrigatório não preenchido: ${field.name}`);
        continue;
      }
      
      // Se o campo está presente, valida seu tipo e outras restrições
      if (data[field.name] !== undefined) {
        // Validação de tipo
        if (field.type === 'number' && typeof data[field.name] !== 'number') {
          errors.push(`Campo ${field.name} deve ser um número`);
        }
        
        if (field.type === 'string' && typeof data[field.name] !== 'string') {
          errors.push(`Campo ${field.name} deve ser uma string`);
        }
        
        if (field.type === 'array' && !Array.isArray(data[field.name])) {
          errors.push(`Campo ${field.name} deve ser um array`);
        }
        
        // Validação de enum
        if (field.enum && !field.enum.includes(data[field.name])) {
          errors.push(`Campo ${field.name} deve ser um dos valores: ${field.enum.join(', ')}`);
        }
        
        // Validação de min/max para números
        if (field.type === 'number') {
          if (field.min !== undefined && data[field.name] < field.min) {
            errors.push(`Campo ${field.name} deve ser maior ou igual a ${field.min}`);
          }
          
          if (field.max !== undefined && data[field.name] > field.max) {
            errors.push(`Campo ${field.name} deve ser menor ou igual a ${field.max}`);
          }
        }
      }
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
  
  // Cria um novo processo de fluxo de trabalho
  createWorkflow() {
    return {
      id: this.generateId(),
      currentStep: 'orcamento',
      steps: {
        orcamento: { status: 'pendente', data: {} },
        cadastro: { status: 'pendente', data: {} },
        contrato: { status: 'pendente', data: {} },
        ordemServico: { status: 'pendente', data: {} },
        pagamento: { status: 'pendente', data: {} },
        avaliacao: { status: 'pendente', data: {} }
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }
  
  // Atualiza uma etapa do fluxo de trabalho
  updateWorkflowStep(workflow, step, data) {
    // Valida os dados
    const validation = this.validateStepData(step, data);
    if (!validation.valid) {
      return {
        success: false,
        errors: validation.errors
      };
    }
    
    // Atualiza os dados da etapa
    workflow.steps[step].data = { ...workflow.steps[step].data, ...data };
    workflow.steps[step].status = 'completo';
    workflow.updatedAt = new Date();
    
    // Verifica se pode avançar para a próxima etapa
    const canAdvance = this.canAdvance(step, workflow.steps[step].data);
    if (canAdvance.success && canAdvance.nextStep) {
      workflow.currentStep = canAdvance.nextStep;
      workflow.steps[canAdvance.nextStep].status = 'ativo';
    }
    
    return {
      success: true,
      workflow
    };
  }
  
  // Gera um ID único para o fluxo de trabalho
  generateId() {
    return 'wf_' + Math.random().toString(36).substr(2, 9);
  }
}

// Exporta a classe para uso no sistema
module.exports = WorkflowManager;
