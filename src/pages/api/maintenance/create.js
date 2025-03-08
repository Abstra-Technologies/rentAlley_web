
import { db } from "../../../lib/db";
import { io } from "socket.io-client";

export default async function CreateNewMaintenanceRequest(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }
  const connection = await db.getConnection();
  try {
    const { tenant_id, subject, description, category, user_id } = req.body;

    const tenantQuery = `
      SELECT unit_id, property_id 
      FROM Unit 
      WHERE unit_id IN (
        SELECT unit_id FROM LeaseAgreement WHERE tenant_id = ? AND status = 'active'
      )
    `;
    const [tenantRecord] = await connection.execute(tenantQuery, [tenant_id]);

    if (!tenantRecord.length) {
      return res.status(404).json({ error: "No approved rental found" });
    }

    const { unit_id, property_id } = tenantRecord[0];

    const landlordQuery = `
      SELECT landlord_id FROM Property WHERE property_id = ?
    `;
    const [landlordRecord] = await connection.execute(landlordQuery, [property_id]);

    if (!landlordRecord.length) {
      return res.status(404).json({ error: "Landlord not found for this property" });
    }

    const { landlord_id } = landlordRecord[0];

    const insertQuery = `
      INSERT INTO MaintenanceRequest 
        (tenant_id, unit_id, subject, description, category, status) 
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    const [result] = await connection.execute(insertQuery, [
      tenant_id,
      unit_id,
      subject,
      description,
      category,
      "Pending",
    ]);

    const request_id = result.insertId;

    const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:4000", { autoConnect: true });

    const chat_room = `chat_${[user_id, landlord_id].sort().join("_")}`;

    const autoMessage = {
      sender_id: landlord_id,
      sender_type: "landlord",
      receiver_id: tenant_id,
      receiver_type: "tenant",
      message: `I have received your maintenance request for "${subject}". We will look into it as soon as possible.`,
      chat_room,
    };

    socket.emit("sendMessage", autoMessage);

    return res.status(201).json({
      success: true,
      message: "Maintenance request created successfully",
      request_id,
      landlord_id, // Return landlord_id to the frontend for reference
    });
  } catch (error) {
    console.error("Error creating maintenance request:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}

