import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { decryptData } from "@/crypto/encrypt";

const SECRET_KEY = process.env.ENCRYPTION_SECRET!;

export async function GET(req: NextRequest) {
    const property_id = req.nextUrl.searchParams.get("property_id");

    if (!property_id) {
        return NextResponse.json({ error: "Missing property_id" }, { status: 400 });
    }

    try {
        // ========================================================
        // 1️⃣ FETCH LEASE AGREEMENTS
        // ========================================================
        const [leaseRows]: any = await db.query(
            `
            SELECT
                la.agreement_id AS lease_id,
                la.start_date,
                la.end_date,
                la.move_in_date,
                la.status AS lease_status,
                la.security_deposit_amount,
                la.advance_payment_amount,
                la.agreement_url,
la.rent_amount,
                u.unit_id,
                u.unit_name,
                u.rent_amount,
                u.property_id,

                p.property_name,
                p.city AS property_city,
                p.province AS property_province,

                t.tenant_id,
                usr.firstName AS enc_firstName,
                usr.lastName AS enc_lastName,
                usr.email AS enc_email,
                usr.phoneNumber AS enc_phoneNumber

            FROM LeaseAgreement la
            LEFT JOIN Unit u ON la.unit_id = u.unit_id
            LEFT JOIN Property p ON u.property_id = p.property_id
            LEFT JOIN Tenant t ON la.tenant_id = t.tenant_id
            LEFT JOIN User usr ON t.user_id = usr.user_id

            WHERE u.property_id = ?
              AND la.status IN (
                    'active','draft','pending','pending_signature',
                    'tenant_signed','landlord_signed'
              )
            ORDER BY la.start_date DESC;
            `,
            [property_id]
        );

        // ========================================================
        // 2️⃣ FETCH SIGNATURES FOR THESE LEASES
        // ========================================================
        const agreementIds = leaseRows.map((l: any) => l.lease_id);

        let landlordSigMap = new Map();
        let tenantSigMap = new Map();

        if (agreementIds.length > 0) {
            const [sigRows]: any = await db.query(
                `
                SELECT agreement_id, role, signed_at, status, email
                FROM LeaseSignature
                WHERE agreement_id IN (?)
                `,
                [agreementIds]
            );

            sigRows.forEach((sig: any) => {
                if (sig.role === "landlord") {
                    landlordSigMap.set(sig.agreement_id, {
                        signed: !!sig.signed_at,
                        signed_at: sig.signed_at,
                        email: sig.email,
                        status: sig.status
                    });
                }

                if (sig.role === "tenant") {
                    tenantSigMap.set(sig.agreement_id, {
                        signed: !!sig.signed_at,
                        signed_at: sig.signed_at,
                        email: sig.email,
                        status: sig.status
                    });
                }
            });
        }

        // ========================================================
        // 3️⃣ FETCH PENDING INVITES
        // ========================================================
        const [inviteRows]: any = await db.query(
            `
            SELECT  
                ic.id AS invite_id,
                ic.email,
                ic.status AS invite_status,
                ic.createdAt,
                ic.expiresAt,
                
                u.unit_id,
                u.unit_name,
                u.rent_amount,
                u.property_id,

                p.property_name,
                p.city AS property_city,
                p.province AS property_province

            FROM InviteCode ic
            JOIN Unit u ON ic.unitId = u.unit_id
            JOIN Property p ON u.property_id = p.property_id
            WHERE u.property_id = ?
              AND ic.status = 'PENDING';
            `,
            [property_id]
        );

        const inviteMap = new Map();
        inviteRows.forEach((inv: any) => inviteMap.set(inv.unit_id, inv));

        // ========================================================
        // 4️⃣ MAP LEASES TO RESPONSE FORMAT
        // ========================================================
        const leases = leaseRows.map((lease: any) => {
            const safeDecrypt = (value: any) => {
                try {
                    return value ? decryptData(JSON.parse(value), SECRET_KEY) : "";
                } catch {
                    return "";
                }
            };

            const firstName = safeDecrypt(lease.enc_firstName);
            const lastName = safeDecrypt(lease.enc_lastName);
            const email = safeDecrypt(lease.enc_email);
            const phone = safeDecrypt(lease.enc_phoneNumber);

            let decryptedUrl = "";
            if (lease.agreement_url) {
                try {
                    decryptedUrl = decryptData(JSON.parse(lease.agreement_url), SECRET_KEY);
                } catch {}
            }

            const invite = inviteMap.get(lease.unit_id);

            const landlordSig = landlordSigMap.get(lease.lease_id) || { signed: false };
            const tenantSig = tenantSigMap.get(lease.lease_id) || { signed: false };

            return {
                type: "lease",
                lease_id: lease.lease_id,

                lease_status: lease.lease_status,
                move_in_date: lease.move_in_date,

                landlord_signed: landlordSig.signed,
                landlord_signed_at: landlordSig.signed_at || null,

                tenant_signed: tenantSig.signed,
                tenant_signed_at: tenantSig.signed_at || null,

                start_date: lease.start_date,
                end_date: lease.end_date,

                unit_id: lease.unit_id,
                unit_name: lease.unit_name,
                rent_amount: lease.rent_amount,

                tenant_id: lease.tenant_id,
                tenant_name: `${firstName} ${lastName}`.trim(),
                tenant_email: email,
                tenant_phone: phone,

                agreement_url: decryptedUrl || null,

                property_id: lease.property_id,
                property_name: lease.property_name,
                property_city: lease.property_city,
                property_province: lease.property_province,

                source: invite ? "invite" : "application",
                invite_id: invite?.invite_id || null,
                invite_email: invite?.email || null,
                invite_created_at: invite?.createdAt || null,
                invite_expires_at: invite?.expiresAt || null
            };
        });

        // ========================================================
        // 5️⃣ MERGE INVITES WITHOUT LEASES
        // ========================================================
        const leaseUnitIds = new Set(leases.map((l: any) => l.unit_id));

        const inviteMapped = inviteRows
            .filter((inv: any) => !leaseUnitIds.has(inv.unit_id))
            .map((invite: any) => ({
                type: "invite",
                invite_id: invite.invite_id,
                invite_email: invite.email,
                created_at: invite.createdAt,
                expires_at: invite.expiresAt,

                unit_id: invite.unit_id,
                unit_name: invite.unit_name,
                rent_amount: invite.rent_amount,

                property_id: invite.property_id,
                property_name: invite.property_name,
                property_city: invite.property_city,
                property_province: invite.property_province
            }));

        const allRecords = [...leases, ...inviteMapped];

        const propertyInfo =
            allRecords.length > 0
                ? {
                    property_id: allRecords[0].property_id,
                    property_name: allRecords[0].property_name,
                    property_city: allRecords[0].property_city,
                    property_province: allRecords[0].property_province
                }
                : null;

        return NextResponse.json(
            { property: propertyInfo, leases: allRecords },
            { status: 200 }
        );

    } catch (err) {
        console.error("❌ Error fetching leases:", err);
        return NextResponse.json(
            { error: "Failed to fetch leases" },
            { status: 500 }
        );
    }
}
