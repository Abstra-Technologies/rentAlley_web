import { db } from "../../../../lib/db";
import {parse} from "cookie";
import {jwtVerify} from "jose";

export default async function handler(req, res) {
  if (req.method !== "DELETE") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  //region GET CURRENT USER

  const cookies = req.headers.cookie ? parse(req.headers.cookie) : null;
  if (!cookies || !cookies.token) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  const secretKey = new TextEncoder().encode(process.env.JWT_SECRET);
  const { payload } = await jwtVerify(cookies.token, secretKey);
  let loggedUser = payload.user_id;
  //endregion

  try {
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({ error: "Missing announcement ID" });
    }

    const checkQuery = "SELECT announcement_id FROM Announcement WHERE announcement_id = ?";
    const [existing] = await db.execute(checkQuery, [id]);

    if (existing.length === 0) {
      return res.status(404).json({ error: "Announcement not found" });
    }

    const deleteQuery = "DELETE FROM Announcement WHERE announcement_id = ?";
    await db.execute(deleteQuery, [id]);

    await db.query(
        "INSERT INTO ActivityLog (user_id, action, timestamp) VALUES (?, ?, NOW())",
        [loggedUser, `Deleted Abnnoucement ID: ${id}`]
    );

    return res.status(200).json({ 
      message: "Announcement deleted successfully",
      id: id
    });

  } catch (error) {
    console.error("Error deleting announcement:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}