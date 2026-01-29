import React from 'react';
import AdminApprovalPanel from '../components/AdminApprovalPanel';
import PageHeader from '../components/PageHeader';

const AdminApprovalQueue = () => {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Project Closure Approvals"
        description="Review and approve project closure requests from managers"
      />
      <AdminApprovalPanel />
    </div>
  );
};

export default AdminApprovalQueue;
