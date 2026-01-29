import React from 'react';
import { Lock, AlertTriangle } from 'lucide-react';

/**
 * ProjectLockBanner - Shows banner when project is closed
 * Locks all task editing UI and shows warning message
 * Appears at top of project/task pages when project.status = CLOSED
 */
const ProjectLockBanner = ({ project }) => {
  // Only show if project is closed
  const isClosed = project?.status === 'CLOSED' || project?.status === 'closed';

  if (!isClosed) return null;

  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0">
          <Lock className="w-5 h-5 text-red-500" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-medium text-red-800">
            Project is Closed
          </h3>
          <p className="text-sm text-red-700 mt-1">
            This project has been closed and all tasks are locked. No further modifications are allowed.
          </p>
        </div>
        <div className="flex-shrink-0">
          <AlertTriangle className="w-5 h-5 text-red-500" />
        </div>
      </div>
    </div>
  );
};

export default ProjectLockBanner;