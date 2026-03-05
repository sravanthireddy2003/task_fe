import React from 'react';
import { useSelector } from 'react-redux';

const NotificationBell = ({ onClick }) => {
  const notifications = useSelector((s) => (s.notifications && s.notifications.items) || []);
  const unread = notifications.filter(n => !n.read).length;

  return (
    <button onClick={onClick} className="relative p-2 rounded-lg hover:bg-slate-100">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0 1 18 14.158V11a6 6 0 1 0-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5"/></svg>
      {unread > 0 && <span className="absolute -top-1 -right-1 text-xs bg-red-500 text-white rounded-full h-5 w-5 flex items-center justify-center">{unread}</span>}
    </button>
  );
};

export default NotificationBell;
