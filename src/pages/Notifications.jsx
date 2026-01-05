import { useState, useEffect } from 'react';
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  AlertCircle,
  RefreshCw,
  Filter,
  Clock,
} from 'lucide-react';
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
} from '../redux/slices/notificationSlice';

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

  // ✅ CHANGE: Use cached Redux state from App.jsx login flow
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
    <div className="p-8">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-2">
            <Bell className="w-6 h-6 text-blue-600" />
            Notifications
          </h1>
          <p className="text-gray-600">
            {unreadCount > 0
              ? `You have ${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}`
              : 'All notifications read'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Refresh Button */}
          <button
            onClick={handleRefresh}
            disabled={isLoading || isLoadingStatus}
            className={`p-2 rounded-lg border ${
              isLoading || isLoadingStatus
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-white text-blue-600 hover:bg-blue-50 border-blue-200'
            }`}
            title="Refresh notifications"
          >
            <RefreshCw
              className={`w-5 h-5 ${isLoading || isLoadingStatus ? 'animate-spin' : ''}`}
            />
          </button>

          {/* Mark All as Read Button */}
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              disabled={isLoading || isLoadingStatus}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              <CheckCheck className="w-4 h-4" />
              Mark All as Read
            </button>
          )}
        </div>
      </div>

      {/* Loading Indicator */}
      {isLoadingStatus && (
        <div className="flex items-center justify-center p-4 mb-6 bg-blue-50 rounded-lg">
          <RefreshCw className="w-5 h-5 mr-2 animate-spin text-blue-600" />
          <span className="text-blue-600 font-medium">Loading notifications...</span>
        </div>
      )}

      {/* FILTERS */}
      <div className="bg-white rounded-xl border p-4 mb-6 flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-gray-600" />
          <span className="text-gray-700 font-medium">Filter:</span>
        </div>

        <button
          onClick={() => setFilterType('all')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filterType === 'all'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          All ({notifications.length})
        </button>

        <button
          onClick={() => setFilterType('unread')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filterType === 'unread'
              ? 'bg-yellow-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Unread ({unreadCount})
        </button>

        <button
          onClick={() => setFilterType('read')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filterType === 'read'
              ? 'bg-green-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Read ({notifications.filter((n) => n.read || n.isRead).length})
        </button>
      </div>

      {/* NO NOTIFICATIONS STATE */}
      {!isLoadingStatus && notifications.length === 0 && (
        <div className="bg-white rounded-xl border p-12 text-center">
          <Bell className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            No Notifications
          </h3>
          <p className="text-gray-600">You're all caught up!</p>
        </div>
      )}

      {/* NO RESULTS STATE */}
      {!isLoadingStatus && notifications.length > 0 && filteredNotifications.length === 0 && (
        <div className="bg-white rounded-xl border p-12 text-center">
          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            No {filterType} Notifications
          </h3>
          <p className="text-gray-600">
            {filterType === 'unread'
              ? "You don't have any unread notifications"
              : "You don't have any read notifications"}
          </p>
        </div>
      )}

      {/* NOTIFICATIONS LIST */}
      {!isLoadingStatus && filteredNotifications.length > 0 && (
        <div className="space-y-3">
          {filteredNotifications.map((notif) => {
            const isRead = notif.read || notif.isRead || notif.is_read === 1;
            return (
              <div
                key={notif.id || notif._id}
                className={`border rounded-xl p-4 transition-all ${
                  isRead
                    ? 'bg-gray-50 border-gray-200'
                    : 'bg-blue-50 border-blue-200 shadow-sm'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    {/* Notification Header */}
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-3 h-3 rounded-full mt-1.5 flex-shrink-0 ${
                          isRead ? 'bg-gray-400' : 'bg-blue-600'
                        }`}
                      />
                      <div className="flex-1 min-w-0">
                        <h3
                          className={`font-semibold text-gray-900 ${
                            isRead ? '' : 'font-bold'
                          }`}
                        >
                          {notif.title || notif.subject || 'Notification'}
                        </h3>
                        {notif.message && (
                          <p className="text-gray-700 text-sm mt-1 line-clamp-2">
                            {notif.message || notif.body}
                          </p>
                        )}

                        {/* Notification Details */}
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                          {notif.type && (
                            <span className="px-2 py-1 rounded-full bg-gray-200 text-gray-700">
                              {notif.type}
                            </span>
                          )}
                          {notif.priority && (
                            <span
                              className={`px-2 py-1 rounded-full ${
                                notif.priority === 'high'
                                  ? 'bg-red-100 text-red-700'
                                  : notif.priority === 'medium'
                                  ? 'bg-yellow-100 text-yellow-700'
                                  : 'bg-green-100 text-green-700'
                              }`}
                            >
                              {notif.priority.toUpperCase()}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDate(notif.createdAt || notif.created_at)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {!isRead && (
                      <button
                        onClick={() => handleMarkAsRead(notif.id || notif._id)}
                        className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                        title="Mark as read"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(notif.id || notif._id)}
                      className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                      title="Delete notification"
                    >
                      <Trash2 className="w-4 h-4" />
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
