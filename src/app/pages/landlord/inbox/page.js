'use client';

import { useState, useEffect } from 'react';
import { Bell, CheckCircle } from 'lucide-react';
import useAuth from '../../../../../hooks/useSession'; // Import useAuth as a default import

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth(); // Using the user object from auth context

  useEffect(() => {
    if (!user || !user.user_id) {
      setError('User not authenticated');
      setIsLoading(false);
      return;
    }

    // Just send the plain user_id - don't stringify it again
    const userId = encodeURIComponent(user.user_id);
    
    setIsLoading(true);
    fetch(`/api/notification/get-notification?userId=${userId}`)
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Server responded with ${res.status}: ${res.statusText}`);
        }
        return res.json();
      })
      .then((data) => {
        // Ensure data is an array
        const notificationsArray = Array.isArray(data) ? data : [];
        setNotifications(notificationsArray);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching notifications:', err);
        setError('Failed to load notifications: ' + err.message);
        setIsLoading(false);
      });
  }, [user]);

  const markAsRead = async (id) => {
    try {
      const response = await fetch('/api/notification/get-notification', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });

      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }

      setNotifications((prev) => prev.map(n => n.id === id ? { ...n, is_read: 1 } : n));
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white shadow-md rounded-lg">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Notifications</h2>
      </div>
      
      {isLoading && <p className="text-center py-4">Loading notifications...</p>}
      
      {error && <p className="text-center py-4 text-red-500">{error}</p>}
      
      {!isLoading && notifications.length === 0 && !error && (
        <p className="text-center py-4 text-gray-500">No notifications yet</p>
      )}
      
      <div className="space-y-4">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`p-4 border rounded-lg flex items-center justify-between ${notification.is_read ? 'bg-gray-100' : 'bg-blue-50'}`}
          >
            <div className="flex items-center space-x-3">
              <Bell className="w-5 h-5 text-gray-500" />
              <div>
                <p className="text-sm font-bold">{notification.title}</p>
                <p className="text-sm">{notification.body}</p>
                <span className="text-xs text-gray-400">{new Date(notification.created_at).toLocaleString()}</span>
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
    </div>
  );
}