/**
 * @route       GET /api/tenant/active-units?tenant_id=<tenant_id>
 * @description
 * This endpoint retrieves the total count and a preview list of active units currently leased
 * by a specific tenant. It’s primarily used in the Tenant Dashboard to display an overview
 * of the tenant’s ongoing leases.
 *
 * @queryParam  {string} tenant_id - The unique identifier of the tenant (required)
 *
 * @response 200 - Success
 * {
 *   "totalActiveUnits": number,   // Total number of active and occupied units
 *   "units": [                    // Small preview list (up to 3 units)
 *     {
 *       "unit_name": string,      // Name of the rented unit
 *       "rent_amount": number,    // Monthly rent of the unit
 *       "property_name": string   // Property where the unit belongs
 *     }
 *   ]
 * }
 *
 * @usedBy Tenant → Dashboard → Active Units Widget
 */

import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: Request) {
    const url = new URL(req.url);
    const tenantId = url.searchParams.get("tenant_id");

    if (!tenantId) {
        return NextResponse.json({ error: "tenant_id is required" }, { status: 400 });
    }

    try {
        const [activeUnits] = await db.query(
            `
                SELECT COUNT(*) as total_active_units
                FROM LeaseAgreement la
                         JOIN Unit u ON la.unit_id = u.unit_id
                WHERE la.tenant_id = ? AND la.status = 'active' AND u.status = 'occupied'
            `,
            [tenantId]
        );

        // Fetch small list of latest active units (limit 3)
        const [unitList] = await db.query(
            `
                SELECT 
                    la.agreement_id,
                    u.unit_name, 
                    u.rent_amount, 
                    p.property_name
                FROM LeaseAgreement la
                         JOIN Unit u ON la.unit_id = u.unit_id
                         JOIN Property p ON u.property_id = p.property_id
                WHERE la.tenant_id = ? AND la.status = 'active' AND u.status = 'occupied'
                ORDER BY la.start_date DESC
                LIMIT 3
            `,
            [tenantId]
        );

        return NextResponse.json({
            // @ts-ignore
            totalActiveUnits: activeUnits[0]?.total_active_units || 0,
            units: unitList,
        });
    } catch (err) {
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}