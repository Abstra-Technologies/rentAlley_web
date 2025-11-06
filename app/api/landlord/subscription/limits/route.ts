// /app/api/landlord/property-access/check/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { listingLimits } from "@/constant/subscription/limits";

export async function POST(req: NextRequest) {
    try {
        const { landlord_id, property_id } = await req.json();

        if (!landlord_id || !property_id) {
            return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
        }

        // ✅ 1. Verify property ownership
        const [propertyRows]: any = await db.query(
            `
      SELECT property_id, landlord_id, created_at
      FROM Property
      WHERE property_id = ? AND landlord_id = ?
      `,
            [property_id, landlord_id]
        );

        if (propertyRows.length === 0) {
            return NextResponse.json(
                { error: "Forbidden: This property is not owned by you" },
                { status: 403 }
            );
        }

        // ✅ 2. Get landlord’s active subscription plan
        const [subscriptionRows]: any = await db.query(
            `
      SELECT plan_name, is_active
      FROM Subscription
      WHERE landlord_id = ? AND is_active = 1
      ORDER BY created_at DESC
      LIMIT 1
      `,
            [landlord_id]
        );

        if (subscriptionRows.length === 0) {
            return NextResponse.json(
                { error: "No active subscription found" },
                { status: 403 }
            );
        }

        const planName = subscriptionRows[0].plan_name?.trim() || "Free Plan";

        // 3. Get plan limits from your constant
        const planLimits = listingLimits[planName];
        if (!planLimits) {
            return NextResponse.json(
                { error: `Invalid plan '${planName}'` },
                { status: 400 }
            );
        }

        const maxProperties = planLimits.maxProperties;

        // 4. Count landlord’s total properties
        const [countRows]: any = await db.query(
            `SELECT COUNT(*) AS total_properties FROM Property WHERE landlord_id = ?`,
            [landlord_id]
        );

        const totalProperties = countRows[0].total_properties;

        // ✅ 5. Identify properties beyond plan limit (ordered by creation date)
        const [orderedRows]: any = await db.query(
            `
      SELECT property_id
      FROM Property
      WHERE landlord_id = ?
      ORDER BY created_at ASC
      `,
            [landlord_id]
        );

        const exceedingIds = orderedRows
            .slice(maxProperties)
            .map((p: any) => p.property_id);

        const isLocked = exceedingIds.includes(Number(property_id));

        if (isLocked) {
            return NextResponse.json(
                {
                    error: "Locked: This property exceeds your plan limit",
                    maxAllowed: maxProperties,
                    totalProperties,
                    planName,
                },
                { status: 403 }
            );
        }

        return NextResponse.json({
            ok: true,
            planName,
            totalProperties,
            maxAllowed: maxProperties,
        });
    } catch (error) {
        console.error("[CHECK_PROPERTY_ACCESS_ERROR]", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
