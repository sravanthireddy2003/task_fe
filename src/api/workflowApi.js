import { httpGetService, httpPostService, httpPatchService } from '../App/httpHandler';

const workflowApi = {
  requestTransition: async (payload) => {
    const { entityType, entityId, toState, projectId, meta, reason } = payload || {};

    const requestBody = {
      entityType: (entityType || 'TASK').toUpperCase(),
      entityId,
      toState: toState || 'COMPLETED',
      meta: {
        reason: meta?.reason || reason || 'Task completed, ready for review',
        ...(projectId && { projectId })
      }
    };

    if (projectId) {
      requestBody.projectId = projectId;
    }

    const resp = await httpPostService('api/workflow/request', requestBody);
    return resp?.data ?? resp;
  },

  getPending: async (roleOrManagerId, status = 'PENDING') => {
    const isManagerId = typeof roleOrManagerId === 'number' || !isNaN(parseInt(roleOrManagerId));
    
    let queryParams;
    if (isManagerId) {
      queryParams = `managerId=${encodeURIComponent(roleOrManagerId)}&status=${encodeURIComponent(status)}`;
    } else {
      const roleParam = roleOrManagerId || 'MANAGER';
      queryParams = `role=${encodeURIComponent(roleParam)}&status=${encodeURIComponent(status)}`;
    }
    
    const resp = await httpGetService(`api/workflow/pending?${queryParams}`);
    return resp?.data ?? resp;
  },

  approveOrReject: async ({ requestId, approved, action, reason }) => {
    let body;
    if (action) {
      body = { requestId, action, reason };
    } else if (typeof approved === 'boolean') {
      body = { requestId, action: approved ? 'APPROVE' : 'REJECT', reason };
    } else {
      body = { requestId, action: 'APPROVE', reason };
    }

    // httpPostService already returns the parsed response body (resp.data).
    // Returning the full parsed response preserves the top-level `success` flag
    // and `message` fields so callers can reliably decide success vs error.
    const resp = await httpPostService('api/workflow/approve', body);
    return resp;
  },

  getHistory: async ({ entityType, entityId }) => {
    const type = entityType || 'TASK';
    const resp = await httpGetService(`api/workflow/history/${encodeURIComponent(type)}/${encodeURIComponent(entityId)}`);
    return resp?.data ?? resp;
  },

  getPendingApprovals: async (role) => {
    return workflowApi.getPending(role);
  },

  approveRequest: async (requestId, action, reason) => {
    return workflowApi.approveOrReject({ requestId, action, reason });
  },

  requestProjectClosure: async (payload) => {
    const resp = await httpPostService('api/workflow/project/close-request', payload);
    return resp?.data ?? resp;
  },
};

export default workflowApi;
