"use client";

import { useState, useEffect } from "react";
import useAuth from "../../../../../hooks/useSession";
import { Bell, CheckCircle, AlertCircle, Clock } from "lucide-react";
import NotificationList from "../../../../components/notification/NotificationList";
import LandlordLayout from "../../../../components/navigation/sidebar-landlord";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    if (!user || !user.user_id) {
      setError("User not authenticated");
      setIsLoading(false);
      return;
    }

    const userId = encodeURIComponent(user.user_id);

    setIsLoading(true);
    fetch(`/api/notification/get-notification?userId=${userId}`)
      .then((res) => {
        if (!res.ok) {
          throw new Error(
            `Server responded with ${res.status}: ${res.statusText}`
          );
        }
        return res.json();
      })
      .then((data) => {
        const notificationsArray = Array.isArray(data) ? data : [];
        setNotifications(notificationsArray);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching notifications:", err);
        setError("Failed to load notifications: " + err.message);
        setIsLoading(false);
      });
  }, [user]);

  const markAsRead = async (id) => {
    try {
      const response = await fetch("/api/notification/get-notification", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }

      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: 1 } : n))
      );
    } catch (err) {
      console.error("Error marking notification as read:", err);
    }
  };

  return (
    <LandlordLayout>
      <div className="max-w-2xl mx-auto p-6 bg-white shadow-lg rounded-xl border border-gray-100">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-800">Notifications</h2>
          {notifications?.length > 0 && (
            <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-1 rounded-full">
              {notifications.filter(n => !n.is_read).length} unread
            </span>
          )}
        </div>
        
        {isLoading && (
          <div className="flex justify-center items-center py-8">
            <div className="animate-pulse flex space-x-2">
              <div className="h-2 w-2 bg-blue-400 rounded-full"></div>
              <div className="h-2 w-2 bg-blue-400 rounded-full"></div>
              <div className="h-2 w-2 bg-blue-400 rounded-full"></div>
            </div>
          </div>
        )}
        
        {!isLoading && !error && notifications?.length > 0 && (
          <NotificationList
            notifications={notifications}
            markAsRead={markAsRead}
          />
        )}
        
        {!isLoading && !error && notifications?.length === 0 && (
          <div className="text-center py-10 px-6 border border-dashed border-gray-200 rounded-lg bg-gray-50">
            <Bell className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No notifications yet</p>
          </div>
        )}
        
        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-md">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <AlertCircle className="h-5 w-5 text-red-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </LandlordLayout>
  );
}
