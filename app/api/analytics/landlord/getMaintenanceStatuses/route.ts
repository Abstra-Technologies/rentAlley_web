import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    
    const landlordId = searchParams.get("landlord_id");
    const propertyId = searchParams.get("property_id");

    let propertyIds: number[] = [];

    if (landlordId) {
      const [props]: any = await db.query(
        `SELECT property_id FROM Property WHERE landlord_id = ?`,
        [landlordId]
      );

      propertyIds = props.map((p: any) => p.property_id);

      if (propertyIds.length === 0) {
        return NextResponse.json([]);
      }

    } else if (propertyId) {
      propertyIds = [propertyId];
    } else {
      return NextResponse.json(
        { error: "Missing landlord_id or property_id." },
        { status: 400 }
      );
    }

    // Fetch ONLY statuses
    const [rows]: any = await db.query(
      `
      SELECT status
      FROM MaintenanceRequest
      WHERE property_id IN (?)
      `,
      [propertyIds]
    );

    return NextResponse.json(rows);

  } catch (error) {
    console.error("Maintenance Status Error:", error);
    return NextResponse.json(
      { error: "Failed to load maintenance statuses." },
      { status: 500 }
    );
  }
}
