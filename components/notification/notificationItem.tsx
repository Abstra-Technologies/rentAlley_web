import React, { useState } from "react";
import { AppNotification } from "../../types/notification";
import { CheckCircle, Trash2, AlertCircle, Clock } from "lucide-react";
import {getNotificationStyles, formatTimeAgo } from "../../utils/notifications";



interface NotificationItemProps {
  notification: AppNotification;
  onMarkRead: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onClick?: (notification: AppNotification) => void;
  compact?: boolean;
}

const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onMarkRead,
  onDelete,
  onClick,
  compact = false,
}) => {
  const [isMarking, setIsMarking] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const styles = getNotificationStyles(notification.type, notification.is_read);

  const handleClick = async () => {
    if (!notification.is_read && !isMarking) {
      setIsMarking(true);
      try {
        await onMarkRead(notification.id);
      } catch (err) {
        console.error("Failed to mark as read:", err);
      } finally {
        setIsMarking(false);
      }
    }
    onClick?.(notification);
  };

  const handleMarkRead = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMarking(true);
    try {
      await onMarkRead(notification.id);
    } catch (err) {
      console.error("Failed to mark as read:", err);
    } finally {
      setIsMarking(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDeleting(true);
    try {
      await onDelete(notification.id);
    } catch (err) {
      console.error("Failed to delete:", err);
      setIsDeleting(false);
    }
  };

  const getIcon = () => {
    switch (notification.type) {
      case "urgent":
        return <AlertCircle className={`w-4 h-4 ${styles.icon}`} />;
      case "success":
        return <CheckCircle className={`w-4 h-4 ${styles.icon}`} />;
      case "info":
        return <Clock className={`w-4 h-4 ${styles.icon}`} />;
      default:
        return <Clock className={`w-4 h-4 ${styles.icon}`} />;
    }
  };

  return (
    <div
      className={`relative group hover:bg-gray-50 cursor-pointer transition-all duration-200 border-l-4 ${
        styles.border
      } ${styles.bg} ${compact ? "py-2 px-3" : "py-3 px-4"} ${
        isDeleting ? "opacity-50 pointer-events-none" : ""
      }`}
      onClick={handleClick}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {getIcon()}
            {!notification.is_read && (
              <div className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-500 to-emerald-500 flex-shrink-0" />
            )}
            <p
              className={`text-sm text-gray-900 truncate flex-1 ${
                !notification.is_read ? "font-semibold" : "font-medium"
              }`}
            >
              {notification.title}
            </p>
          </div>

          <p
            className={`text-xs text-gray-600 ${
              compact ? "line-clamp-1" : "line-clamp-2"
            } ml-6`}
          >
            {notification.body}
          </p>

          <div className="flex items-center justify-between mt-2 ml-6">
            <p className="text-xs text-gray-400">
              {formatTimeAgo(
                notification.created_at || notification.timestamp || ""
              )}
            </p>

            {notification.type && (
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-medium ${styles.badge}`}
              >
                {notification.type}
              </span>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          {!notification.is_read && (
            <button
              onClick={handleMarkRead}
              disabled={isMarking}
              className="p-1.5 hover:bg-blue-100 rounded-full transition-colors duration-200 disabled:opacity-50"
              title="Mark as read"
            >
              <CheckCircle className="w-3.5 h-3.5 text-blue-600" />
            </button>
          )}

          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="p-1.5 hover:bg-red-100 rounded-full transition-colors duration-200 disabled:opacity-50"
            title="Delete notification"
          >
            <Trash2 className="w-3.5 h-3.5 text-red-600" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationItem;
