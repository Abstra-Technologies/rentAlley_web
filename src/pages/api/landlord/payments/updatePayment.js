import { db } from "../../../../lib/db";

export default async function handler(req, res) {
  if (req.method !== "PUT")
    return res.status(405).json({ message: "Method not allowed" });

  const { payment_id, payment_status, payment_type } = req.body;

  if (!payment_id || !payment_status || !payment_type) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    await db.query(
      `UPDATE Payment SET payment_status = ?, payment_type = ?, updated_at = NOW() WHERE payment_id = ?`,
      [payment_status, payment_type, payment_id]
    );

    res.status(200).json({ message: "Payment updated successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error updating payment" });
  }
}
