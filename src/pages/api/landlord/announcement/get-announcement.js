import { db } from "../../../../lib/db";
import { decryptData } from "../../../../crypto/encrypt";

const SECRET_KEY = process.env.ENCRYPTION_SECRET;

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const { landlord_id } = req.query;

  try {
    const query = `
      SELECT
        a.announcement_id, 
        a.property_id,
        a.subject,
        a.description,
        a.created_at,
        p.property_name
      FROM Announcement a
      JOIN Property p ON a.property_id = p.property_id
      WHERE a.landlord_id = ?
      ORDER BY a.created_at DESC;
    `;

    console.log("Executing query with landlord_id:", landlord_id);
    const [announcements] = await db.execute(query, [landlord_id]);
    console.log("Raw announcements:", announcements);

    // Decrypt the encrypted fields safely
    const decryptedAnnouncements = announcements.map(announcement => {
      try {
        return {
          id: announcement.announcement_id,
          subject: isValidJson(announcement.subject) ? 
            decryptData(JSON.parse(announcement.subject), SECRET_KEY) : 
            announcement.subject,
          description: isValidJson(announcement.description) ?
            decryptData(JSON.parse(announcement.description), SECRET_KEY) :
            announcement.description,
          property: announcement.property_name,
          property_id: announcement.property_id,
          created_at: announcement.created_at
        };
      } catch (error) {
        console.error("Error decrypting announcement:", error, announcement);
        return { ...announcement, subject: "Error decrypting", description: "Error decrypting" };
      }
    });

    console.log("Decrypted announcements:", decryptedAnnouncements);
    return res.status(200).json(decryptedAnnouncements);
  } catch (error) {
    console.error("Detailed error in get-announcements:", error);
    return res.status(500).json({ 
      message: "Internal Server Error",
      error: error.message 
    });
  }
}

// Helper function to validate JSON
function isValidJson(str) {
  try {
    JSON.parse(str);
    return true;
  } catch (e) {
    return false;
  }
}
