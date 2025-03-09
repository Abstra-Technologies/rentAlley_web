import { db } from "../../../../lib/db";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { billing_id } = req.query;

  if (!billing_id) {
    return res.status(400).json({ error: "Billing ID is required" });
  }

  try {
    const [bill] = await db.query(
      `SELECT * FROM Billing WHERE billing_id = ?`,
      [billing_id]
    );

    if (!bill) {
      return res.status(404).json({ error: "Bill not found" });
    }

    res.status(200).json(bill);
  } catch (error) {
    console.error("Error fetching bill:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}
