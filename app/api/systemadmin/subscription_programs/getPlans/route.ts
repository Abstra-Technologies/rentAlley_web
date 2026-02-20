import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/auth/adminAuth";

export async function GET(request: NextRequest) {
    try {
        // 🔐 Verify Admin
        // const auth = await verifyAdmin(request);
        //
        // if ("error" in auth) {
        //     return NextResponse.json(
        //         { success: false, message: auth.error },
        //         { status: auth.status }
        //     );
        // }

        // Optional: role restriction
        // if (auth.role !== "super_admin") {
        //   return NextResponse.json({ message: "Forbidden" }, { status: 403 });
        // }

        // 📦 Fetch Plans
        const [plans]: any = await db.query(`
        SELECT 
            plan_id,
            plan_code,
            name,
            price,
            billing_cycle,
            is_active,
            created_at,
            updated_at
        FROM Plan
        ORDER BY created_at DESC
    `);

        return NextResponse.json(plans);

    } catch (error) {
        console.error("ADMIN GET PLANS ERROR:", error);

        return NextResponse.json(
            { success: false, message: "Failed to fetch plans" },
            { status: 500 }
        );
    }
}
