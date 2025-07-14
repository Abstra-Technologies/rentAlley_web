import { db } from "../../../../lib/db";
import { decryptData } from "../../../../crypto/encrypt";
const SECRET_KEY = process.env.ENCRYPTION_SECRET;

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { unitId, tenant_id } = req.query;

  if (!unitId && !tenant_id) {
    return res.status(400).json({
      message:
        "Missing required parameters: either unitId or tenant_id must be provided",
    });
  }

  try {
    let query = `
      SELECT pt.id, pt.status, pt.message, pt.valid_id, pt.created_at, pt.tenant_id,
             u.firstName, u.lastName, u.email, u.phoneNumber, u.profilePicture, u.birthDate,
             t.address, t.occupation, t.employment_type, t.monthly_income, t.tenant_id
      FROM ProspectiveTenant pt
      JOIN Tenant t ON pt.tenant_id = t.tenant_id
      JOIN User u ON t.user_id = u.user_id
      WHERE `;

    let params = [];

    if (tenant_id) {
      query += `pt.tenant_id = ?`;
      params.push(tenant_id);
    } else {
      query += `pt.unit_id = ?`;
      params.push(unitId);
    }

    console.log("Query:", query);
    console.log("Parameters:", params);

    const [tenants] = await db.query(query, params);

    console.log("Database query results count:", tenants.length);

    if (tenant_id && tenants.length > 0) {
      const tenant = tenants[0];
      const decryptedTenant = {
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
        birthDate: tenant.birthDate
          ? decryptData(JSON.parse(tenant.birthDate), SECRET_KEY)
          : null,
      };

      return res.status(200).json(decryptedTenant);
    }

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
      birthDate: tenant.birthDate
        ? decryptData(JSON.parse(tenant.birthDate), SECRET_KEY)
        : null,
    }));

    return res.status(200).json(decryptedTenants);
  } catch (error) {
    console.error("Database error:", error);
    console.log("Tenant ID:", tenantId);
    console.log("Unit ID:", unitId);
    console.log("API Response:", response.data);
    return res
      .status(500)
      .json({ message: "Database error", error: error.message });
  }
}
