import { db } from "../../../lib/db";
import { decryptData } from "../../../crypto/encrypt";

const encryptionSecret = process.env.ENCRYPTION_SECRET;

export default async function getLease(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  let connection;
  connection = await db.getConnection();

  const { unit_id } = req.query;

  try {
    let tenantQuery = `
      SELECT tenant_id FROM ProspectiveTenant 
      WHERE unit_id = ? AND status = 'approved'
      LIMIT 1;
    `;
    const [tenantRows] = await connection.execute(tenantQuery, [unit_id]);

    if (tenantRows.length === 0) {
      return res
        .status(404)
        .json({ error: "No approved tenant found for this unit" });
    }

    const tenant_id = tenantRows[0].tenant_id;

    let leaseQuery = `SELECT * FROM LeaseAgreement WHERE tenant_id = ? AND unit_id = ? LIMIT 1`;
    const [leaseRows] = await connection.execute(leaseQuery, [
      tenant_id,
      unit_id,
    ]);

    if (leaseRows.length === 0) {
      return res.status(200).json([]);
    }

    const decryptedRows = leaseRows.map((row) => {
      try {
        const encryptedData = JSON.parse(row.agreement_url);
        const decryptedUrl = decryptData(encryptedData, encryptionSecret);
        return { ...row, agreement_url: decryptedUrl };
      } catch (decryptionError) {
        console.error("Decryption Error:", decryptionError);
        return { ...row, agreement_url: null };
      }
    });

    res.status(200).json(decryptedRows);
  } catch (error) {
    console.error("Error fetching lease agreement:", error);
    res
      .status(500)
      .json({ error: "Failed to fetch lease agreement: " + error.message });
  } finally {
    connection.release();
  }
}
