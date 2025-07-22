import { db } from "@/lib/db";
import { decryptData } from "@/crypto/encrypt";
import { NextRequest, NextResponse } from "next/server";

const SECRET_KEY = process.env.ENCRYPTION_SECRET;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const tenantId = searchParams.get("tenantId");

    if (!tenantId) {
      return NextResponse.json(
        { message: "Tenant ID is required" },
        { status: 400 }
      );
    }

    // Fetch ALL active lease agreements
    const [leaseRecords] = await db.query(
      `SELECT
         agreement_id, start_date, end_date,
         is_advance_payment_paid, is_security_deposit_paid,
         unit_id, tenant_id
       FROM LeaseAgreement
       WHERE tenant_id = ?
         AND status = 'active'
       ORDER BY updated_at DESC`,
      [tenantId]
    );

    // @ts-ignore
    if (!leaseRecords || leaseRecords.length === 0) {
      return NextResponse.json(
        { message: "No active leases found" },
        { status: 404 }
      );
    }

    const result = [];
// @ts-ignore
    for (const lease of leaseRecords) {
      const [unitDetails] = await db.query(
        `SELECT
           u.unit_id, u.unit_name, u.unit_size, u.bed_spacing, u.avail_beds,
           u.rent_amount, u.furnish, u.status, u.sec_deposit, u.advanced_payment,
           p.property_id, p.property_name, p.property_type, p.min_stay, p.landlord_id,
           p.city, p.zip_code, p.province, p.street, p.brgy_district
         FROM Unit u
         INNER JOIN Property p ON u.property_id = p.property_id
         WHERE u.unit_id = ?`,
        [lease.unit_id]
      );
// @ts-ignore
      if (!unitDetails || unitDetails.length === 0) {
        continue; // skip if unit not found
      }
// @ts-ignore
      const unit = unitDetails[0];

      const [unitPhotos] = await db.query(
        `SELECT photo_url FROM UnitPhoto WHERE unit_id = ? ORDER BY id ASC`,
        [lease.unit_id]
      );
// @ts-ignore
      const decryptedPhotos = unitPhotos.length > 0
          // @ts-ignore
        ? unitPhotos.map((photo) => {
            try {
              return decryptData(JSON.parse(photo.photo_url), SECRET_KEY!);
            } catch (e) {
              console.error("Failed to decrypt unit photo:", e);
              return null;
            }
          }).filter(Boolean)
        : [];

      result.push({
        ...unit,
        unit_photos: decryptedPhotos,
        agreement_id: lease.agreement_id,
        start_date: lease.start_date,
        end_date: lease.end_date,
        is_advance_payment_paid: lease.is_advance_payment_paid,
        is_security_deposit_paid: lease.is_security_deposit_paid,
        street: unit.street,
        brgy_district: unit.brgy_district,
        city: unit.city,
        province: unit.province,
        zip_code: unit.zip_code,
      });
    }

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("Error fetching multiple active rentals:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
