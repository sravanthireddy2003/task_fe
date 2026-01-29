import { httpGetService, httpPostService, httpPatchService } from '../App/httpHandler';

// New Workflow Module API wrapper (TASK / PROJECT state machine)
const workflowApi = {
  // Request a state transition for an entity (TASK / PROJECT)
  // For TASK transitions the API expects a PATCH to /api/tasks/:id/status
  // Payload: { tenantId, entityType, entityId, toState, meta: { reason, projectId } }
  requestTransition: async (payload) => {
    console.debug('[workflowApi] requestTransition', payload);
    const { entityType, entityId, toState, meta } = payload || {};

    // If this is a TASK state change, call the tasks status endpoint as per Postman collection
    if ((entityType || '').toUpperCase() === 'TASK' && entityId) {
      const body = { status: toState };
      // include projectId when available (many endpoints expect it)
      if (meta?.projectId) body.projectId = meta.projectId;
      if (payload.projectId) body.projectId = payload.projectId;
      console.debug('[workflowApi] routing TASK transition to PATCH /api/tasks/:id/status', { entityId, body });
      const resp = await httpPatchService(`api/tasks/${encodeURIComponent(entityId)}/status`, body);
      // Expect backend to return either the updated task or a workflow request object
      return resp?.data ?? resp;
    }

    // Fallback: older servers may accept a workflow request endpoint
    const resp = await httpPostService('api/workflow/request', payload);
    return resp?.data ?? resp;
  },

  // Get pending approval requests for a role (e.g. MANAGER)
  // Returns: { success: true, data: [{ id, tenant_id, entity_type, entity_id, from_state, to_state, requested_by, reason, created_at }] }
  getPending: async (role) => {
    const roleParam = role || 'MANAGER';
    console.debug('[workflowApi] getPending', roleParam);
    const resp = await httpGetService(`api/workflow/pending?role=${encodeURIComponent(roleParam)}`);
    // Response format: { success: true, data: [...] }
    return resp?.data ?? resp;
  },

  // Approve or reject a pending request
  // Accepts either: { requestId, action: 'APPROVE'|'REJECT', reason }
  // or legacy: { requestId, approved: true|false, reason }
  approveOrReject: async ({ requestId, approved, action, reason }) => {
    let body;
    if (action) {
      body = { requestId, action, reason };
    } else if (typeof approved === 'boolean') {
      body = { requestId, action: approved ? 'APPROVE' : 'REJECT', reason };
    } else {
      // default to approve if caller omitted explicit action/approved
      body = { requestId, action: 'APPROVE', reason };
    }

    console.debug('[workflowApi] approveOrReject', body);
    const resp = await httpPostService('api/workflow/approve', body);
    // Response format: { success: true, data: { status: 'APPROVED' | 'REJECTED' } }
    return resp?.data ?? resp;
  },

  // Get workflow history for an entity (TASK or PROJECT)
  // Returns: { success: true, data: [{ id, action, from_state, to_state, user_id, details, timestamp }] }
  getHistory: async ({ entityType, entityId }) => {
    const type = entityType || 'TASK';
    console.debug('[workflowApi] getHistory', { entityType: type, entityId });
    const resp = await httpGetService(`api/workflow/history/${encodeURIComponent(type)}/${encodeURIComponent(entityId)}`);
    // Response format: { success: true, data: [...] }
    return resp?.data ?? resp;
  },

  // Alias for getPending - fetch pending approvals for a role
  getPendingApprovals: async (role) => {
    return workflowApi.getPending(role);
  },

  // Alias for approveOrReject - approve or reject a workflow request
  approveRequest: async (requestId, action, reason) => {
    return workflowApi.approveOrReject({ requestId, action, reason });
  },

  // Request project closure (Manager → Admin)
  requestProjectClosure: async (payload) => {
    console.debug('[workflowApi] requestProjectClosure', payload);
    const resp = await httpPostService('api/workflow/project/close-request', payload);
    return resp?.data ?? resp;
  },
};

export default workflowApi;
