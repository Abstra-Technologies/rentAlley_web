import { decryptData } from "../../../../crypto/encrypt";
import { db } from "../../../../lib/db";

const SECRET_KEY = process.env.ENCRYPTION_SECRET;

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    const { tenant_id } = req.query;

    // Fetch lease agreement from the database
    const leaseResults = await db.query(
      "SELECT agreement_id, start_date, end_date, DATEDIFF(end_date, start_date) AS duration, agreement_url, status FROM LeaseAgreement WHERE tenant_id = ? AND status = 'active' LIMIT 1",
      [tenant_id]
    );

    // Ensure we got a valid lease
    if (!leaseResults || leaseResults.length === 0) {
      return res
        .status(404)
        .json({ message: "No active lease agreement found" });
    }

    const lease = leaseResults[0];

    // Decrypt the agreement URL
    let decryptedUrl = null;
    if (lease.agreement_url) {
      try {
        decryptedUrl = decryptData(lease.agreement_url, SECRET_KEY);
      } catch (error) {
        console.error("Error decrypting agreement URL:", error);
        return res
          .status(500)
          .json({ message: "Error decrypting lease agreement URL" });
      }
    }

    res.status(200).json({
      ...lease,
      agreement_url: decryptedUrl,
    });
  } catch (error) {
    console.error("Error fetching lease agreement:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}
