import React from 'react';
import ManagerApprovalPanel from '../components/ManagerApprovalPanel';
import PageHeader from '../components/PageHeader';

const ManagerApprovalQueue = () => {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Task Approvals"
        description="Review and approve employee task completion requests"
      />
      <ManagerApprovalPanel />
    </div>
  );
};

export default ManagerApprovalQueue;
