import React, { useEffect, useRef } from 'react';
import { Bell, Check, CheckCheck, Clock, AlertCircle } from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';

const NotificationDropdown = ({ onClose }) => {
  const { notifications, loading, markAsRead, markAllAsRead } = useNotifications();
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const handleNotificationClick = async (notification) => {
    if (!notification.isRead) {
      await markAsRead(notification._id);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'text-error bg-secondary-container';
      case 'high': return 'text-primary bg-primary-container';
      case 'medium': return 'text-tertiary bg-primary-container';
      case 'low': return 'text-onSurfaceVariant bg-surfaceVariant';
      default: return 'text-onSurfaceVariant bg-surfaceVariant';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'idea_submitted':
      case 'idea_status_updated':
      case 'idea_reviewed':
        return <Bell className="h-4 w-4" />;
      case 'credit_points_updated':
        return <CheckCheck className="h-4 w-4" />;
      case 'new_reviewer_added':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const formatTimeAgo = (date) => {
    const now = new Date();
    const created = new Date(date);
    const diffInMinutes = Math.floor((now - created) / 60000);
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  return (
    <div 
      ref={dropdownRef}
      className="absolute right-0 mt-2 w-96 bg-background rounded-lg shadow-xl border border-background z-50 max-h-96 overflow-hidden"
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-background bg-background">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-onPrimary">Notifications</h3>
          {notifications.length > 0 && (
            <button
              onClick={markAllAsRead}
              className="text-xs text-primary font-medium"
            >
              Mark all read
            </button>
          )}
        </div>
      </div>

      {/* Notifications List */}
      <div className="max-h-80 overflow-y-auto">
        {loading ? (
          <div className="p-4 text-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
            <p className="text-sm text-onPrimary mt-2">Loading notifications...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-6 text-center">
            <Bell className="h-8 w-8 text-onPrimary mx-auto mb-2" />
            <p className="text-sm text-onPrimary">No notifications yet</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {notifications.slice(0, 10).map((notification) => (
              <div
                key={notification._id}
                onClick={() => handleNotificationClick(notification)}
                className={`p-4 hover:bg-primary cursor-pointer transition-colors bg-background text-onPrimary ${!notification.isRead ? 'border-l-4 border-primary' : ''}`}
              >
                <div className="flex items-start space-x-3">
                  <div className={`p-2 rounded-full ${getPriorityColor(notification.priority)}`}>
                    {getTypeIcon(notification.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className={`text-sm font-medium ${
                        !notification.isRead ? 'text-onPrimary' : 'text-onPrimary'
                      }`}>
                        {notification.title}
                      </p>
                      <div className="flex items-center space-x-1">
                        <Clock className="h-3 w-3 text-primary" />
                        <span className="text-xs text-primary">
                          {formatTimeAgo(notification.createdAt)}
                        </span>
                      </div>
                    </div>
                    
                    <p className="text-sm text-onPrimary mt-1 line-clamp-2">
                      {notification.message}
                    </p>
                    
                    <div className="flex items-center justify-between mt-2">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium capitalize ${
                        getPriorityColor(notification.priority)
                      }`}>
                        {notification.priority}
                      </span>
                      
                      {!notification.isRead && (
                        <div className="w-2 h-2 bg-primary rounded-full"></div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {notifications.length > 10 && (
        <div className="px-4 py-3 border-t border-background bg-background">
          <button
            onClick={onClose}
            className="text-sm text-primary font-medium"
          >
            View all notifications
          </button>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;