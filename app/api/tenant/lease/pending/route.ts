
import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    const tenant_id = req.nextUrl.searchParams.get("tenant_id");

    if (!tenant_id) {
        return NextResponse.json({ error: "tenant_id required" }, { status: 400 });
    }

    let connection;
    try {
        connection = await db.getConnection();

        const [rows] = await connection.execute(
            `
                SELECT la.agreement_id,
                       la.unit_id,
                       la.start_date,
                       la.end_date,
                       la.status AS lease_status,
                       u.unit_name,
                       p.property_name,
                       la.docusign_envelope_id,
                       ls.role,
                       ls.status AS signature_status,
                       ls.signed_at
                FROM LeaseAgreement la
                         JOIN Unit u ON la.unit_id = u.unit_id
                         JOIN Property p ON u.property_id = p.property_id
                         JOIN LeaseSignature ls ON la.agreement_id = ls.agreement_id
                WHERE la.tenant_id = ?
                  AND la.status IN ('pending', 'sent', 'partially_signed')
                  AND ls.role = 'tenant'
            `,
            [tenant_id]
        );

        console.log(rows);

        if ((rows as any[]).length === 0) {
            return NextResponse.json({ pendingLeases: [] });
        }

        // Format leases for the widget
        const leases = (rows as any[]).map((lease) => ({
            agreement_id: lease.agreement_id,
            unit_id: lease.unit_id,
            property_name: lease.property_name,
            unit_name: lease.unit_name,
            start_date: lease.start_date,
            end_date: lease.end_date,
            lease_status: lease.lease_status,
            signature_status: lease.signature_status,
            signed_at: lease.signed_at,
            docusign_envelope_id: lease.docusign_envelope_id,
            signingPageUrl: `/tenant/leaseAgreement/signing?envelopeId=${lease.docusign_envelope_id}`,
        }));

        return NextResponse.json({ pendingLeases: leases });

    } catch (error: any) {
        console.error("Error fetching pending leases:", error);
        return NextResponse.json(
            { error: "Failed to fetch pending leases" },
            { status: 500 }
        );
    } finally {
        if (connection) connection.release();
    }
}

