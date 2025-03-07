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
    // Step 1: Get the approved prospective tenant for the unit
    const [prospectiveTenantResult] = await connection.execute(
      "SELECT tenant_id FROM ProspectiveTenant WHERE unit_id = ?",
      [Number(unit_id)]
    );

    if (prospectiveTenantResult.length === 0) {
      return res.status(400).json({
        error: "No approved prospective tenant found for this unit.",
      });
    }

    const tenant_id = prospectiveTenantResult[0].tenant_id;

    let query = `SELECT * FROM LeaseAgreement WHERE tenant_id = ? AND unit_id = ?`;
    let params = [tenant_id, unit_id];

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
