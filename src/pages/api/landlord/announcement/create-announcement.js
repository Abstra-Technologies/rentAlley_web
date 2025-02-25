import { db } from "../../../../lib/db";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    const { property_id, subject, description, landlord_id } = req.body;

    // Validate input
    if (!property_id || !subject || !description || !landlord_id) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Insert new announcement
    let query = `
      INSERT INTO Announcement (property_id, landlord_id, subject, description, created_at, updated_at)
      VALUES (?, ?, ?, ?, NOW(), NOW());
    `;
    await db.execute(query, [property_id, landlord_id, subject, description]);

    return res.status(201).json({ message: "Announcement created successfully" });
  } catch (error) {
    console.error("Error creating announcement:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }

  if (response.ok) {
  alert("Announcement created successfully!");
  router.push('/pages/landlord/announcement'); // Update this path to match your route structure
}
}
