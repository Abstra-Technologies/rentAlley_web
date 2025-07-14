import { db } from "../../../lib/db";

export default async function sendMaintenanceNotification(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const { request_id, status } = req.body;

    // Fetch tenant details for notification
    const [maintenanceRequest] = await db.execute(
      `SELECT mr.tenant_id, t.user_id AS tenant_user_id, mr.subject, mr.schedule_date
         FROM MaintenanceRequest mr
         JOIN Tenant t ON mr.tenant_id = t.tenant_id
         WHERE mr.request_id = ?`,
      [request_id]
    );

    if (!maintenanceRequest.length) {
      return res.status(404).json({ error: "Maintenance request not found" });
    }

    const { tenant_user_id, subject, schedule_date } = maintenanceRequest[0];

    // Construct notification message
    let notificationMessage = `Your maintenance request for "${subject}" has been updated to "${status}".`;

    if (schedule_date) {
      notificationMessage += ` The scheduled date is on ${new Date(
        schedule_date
      ).toLocaleDateString()}.`;
    } else if (status === "completed") {
      notificationMessage += ` The request has been marked as completed.`;
    }

    // Insert notification into the database
    await db.execute(
      `INSERT INTO Notification (user_id, title, body, is_read, created_at) 
         VALUES (?, ?, ?, 0, NOW())`,
      [tenant_user_id, "Maintenance Request Update", notificationMessage]
    );

    return res.status(200).json({
      success: true,
      message: "Notification sent successfully.",
    });
  } catch (error) {
    console.error("Error sending notification:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
