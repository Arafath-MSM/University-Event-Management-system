import React, { useState, useEffect } from 'react';
import { Bell, X } from 'lucide-react';
import apiService from '../services/api';

interface Notification {
  id: number;
  title: string;
  message: string;
  type: 'booking_request' | 'booking_approved' | 'booking_rejected' | 'letter_sent' | 'letter_received' | 'service_provider_notified' | 'final_approval' | 'system';
  status: 'unread' | 'read';
  created_at: string;
}

interface NotificationPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

const NotificationPopup: React.FC<NotificationPopupProps> = ({ isOpen, onClose }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  const fetchNotifications = async () => {
    setIsLoading(true);
    try {
      const response = await apiService.getNotifications({
        limit: 10
      });
      
      if (response.success) {
        setNotifications(response.data || []);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    try {
      if (notification.status === 'unread') {
        await apiService.markNotificationAsRead(notification.id);
        
        // Update local state
        setNotifications(prevNotifications =>
          prevNotifications.map(n =>
            n.id === notification.id ? { ...n, status: 'read' as const } : n
          )
        );
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'booking_approved':
      case 'final_approval':
        return '✅';
      case 'booking_rejected':
        return '❌';
      case 'booking_request':
        return '📋';
      case 'letter_sent':
        return '📤';
      case 'letter_received':
        return '📥';
      default:
        return '🔔';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />
      
      {/* Popup */}
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md mx-4 max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <Bell size={20} className="text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">Notifications</h2>
            {notifications.filter(n => n.status === 'unread').length > 0 && (
              <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1">
                {notifications.filter(n => n.status === 'unread').length}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="max-h-[60vh] overflow-y-auto">
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
              <p className="text-gray-500 mt-2">Loading notifications...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center">
              <Bell size={48} className="text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No notifications found</p>
            </div>
          ) : (
            <div className="p-4 space-y-3">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors hover:shadow-md ${
                    notification.status === 'unread' 
                      ? 'border-blue-300 bg-blue-50' 
                      : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className="text-2xl">{getNotificationIcon(notification.type)}</div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 text-sm">
                        {notification.title}
                      </h3>
                      <p className="text-gray-600 text-xs mt-1">
                        {notification.message}
                      </p>
                      <p className="text-gray-400 text-xs mt-2">
                        {new Date(notification.created_at).toLocaleDateString()} at {new Date(notification.created_at).toLocaleTimeString()}
                      </p>
                    </div>
                    {notification.status === 'unread' && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1"></div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="p-4 border-t border-gray-200 bg-gray-50">
            <button
              onClick={async () => {
                try {
                  await apiService.markAllNotificationsAsRead();
                  setNotifications(prevNotifications =>
                    prevNotifications.map(n => ({ ...n, status: 'read' as const }))
                  );
                } catch (error) {
                  console.error('Error marking all notifications as read:', error);
                }
              }}
              className="w-full text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              Mark all as read
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationPopup; 