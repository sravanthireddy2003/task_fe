import { httpGetService, httpPostService } from '../App/httpHandler';

// API wrapper for workflow endpoints
const workflowApi = {
  createTemplate: async (payload) => {
    console.debug('[workflowApi] createTemplate', payload);
    return await httpPostService('api/admin/workflows/templates', payload);
  },

  addStep: async (payload) => {
    console.debug('[workflowApi] addStep', payload);
    return await httpPostService('api/admin/workflows/steps', payload);
  },

  getQueue: async () => {
    console.debug('[workflowApi] getQueue');
    return await httpGetService('api/manager/workflows/queue');
  },

  approveWorkflow: async (id, body = {}) => {
    console.debug('[workflowApi] approveWorkflow', id, body);
    return await httpPostService(`api/manager/workflows/${id}/approve`, body);
  },

  rejectWorkflow: async (id, body = {}) => {
    console.debug('[workflowApi] rejectWorkflow', id, body);
    return await httpPostService(`api/manager/workflows/${id}/reject`, body);
  },

  escalateWorkflow: async (id, body = {}) => {
    console.debug('[workflowApi] escalateWorkflow', id, body);
    return await httpPostService(`api/manager/workflows/${id}/escalate`, body);
  },

  getHistory: async (id) => {
    console.debug('[workflowApi] getHistory', id);
    return await httpGetService(`api/workflow/${id}/history`);
  },
};

export default workflowApi;
