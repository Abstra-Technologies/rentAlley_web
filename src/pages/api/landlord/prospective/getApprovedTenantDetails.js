import { db } from "../../../../lib/db";
import { decryptData } from "../../../../crypto/encrypt";

const encryptionSecret = process.env.ENCRYPTION_SECRET;

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  let connection;
  try {
    connection = await db.getConnection();
    const { unit_id } = req.query;

    const [prospectiveTenant] = await connection.execute(
      `SELECT pt.tenant_id, pt.valid_id
            FROM ProspectiveTenant pt
            WHERE pt.unit_id = ? AND pt.status = 'approved'
            LIMIT 1`,
      [unit_id]
    );

    if (prospectiveTenant.length === 0) {
      return res
        .status(404)
        .json({ error: "No approved tenant found for this unit" });
    }

    const tenant_id = prospectiveTenant[0].tenant_id;
    let decryptedValidId = decryptData(
      JSON.parse(prospectiveTenant[0].valid_id),
      encryptionSecret
    );

    const [tenantDetails] = await connection.execute(
      `SELECT t.user_id, t.occupation, t.employment_type, t.monthly_income, t.address,
                    u.firstName, u.lastName, u.birthDate, u.phoneNumber
            FROM Tenant t
            JOIN User u ON t.user_id = u.user_id
            WHERE t.tenant_id = ?`,
      [tenant_id]
    );

    if (tenantDetails.length === 0) {
      return res.status(404).json({ error: "Tenant details not found" });
    }

    let decryptedAddress = tenantDetails[0].address.toString("utf8");

    res.status(200).json({
      firstName: decryptData(
        JSON.parse(tenantDetails[0].firstName),
        encryptionSecret
      ),
      lastName: decryptData(
        JSON.parse(tenantDetails[0].lastName),
        encryptionSecret
      ),
      birthDate: decryptData(
        JSON.parse(tenantDetails[0].birthDate),
        encryptionSecret
      ),
      phoneNumber: decryptData(
        JSON.parse(tenantDetails[0].phoneNumber),
        encryptionSecret
      ),
      monthlyIncome: tenantDetails[0].monthly_income,
      occupation: tenantDetails[0].occupation,
      employmentType: tenantDetails[0].employment_type,
      validId: decryptedValidId,
      address: decryptedAddress,
    });
  } catch (error) {
    console.error("Error fetching approved tenant details:", error);
    res.status(500).json({ error: "Internal Server Error" });
  } finally {
    if (connection) connection.release();
  }
}
