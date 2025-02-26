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

  const { property_id, unit_id } = req.query;

  try {
    let query = `SELECT * FROM LeaseAgreement WHERE property_id = ? OR unit_id = ?`;
    let params = [property_id || null, unit_id || null];

    // if (property_id) {
    //   query += ` WHERE property_id = ?`;
    //   params.push(property_id);
    // }

    // if (unit_id) {
    //   query += ` WHERE unit_id = ?`;
    //   params.push(unit_id);
    // }

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
