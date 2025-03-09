import { db } from "../../../lib/db";
import { io } from "socket.io-client";

export default async function updateMaintenanceRequestStatusLandlord(req, res) {
  if (req.method !== "PUT") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const { request_id, status, schedule_date, completion_date, landlord_id } = req.body;

    if (!request_id || !status || !landlord_id) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    let query = `UPDATE MaintenanceRequest SET status = ?, updated_at = NOW()`;
    let values = [status];

    if (schedule_date) {
      query += `, schedule_date = ?`;
      values.push(schedule_date);
    }

    if (completion_date) {
      query += `, completion_date = ?`;
      values.push(completion_date);
    }

    query += ` WHERE request_id = ?`;
    values.push(request_id);

    // Update Maintenance Request in Database
    await db.query(query, values);

    // Fetch tenant_id, user_id (tenant's user_id), unit_id, and subject for auto-message
    const [maintenanceRequest] = await db.execute(
        `SELECT mr.tenant_id, t.user_id AS tenant_user_id, mr.subject
         FROM MaintenanceRequest mr
                JOIN Tenant t ON mr.tenant_id = t.tenant_id
         WHERE mr.request_id = ?`,
        [request_id]
    );

    if (!maintenanceRequest.length) {
      return res.status(404).json({ error: "Maintenance request not found" });
    }

    const {tenant_id, subject, tenant_user_id } = maintenanceRequest[0];

    const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:4000", { autoConnect: true });

    const chat_room = `chat_${[tenant_user_id, landlord_id].sort().join("_")}`;

    const autoMessage = {
      sender_id: landlord_id,
      sender_type: "landlord",
      receiver_id: tenant_id,
      receiver_type: "tenant",
      message: `The status of your maintenance request for "${subject}" has been updated to "${status}".`,
      chat_room,
    };

    socket.emit("sendMessage", autoMessage);

    return res.status(200).json({
      success: true,
      message: "Maintenance request updated successfully, tenant notified",
    });
  } catch (error) {
    console.error("Error updating maintenance request:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
