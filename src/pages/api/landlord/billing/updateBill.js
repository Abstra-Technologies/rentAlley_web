import { db } from "../../../../lib/db";

export default async function handler(req, res) {
  if (req.method !== "PUT") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const {
    billing_id,
    total_water_amount,
    total_electricity_amount,
    penalty_amount,
    discount_amount,
    total_amount_due,
    status,
    due_date,
    paid_at,
  } = req.body;

  if (!billing_id) {
    return res.status(400).json({ error: "Billing ID is required" });
  }

  try {
    await db.query(
      `UPDATE Billing 
       SET total_water_amount = ?, total_electricity_amount = ?, penalty_amount = ?, discount_amount = ?, total_amount_due = ?, status = ?, due_date = ?, paid_at = ?
       WHERE billing_id = ?`,
      [
        total_water_amount,
        total_electricity_amount,
        penalty_amount,
        discount_amount,
        total_amount_due,
        status,
        due_date,
        paid_at,
        billing_id,
      ]
    );

    res.status(200).json({ message: "Billing record updated successfully" });
  } catch (error) {
    console.error("Error updating bill:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}
