import { db } from "../../../../lib/db";
import { decryptData, encryptData } from "../../../../crypto/encrypt";

const SECRET_KEY = process.env.ENCRYPTION_SECRET;

export default async function handler(req, res) {
  if (req.method !== "PUT") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    const { id } = req.query;
    const { subject, description, property_id } = req.body;

    console.log("Received PUT request for announcement:", { id, subject, description, property_id });

    if (!id) {
      console.error("❌ Missing announcement ID!");
      return res.status(400).json({ message: "Announcement ID is required" });
    }

    if (!subject || !description || !property_id) {
      console.error("❌ Missing required fields:", { subject, description, property_id });
      return res.status(400).json({ 
        message: "Missing required fields: subject, description, and property_id are required" 
      });
    }

    // Check if the announcement exists
    const checkQuery = "SELECT announcement_id FROM Announcement WHERE announcement_id = ?";
    const [existing] = await db.execute(checkQuery, [id]);

    if (existing.length === 0) {
      console.error(`❌ Announcement with ID ${id} not found!`);
      return res.status(404).json({ message: "Announcement not found" });
    }

    console.log("✅ Announcement found, proceeding with update...");

    // Encrypt the subject and description and ensure they are valid JSON strings
    const encryptedSubject = typeof encryptData(subject, SECRET_KEY) === "string" 
  ? encryptData(subject, SECRET_KEY) 
  : JSON.stringify(encryptData(subject, SECRET_KEY));

const encryptedDescription = typeof encryptData(description, SECRET_KEY) === "string"
  ? encryptData(description, SECRET_KEY)
  : JSON.stringify(encryptData(description, SECRET_KEY));

    console.log("🔒 Encrypted Data:", { encryptedSubject, encryptedDescription });

    // Convert property_id to integer
    const propertyIdInt = parseInt(property_id, 10);

    // Update the announcement
    const updateQuery = `
      UPDATE Announcement 
      SET subject = ?,
          description = ?,
          property_id = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE announcement_id = ?
    `;

    const [result] = await db.execute(updateQuery, [
      encryptedSubject,
      encryptedDescription,
      propertyIdInt,
      id
    ]);

    console.log("✅ Update result:", result);

    return res.status(200).json({ 
      message: "Announcement updated successfully",
      id: id
    });

  } catch (error) {
    console.error("🔥 Error updating announcement:", error.message, error.stack);
    return res.status(500).json({ message: "Internal Server Error" });
  }
}
