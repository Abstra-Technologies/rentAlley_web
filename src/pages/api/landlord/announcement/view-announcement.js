import { db } from "../../../../lib/db";
import { decryptData } from "../../../../crypto/encrypt";

const SECRET_KEY = process.env.ENCRYPTION_SECRET;

export default async function handler(req, res) {
    if (req.method !== "GET") {
      return res.status(405).json({ error: "Method Not Allowed" });
    }
  
    try {
      const { id } = req.query;
  
      if (!id) {
        return res.status(400).json({ error: "Missing announcement ID" });
      }
  
      const query = `
        SELECT a.announcement_id, a.subject, a.description, a.created_at, p.property_name, a.property_id
        FROM Announcement a
        JOIN Property p ON a.property_id = p.property_id
        WHERE a.announcement_id = ?
      `;
  
      const [announcements] = await db.execute(query, [id]);
  
      if (announcements.length === 0) {
        return res.status(404).json({ error: "Announcement not found" });
      }
  
      const announcement = announcements[0];
  
      try {
        announcement.subject = announcement.subject.startsWith('{') ? 
          decryptData(JSON.parse(announcement.subject), SECRET_KEY) : 
          announcement.subject;
        
        announcement.description = announcement.description.startsWith('{') ? 
          decryptData(JSON.parse(announcement.description), SECRET_KEY) : 
          announcement.description;
      } catch (error) {
        console.error("Error decrypting announcement:", error);
        return res.status(500).json({ error: "Error decrypting announcement data" });
      }
  
      return res.status(200).json(announcement);
    } catch (error) {
      console.error("Error fetching announcement:", error);
      return res.status(500).json({ error: "Internal Server Error" });
    }
}
