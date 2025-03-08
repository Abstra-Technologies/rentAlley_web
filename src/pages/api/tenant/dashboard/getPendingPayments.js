import { db } from "../../../../lib/db";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    const { tenant_id } = req.query;

    if (!tenant_id) {
      return res.status(400).json({ message: "Tenant ID is required" });
    }

    // Fetch total pending payments for the tenant
    const [result] = await db.query(
      `
        SELECT COALESCE(SUM(amount_paid), 0) AS total_pending
        FROM Payment
        JOIN LeaseAgreement ON Payment.agreement_id = LeaseAgreement.agreement_id
        WHERE LeaseAgreement.tenant_id = ? 
          AND Payment.payment_status = 'pending'
        `,
      [tenant_id]
    );

    return res
      .status(200)
      .json({ total_pending: result[0]?.total_pending || 0 });
  } catch (error) {
    console.error("Error fetching pending payments:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
}
