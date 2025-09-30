export interface AppNotification {
  id: string;
  title: string;
  body: string;
  type: "urgent" | "success" | "info" | string;
  is_read: boolean;
  created_at?: string;
  timestamp?: string;
}