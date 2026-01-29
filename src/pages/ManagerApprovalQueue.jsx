import React, { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import ApprovalCard from '../components/ApprovalCard';
import { fetchQueue, approveInstance, rejectInstance } from '../redux/slices/approvalSlice';
import WSClient from '../utils/wsClient';
import { toast } from 'sonner';
import PageHeader from '../components/PageHeader';
import Card from '../components/Card';
import ViewToggle from '../components/ViewToggle';
import Icon from '../components/Icon';
import GridCard from '../components/ui/GridCard';
import FormField from '../components/ui/FormField';
import { XCircle, ChevronRight, Download } from 'lucide-react';
import fetchWithTenant from '../utils/fetchWithTenant';

const ManagerApprovalQueue = () => {
  const dispatch = useDispatch();
  const { queue, loading } = useSelector((s) => s.approval || { queue: [], loading: false });
  const [viewMode, setViewMode] = useState('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedItems, setSelectedItems] = useState([]);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectingId, setRejectingId] = useState(null);
  const [showFilters, setShowFilters] = useState(false);

  const wsRef = useRef(null);
  const lastFetchRef = useRef(0);

  useEffect(() => {
    console.debug('[ManagerApprovalQueue] mounted -> dispatching fetchQueue');
    dispatch(fetchQueue()).catch((e) => console.warn('[ManagerApprovalQueue] fetchQueue error', e));
  }, [dispatch]);

  useEffect(() => {
    const server = import.meta.env.VITE_WS_URL;
    if (!server) return;

    const ws = new WSClient(server);
    wsRef.current = ws;
    ws.connect();

    const unsub = ws.onMessage((msg) => {
      try {
        if (!msg || !msg.type) return;
        if (msg.type.includes('approval') || msg.type.includes('workflow')) {
          const now = Date.now();
          if (now - lastFetchRef.current > 2000) {
            lastFetchRef.current = now;
            dispatch(fetchQueue());
            toast.success('Queue updated', {
              description: 'New approval items have been received',
              duration: 3000,
            });
          }
        }
      } catch (e) {
        console.warn('WS msg handling error', e);
      }
    });

    return () => {
      try { unsub(); } catch (e) {}
      try { ws.disconnect(); } catch (e) {}
    };
  }, [dispatch]);

  // Filter and search logic
  const filteredQueue = queue.filter(item => {
    const matchesSearch = searchQuery === '' || 
      (item.entity_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.requested_by || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.entity_type || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'pending' && item.status?.toLowerCase().includes('pending')) ||
      (statusFilter === 'approved' && item.status?.toLowerCase().includes('approved')) ||
      (statusFilter === 'rejected' && item.status?.toLowerCase().includes('rejected'));
    
    return matchesSearch && matchesStatus;
  });

  const pendingCount = queue.filter(item => 
    item.status?.toLowerCase().includes('pending')
  ).length;

  const handleApprove = (id) => {
    dispatch(approveInstance({ requestId: id, reason: 'Approved via UI' }))
      .then(() => {
        toast.success('Request Approved', {
          description: 'The request has been approved successfully.',
        });
        setSelectedItems(prev => prev.filter(itemId => itemId !== id));
      })
      .catch(() => {
        toast.error('Approval Failed', {
          description: 'Failed to approve the request. Please try again.',
        });
      });
  };

  const handleReject = (id, reason) => {
    dispatch(rejectInstance({ requestId: id, reason: reason || 'Rejected via UI' }))
      .then(() => {
        toast.error('Request Rejected', {
          description: 'The request has been rejected.',
        });
        setShowRejectDialog(false);
        setRejectReason('');
        setSelectedItems(prev => prev.filter(itemId => itemId !== id));
      })
      .catch(() => {
        toast.error('Rejection Failed', {
          description: 'Failed to reject the request. Please try again.',
        });
      });
  };

  const handleBulkApprove = () => {
    selectedItems.forEach(id => {
      dispatch(approveInstance({ requestId: id, reason: 'Bulk approved via UI' }));
    });
    toast.success(`Approved ${selectedItems.length} items`, {
      description: 'Selected requests have been approved.',
    });
    setSelectedItems([]);
  };

  const openRejectDialog = (id) => {
    setRejectingId(id);
    setShowRejectDialog(true);
  };

  const handleRefresh = () => {
    dispatch(fetchQueue());
    toast.info('Refreshing queue...', { duration: 1500 });
  };

  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailData, setDetailData] = useState(null);

  const handleViewDetails = async (item) => {
    try {
      setDetailLoading(true);
      setDetailModalOpen(true);
      setDetailData(null);

      // approval items reference the underlying entity (task) via fields like entity_id/entityId
      const taskId = item?.entity_id || item?.entityId || item?.entity_public_id || item?.entityPublicId || item?.entity || item?.requestId || item?.id;
      if (!taskId) throw new Error('No task id found for this approval item');

      const resp = await fetchWithTenant('/api/tasks/selected-details', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskIds: [taskId] }),
      });

      if (resp && resp.error) throw new Error(resp.error || 'Failed to fetch task details');

      const payload = resp?.data ?? resp;
      const details = Array.isArray(payload) ? payload[0] : payload;
      setDetailData(details || null);
    } catch (err) {
      console.warn('Failed to load task details', err);
      toast.error(err?.message || 'Failed to load details');
      setDetailModalOpen(false);
    } finally {
      setDetailLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) {
      return `${diffMins}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    }
    return date.toLocaleDateString();
  };

  const formatDateFull = (dateString) => {
    if (!dateString) return '—';
    try {
      const d = new Date(dateString);
      return d.toLocaleString();
    } catch (e) {
      return dateString;
    }
  };

  const getStatusColor = (status) => {
    const statusLower = status?.toLowerCase() || '';
    if (statusLower.includes('pending')) return 'bg-amber-100 text-amber-800';
    if (statusLower.includes('approved')) return 'bg-green-100 text-green-800';
    if (statusLower.includes('rejected')) return 'bg-red-100 text-red-800';
    return 'bg-slate-100 text-slate-800';
  };

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-amber-500';
      case 'low': return 'bg-blue-500';
      default: return 'bg-slate-500';
    }
  };

  return (
    <div className="w-full p-6 space-y-6 bg-slate-50 min-h-screen">
      <PageHeader
        title="Approval Queue"
        subtitle="Review and manage pending workflow approvals"
        onRefresh={handleRefresh}
        refreshing={loading}
      />

      <Card className="overflow-hidden">
        {/* Header with Stats (GridCards for consistency) */}
        <div className="p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold">Approval Dashboard</h1>
              <p className="text-slate-600 mt-1">Manage workflow approvals in real-time</p>
            </div>
            <div className="flex items-center gap-4 mt-4 lg:mt-0">
              <GridCard title="Total" value={queue.length} subtitle="requests" tone="default" className="w-44" />
              <GridCard title="Pending" value={pendingCount} subtitle="awaiting review" tone="warning" className="w-44" />
              <GridCard title="Avg Time" value={`24h`} subtitle="average" tone="primary" className="w-44" />
            </div>
          </div>
        </div>

        {/* Controls Bar */}
        <div className="p-6 border-b border-slate-200">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex-1">
              <FormField>
                <div className="relative">
                  <Icon name="Search" className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                  <input
                    type="text"
                    placeholder="Search requests, entities, or requesters..."
                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </FormField>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${
                  showFilters 
                    ? 'bg-blue-50 border-blue-500 text-blue-700' 
                    : 'border-slate-300 hover:bg-slate-50'
                }`}
              >
                <Icon name="Filter" className="h-4 w-4" />
                Filters
              </button>

              <ViewToggle
                mode={viewMode}
                onChange={setViewMode}
              />

              {selectedItems.length > 0 && (
                <button
                  onClick={handleBulkApprove}
                  className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                >
                  <Icon name="Check" className="h-4 w-4" />
                  Approve Selected ({selectedItems.length})
                </button>
              )}
            </div>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="mt-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <FormField label="Status">
                    <div className="flex gap-2">
                      {['all', 'pending', 'approved', 'rejected'].map((status) => (
                        <button
                          key={status}
                          onClick={() => setStatusFilter(status)}
                          className={`px-3 py-1.5 rounded-lg text-sm capitalize ${
                            statusFilter === status
                              ? 'bg-blue-500 text-white'
                              : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          {status}
                        </button>
                      ))}
                    </div>
                  </FormField>
                </div>

                <div>
                  <FormField label="Priority">
                    <select className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                      <option value="all">All Priorities</option>
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>
                  </FormField>
                </div>

                <div>
                  <FormField label="Date Range">
                    <div className="flex items-center gap-2">
                      <Icon name="Calendar" className="h-4 w-4 text-slate-400" />
                      <input
                        type="date"
                        className="flex-1 px-3 py-2 border border-slate-300 rounded-lg"
                      />
                      <span className="text-slate-400">to</span>
                      <input
                        type="date"
                        className="flex-1 px-3 py-2 border border-slate-300 rounded-lg"
                      />
                    </div>
                  </FormField>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Content Area */}
        {loading ? (
          <div className="p-8">
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-24 bg-gradient-to-r from-slate-100 to-slate-200 rounded-xl animate-pulse"
                />
              ))}
            </div>
          </div>
        ) : filteredQueue.length === 0 ? (
          <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-100 rounded-full mb-4">
              <Icon name="CheckCircle" className="h-8 w-8 text-green-500" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900">All caught up!</h3>
            <p className="text-slate-600 mt-2 max-w-md mx-auto">
              No approval requests need your attention right now.
              Requests will appear here as they come in.
            </p>
            <button
              onClick={handleRefresh}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800"
            >
              <Icon name="RefreshCw" className="h-4 w-4" />
              Refresh Queue
            </button>
          </div>
        ) : viewMode === 'list' ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="py-3 px-6 text-left">
                    <input
                      type="checkbox"
                      className="rounded border-slate-300"
                      checked={selectedItems.length === filteredQueue.length}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedItems(filteredQueue.map(item => item.id));
                        } else {
                          setSelectedItems([]);
                        }
                      }}
                    />
                  </th>
                  <th className="py-3 px-6 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Request
                  </th>
                  <th className="py-3 px-6 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Requester
                  </th>
                  <th className="py-3 px-6 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="py-3 px-6 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Priority
                  </th>
                  <th className="py-3 px-6 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="py-3 px-6 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredQueue.map((item) => {
                  const id = item.id || item.requestId || item._id || item.instanceId;
                  const isPending = item.status?.toLowerCase().includes('pending');
                  const isSelected = selectedItems.includes(id);

                  return (
                    <tr 
                      key={id}
                      onClick={() => handleViewDetails(item)}
                      className={`hover:bg-slate-50 transition-colors cursor-pointer ${
                        isSelected ? 'bg-blue-50' : ''
                      }`}
                    >
                      <td className="py-4 px-6">
                        {isPending && (
                          <input
                            type="checkbox"
                            className="rounded border-slate-300"
                            checked={isSelected}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedItems([...selectedItems, id]);
                              } else {
                                setSelectedItems(selectedItems.filter(itemId => itemId !== id));
                              }
                            }}
                          />
                        )}
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${getPriorityColor(item.priority)}`} />
                          <div>
                            <div className="font-medium text-slate-900">
                              {item.entity_type} • {item.entity_name || 'Unnamed'}
                            </div>
                            <div className="text-sm text-slate-500">
                              ID: {item.requestId || id}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center">
                            <Icon name="User" className="h-4 w-4 text-slate-600" />
                          </div>
                          <div>
                            <div className="font-medium">{item.requester_name}</div>
                            <div className="text-sm text-slate-500">{item.requester_email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2 text-sm">
                          <Icon name="Calendar" className="h-4 w-4 text-slate-400" />
                          <span>{formatDate(item.created_at)}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          item.priority === 'high' ? 'bg-red-100 text-red-800' :
                          item.priority === 'medium' ? 'bg-amber-100 text-amber-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {item.priority || 'Normal'}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          {isPending ? (
                            <>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleApprove(id); }}
                                title="Approve"
                                className="inline-flex items-center justify-center p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                                aria-label="Approve"
                              >
                                <Icon name="Check" className="h-4 w-4" />
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); openRejectDialog(id); }}
                                title="Reject"
                                className="inline-flex items-center justify-center p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                                aria-label="Reject"
                              >
                                <Icon name="X" className="h-4 w-4" />
                              </button>
                            </>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          // Grid View
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredQueue.map((item) => (
                <ApprovalCard
                  key={item.id || item._id || item.instanceId}
                  item={item}
                  onApprove={handleApprove}
                  onReject={(id) => openRejectDialog(id)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50">
          <div className="flex items-center justify-between text-sm text-slate-600">
            <div>
              Showing <span className="font-semibold">{filteredQueue.length}</span> of{' '}
              <span className="font-semibold">{queue.length}</span> requests
            </div>
            <div className="flex items-center gap-4">
              <button className="inline-flex items-center gap-2 hover:text-slate-900">
                <Download className="h-4 w-4" />
                Export
              </button>
            </div>
          </div>
        </div>
      </Card>

      {/* Reject Dialog */}
      {showRejectDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <XCircle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Reject Request</h3>
                <p className="text-sm text-slate-600">Please provide a reason for rejection</p>
              </div>
            </div>
            
            <textarea
              className="w-full h-32 p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              placeholder="Enter rejection reason..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowRejectDialog(false);
                  setRejectReason('');
                }}
                className="flex-1 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleReject(rejectingId, rejectReason)}
                disabled={!rejectReason.trim()}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {detailModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-5xl w-full p-6 overflow-auto max-h-[88vh] shadow-xl">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-xl">{(detailData?.title || detailData?.name || 'T').slice(0,2).toUpperCase()}</div>
                <div>
                  <h3 className="text-xl font-semibold text-slate-900">{detailData?.title || detailData?.name || 'Untitled Task'}</h3>
                  <div className="text-sm text-slate-500 mt-1">{detailData?.description || 'No description provided.'}</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-xs text-slate-500">{detailData?.id ? `ID: ${detailData.id}` : ''}</div>
                <button
                  onClick={() => {
                    if (detailData?.id) {
                      try { navigator.clipboard.writeText(detailData.id); toast.success('ID copied'); } catch (e) {}
                    }
                  }}
                  className="px-3 py-1 border rounded text-sm text-slate-600 hover:bg-slate-50"
                >
                  Copy ID
                </button>
                <button onClick={() => setDetailModalOpen(false)} className="text-slate-400 hover:text-slate-700">Close</button>
              </div>
            </div>

            {detailLoading ? (
              <div className="space-y-2">
                <div className="h-4 bg-slate-100 rounded animate-pulse" />
                <div className="h-4 bg-slate-100 rounded animate-pulse" />
                <div className="h-4 bg-slate-100 rounded animate-pulse" />
              </div>
            ) : detailData ? (
              <div className="space-y-6 text-sm text-slate-700">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="md:col-span-2">
                    <div className="flex flex-wrap gap-3 text-xs mb-4">
                      <div className="px-3 py-1 rounded bg-slate-50 text-slate-700">Status: <span className="font-medium">{detailData.status || detailData.stage || '—'}</span></div>
                      <div className="px-3 py-1 rounded bg-slate-50 text-slate-700">Priority: <span className="font-medium">{detailData.priority || 'Normal'}</span></div>
                      <div className="px-3 py-1 rounded bg-slate-50 text-slate-700">Due: <span className="font-medium">{formatDate(detailData.taskDate || detailData.day || detailData.summary?.dueDate)}</span></div>
                    </div>

                    <div className="bg-slate-50 p-4 rounded">
                      <h5 className="font-medium text-slate-900 mb-2">Summary</h5>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-slate-700">
                        <div>Created: <div className="font-medium text-slate-800">{formatDateFull(detailData.createdAt || detailData.created_at)}</div></div>
                        <div>Completed: <div className="font-medium text-slate-800">{formatDateFull(detailData.completed_at || detailData.completedAt)}</div></div>
                        <div>Total Time: <div className="font-medium text-slate-800">{detailData.total_time_hhmmss ?? detailData.totalTime ?? '0:00:00'}</div></div>
                        <div>Approved By: <div className="font-medium text-slate-800">{detailData.approved_by?.name || '—'}</div></div>
                      </div>
                    </div>
                  </div>

                  <div className="text-sm text-slate-700">
                    <h5 className="font-medium text-slate-900">Quick Info</h5>
                    <div className="mt-2 space-y-2">
                      <div>Client: <div className="font-medium">{detailData.client?.name || '—'}</div></div>
                      <div>Assigned: <div className="font-medium">{(detailData.assignedUsers || detailData.assigned_users || []).map(u => u.name).join(', ') || 'Unassigned'}</div></div>
                      <div className="text-xs text-slate-500">Request count: <span className="font-medium">{detailData?.summary ? detailData.summary.dueStatus : '—'}</span></div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h5 className="font-medium text-slate-900">Assigned</h5>
                    <ul className="mt-2 space-y-2 text-sm text-slate-700">
                      {(detailData.assignedUsers || detailData.assigned_users || []).map((u) => (
                        <li key={u.id || u.internalId || u.internal_id} className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-xs text-slate-700">{(u.name || '?')[0]}</div>
                          <div>
                            <div className="font-medium text-slate-800">{u.name || u.fullName || 'Unknown'}</div>
                            <div className="text-xs text-slate-500">{u.id || u.internalId || ''}</div>
                          </div>
                        </li>
                      ))}
                      {((detailData.assignedUsers || detailData.assigned_users || []).length === 0) && (
                        <div className="text-sm text-slate-500 mt-2">No assigned users.</div>
                      )}
                    </ul>
                  </div>

                  <div>
                    <h5 className="font-medium text-slate-900">Checklist</h5>
                    {(detailData.checklist || []).length === 0 ? (
                      <div className="text-sm text-slate-500 mt-2">No checklist items.</div>
                    ) : (
                      <ul className="mt-2 space-y-2 text-sm text-slate-700">
                        {(detailData.checklist || []).map((it) => (
                          <li key={it.id || it._id} className="flex items-center justify-between bg-white p-3 rounded border">
                            <div>
                              <div className="font-medium text-slate-800">{it.title || it.name}</div>
                              <div className="text-xs text-slate-500">{it.status}</div>
                            </div>
                            <div className="text-xs text-slate-500">{formatDateFull(it.dueDate || it.due_date || it.updatedAt)}</div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>

                {(detailData.activities || []).length > 0 && (
                  <div>
                    <h5 className="font-medium text-slate-900">Recent Activities</h5>
                    <ul className="mt-2 space-y-2 text-sm text-slate-700">
                      {detailData.activities.map((a, idx) => (
                        <li key={idx} className="text-xs text-slate-600">{formatDateFull(a.timestamp || a.createdAt)} — {a.text || a.action || JSON.stringify(a)}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {detailData.files && detailData.files.length > 0 && (
                  <div>
                    <h5 className="font-medium text-slate-900">Files</h5>
                    <ul className="mt-2 space-y-2 text-sm text-slate-700">
                      {detailData.files.map((f) => (
                        <li key={f.id || f.name} className="flex items-center justify-between bg-white p-2 rounded border">
                          <div className="truncate">{f.name || f.filename || 'file'}</div>
                          <a href={f.url || f.path} target="_blank" rel="noreferrer" className="text-xs text-blue-600">Open</a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {detailData.rejection && (
                  <div className="bg-red-50 border border-red-100 p-3 rounded">
                    <div className="text-sm text-red-800 font-medium">Rejection</div>
                    <div className="text-sm text-red-700 mt-1">{detailData.rejection.reason}</div>
                    <div className="text-xs text-red-600 mt-1">Rejected by: {detailData.rejection.rejected_by?.name || detailData.rejection.rejected_by?.name || '—'}</div>
                    <div className="text-xs text-red-600 mt-1">At: {formatDateFull(detailData.rejection.rejected_at || detailData.rejection.rejectedAt)}</div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-sm text-slate-500">No details available.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagerApprovalQueue;