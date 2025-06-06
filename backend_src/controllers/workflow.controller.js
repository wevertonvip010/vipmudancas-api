// Controlador para gerenciar o fluxo de trabalho sequencial
const WorkflowManager = require('../services/workflow.service');
const workflowManager = new WorkflowManager();

class WorkflowController {
  // Criar um novo fluxo de trabalho
  async createWorkflow(req, res) {
    try {
      const workflow = workflowManager.createWorkflow();
      return res.status(201).json({
        success: true,
        data: workflow
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Erro ao criar fluxo de trabalho',
        error: error.message
      });
    }
  }

  // Atualizar uma etapa do fluxo de trabalho
  async updateWorkflowStep(req, res) {
    try {
      const { workflowId, step } = req.params;
      const data = req.body;
      
      // Buscar o workflow no banco de dados (simulado aqui)
      const workflow = await this.getWorkflowById(workflowId);
      
      if (!workflow) {
        return res.status(404).json({
          success: false,
          message: 'Fluxo de trabalho não encontrado'
        });
      }
      
      // Verificar se a etapa é válida
      if (!workflowManager.schema[step]) {
        return res.status(400).json({
          success: false,
          message: 'Etapa inválida'
        });
      }
      
      // Verificar se é a etapa atual
      if (workflow.currentStep !== step) {
        return res.status(400).json({
          success: false,
          message: `Não é possível atualizar esta etapa. A etapa atual é ${workflow.currentStep}`
        });
      }
      
      // Atualizar a etapa
      const result = workflowManager.updateWorkflowStep(workflow, step, data);
      
      if (!result.success) {
        return res.status(400).json({
          success: false,
          message: 'Erro ao atualizar etapa',
          errors: result.errors
        });
      }
      
      // Salvar o workflow atualizado (simulado aqui)
      await this.saveWorkflow(result.workflow);
      
      return res.status(200).json({
        success: true,
        data: result.workflow
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Erro ao atualizar etapa do fluxo de trabalho',
        error: error.message
      });
    }
  }

  // Obter um fluxo de trabalho por ID
  async getWorkflow(req, res) {
    try {
      const { workflowId } = req.params;
      
      // Buscar o workflow no banco de dados (simulado aqui)
      const workflow = await this.getWorkflowById(workflowId);
      
      if (!workflow) {
        return res.status(404).json({
          success: false,
          message: 'Fluxo de trabalho não encontrado'
        });
      }
      
      return res.status(200).json({
        success: true,
        data: workflow
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Erro ao obter fluxo de trabalho',
        error: error.message
      });
    }
  }

  // Listar todos os fluxos de trabalho
  async listWorkflows(req, res) {
    try {
      // Buscar todos os workflows no banco de dados (simulado aqui)
      const workflows = await this.getAllWorkflows();
      
      return res.status(200).json({
        success: true,
        data: workflows
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Erro ao listar fluxos de trabalho',
        error: error.message
      });
    }
  }

  // Métodos auxiliares para simulação de banco de dados
  // Em um ambiente real, estes métodos seriam substituídos por chamadas ao banco de dados
  
  // Simula a busca de um workflow por ID
  async getWorkflowById(workflowId) {
    // Simulação - em um ambiente real, isso seria uma consulta ao banco de dados
    return this.workflows.find(w => w.id === workflowId);
  }
  
  // Simula o salvamento de um workflow
  async saveWorkflow(workflow) {
    // Simulação - em um ambiente real, isso seria uma operação de atualização no banco de dados
    const index = this.workflows.findIndex(w => w.id === workflow.id);
    
    if (index >= 0) {
      this.workflows[index] = workflow;
    } else {
      this.workflows.push(workflow);
    }
    
    return workflow;
  }
  
  // Simula a obtenção de todos os workflows
  async getAllWorkflows() {
    // Simulação - em um ambiente real, isso seria uma consulta ao banco de dados
    return this.workflows;
  }
  
  // Array para simular o armazenamento de workflows
  workflows = [];
}

module.exports = new WorkflowController();
