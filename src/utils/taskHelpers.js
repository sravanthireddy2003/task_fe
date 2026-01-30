// Shared helpers for task status/priority logic across manager/employee views

// Map various backend status values to human-readable labels
export const getStatusText = (status) => {
  if (!status) return 'Pending';

  const map = {
    // Core workflow
    PENDING: 'Pending',
    IN_PROGRESS: 'In Progress',
    COMPLETED: 'Completed',
    ON_HOLD: 'On Hold',

    // Case variants / legacy
    pending: 'Pending',
    in_progress: 'In Progress',
    completed: 'Completed',
    on_hold: 'On Hold',

    // Board/Kanban style
    'TO DO': 'To Do',
    TODO: 'To Do',
    'IN PROGRESS': 'In Progress',
    'On Hold': 'On Hold',

    // Review state
    Review: 'Review',
    REVIEW: 'Review',

    // Manager-specific lock / approval
    LOCKED: 'Locked - Pending Approval',
    locked: 'Locked - Pending Approval',
    'Request Approved': 'Request Approved',
    'REQUEST APPROVED': 'Request Approved',
  };

  return map[status] || status || 'Pending';
};

// Basic lock detection used in multiple places
export const isTaskLocked = (task) => {
  if (!task) return false;
  return (
    task.is_locked === true ||
    task?.lock_info?.is_locked === true ||
    task?.task_status?.is_locked === true
  );
};

// Common review-state detection
export const isTaskInReview = (task) => {
  if (!task) return false;
  const raw =
    task.status ||
    task.stage ||
    task?.task_status?.current_status ||
    '';
  const s = raw.toString().toLowerCase();
  return s === 'review' || s === 'in_review' || s.includes('review');
};

// Manager-specific helpers used to decorate lock / approval state
export const hasApprovedRequest = (task) => {
  if (!task) return false;
  return (
    (task.lock_info &&
      (task.lock_info.request_status === 'APPROVE' ||
        task.lock_info.request_status === 'APPROVED')) ||
    task.status === 'Request Approved' ||
    task?.task_status?.current_status === 'Request Approved' ||
    (task.is_locked === true && task.status === 'Request Approved')
  );
};

// Normalised status used in manager views (list/grid/details)
export const getManagerTaskStatus = (task) => {
  if (!task) return 'PENDING';

  // Locked while reassignment pending
  if (task.lock_info?.request_status === 'PENDING') {
    return 'LOCKED';
  }

  // Explicit approved state
  if (hasApprovedRequest(task)) {
    return 'Request Approved';
  }

  // Fallback to task_status / status / stage
  return (
    task?.task_status?.current_status ||
    task.status ||
    task.stage ||
    'PENDING'
  );
};
