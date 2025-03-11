// pages/api/maintenance/notify-landlord.js
import { db } from "../../../lib/db";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const { request_id } = req.body;

    // Fetch maintenance request details including landlord information
    const [maintenanceRequestResult] = await db.execute(
      `SELECT mr.request_id, mr.subject, mr.description, mr.category, mr.schedule_date, 
              t.user_id AS tenant_user_id,  
              p.property_name, u.unit_name, 
              l.user_id AS landlord_user_id
       FROM MaintenanceRequest mr
       JOIN Tenant t ON mr.tenant_id = t.tenant_id
       JOIN Unit u ON mr.unit_id = u.unit_id
       JOIN Property p ON u.property_id = p.property_id
       JOIN Landlord l ON p.landlord_id = l.landlord_id
       WHERE mr.request_id = ?`,
      [request_id]
);


    if (!maintenanceRequestResult.length) {
      return res.status(404).json({ error: "Maintenance request not found" });
    }

    const requestDetails = maintenanceRequestResult[0];
    
    // Construct notification message for landlord
    const notificationTitle = "New Maintenance Request";
    const notificationMessage = `${requestDetails.tenant_first_name} ${requestDetails.tenant_last_name} has submitted a maintenance request for ${requestDetails.property_name} - Unit ${requestDetails.unit_number}: "${requestDetails.subject}" (${requestDetails.category}).`;

    // Insert notification for landlord
    await db.execute(
      `INSERT INTO Notification (user_id, title, body, is_read, created_at)
       VALUES (?, ?, ?, 0, NOW())`,
      [
        requestDetails.landlord_user_id,
        notificationTitle,
        notificationMessage
      ]
    );

    return res.status(200).json({
      success: true,
      message: "Landlord notification sent successfully",
    });
  } catch (error) {
    console.error("Error sending landlord notification:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}