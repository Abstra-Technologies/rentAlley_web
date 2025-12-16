import { NextRequest, NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { db } from "@/lib/db";
import { decryptData } from "@/crypto/encrypt";

const SECRET_KEY = process.env.ENCRYPTION_SECRET!;

/* --------------------------------------------------
   CACHED QUERY (per landlord)
-------------------------------------------------- */
const getCurrentTenantsCached = unstable_cache(
    async (landlord_id: string) => {
        const query = `
      SELECT
        t.tenant_id,
        t.employment_type,
        u.occupation,
        u.firstName,
        u.lastName,
        u.email,
        u.phoneNumber,
        u.profilePicture,
        la.unit_id,
        un.unit_name,
        p.property_name,
        la.agreement_id,
        la.start_date,
        la.end_date,
        la.status AS lease_status,
        la.agreement_url,
        ls_tenant.status AS tenant_signature_status,
        ls_landlord.status AS landlord_signature_status
      FROM Tenant t
      JOIN LeaseAgreement la ON t.tenant_id = la.tenant_id
      JOIN Unit un ON la.unit_id = un.unit_id
      JOIN Property p ON un.property_id = p.property_id
      JOIN User u ON t.user_id = u.user_id
      LEFT JOIN LeaseSignature ls_tenant 
            ON la.agreement_id = ls_tenant.agreement_id AND ls_tenant.role = 'tenant'
      LEFT JOIN LeaseSignature ls_landlord 
            ON la.agreement_id = ls_landlord.agreement_id AND ls_landlord.role = 'landlord'
      WHERE la.status = 'active'
        AND p.landlord_id = ?
      ORDER BY la.start_date DESC
    `;

        const [rows] = await db.execute(query, [landlord_id]);
        const tenants = rows as any[];

        const tenantMap = new Map<number, any>();

        for (const tenant of tenants) {
            const email = decryptData(JSON.parse(tenant.email), SECRET_KEY);
            const firstName = decryptData(JSON.parse(tenant.firstName), SECRET_KEY);
            const lastName = decryptData(JSON.parse(tenant.lastName), SECRET_KEY);

            const phoneNumber = tenant.phoneNumber
                ? decryptData(JSON.parse(tenant.phoneNumber), SECRET_KEY)
                : null;

            const profilePicture = tenant.profilePicture
                ? decryptData(JSON.parse(tenant.profilePicture), SECRET_KEY)
                : null;

            const agreementUrl = tenant.agreement_url
                ? decryptData(JSON.parse(tenant.agreement_url), SECRET_KEY)
                : null;

            if (!tenantMap.has(tenant.tenant_id)) {
                tenantMap.set(tenant.tenant_id, {
                    tenant_id: tenant.tenant_id,
                    firstName,
                    lastName,
                    email,
                    phoneNumber,
                    profilePicture,
                    employment_type: tenant.employment_type,
                    occupation: tenant.occupation,
                    units: [],
                    agreements: [],
                    property_names: new Set<string>(),
                });
            }

            const entry = tenantMap.get(tenant.tenant_id);

            if (!entry.units.some((u: any) => u.unit_id === tenant.unit_id)) {
                entry.units.push({
                    unit_id: tenant.unit_id,
                    unit_name: tenant.unit_name,
                });
            }

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
        }

        return Array.from(tenantMap.values()).map((t) => ({
            ...t,
            property_names: Array.from(t.property_names),
        }));
    },

    /* 🔑 Cache key */
    (landlord_id: string) => ["current-tenants", landlord_id],

    /* ⏱ Cache config */
    {
        revalidate: 120, // 2 minutes (safe for tenants)
        tags: ["current-tenants"],
    }
);

/* --------------------------------------------------
   API HANDLER
-------------------------------------------------- */
export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const landlord_id = searchParams.get("landlord_id");

    if (!landlord_id) {
        return NextResponse.json(
            { message: "Missing landlord_id" },
            { status: 400 }
        );
    }

    try {
        const result = await getCurrentTenantsCached(landlord_id);
        return NextResponse.json(result, { status: 200 });
    } catch (error) {
        console.error("[CURRENT_TENANTS_CACHE_ERROR]", error);
        return NextResponse.json(
            { message: "Internal Server Error" },
            { status: 500 }
        );
    }
}
