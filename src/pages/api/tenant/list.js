import { db } from "../../../lib/db";
import { decryptData } from "../../../crypto/encrypt";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    const [tenants] = await db.query(`
      SELECT t.*, u.email AS user_email
      FROM Tenant t
      JOIN User u ON t.user_id = u.user_id WHERE status = 'active'
    `);

    const decryptedTenants = tenants.map((tenant) => {
      let decryptedEmail = tenant.user_email;
      try {
        if (tenant.user_email) {
          decryptedEmail = decryptData(
            JSON.parse(tenant.user_email),
            process.env.ENCRYPTION_SECRET
          );
        }
      } catch (err) {
        console.error(
          `Failed to decrypt email for tenant with id ${
            tenant.tenant_id || "N/A"
          }:`,
          err
        );
      }

      return {
        ...tenant,
        email: decryptedEmail,
      };
    });

    return res.status(200).json({ tenants: decryptedTenants });
  } catch (error) {
    console.error("Error fetching tenants:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
}
