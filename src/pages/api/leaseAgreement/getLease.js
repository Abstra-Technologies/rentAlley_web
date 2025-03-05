import { db } from "../../../lib/db";
import { decryptData } from "../../../crypto/encrypt";

// Encryption Secret
const encryptionSecret = process.env.ENCRYPTION_SECRET;

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  let connection;

  connection = await db.getConnection();

  const { unit_id } = req.query;

  try {
    // First, get the prospective_tenant_id using unit_id
    const [prospectiveRows] = await connection.execute(
      `SELECT id FROM ProspectiveTenant WHERE unit_id = ?`,
      [unit_id]
    );

    if (prospectiveRows.length === 0) {
      return res
        .status(404)
        .json({ error: "No prospective tenant found for this unit" });
    }

    const prospectiveTenantId = prospectiveRows[0].id;

    let query = `SELECT * FROM LeaseAgreement WHERE prospective_tenant_id = ?`;
    let params = [prospectiveTenantId];

    const [rows] = await connection.execute(query, params);

    // Decrypt the photo URLs before returning them
    const decryptedRows = rows.map((row) => {
      try {
        const encryptedData = JSON.parse(row.agreement_url);
        const decryptedUrl = decryptData(encryptedData, encryptionSecret);

        return {
          ...row,
          agreement_url: decryptedUrl,
        };
      } catch (decryptionError) {
        console.error("Decryption Error:", decryptionError);
        return {
          ...row,
          agreement_url: null,
        };
      }
    });
    res.status(200).json(decryptedRows);
  } catch (error) {
    console.error("Error fetching lease agreement:", error);
    res
      .status(500)
      .json({ error: "Failed to fetch lease agreement: " + error.message });
  }
}
