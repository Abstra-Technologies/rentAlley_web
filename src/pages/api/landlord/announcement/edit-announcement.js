import { db } from "../../../../lib/db";
import { parse } from "cookie";
import { jwtVerify } from "jose";

export default async function EditAnnouncements(req, res) {
  if (req.method !== "PUT") {
    return res.status(405).json({ message: "Method Not Allowed" });
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
    const { subject, description, property_id } = req.body;

    console.log("Received PUT request for announcement:", {
      id,
      subject,
      description,
      property_id,
    });

    if (!id) {
      console.error(" Missing announcement ID!");
      return res.status(400).json({ message: "Announcement ID is required" });
    }

    if (!subject || !description || !property_id) {
      console.error(" Missing required fields:", {
        subject,
        description,
        property_id,
      });
      return res.status(400).json({
        message:
          "Missing required fields: subject, description, and property_id are required",
      });
    }

    // Check if the announcement exists
    const checkAnnoucementQuery =
      "SELECT announcement_id FROM Announcement WHERE announcement_id = ?";
    const [existing] = await db.execute(checkAnnoucementQuery, [id]);

    if (existing.length === 0) {
      console.error(` Announcement with ID ${id} not found!`);
      return res.status(404).json({ message: "Announcement not found" });
    }

    console.log(" Announcement found, proceeding with update...");

    const updateQuery = `
      UPDATE Announcement 
      SET subject = ?,
          description = ?,
          property_id = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE announcement_id = ?
    `;

    const [result] = await db.execute(updateQuery, [
      subject,
      description,
      property_id,
      id,
    ]);

    console.log(" Update result:", result);

    await db.query(
      "INSERT INTO ActivityLog (user_id, action, timestamp) VALUES (?, ?, NOW())",
      [loggedUser, `Edited Announcement # ${id}`]
    );

    return res.status(200).json({
      message: "Announcement updated successfully",
      id: id,
    });
  } catch (error) {
    console.error(" Error updating announcement:", error.message, error.stack);
    return res.status(500).json({ message: "Internal Server Error" });
  }
}
