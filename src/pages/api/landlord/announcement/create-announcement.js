import { db } from "../../../../lib/db";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    const { property_id, subject, description, landlord_id } = req.body;

    if (!property_id || !subject || !description || !landlord_id) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const [landlord] = await db.execute(
      `SELECT user_id FROM Landlord WHERE landlord_id = ?`,
      [landlord_id]
    );

    if (landlord.length === 0) {
      return res.status(404).json({ message: "Landlord not found" });
    }

    const user_id = landlord[0].user_id;

    const query = `
      INSERT INTO Announcement (property_id, landlord_id, subject, description, created_at, updated_at)
      VALUES (?, ?, ?, ?, NOW(), NOW());
    `;
    await db.execute(query, [property_id, landlord_id, subject, description]);

    const activityLogQuery = `
      INSERT INTO ActivityLog (user_id, action, timestamp)
      VALUES (?, ?, NOW());
    `;

    await db.execute(activityLogQuery, [
      user_id,
      `Created Announcement ${subject - description}`,
    ]);

    const tenantQuery = `
      SELECT DISTINCT t.user_id
      FROM LeaseAgreement la
      JOIN Tenant t ON la.tenant_id = t.tenant_id
      JOIN Unit u ON la.unit_id = u.unit_id
      WHERE u.property_id = ? AND la.status = 'active'
    `;
    const [tenants] = await db.execute(tenantQuery, [property_id]);

    const notificationQuery = `
      INSERT INTO Notification (user_id, title, body, is_read, created_at)
      VALUES (?, ?, ?, ?, NOW())
    `;

    const maxBodyLength = 100;
    const truncatedDescription =
      description.length > maxBodyLength
        ? description.slice(0, maxBodyLength) + "..."
        : description;

    for (const tenant of tenants) {
      await db.execute(notificationQuery, [
        tenant.user_id,
        subject,
        truncatedDescription,
        0,
      ]);
    }

    return res
      .status(201)
      .json({ message: "Announcement created and logged successfully" });
  } catch (error) {
    console.error("Error creating announcement:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
}
