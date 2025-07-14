import { db } from "../../../lib/db";

export default async function getLeaseStatus(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { tenant_id } = req.query;

  if (!tenant_id) {
    return res.status(400).json({ error: "Missing tenant_id parameter" });
  }

  let connection;
  try {
    connection = await db.getConnection();

    // Query to check if the tenant has an active lease with valid start and end dates
    const query = `
      SELECT agreement_id FROM LeaseAgreement 
      WHERE tenant_id = ?
      AND status = 'active' 
      AND created_at IS NOT NULL 
      AND updated_at IS NOT NULL 
      LIMIT 1
    `;
    const [rows] = await connection.execute(query, [tenant_id]);

    res.status(200).json({ hasLease: rows.length > 0 });
  } catch (error) {
    console.error("Error checking lease agreement:", error);
    res.status(500).json({ error: "Failed to check lease agreement: " + error.message });
  } finally {
    if (connection) connection.release(); // Release the DB connection
  }
}
