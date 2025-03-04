import { db } from "../../../../lib/db";
import { decryptData } from "../../../../crypto/encrypt";
const SECRET_KEY = process.env.ENCRYPTION_SECRET;

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { unitId } = req.query;

  try {
    const [tenants] = await db.query(
      `SELECT pt.id, pt.status, pt.message, pt.valid_id, pt.created_at,
              u.firstName, u.lastName, u.email, u.phoneNumber, u.profilePicture, u.birthDate,
              t.address, t.occupation, t.employment_type, t.monthly_income
       FROM ProspectiveTenant pt
       JOIN Tenant t ON pt.tenant_id = t.tenant_id
       JOIN User u ON t.user_id = u.user_id
       WHERE (pt.unit_id = ?)
       ORDER BY pt.created_at DESC`,
      [unitId || null]
    );

    // Decrypt necessary fields before returning response
    const decryptedTenants = tenants.map((tenant) => ({
      ...tenant,
      firstName: decryptData(JSON.parse(tenant.firstName), SECRET_KEY),
      lastName: decryptData(JSON.parse(tenant.lastName), SECRET_KEY),
      email: decryptData(JSON.parse(tenant.email), SECRET_KEY),
      phoneNumber: decryptData(JSON.parse(tenant.phoneNumber), SECRET_KEY),
      profilePicture: tenant.profilePicture
        ? decryptData(JSON.parse(tenant.profilePicture), SECRET_KEY)
        : null,
      valid_id: tenant.valid_id
        ? decryptData(JSON.parse(tenant.valid_id), SECRET_KEY)
        : null,
      address: tenant.address.toString("utf8"),
      occupation: tenant.occupation,
      employment_type: tenant.employment_type,
      monthly_income: tenant.monthly_income,
      birthDate: tenant.birthDate,
    }));

    return res.status(200).json(decryptedTenants);
  } catch (error) {
    console.error("Database error:", error);
    return res.status(500).json({ message: "Database error", error });
  }
}
