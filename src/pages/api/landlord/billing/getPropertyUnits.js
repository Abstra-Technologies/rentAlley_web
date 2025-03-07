import { db } from "../../../../lib/db";

export default async function handler(req, res) {
  try {
    const { landlordId } = req.query;

    if (!landlordId) {
      console.error("API Error: Missing landlordId");
      return res.status(400).json({ error: "Landlord ID is required" });
    }

    // ✅ Fix: Destructure rows from query result
    const [properties] = await db.query(
      "SELECT * FROM Property WHERE landlord_id = ?",
      [landlordId]
    );

    console.log("Fetched properties:", properties);

    if (!properties.length) {
      console.warn("No properties found for landlord ID:", landlordId);
      return res.status(404).json({ error: "No properties found" });
    }

    // Fetch units
    const propertyIds = properties.map((p) => p.property_id);
    const [units] = await db.query(
      "SELECT * FROM Unit WHERE property_id IN (?)",
      [propertyIds]
    );

    console.log("Fetched units:", units);

    // Map units to properties
    const propertiesWithUnits = properties.map((property) => ({
      ...property,
      units: units.filter((unit) => unit.property_id === property.property_id),
    }));

    console.log("Final API Response:", propertiesWithUnits);

    res.status(200).json(propertiesWithUnits);
  } catch (error) {
    console.error("Error fetching properties and units:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}
