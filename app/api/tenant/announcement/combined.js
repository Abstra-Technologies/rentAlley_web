import { db } from "../../../../lib/db";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    const { user_id } = req.query;

    if (!user_id) {
      return res.status(400).json({ message: "Missing user_id parameter" });
    }

    const [tenant] = await db.execute(
      "SELECT tenant_id FROM Tenant WHERE user_id = ?",
      [user_id]
    );

    if (tenant.length === 0) {
      return res.status(404).json({ message: "Tenant not found" });
    }

    const tenantId = tenant[0].tenant_id;

    const [property] = await db.execute(
      `SELECT p.property_id, p.landlord_id 
             FROM Property p 
             JOIN Unit u ON p.property_id = u.property_id 
             JOIN LeaseAgreement la ON u.unit_id = la.unit_id 
             WHERE la.tenant_id = ? LIMIT 1`,
      [tenantId]
    );

    if (property.length === 0) {
      return res.status(404).json({ message: "No associated property found" });
    }

    const [systemAnnouncementsRaw] = await db.execute(
      "SELECT id, title, message, created_at FROM AdminAnnouncement WHERE target_audience IN ('all', 'tenant')"
    );

    const systemAnnouncements = systemAnnouncementsRaw.map((ann) => ({
      unique_id: `sys-${ann.id}`,
      title: ann.title,
      message: ann.message,
      created_at: ann.created_at,
    }));

    let landlordAnnouncements = [];

    if (property.length > 0 && property[0].landlord_id) {
      const landlord_id = property[0].landlord_id;
      const [landlordAnnouncementsRaw] = await db.execute(
        "SELECT announcement_id, subject AS title, description AS message, created_at FROM Announcement WHERE landlord_id = ?",
        [landlord_id]
      );

      landlordAnnouncements = landlordAnnouncementsRaw.map((ann) => ({
        unique_id: `ll-${ann.announcement_id}`,
        title: ann.title,
        message: ann.message,
        created_at: ann.created_at,
      }));
    }

    const announcements = [
      ...systemAnnouncements,
      ...landlordAnnouncements,
    ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    console.log("Announcements: ", announcements);

    return res.status(200).json(announcements);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
}
