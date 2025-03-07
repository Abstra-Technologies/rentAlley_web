import { db } from "../../../lib/db";
import { Server } from "socket.io";

export default async function CreateNewMaintenanceRequest(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const { tenant_id, subject, description, category } = req.body;

    console.log("Request Data:", req.body);

    const [tenantRecord] = await db.query(
      "SELECT unit_id FROM ProspectiveTenant WHERE tenant_id = ? AND status = 'approved'",
      [tenant_id]
    );

    if (!tenantRecord.length) {
      return res.status(404).json({ error: "No approved rental found" });
    }

    const { unit_id } = tenantRecord[0];

    const [result] = await db.query(
      `INSERT INTO MaintenanceRequest
            (tenant_id, unit_id, subject, description, category, status)
            VALUES (?, ?, ?, ?, ?, ?)`,
      [tenant_id, unit_id, subject, description, category, "Pending"]
    );

    return res.status(201).json({
      success: true,
      message: "Maintenance request created successfully",
      request_id: result.insertId,
    });
  } catch (error) {
    console.error("Error creating maintenance request:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}

// export default async function handler(req, res) {
//   if (req.method !== "POST") {
//     return res.status(405).json({ error: "Method Not Allowed" });
//   }
//
//   try {
//     const { tenant_id, subject, description, category } = req.body;
//
//     console.log("Request Data:", req.body);
//
//     // ✅ Validate if the unit exists
//     const [unitRecord] = await db.query(
//         "SELECT property_id FROM Unit WHERE unit_id = ?",
//         [unit_id]
//     );
//
//     if (!unitRecord.length) {
//       return res.status(404).json({ error: "Unit not found." });
//     }
//
//     const { property_id } = unitRecord[0];
//
//     // ✅ Fetch landlord_id from Property table
//     const [propertyRecord] = await db.query(
//         "SELECT landlord_id FROM Property WHERE property_id = ?",
//         [property_id]
//     );
//
//     if (!propertyRecord.length) {
//       return res.status(404).json({ error: "No landlord found for this property" });
//     }
//
//     const { landlord_id } = propertyRecord[0];
//
//     // ✅ Insert new maintenance request into the database
//     const [result] = await db.query(
//         `INSERT INTO MaintenanceRequest
//             (tenant_id, unit_id, subject, description, category, status)
//             VALUES (?, ?, ?, ?, ?, "Pending")`,
//         [tenant_id, unit_id, subject, description, category]
//     );
//
//     const requestData = {
//       request_id: result.insertId,
//       tenant_id,
//       landlord_id,
//       unit_id,
//       subject,
//       description,
//       category,
//       status: "Pending",
//       timestamp: new Date().toISOString(),
//     };
//
//     //  Initialize Socket.io inside the API handler
//     if (!res.socket.server.io) {
//       console.log("Initializing new Socket.io server...");
//       const io = new Server(res.socket.server);
//       res.socket.server.io = io;
//
//       io.on("connection", (socket) => {
//         console.log("A user connected to the chat system.");
//       });
//     }
//
//     // Emit a chat message from the landlord via Socket.io
//     res.socket.server.io.emit(`chat_${tenant_id}`, {
//       sender: `Landlord_${landlord_id}`, // Simulating the landlord as the sender
//       message: `Hello! Your maintenance request for "${subject}" has been received. We will schedule a visit soon.`,
//       timestamp: new Date().toISOString(),
//     });
//
//     return res.status(201).json({
//       success: true,
//       message: "Maintenance request created successfully. Automated chat message sent.",
//       request_id: result.insertId,
//     });
//
//   } catch (error) {
//     console.error("Error creating maintenance request:", error);
//     return res.status(500).json({ error: "Internal Server Error" });
//   }
// }
