import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { decryptData } from "@/crypto/encrypt";

const SECRET_KEY = process.env.ENCRYPTION_SECRET;

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const landlord_id = searchParams.get("landlord_id");

    if (!landlord_id) {
        return NextResponse.json({ message: "Missing landlord_id" }, { status: 400 });
    }

    try {
        const query = `
      SELECT
        t.tenant_id,
        t.employment_type,
        u.occupation,
        u.firstName,
        u.lastName,
        u.email,
        la.unit_id,
        un.unit_name,
        p.property_name,
        la.agreement_id,
        la.start_date,
        la.end_date,
        la.status as lease_status,
        la.agreement_url,
        ls_tenant.status as tenant_signature_status,
        ls_landlord.status as landlord_signature_status
      FROM Tenant t
        JOIN LeaseAgreement la ON t.tenant_id = la.tenant_id
        JOIN Unit un ON la.unit_id = un.unit_id
        JOIN Property p ON un.property_id = p.property_id
        JOIN User u ON t.user_id = u.user_id
        LEFT JOIN LeaseSignature ls_tenant 
            ON la.agreement_id = ls_tenant.agreement_id AND ls_tenant.role = 'tenant'
        LEFT JOIN LeaseSignature ls_landlord 
            ON la.agreement_id = ls_landlord.agreement_id AND ls_landlord.role = 'landlord'
      WHERE la.status = 'active' AND p.landlord_id = ?
      ORDER BY la.start_date DESC
    `;

        const [rows] = await db.execute(query, [landlord_id]);
        const tenants = rows as any[];

        // --- 🔹 Group by tenant_id
        const tenantMap = new Map();

        tenants.forEach((tenant) => {
            const email = decryptData(JSON.parse(tenant.email), SECRET_KEY);
            const firstName = decryptData(JSON.parse(tenant.firstName), SECRET_KEY);
            const lastName = decryptData(JSON.parse(tenant.lastName), SECRET_KEY);
            const agreementUrl = tenant.agreement_url
                ? decryptData(JSON.parse(tenant.agreement_url), SECRET_KEY)
                : null;

            if (!tenantMap.has(tenant.tenant_id)) {
                tenantMap.set(tenant.tenant_id, {
                    tenant_id: tenant.tenant_id,
                    firstName,
                    lastName,
                    email,
                    employment_type: tenant.employment_type,
                    occupation: tenant.occupation,
                    units: [],
                    agreements: [],
                    property_names: new Set(),
                });
            }

            const entry = tenantMap.get(tenant.tenant_id);

            // Append unique units
            if (!entry.units.some((u) => u.unit_id === tenant.unit_id)) {
                entry.units.push({ unit_id: tenant.unit_id, unit_name: tenant.unit_name });
            }

            // Append agreements
            entry.agreements.push({
                agreement_id: tenant.agreement_id,
                start_date: tenant.start_date,
                end_date: tenant.end_date,
                lease_status: tenant.lease_status,
                agreement_url: agreementUrl,
                tenant_signature_status: tenant.tenant_signature_status,
                landlord_signature_status: tenant.landlord_signature_status,
            });

            entry.property_names.add(tenant.property_name);
        });

        const result = Array.from(tenantMap.values()).map((t) => ({
            ...t,
            property_names: Array.from(t.property_names),
        }));

        return NextResponse.json(result);
    } catch (error) {
        console.error("Database error:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}
