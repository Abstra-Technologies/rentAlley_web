"use client";

import { useState, useEffect } from "react";
import useAuth from "../../../../hooks/useSession";
import NotificationList from "../../../../components/notification/NotificationList";

export default function TenantNotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    const userId = user ? encodeURIComponent(user.user_id) : null;
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
        setNotifications(Array.isArray(data) ? data : []);
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
    <div className="max-w-2xl mx-auto p-6 bg-white shadow-md rounded-lg">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Notifications</h2>
      </div>

      {isLoading && (
        <p className="text-center py-4">Loading notifications...</p>
      )}
      {error && <p className="text-center py-4 text-red-500">{error}</p>}
      {!isLoading && !error && (
        <NotificationList
          notifications={notifications}
          markAsRead={markAsRead}
        />
      )}
    </div>
  );
}
