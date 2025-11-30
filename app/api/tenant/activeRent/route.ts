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

        // Fetch leases for tenant
        const [leaseRecords]: any = await db.query(
            `
        SELECT
          agreement_id, start_date, end_date,
          unit_id, tenant_id, status
        FROM LeaseAgreement
        WHERE tenant_id = ?
          AND status IN ('active', 'pending', 'sent', 'landlord_signed', 'tenant_signed')
        ORDER BY updated_at DESC
      `,
            [tenantId]
        );

        if (!leaseRecords?.length) {
            return NextResponse.json(
                { message: "No active leases found" },
                { status: 404 }
            );
        }

        const result = [];

        for (const lease of leaseRecords) {
            /* ---------------------------------------------------------
               FETCH UNIT, PROPERTY & LANDLORD INFO
            --------------------------------------------------------- */
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

            /* ---------------------------------------------------------
               DECRYPT LANDLORD NAME
            --------------------------------------------------------- */
            let landlordName = "Landlord";
            try {
                const first = decryptData(JSON.parse(unit.enc_first_name), SECRET_KEY);
                const last = decryptData(JSON.parse(unit.enc_last_name), SECRET_KEY);
                landlordName = `${first} ${last}`.trim();
            } catch {}

            /* ---------------------------------------------------------
               GET SECURITY DEPOSIT (if ANY)
            --------------------------------------------------------- */
            const [depositRow]: any = await db.query(
                `
          SELECT amount, status
          FROM SecurityDeposit
          WHERE lease_id = ?
          ORDER BY deposit_id DESC
          LIMIT 1
        `,
                [lease.agreement_id]
            );

            const hasSecurityDepositRecord = depositRow?.length > 0;

            /* ---------------------------------------------------------
               GET ADVANCE PAYMENT (if ANY)
            --------------------------------------------------------- */
            const [advanceRow]: any = await db.query(
                `
          SELECT amount, status
          FROM AdvancePayment
          WHERE lease_id = ?
          ORDER BY advance_id DESC
          LIMIT 1
        `,
                [lease.agreement_id]
            );

            const hasAdvanceRecord = advanceRow?.length > 0;

            /* ---------------------------------------------------------
               CHECK PENDING PAYMENT PROOF
            --------------------------------------------------------- */
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

            /* ---------------------------------------------------------
               GET BILLING SETTINGS
            --------------------------------------------------------- */
            const [propertyConfig]: any = await db.query(
                `
          SELECT billingDueDay
          FROM PropertyConfiguration
          WHERE property_id = ?
          LIMIT 1
        `,
                [unit.property_id]
            );

            const billingDueDay = Number(propertyConfig?.[0]?.billingDueDay) || null;

            let due_day = null;
            let due_date = null;

            if (billingDueDay) {
                due_day = billingDueDay;
                const today = new Date();
                const due = new Date(today.getFullYear(), today.getMonth(), billingDueDay);
                due_date = due.toLocaleDateString("en-CA");
            }

            /* ---------------------------------------------------------
               UNIT PHOTOS
            --------------------------------------------------------- */
            const [unitPhotos]: any = await db.query(
                `
          SELECT photo_url
          FROM UnitPhoto
          WHERE unit_id = ?
          ORDER BY id ASC
        `,
                [lease.unit_id]
            );

            const decryptedPhotos =
                unitPhotos?.length > 0
                    ? unitPhotos
                        .map((photo: any) => {
                            try {
                                return decryptData(JSON.parse(photo.photo_url), SECRET_KEY);
                            } catch {
                                return null;
                            }
                        })
                        .filter(Boolean)
                    : [];

            /* ---------------------------------------------------------
               BUILD FINAL RESPONSE
            --------------------------------------------------------- */
            const response: any = {
                ...unit,
                unit_photos: decryptedPhotos,

                agreement_id: lease.agreement_id,
                start_date: lease.start_date,
                end_date: lease.end_date,

                lease_status: lease.status,
                signature_status: lease.status,

                // NEW
                leaseSignature: lease.status,

                has_pending_proof: hasPendingProof,

                // ADDRESS
                street: unit.street,
                brgy_district: unit.brgy_district,
                city: unit.city,
                province: unit.province,
                zip_code: unit.zip_code,

                // BILLING
                due_day,
                due_date,

                landlord_user_id: unit.landlord_user_id,
                landlord_name: landlordName
            };

            // Attach ONLY IF records exist
            if (hasSecurityDepositRecord) {
                response.security_deposit_amount = depositRow[0].amount;
                response.security_deposit_status = depositRow[0].status;
            }

            if (hasAdvanceRecord) {
                response.advance_payment_amount = advanceRow[0].amount;
                response.advance_payment_status = advanceRow[0].status;
            }

            result.push(response);
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
