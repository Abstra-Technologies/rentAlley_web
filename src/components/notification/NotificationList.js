import { Bell, CheckCircle } from "lucide-react";

export default function NotificationList({ notifications, markAsRead }) {
  if (notifications.length === 0) {
    return (
      <p className="text-center py-4 text-gray-500">No notifications yet</p>
    );
  }

  return (
    <div className="space-y-4">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`p-4 border rounded-lg flex items-center justify-between ${
            notification.is_read ? "bg-gray-100" : "bg-blue-50"
          }`}
        >
          <div className="flex items-center space-x-3">
            <Bell className="w-5 h-5 text-gray-500" />
            <div>
              <p className="text-sm font-bold">{notification.title}</p>
              <p className="text-sm">{notification.body}</p>
              <span className="text-xs text-gray-400">
                {new Date(notification.created_at).toLocaleString()}
              </span>
            </div>
          </div>
          {!notification.is_read && (
            <button onClick={() => markAsRead(notification.id)}>
              <CheckCircle className="w-5 h-5 text-green-500" />
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
