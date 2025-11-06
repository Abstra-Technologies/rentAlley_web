import { useState, useEffect, useCallback, useRef } from "react";
import { notificationService } from "../utils/notificationService";
import type { Notification } from "../utils/notifications";

export const useNotifications = (userId: string | undefined) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastFetchRef = useRef(0);
  const isMountedRef = useRef(true);

  const fetchNotifications = useCallback(
    async (showLoading = true) => {
      if (!userId) return;

      // Prevent too frequent calls
      const now = Date.now();
      if (now - lastFetchRef.current < 5000) return;
      lastFetchRef.current = now;

      if (showLoading) setLoading(true);
      setError(null);

      try {
        const data = await notificationService.getNotifications(userId);

        if (!isMountedRef.current) return;

        // Sort by date (newest first)
        const sortedNotifications = data.sort(
          (a, b) =>
            new Date(b.created_at || b.timestamp || 0).getTime() -
            new Date(a.created_at || a.timestamp || 0).getTime()
        );

        setNotifications(sortedNotifications);
        setUnreadCount(sortedNotifications.filter((n) => !n.is_read).length);
      } catch (err) {
        if (!isMountedRef.current) return;
        console.error("Error fetching notifications:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load notifications"
        );
      } finally {
        if (isMountedRef.current) {
          setLoading(false);
        }
      }
    },
    [userId]
  );

  useEffect(() => {
    isMountedRef.current = true;
    fetchNotifications();

    // Set up periodic refresh (every 30 seconds)
    intervalRef.current = setInterval(() => {
      fetchNotifications(false);
    }, 30000);

    return () => {
      isMountedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [fetchNotifications]);

  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      await notificationService.markAsRead(notificationId);

      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Error marking notification as read:", err);
      throw err;
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    const unreadNotifications = notifications.filter((n) => !n.is_read);
    if (unreadNotifications.length === 0) return;

    try {
      await notificationService.markAllAsRead(
        unreadNotifications.map((n) => n.id)
      );

      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error("Error marking all notifications as read:", err);
      throw err;
    }
  }, [notifications]);

  const deleteNotification = useCallback(
    async (notificationId: string) => {
      try {
        await notificationService.deleteNotification(notificationId);

        const deletedNotification = notifications.find(
          (n) => n.id === notificationId
        );

        setNotifications((prev) => prev.filter((n) => n.id !== notificationId));

        if (deletedNotification && !deletedNotification.is_read) {
          setUnreadCount((prev) => Math.max(0, prev - 1));
        }
      } catch (err) {
        console.error("Error deleting notification:", err);
        throw err;
      }
    },
    [notifications]
  );

  return {
    notifications,
    unreadCount,
    loading,
    error,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  };
};
