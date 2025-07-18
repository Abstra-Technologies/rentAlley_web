import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const landlordId = searchParams.get("landlordId");

    if (!landlordId) {
      console.error("API Error: Missing landlordId");
      return NextResponse.json({ error: "Landlord ID is required" }, { status: 400 });
    }

    const [properties] = await db.query(
      "SELECT * FROM Property WHERE landlord_id = ?",
      [landlordId]
    );

    console.log("Fetched properties:", properties);

    if (!properties.length) {
      return NextResponse.json({ error: "No properties found" }, { status: 404 });
    }

    const propertyIds = properties.map((p: any) => p.property_id);
    const [units] = await db.query(
      "SELECT * FROM Unit WHERE property_id IN (?)",
      [propertyIds]
    );

    console.log("Fetched units:", units);

    const propertiesWithUnits = properties.map((property: any) => ({
      ...property,
      units: units.filter((unit: any) => unit.property_id === property.property_id),
    }));

    console.log("Final API Response:", propertiesWithUnits);

    return NextResponse.json(propertiesWithUnits, { status: 200 });

  } catch (error) {
    console.error("Error fetching properties and units:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
