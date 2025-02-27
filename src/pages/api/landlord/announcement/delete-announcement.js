import { db } from "../../../../lib/db";

export default async function handler(req, res) {
  if (req.method !== "DELETE") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({ error: "Missing announcement ID" });
    }

    // First check if announcement exists
    const checkQuery = "SELECT announcement_id FROM Announcement WHERE announcement_id = ?";
    const [existing] = await db.execute(checkQuery, [id]);

    if (existing.length === 0) {
      return res.status(404).json({ error: "Announcement not found" });
    }

    // Delete the announcement
    const deleteQuery = "DELETE FROM Announcement WHERE announcement_id = ?";
    await db.execute(deleteQuery, [id]);

    return res.status(200).json({ 
      message: "Announcement deleted successfully",
      id: id
    });

  } catch (error) {
    console.error("Error deleting announcement:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}