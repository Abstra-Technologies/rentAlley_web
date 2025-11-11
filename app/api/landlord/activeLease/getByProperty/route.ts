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
        const [rows]: any = await db.query(
            `
      SELECT
          la.agreement_id AS lease_id,
          la.start_date,
          la.end_date,
          la.status AS lease_status,
          la.security_deposit_amount,
          la.advance_payment_amount,
          la.is_security_deposit_paid,
          la.is_advance_payment_paid,
          la.agreement_url,

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
               JOIN Unit u ON la.unit_id = u.unit_id
               JOIN Property p ON u.property_id = p.property_id
               JOIN Tenant t ON la.tenant_id = t.tenant_id
               JOIN User usr ON t.user_id = usr.user_id
      WHERE u.property_id = ?
        AND la.status IN ('active', 'draft', 'pending', 'pending_signature')
      ORDER BY la.start_date DESC;
      `,
            [property_id]
        );

        const leases = rows.map((lease: any) => {
            const safeDecrypt = (value: any) => {
                try {
                    return value ? decryptData(JSON.parse(value), SECRET_KEY) : "";
                } catch (err) {
                    console.error("Decryption failed:", err);
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
                } catch (err) {
                    console.error("Agreement URL decryption failed:", err);
                }
            }

            return {
                lease_id: lease.lease_id,
                lease_status: lease.lease_status,
                start_date: lease.start_date,
                end_date: lease.end_date,
                unit_id: lease.unit_id,
                unit_name: lease.unit_name,
                rent_amount: lease.rent_amount,
                tenant_id: lease.tenant_id,
                tenant_name: `${firstName} ${lastName}`.trim(),
                tenant_email: email,
                tenant_phone: phone,
                security_deposit_amount: lease.security_deposit_amount,
                advance_payment_amount: lease.advance_payment_amount,
                is_security_deposit_paid: lease.is_security_deposit_paid,
                is_advance_payment_paid: lease.is_advance_payment_paid,
                agreement_url: decryptedUrl || null,

                property_id: lease.property_id,
                property_name: lease.property_name,
                property_city: lease.property_city,
                property_province: lease.property_province,
            };
        });

        const propertyInfo =
            leases.length > 0
                ? {
                    property_id: leases[0].property_id,
                    property_name: leases[0].property_name,
                    property_city: leases[0].property_city,
                    property_province: leases[0].property_province,
                }
                : null;

        return NextResponse.json({ property: propertyInfo, leases }, { status: 200 });
    } catch (err) {
        console.error("❌ Error fetching active leases:", err);
        return NextResponse.json(
            { error: "Failed to fetch active leases" },
            { status: 500 }
        );
    }
}
