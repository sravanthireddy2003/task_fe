import { Fragment, useState, useEffect } from "react";
import { Popover, Transition } from "@headlessui/react";
import { Bell, Check, Trash2, Clock, AlertCircle } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import {
  selectNotifications,
  selectUnreadCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
} from "../redux/slices/notificationSlice";

const NotificationPanel = () => {
  const dispatch = useDispatch();
  const [isOpen, setIsOpen] = useState(false);

  // Redux selectors
  const notifications = useSelector(selectNotifications);
  const unreadCount = useSelector(selectUnreadCount);

  // ✅ CHANGE: Use cached Redux state from App.jsx login flow
  // No need to fetch when opening notification panel
  // Data is already populated by fetchNotifications in App.jsx on login
  // This prevents unnecessary API calls and enables real-time updates
  // The notifications will update live as they're created across modules

  // Format date relative
  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Handle mark as read
  const handleMarkAsRead = async (notificationId, e) => {
    e.stopPropagation();
    try {
      await dispatch(markNotificationAsRead(notificationId)).unwrap();
      toast.success("Marked as read");
    } catch (err) {
      toast.error(err?.message || "Failed to mark as read");
    }
  };

  // Handle mark all as read
  const handleMarkAllAsRead = async () => {
    if (unreadCount === 0) {
      toast.info("All notifications are already read");
      return;
    }
    try {
      await dispatch(markAllNotificationsAsRead()).unwrap();
      toast.success("All notifications marked as read");
    } catch (err) {
      toast.error(err?.message || "Failed to mark all as read");
    }
  };

  // Handle delete
  const handleDelete = async (notificationId, e) => {
    e.stopPropagation();
    try {
      await dispatch(deleteNotification(notificationId)).unwrap();
      toast.success("Notification deleted");
    } catch (err) {
      toast.error(err?.message || "Failed to delete notification");
    }
  };

  // Get first 5 unread notifications (handle is_read field from API)
  const unreadNotifications = notifications
    .filter((n) => !n.read && !n.isRead && n.is_read !== 1)
    .slice(0, 5);

  return (
    <Popover className="relative">
      <Popover.Button className="inline-flex items-center outline-none">
        <div className="w-8 h-8 flex items-center justify-center text-gray-800 relative hover:text-blue-600 transition-colors">
          <Bell className="w-6 h-6" />
          {unreadCount > 0 && (
            <span className="absolute text-center top-0 right-0 text-xs text-white font-bold w-5 h-5 rounded-full bg-red-600 flex items-center justify-center">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </div>
      </Popover.Button>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-200"
        enterFrom="opacity-0 translate-y-1"
        enterTo="opacity-100 translate-y-0"
        leave="transition ease-in duration-150"
        leaveFrom="opacity-100 translate-y-0"
        leaveTo="opacity-0 translate-y-1"
      >
        <Popover.Panel className="absolute -right-16 md:-right-2 z-10 mt-3 flex w-screen max-w-max px-4">
          {({ close }) => (
            <div className="w-screen max-w-sm flex-auto overflow-hidden rounded-lg bg-white shadow-lg ring-1 ring-gray-900/5">
              {/* Header */}
              <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-blue-50 to-white">
                <div className="flex items-center gap-2">
                  <Bell className="w-5 h-5 text-blue-600" />
                  <h3 className="font-semibold text-gray-900">Notifications</h3>
                </div>
                {unreadCount > 0 && (
                  <span className="text-xs font-semibold bg-red-100 text-red-600 px-2 py-1 rounded-full">
                    {unreadCount} new
                  </span>
                )}
              </div>

              {/* Notifications List */}
              {unreadNotifications.length > 0 ? (
                <div className="divide-y max-h-96 overflow-y-auto">
                  {unreadNotifications.map((notif) => {
                    const isRead = notif.read || notif.isRead || notif.is_read === 1;
                    return (
                      <div
                        key={notif.id || notif._id}
                        className={`p-4 hover:bg-gray-50 transition-colors border-l-4 ${
                          isRead 
                            ? "bg-white border-gray-300" 
                            : "bg-blue-50 border-blue-500"
                        }`}
                      >
                        <div className="flex gap-3">
                          {/* Unread Indicator */}
                          <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 mt-2 ${
                            isRead ? "bg-gray-400" : "bg-blue-600"
                          }`} />

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start gap-2 justify-between">
                              <p className={`text-sm truncate ${
                                isRead ? "text-gray-700 font-medium" : "text-gray-900 font-semibold"
                              }`}>
                                {notif.title || notif.subject || "Notification"}
                              </p>
                              {!isRead && (
                                <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full flex-shrink-0">
                                  New
                                </span>
                              )}
                            </div>
                            
                            <p className="text-gray-600 text-xs mt-1 line-clamp-2">
                              {notif.message || notif.body || notif.text}
                            </p>

                            {/* Type and Date */}
                            <div className="flex items-center gap-2 mt-2 text-xs">
                              {notif.type && (
                                <span className="px-2 py-0.5 bg-gray-200 text-gray-700 rounded text-xs">
                                  {notif.type}
                                </span>
                              )}
                              <div className="flex items-center gap-1 text-gray-500">
                                <Clock className="w-3 h-3" />
                                <span>
                                  {formatDate(notif.createdAt || notif.created_at)}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex gap-2 flex-shrink-0">
                            {!isRead && (
                              <button
                                onClick={(e) =>
                                  handleMarkAsRead(notif.id || notif._id, e)
                                }
                                className="p-1 text-blue-600 hover:bg-blue-100 rounded transition-colors"
                                title="Mark as read"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={(e) =>
                                handleDelete(notif.id || notif._id, e)
                              }
                              className="p-1 text-red-600 hover:bg-red-100 rounded transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-8 text-center">
                  <AlertCircle className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p className="text-gray-500 text-sm">No new notifications</p>
                </div>
              )}

              {/* Footer Actions */}
              <div className="flex items-center gap-2 p-3 bg-gray-50 border-t border-gray-100">
                <Link
                  to="/notifications"
                  onClick={() => close()}
                  className="flex-1 text-center text-sm font-semibold text-blue-600 hover:bg-blue-50 py-2 rounded transition-colors"
                >
                  View All
                </Link>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    className="flex-1 text-sm font-semibold text-blue-600 hover:bg-blue-50 py-2 rounded transition-colors"
                  >
                    Mark All Read
                  </button>
                )}
              </div>
            </div>
          )}
        </Popover.Panel>
      </Transition>
    </Popover>
  );
};

export default NotificationPanel;
