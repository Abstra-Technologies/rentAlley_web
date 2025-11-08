import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { decryptData } from "@/crypto/encrypt";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const agreement_id = searchParams.get("agreement_id");

        console.log("agreement_id", agreement_id);

        if (!agreement_id) {
            return NextResponse.json(
                { error: "Missing or invalid query parameter: agreement_id" },
                { status: 400 }
            );
        }

        // 🔹 Fetch lease details and tenant signature
        const [rows]: any = await db.query(
            `
      SELECT 
          la.agreement_id,
          la.status AS agreement_status,
          la.agreement_url,
          ls.id AS signature_id,
          ls.status AS signature_status,
          ls.signed_at,
          t.email AS tenant_email_enc,
          p.property_name,
          u.unit_name
      FROM LeaseAgreement la
      LEFT JOIN LeaseSignature ls 
        ON la.agreement_id = ls.agreement_id 
        AND ls.role = 'tenant'
      JOIN Tenant tn ON la.tenant_id = tn.tenant_id
      JOIN User t ON tn.user_id = t.user_id
      JOIN Unit u ON la.unit_id = u.unit_id
      JOIN Property p ON u.property_id = p.property_id
      WHERE la.agreement_id = ?
      LIMIT 1
      `,
            [agreement_id]
        );

        if (!rows || rows.length === 0) {
            return NextResponse.json(
                { error: "No lease found for the given agreement_id" },
                { status: 404 }
            );
        }

        const data = rows[0];

        // 🔹 Decrypt tenant email if encrypted
        let tenantEmail: string | null = null;
        try {
            if (data.tenant_email_enc?.startsWith("{") || data.tenant_email_enc?.startsWith("[")) {
                tenantEmail = decryptData(
                    JSON.parse(data.tenant_email_enc),
                    process.env.ENCRYPTION_SECRET!
                );
            } else {
                tenantEmail = data.tenant_email_enc;
            }
        } catch (err) {
            console.warn(`⚠️ Failed to decrypt tenant email for agreement_id ${agreement_id}`, err);
        }

        // 🔹 Decrypt lease document URL if encrypted
        let leaseUrl: string | null = null;
        try {
            if (data.agreement_url?.startsWith("{") || data.agreement_url?.startsWith("[")) {
                leaseUrl = decryptData(
                    JSON.parse(data.agreement_url),
                    process.env.ENCRYPTION_SECRET!
                );
            }
        } catch (err) {
            console.warn(`⚠️ Failed to decrypt lease URL for agreement_id ${agreement_id}`, err);
        }

        // 🔹 Build simplified tenant signature info
        const tenantSignature = {
            id: data.signature_id ?? null,
            status: data.signature_status ?? "pending",
            signed_at: data.signed_at ?? null,
            email: tenantEmail,
        };

        // 🔹 Return tenant-focused lease status + document
        return NextResponse.json({
            success: true,
            agreement_id: Number(agreement_id),
            agreement_status: data.agreement_status,
            property_name: data.property_name,
            unit_name: data.unit_name,
            agreement_url: leaseUrl,
            tenant_signature: tenantSignature,
            updated_at: new Date().toISOString(),
        });
    } catch (error: any) {
        console.error("❌ Error fetching tenant lease signature:", error);
        return NextResponse.json(
            {
                success: false,
                message: "Failed to fetch tenant lease signature data.",
                error: error.message,
            },
            { status: 500 }
        );
    }
}
