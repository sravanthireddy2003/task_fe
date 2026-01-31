import { httpGetService, httpPostService, httpPatchService } from '../App/httpHandler';

// New Workflow Module API wrapper (TASK / PROJECT state machine)
const workflowApi = {
  // Request a state transition for an entity (TASK / PROJECT)
  // Workflow spec: POST /api/workflow/request
  // Payload: { entityType, entityId, projectId, toState, meta: { reason } }
  requestTransition: async (payload) => {
    console.debug('[workflowApi] requestTransition', payload);
    const { entityType, entityId, toState, projectId, meta, reason } = payload || {};

    // Build request payload according to workflow specification
    const requestBody = {
      entityType: (entityType || 'TASK').toUpperCase(),
      entityId,
      toState: toState || 'COMPLETED',
      meta: {
        reason: meta?.reason || reason || 'Task completed, ready for review',
        ...(projectId && { projectId })
      }
    };

    // If projectId is at top level, include it
    if (projectId) {
      requestBody.projectId = projectId;
    }

    console.debug('[workflowApi] POST /api/workflow/request', requestBody);
    const resp = await httpPostService('api/workflow/request', requestBody);
    // Expect backend to return workflow request object
    return resp?.data ?? resp;
  },

  // Get pending approval requests for a role (e.g. MANAGER, ADMIN)
  // Workflow spec: GET /api/workflow/pending?role={role}&status=PENDING
  // Returns: { success: true, data: [{ id, entity_type, entity_id, status, project_status_info, ... }] }
  getPending: async (role, status = 'PENDING') => {
    const roleParam = role || 'MANAGER';
    console.debug('[workflowApi] getPending', { role: roleParam, status });
    const resp = await httpGetService(`api/workflow/pending?role=${encodeURIComponent(roleParam)}&status=${encodeURIComponent(status)}`);
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
