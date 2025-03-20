import { db } from "../../../lib/db";
import { decryptData } from "../../../crypto/encrypt";

export default async function landlordList(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    const [landlords] = await db.query(`
            SELECT l.*, u.email AS user_email
            FROM Landlord l
                     JOIN User u ON l.user_id = u.user_id
            WHERE u.status = 'active'
        `);

    const decryptedLandlords = landlords.map((landlord) => {
      let decryptedEmail = landlord.user_email;
      try {
        if (landlord.user_email) {
          decryptedEmail = decryptData(
            JSON.parse(landlord.user_email),
            process.env.ENCRYPTION_SECRET
          );
        }
      } catch (err) {
        console.error(
          `Failed to decrypt email for landlord id ${landlord.id}:`,
          err
        );
      }
      return {
        ...landlord,
        email: decryptedEmail,
      };
    });

    return res.status(200).json({ landlords: decryptedLandlords });
  } catch (error) {
    console.error("Error fetching landlords:", error);
    return res.status(500).json({ success: false, message: "DB Server Error" });
  }
}
