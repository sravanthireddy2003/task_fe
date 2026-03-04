import { useState, useEffect } from 'react';
import * as Icons from '../icons';

const { Bell, Check, CheckCheck, Trash2, AlertCircle, RefreshCw, Filter, Clock } = Icons;
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'sonner';

import {
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  selectNotifications,
  selectNotificationStatus,
  selectNotificationError,
  selectUnreadCount,
  fetchNotifications,
} from '../redux/slices/notificationSlice';
import PageHeader from '../components/PageHeader';

export default function Notifications() {
  const dispatch = useDispatch();

  // Redux state
  const notifications = useSelector(selectNotifications);
  const status = useSelector(selectNotificationStatus);
  const error = useSelector(selectNotificationError);
  const unreadCount = useSelector(selectUnreadCount);

  // Local state
  const [filterType, setFilterType] = useState('all'); // all, unread, read
  const [isLoading, setIsLoading] = useState(false);

  const isLoadingStatus = status === 'loading';

  // âœ… CHANGE: Use cached Redux state from App.jsx login flow
  // No need to fetch again when opening notifications page
  // Data is already populated by fetchNotifications in App.jsx on login
  // This prevents unnecessary API calls and enables real-time updates
  // The notifications will update live as they're created across modules

  // Show error toast
  useEffect(() => {
    if (error) {
      toast.error(error?.message || String(error));
    }
  }, [error]);

  // Handle mark as read
  const handleMarkAsRead = async (notificationId) => {
    try {
      await dispatch(markNotificationAsRead(notificationId)).unwrap();
      toast.success('Marked as read');
    } catch (err) {
      toast.error(err?.message || 'Failed to mark as read');
    }
  };

  // Handle mark all as read
  const handleMarkAllAsRead = async () => {
    if (unreadCount === 0) {
      toast.info('All notifications are already read');
      return;
    }

    try {
      setIsLoading(true);
      await dispatch(markAllNotificationsAsRead()).unwrap();
      toast.success('All notifications marked as read');
    } catch (err) {
      toast.error(err?.message || 'Failed to mark all as read');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle delete
  const handleDelete = async (notificationId) => {
    if (!window.confirm('Are you sure you want to delete this notification?'))
      return;

    try {
      await dispatch(deleteNotification(notificationId)).unwrap();
      toast.success('Notification deleted');
    } catch (err) {
      toast.error(err?.message || 'Failed to delete notification');
    }
  };

  // Handle refresh
  const handleRefresh = async () => {
    try {
      setIsLoading(true);
      await dispatch(fetchNotifications()).unwrap();
      toast.success('Notifications refreshed');
    } catch (err) {
      toast.error(err?.message || 'Failed to refresh notifications');
    } finally {
      setIsLoading(false);
    }
  };

  // Filter notifications (handle is_read field from API)
  const filteredNotifications = notifications.filter((notif) => {
    const isRead = notif.read || notif.isRead || notif.is_read === 1;
    if (filterType === 'unread') return !isRead;
    if (filterType === 'read') return isRead;
    return true; // all
  });

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6">
      {/* Enhanced Header */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm relative overflow-hidden">
        {/* Decorative background blur */}
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-indigo-50 rounded-full blur-3xl opacity-50 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-40 h-40 bg-blue-50 rounded-full blur-3xl opacity-50 pointer-events-none"></div>

        <PageHeader
          title={
            <span className="inline-flex items-center gap-3">
              <div className="p-2.5 bg-gradient-to-tr from-indigo-500 to-blue-500 rounded-xl shadow-inner shadow-blue-400/20 text-white">
                <Bell className="w-5 h-5 md:w-6 md:h-6" />
              </div>
              <span className="text-page-title text-gray-900 tracking-tight">
                Notifications
              </span>
            </span>
          }
          subtitle={
            <span className="text-gray-500 text-small-text font-medium">
              {unreadCount > 0
                ? `You have ${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}`
                : 'All notifications read'}
            </span>
          }
          onRefresh={handleRefresh}
          refreshing={isLoading || isLoadingStatus}
        >
          <div className="flex items-center gap-3 relative z-10">
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                disabled={isLoading || isLoadingStatus}
                className="btn btn-primary group flex items-center gap-2 transition-all duration-300 transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <CheckCheck className="w-4 h-4 group-hover:scale-110 transition-transform" />
                <span>Mark All as Read</span>
              </button>
            )}
          </div>
        </PageHeader>
      </div>

      {/* Loading Indicator */}
      {isLoadingStatus && (
        <div className="flex items-center justify-center p-6 bg-white rounded-2xl border border-gray-200 shadow-sm animate-pulse">
          <RefreshCw className="w-6 h-6 mr-3 animate-spin text-indigo-600" />
          <span className="text-gray-700 font-semibold tracking-wide">Fetching incoming notes...</span>
        </div>
      )}

      {/* FILTERS */}
      <div className="bg-white rounded-2xl border border-gray-200 p-2 shadow-sm flex items-center gap-2 overflow-x-auto hide-scrollbar sticky top-4 z-20">
        <div className="flex items-center gap-2 pl-3 pr-2 border-r border-gray-200 hide-on-mobile">
          <Filter className="w-4 h-4 text-gray-400" />
          <span className="text-gray-500 text-sm font-semibold uppercase tracking-wider">Filter</span>
        </div>

        <button
          onClick={() => setFilterType('all')}
          className={`flex-shrink-0 px-5 py-2 rounded-xl text-sm font-semibold transition-all duration-300 ${filterType === 'all'
            ? 'bg-gray-900 text-white shadow-md shadow-gray-900/20 scale-100'
            : 'bg-transparent text-gray-600 hover:bg-gray-100 scale-95 hover:scale-100'
            }`}
        >
          All <span className={`ml-1.5 px-2 py-0.5 rounded-full text-xs ${filterType === 'all' ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-700'}`}>{notifications.length}</span>
        </button>

        <button
          onClick={() => setFilterType('unread')}
          className={`flex-shrink-0 px-5 py-2 rounded-xl text-sm font-semibold transition-all duration-300 ${filterType === 'unread'
            ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20 scale-100'
            : 'bg-transparent text-gray-600 hover:bg-amber-50 hover:text-amber-700 scale-95 hover:scale-100'
            }`}
        >
          Unread <span className={`ml-1.5 px-2 py-0.5 rounded-full text-xs ${filterType === 'unread' ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-700'}`}>{unreadCount}</span>
        </button>

        <button
          onClick={() => setFilterType('read')}
          className={`flex-shrink-0 px-5 py-2 rounded-xl text-sm font-semibold transition-all duration-300 ${filterType === 'read'
            ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20 scale-100'
            : 'bg-transparent text-gray-600 hover:bg-emerald-50 hover:text-emerald-700 scale-95 hover:scale-100'
            }`}
        >
          Read <span className={`ml-1.5 px-2 py-0.5 rounded-full text-xs ${filterType === 'read' ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-700'}`}>{notifications.filter((n) => n.read || n.isRead).length}</span>
        </button>
      </div>

      {/* NO NOTIFICATIONS STATE */}
      {!isLoadingStatus && notifications.length === 0 && (
        <div className="bg-white rounded-3xl border border-gray-200 p-16 text-center shadow-sm relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-gray-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="w-24 h-24 mx-auto mb-6 bg-gray-50 rounded-full flex items-center justify-center border-4 border-white shadow-inner relative">
            <div className="absolute inset-0 bg-indigo-500 rounded-full blur-xl opacity-20 animate-pulse"></div>
            <Bell className="w-10 h-10 text-gray-300 relative z-10 block" />
            <div className="absolute top-0 right-0 w-3 h-3 bg-indigo-400 rounded-full border-2 border-white shadow-sm mt-3 mr-3"></div>
          </div>
          <h3 className="text-section-title text-gray-900 mb-2 relative z-10">
            No Notifications Here
          </h3>
          <p className="text-gray-500 max-w-sm mx-auto text-small-text font-medium relative z-10">We'll let you know when there's something new to check out!</p>
        </div>
      )}

      {/* NO RESULTS STATE */}
      {!isLoadingStatus && notifications.length > 0 && filteredNotifications.length === 0 && (
        <div className="bg-white rounded-3xl border border-gray-200 p-16 text-center shadow-sm">
          <div className="w-20 h-20 mx-auto mb-6 bg-slate-50 rounded-full flex items-center justify-center border-2 border-slate-100 shadow-sm">
            <Filter className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-section-title text-slate-800 mb-2">
            No {filterType} Notifications
          </h3>
          <p className="text-slate-500 text-small-text font-medium">
            {filterType === 'unread'
              ? "You've read everything! Time to relax."
              : "Looks like nothing here matches your filter."}
          </p>
        </div>
      )}

      {/* NOTIFICATIONS LIST */}
      {!isLoadingStatus && filteredNotifications.length > 0 && (
        <div className="space-y-4">
          {filteredNotifications.map((notif) => {
            const isRead = notif.read || notif.isRead || notif.is_read === 1;
            return (
              <div
                key={notif.id || notif._id}
                className={`group relative rounded-2xl p-5 md:p-6 transition-all duration-300 ease-[cubic-bezier(0.25,0.8,0.25,1)] hover:-translate-y-1 ${isRead
                  ? 'bg-white border border-gray-200 hover:shadow-md hover:shadow-gray-200/40'
                  : 'bg-gradient-to-br from-white to-indigo-50/50 border border-indigo-100 shadow-md shadow-indigo-100/50 hover:shadow-xl hover:shadow-indigo-200/40'
                  }`}
              >
                {!isRead && (
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-indigo-500 to-blue-500 rounded-l-2xl"></div>
                )}
                <div className="flex items-start justify-between gap-4 md:gap-6">
                  <div className="flex-1 min-w-0">
                    {/* Notification Header */}
                    <div className="flex items-start gap-4">
                      {/* Icon Container */}
                      <div className={`flex-shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm ${isRead ? 'bg-gray-50 border border-gray-100' : 'bg-white border border-indigo-100'
                        }`}>
                        {notif.type === 'alert' ? <AlertCircle className={`w-6 h-6 ${isRead ? 'text-gray-400' : 'text-amber-500'}`} /> :
                          notif.type === 'message' ? <Icons.MessageCircle className={`w-6 h-6 ${isRead ? 'text-gray-400' : 'text-blue-500'}`} /> :
                            <Bell className={`w-6 h-6 ${isRead ? 'text-gray-400' : 'text-indigo-500'}`} />}
                      </div>

                      <div className="flex-1 min-w-0 pt-0.5">
                        <div className="flex items-center gap-2 mb-1">
                          <h3
                            className={`text-base md:text-lg tracking-tight truncate ${isRead ? 'font-medium text-gray-700' : 'font-bold text-gray-900'
                              }`}
                          >
                            {notif.title || notif.subject || 'New Update'}
                          </h3>
                          {!isRead && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-indigo-100 text-indigo-700 shadow-sm border border-indigo-200">
                              NEW
                            </span>
                          )}
                        </div>

                        {notif.message && (
                          <p className={`text-sm mt-1 mb-3 leading-relaxed ${isRead ? 'text-gray-500' : 'text-gray-600 font-medium'}`}>
                            {notif.message || notif.body}
                          </p>
                        )}

                        {/* Notification Details Pill Row */}
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          {notif.type && (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200 uppercase tracking-wider">
                              {notif.type}
                            </span>
                          )}
                          {notif.priority && (
                            <span
                              className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold border uppercase tracking-wider ${notif.priority === 'high'
                                ? 'bg-rose-50 text-rose-600 border-rose-200'
                                : notif.priority === 'medium'
                                  ? 'bg-amber-50 text-amber-600 border-amber-200'
                                  : 'bg-emerald-50 text-emerald-600 border-emerald-200'
                                }`}
                            >
                              <div className={`w-1.5 h-1.5 rounded-full mr-1.5 ${notif.priority === 'high' ? 'bg-rose-500 animate-pulse' :
                                notif.priority === 'medium' ? 'bg-amber-500' : 'bg-emerald-500'
                                }`}></div>
                              {notif.priority}
                            </span>
                          )}
                          <span className="inline-flex items-center text-xs font-medium text-gray-500 ml-auto md:ml-2">
                            <Clock className="w-3.5 h-3.5 mr-1 text-gray-400" />
                            {formatDate(notif.createdAt || notif.created_at)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions - Visible on hover or always on mobile */}
                  <div className="flex flex-col md:flex-row items-center gap-2 flex-shrink-0 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200">
                    {!isRead ? (
                      <button
                        onClick={() => handleMarkAsRead(notif.id || notif._id)}
                        className="p-2.5 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors ring-1 ring-inset ring-indigo-500/10 shadow-sm"
                        title="Mark as read"
                      >
                        <Check className="w-5 h-5" />
                      </button>
                    ) : (
                      <div className="p-2.5 text-emerald-500 bg-emerald-50 rounded-xl ring-1 ring-inset ring-emerald-500/10 shadow-sm cursor-default" title="Read">
                        <CheckCheck className="w-5 h-5" />
                      </div>
                    )}
                    <button
                      onClick={() => handleDelete(notif.id || notif._id)}
                      className="p-2.5 text-rose-500 bg-rose-50 hover:bg-rose-100 rounded-xl transition-colors ring-1 ring-inset ring-rose-500/10 shadow-sm"
                      title="Delete notification"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

