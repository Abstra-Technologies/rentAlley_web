import { db } from "@/lib/db";
import { decryptData } from "@/crypto/encrypt";
import { NextRequest, NextResponse } from "next/server";

const SECRET_KEY = process.env.ENCRYPTION_SECRET;

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const tenantId = searchParams.get("tenantId");
console.log('tenant id active rent: ' + tenantId);
        if (!tenantId) {
            return NextResponse.json(
                { message: "Tenant ID is required" },
                { status: 400 }
            );
        }

        /* ---------------------------------------------------------
           FETCH LEASE AGREEMENTS (ignore signature status here)
        --------------------------------------------------------- */
        const [leaseRecords]: any = await db.query(
            `
            SELECT 
                agreement_id, start_date, end_date,
                security_deposit_amount, advance_payment_amount,
                tenant_id, unit_id, status
            FROM LeaseAgreement
            WHERE tenant_id = ?
              AND status NOT IN ('draft','cancelled')
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
               GET INDIVIDUAL LANDLORD + TENANT SIGNATURES
            --------------------------------------------------------- */
            const [signatureRows]: any = await db.query(
                `
                SELECT role, status
                FROM LeaseSignature
                WHERE agreement_id = ?
                `,
                [lease.agreement_id]
            );

            let landlordSig = "pending";
            let tenantSig = "pending";

            if (signatureRows?.length) {
                for (const sig of signatureRows) {
                    if (sig.role === "landlord") landlordSig = sig.status;
                    if (sig.role === "tenant") tenantSig = sig.status;
                }
            }

            /* ---------------------------------------------------------
               DETERMINE MERGED leaseSignature STATUS
            --------------------------------------------------------- */
            let leaseSignature = "pending";

            if (landlordSig === "pending" && tenantSig === "pending") {
                leaseSignature = "pending";
            }
            else if (landlordSig === "signed" && tenantSig === "pending") {
                leaseSignature = "landlord_signed";
            }
            else if (landlordSig === "pending" && tenantSig === "signed") {
                leaseSignature = "tenant_signed";
            }
            else if (landlordSig === "signed" && tenantSig === "signed") {
                leaseSignature = "completed";
            }

            /* If LeaseAgreement.status becomes "active", override */
            if (lease.status === "active") {
                leaseSignature = "active";
            }

            /* ---------------------------------------------------------
               FETCH UNIT + PROPERTY + LANDLORD INFO
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

            /* Decrypt Landlord name */
            let landlordName = "Landlord";
            try {
                const first = decryptData(JSON.parse(unit.enc_first_name), SECRET_KEY);
                const last = decryptData(JSON.parse(unit.enc_last_name), SECRET_KEY);
                landlordName = `${first} ${last}`;
            } catch {}

            /* ---------------------------------------------------------
               SECURITY DEPOSIT
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
               ADVANCE PAYMENT
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
               PENDING PROOF
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
               BILLING DAY
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

            const billingDueDay = propertyConfig?.[0]?.billingDueDay || null;

            let due_day = billingDueDay;
            let due_date = null;

            if (billingDueDay) {
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
                unitPhotos?.map((p: any) => {
                    try {
                        return decryptData(JSON.parse(p.photo_url), SECRET_KEY);
                    } catch {
                        return null;
                    }
                }).filter(Boolean) || [];

            /* ---------------------------------------------------------
               FINAL RESPONSE OBJECT
            --------------------------------------------------------- */
            const response: any = {
                ...unit,

                unit_photos: decryptedPhotos,

                agreement_id: lease.agreement_id,
                start_date: lease.start_date,
                end_date: lease.end_date,

                lease_status: lease.status,
                leaseSignature, // ⭐ REAL SIGNATURE STATUS

                has_pending_proof: hasPendingProof,

                street: unit.street,
                brgy_district: unit.brgy_district,
                city: unit.city,
                province: unit.province,
                zip_code: unit.zip_code,

                due_day,
                due_date,

                landlord_user_id: unit.landlord_user_id,
                landlord_name: landlordName,
            };

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
        return NextResponse.json(
            { message: "Internal Server Error" },
            { status: 500 }
        );
    }
}
