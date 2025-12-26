import React, { useEffect, useState } from 'react';
import { AppNotification } from '../types';
import { X, Bell } from 'lucide-react';

interface NotificationSystemProps {
  notifications: AppNotification[];
  currentUserId: string;
  onDismiss: (id: string) => void;
}

export const NotificationSystem: React.FC<NotificationSystemProps> = ({ notifications, currentUserId, onDismiss }) => {
  const [visibleNotifications, setVisibleNotifications] = useState<AppNotification[]>([]);

  useEffect(() => {
    // Filter notifications for the current user that are recent (mocking push receipt)
    const myNotifications = notifications.filter(n => n.toUserId === currentUserId);
    setVisibleNotifications(myNotifications);
  }, [notifications, currentUserId]);

  if (visibleNotifications.length === 0) return null;

  return (
    <div className="absolute top-0 left-0 right-0 z-[1000] p-4 flex flex-col items-center pointer-events-none">
      {visibleNotifications.map((notif) => (
        <div 
          key={notif.id}
          className="pointer-events-auto w-full max-w-sm bg-white/95 backdrop-blur-sm border border-slate-200 shadow-xl rounded-2xl p-4 mb-2 animate-in fade-in slide-in-from-top-4 duration-300 flex items-start gap-3"
        >
          <div className={`p-2 rounded-full ${notif.type === 'success' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}`}>
            <Bell size={20} />
          </div>
          <div className="flex-1">
            <h4 className="font-bold text-sm text-slate-800">{notif.title}</h4>
            <p className="text-sm text-slate-500 leading-tight mt-1">{notif.message}</p>
            <p className="text-[10px] text-slate-400 mt-2">Ahora</p>
          </div>
          <button 
            onClick={() => onDismiss(notif.id)}
            className="text-slate-400 hover:text-slate-600 p-1"
          >
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  );
};