import { AppNotification } from "../types/notification";

class NotificationService {
  private baseUrl = "/api/notification";

  // GET /api/notification/getNotifications?userId=123
  async getNotifications(userId: string): Promise<AppNotification[]> {
    const response = await fetch(
      `${this.baseUrl}/getNotifications?userId=${encodeURIComponent(userId)}`
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch notifications: ${response.status}`);
    }

    const data = await response.json();
    return Array.isArray(data) ? (data as AppNotification[]) : [];
  }

  // PATCH /api/notification/markSingleRead
  async markAsRead(notificationId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/markSingleRead`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: notificationId }),
    });

    if (!response.ok) {
      throw new Error(`Failed to mark as read: ${response.status}`);
    }
  }

  // PATCH /api/notification/markAllAsRead
  async markAllAsRead(notificationIds: string[]): Promise<void> {
    const response = await fetch(`${this.baseUrl}/markAllAsRead`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: notificationIds }),
    });

    if (!response.ok) {
      throw new Error(`Failed to mark all as read: ${response.status}`);
    }
  }

  // DELETE /api/notification/delete/[id]
  async deleteNotification(notificationId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/delete/${notificationId}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      throw new Error(`Failed to delete notification: ${response.status}`);
    }
  }
}

export const notificationService = new NotificationService();
