import { db } from "../../../../lib/db";
import { MAINTENANCE_CATEGORIES } from "../../../../constant/maintenanceCategories";

export default async function GetMaintenanceCategories(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { landlord_id } = req.query;

  if (!landlord_id) {
    return res.status(400).json({ error: "Missing landlord_id parameter" });
  }

  try {
    // Fetch maintenance request count for each category
    const result = await db.query(
      `
                SELECT mr.category, COUNT(*) AS count
                FROM MaintenanceRequest mr
                         JOIN Unit u ON mr.unit_id = u.unit_id
                         JOIN Property p ON u.property_id = p.property_id
                WHERE p.landlord_id = ?
                GROUP BY mr.category
            `,
      [landlord_id]
    );

    // Convert result to a dictionary for easy lookup
    const categoryCountMap = {};
    const categoryResults = Array.isArray(result[0]) ? result[0] : result;

    categoryResults.forEach(({ category, count }) => {
      categoryCountMap[category] = count;
    });

    // Include all predefined categories, even those with zero requests
    const categories = MAINTENANCE_CATEGORIES.map((category) => ({
      category: category.value,
      label: category.label,
      count: categoryCountMap[category.value] || 0, // Default to 0 if no requests exist
    }));

    res.status(200).json({ categories });
  } catch (error) {
    console.error("Error fetching maintenance categories:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}
