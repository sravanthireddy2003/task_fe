import React, { useState } from 'react';
import { Eye, Check, X, List, Grid, Plus } from 'lucide-react';

const Approvals = () => {
  const staticApprovals = [
    {
      id: 'a1',
      department: 'Design',
      project: 'Website Redesign',
      title: 'Homepage Mockup Approval',
      requester: 'Alice Johnson',
      assignedTo: ['John Doe', 'Jane Smith'],
      date: '2025-12-12',
      status: 'Pending',
    },
    {
      id: 'a2',
      department: 'Development',
      project: 'Mobile App Feature',
      title: 'New Login Feature Approval',
      requester: 'Bob Smith',
      assignedTo: ['Mike Brown'],
      date: '2025-12-10',
      status: 'Approved',
    },
    {
      id: 'a3',
      department: 'Operations',
      project: 'Cloud Migration',
      title: 'Server Migration Plan',
      requester: 'Charlie Davis',
      assignedTo: ['Emma White', 'Oliver Green'],
      date: '2025-12-08',
      status: 'Rejected',
    },
    {
      id: 'a4',
      department: 'Marketing',
      project: 'New Campaign',
      title: 'Social Media Campaign Plan',
      requester: 'Dana Lee',
      assignedTo: ['Liam Gray'],
      date: '2025-12-11',
      status: 'Pending',
    },
  ];

  const [approvals, setApprovals] = useState(staticApprovals);
  const [view, setView] = useState('card'); // card | list

  const handleApprove = (id) => {
    setApprovals((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: 'Approved' } : a))
    );
  };

  const handleReject = (id) => {
    setApprovals((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: 'Rejected' } : a))
    );
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h2 className="text-3xl font-bold text-gray-800">Approval Workflows</h2>
        <div className="flex gap-2">
          <button
            className={`p-2 rounded-lg ${view === 'card' ? 'bg-blue-600 text-white shadow-md' : 'bg-white border hover:bg-gray-100'}`}
            onClick={() => setView('card')}
            title="Card View"
          >
            <Grid size={18} />
          </button>
          <button
            className={`p-2 rounded-lg ${view === 'list' ? 'bg-blue-600 text-white shadow-md' : 'bg-white border hover:bg-gray-100'}`}
            onClick={() => setView('list')}
            title="List View"
          >
            <List size={18} />
          </button>
          
        </div>
      </div>

      {/* ---------------- CARD VIEW ---------------- */}
      {view === 'card' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {approvals.map((a) => (
            <div
              key={a.id}
              className="bg-white rounded-xl shadow-md hover:shadow-xl transition-shadow p-5 flex flex-col justify-between"
            >
              <div>
                <h3 className="text-lg font-semibold mb-3 text-gray-800">{a.title}</h3>
                <div className="text-gray-600 text-sm mb-1">
                  <span className="font-medium">Dept:</span> {a.department}
                </div>
                <div className="text-gray-600 text-sm mb-1">
                  <span className="font-medium">Project:</span> {a.project}
                </div>
                <div className="text-gray-600 text-sm mb-1">
                  <span className="font-medium">Requester:</span> {a.requester}
                </div>
                <div className="text-gray-600 text-sm mb-2">
                  <span className="font-medium">Assigned To:</span> {a.assignedTo.join(', ')}
                </div>
                <div className="text-gray-600 text-sm mb-3">
                  <span className="font-medium">Date:</span> {a.date}
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    a.status === 'Approved'
                      ? 'bg-green-500 text-white'
                      : a.status === 'Rejected'
                      ? 'bg-red-500 text-white'
                      : 'bg-yellow-500 text-white'
                  }`}
                >
                  {a.status}
                </span>
              </div>

              {/* Actions */}
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => alert(`Viewing ${a.title}`)}
                  className="flex-1 p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex justify-center items-center gap-1"
                >
                  <Eye size={16} /> View
                </button>
                {a.status === 'Pending' && (
                  <>
                    <button
                      onClick={() => handleApprove(a.id)}
                      className="flex-1 p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 flex justify-center items-center gap-1"
                    >
                      <Check size={16} /> Approve
                    </button>
                    <button
                      onClick={() => handleReject(a.id)}
                      className="flex-1 p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 flex justify-center items-center gap-1"
                    >
                      <X size={16} /> Reject
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ---------------- LIST VIEW ---------------- */}
      {view === 'list' && (
        <div className="overflow-auto rounded-xl border bg-white shadow-md">
          <table className="min-w-full text-left">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-3 text-gray-700">Dept</th>
                <th className="px-4 py-3 text-gray-700">Project</th>
                <th className="px-4 py-3 text-gray-700">Title</th>
                <th className="px-4 py-3 text-gray-700">Requester</th>
                <th className="px-4 py-3 text-gray-700">Assigned To</th>
                <th className="px-4 py-3 text-gray-700">Date</th>
                <th className="px-4 py-3 text-gray-700">Status</th>
                <th className="px-4 py-3 text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {approvals.map((a) => (
                <tr key={a.id} className="border-b hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">{a.department}</td>
                  <td className="px-4 py-3">{a.project}</td>
                  <td className="px-4 py-3">{a.title}</td>
                  <td className="px-4 py-3">{a.requester}</td>
                  <td className="px-4 py-3">{a.assignedTo.join(', ')}</td>
                  <td className="px-4 py-3">{a.date}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        a.status === 'Approved'
                          ? 'bg-green-500 text-white'
                          : a.status === 'Rejected'
                          ? 'bg-red-500 text-white'
                          : 'bg-yellow-500 text-white'
                      }`}
                    >
                      {a.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 flex gap-2">
                    <button
                      onClick={() => alert(`Viewing ${a.title}`)}
                      className="p-1 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center justify-center"
                    >
                      <Eye size={16} />
                    </button>
                    {a.status === 'Pending' && (
                      <>
                        <button
                          onClick={() => handleApprove(a.id)}
                          className="p-1 bg-green-500 text-white rounded hover:bg-green-600 flex items-center justify-center"
                        >
                          <Check size={16} />
                        </button>
                        <button
                          onClick={() => handleReject(a.id)}
                          className="p-1 bg-red-500 text-white rounded hover:bg-red-600 flex items-center justify-center"
                        >
                          <X size={16} />
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Approvals;
