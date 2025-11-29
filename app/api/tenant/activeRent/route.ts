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

    const [leaseRecords]: any = await db.query(
        `
          SELECT
            agreement_id, start_date, end_date,
            is_advance_payment_paid, is_security_deposit_paid,
            advance_payment_amount, security_deposit_amount,
            unit_id, tenant_id, status
          FROM LeaseAgreement
          WHERE tenant_id = ?
            AND status IN ('active', 'pending', 'pending_signature')
          ORDER BY updated_at DESC
        `,
        [tenantId]
    );

    if (!leaseRecords?.length) {
      return NextResponse.json({ message: "No active leases found" }, { status: 404 });
    }

    const result = [];

    for (const lease of leaseRecords) {
      // 🔹 Fetch unit, property, and landlord details (with landlord user_id)
      const [unitDetails]: any = await db.query(
          `
            SELECT
              u.unit_id, u.unit_name, u.unit_size, u.unit_style,
              u.rent_amount, u.furnish, u.status,
              p.property_id, p.property_name, p.property_type, p.landlord_id,
              p.city, p.zip_code, p.province, p.street, p.brgy_district,
              l.user_id AS landlord_user_id,
              u2.firstName AS enc_first_name,
              u2.lastName AS enc_last_name
            FROM Unit u
                   INNER JOIN Property p ON u.property_id = p.property_id
                   INNER JOIN Landlord l ON p.landlord_id = l.landlord_id
                   INNER JOIN User u2 ON l.user_id = u2.user_id
            WHERE u.unit_id = ?
          `,
          [lease.unit_id]
      );

      if (!unitDetails?.length) continue;
      const unit = unitDetails[0];

      // ✅ Decrypt landlord name safely
      let landlordName = "Landlord";
      try {
        const first = decryptData(JSON.parse(unit.enc_first_name), SECRET_KEY);
        const last = decryptData(JSON.parse(unit.enc_last_name), SECRET_KEY);
        landlordName = `${first} ${last}`.trim();
      } catch (err) {
        console.warn("⚠️ Failed to decrypt landlord name:", err);
      }

      // 🔹 Check for pending proof of initial payment
      const [pendingPayment]: any = await db.query(
          `
          SELECT COUNT(*) AS pending_count
          FROM Payment
          WHERE agreement_id = ?
            AND payment_status = 'pending'
            AND payment_type = 'initial_payment'
        `,
          [lease.agreement_id]
      );

      const hasPendingProof = pendingPayment?.[0]?.pending_count > 0;

      // 🔹 Fetch property configuration (billingDueDay)
      const [propertyConfig]: any = await db.query(
          `
            SELECT billingDueDay
            FROM PropertyConfiguration
            WHERE property_id = ?
            LIMIT 1
          `,
          [unit.property_id]
      );

      const billingDueDay = propertyConfig?.[0]?.billingDueDay
          ? Number(propertyConfig[0].billingDueDay)
          : null;

      let due_day = null;
      let due_date = null;

      if (billingDueDay) {
        due_day = billingDueDay;
        const today = new Date();
        const year = today.getFullYear();
        const month = today.getMonth();
        const due = new Date(year, month, billingDueDay);
        due_date = due.toLocaleDateString("en-CA"); // YYYY-MM-DD
      }

      const [unitPhotos]: any = await db.query(
          `
            SELECT photo_url
            FROM UnitPhoto
            WHERE unit_id = ?
            ORDER BY id ASC
          `,
          [lease.unit_id]
      );

      // 🔹 Decrypt photo URLs
      const decryptedPhotos =
          unitPhotos?.length > 0
              ? unitPhotos
                  .map((photo: any) => {
                    try {
                      return decryptData(JSON.parse(photo.photo_url), SECRET_KEY);
                    } catch (err) {
                      console.error("Failed to decrypt unit photo:", err);
                      return null;
                    }
                  })
                  .filter(Boolean)
              : [];

      // 🔹 Combine everything (keep all original fields)
      result.push({
        ...unit,
        unit_photos: decryptedPhotos,
        agreement_id: lease.agreement_id,
        start_date: lease.start_date,
        end_date: lease.end_date,
        lease_status: lease.status,
          signature_status: lease.status,

        // Payment info
        advance_payment_amount: lease.advance_payment_amount,
        security_deposit_amount: lease.security_deposit_amount,
        is_advance_payment_paid: lease.is_advance_payment_paid,
        is_security_deposit_paid: lease.is_security_deposit_paid,

        // Flags
        has_pending_proof: hasPendingProof,

        // Location info
        street: unit.street,
        brgy_district: unit.brgy_district,
        city: unit.city,
        province: unit.province,
        zip_code: unit.zip_code,

        // ✅ Billing Info
        due_day,
        due_date,

        // ✅ NEW: Landlord user details
        landlord_user_id: unit.landlord_user_id,
        landlord_name: landlordName, // decrypted now
      });
    }

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("❌ Error fetching rentals:", error);
    return NextResponse.json(
        { message: "Internal Server Error" },
        { status: 500 }
    );
  }
}
