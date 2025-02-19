import { db } from "../../../lib/db";
import { decryptData } from "../../../crypto/encrypt";
const SECRET_KEY = process.env.ENCRYPTION_SECRET;

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { property_id, unit_id } = req.query;

  try {
    const [tenants] = await db.query(
      `SELECT pt.id, pt.status, pt.government_id, pt.current_home_address, pt.created_at, 
              u.firstName, u.lastName, u.email, u.phoneNumber, u.profilePicture
       FROM ProspectiveTenant pt
       JOIN Tenant t ON pt.tenant_id = t.tenant_id
       JOIN User u ON t.user_id = u.user_id
       WHERE (pt.property_id = ? OR pt.unit_id = ?)
       ORDER BY pt.created_at DESC`,
      [property_id, unit_id]
    );

    // Decrypt necessary fields before returning response
    const decryptedTenants = tenants.map((tenant) => ({
      ...tenant,
      firstName: decryptData(JSON.parse(tenant.firstName), SECRET_KEY),
      lastName: decryptData(JSON.parse(tenant.lastName), SECRET_KEY),
      email: decryptData(JSON.parse(tenant.email), SECRET_KEY),
      phoneNumber: decryptData(JSON.parse(tenant.phoneNumber), SECRET_KEY),
      government_id: decryptData(JSON.parse(tenant.government_id), SECRET_KEY), // Decrypt S3 link
    }));

    return res.status(200).json(decryptedTenants);
  } catch (error) {
    console.error("Database error:", error);
    return res.status(500).json({ message: "Database error", error });
  }
}
