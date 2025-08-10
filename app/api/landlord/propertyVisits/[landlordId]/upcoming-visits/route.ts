import { NextResponse } from "next/server";
import { db } from "@/lib/db";

interface Params {
    landlordId: string;
}

interface Visit {
    visit_id: number;
    visit_date: string;
    visit_time: string | null;
    status: string;
    unit_name: string | null;
    firstName: string | null;
    lastName: string | null;
}

export async function GET(
    _request: Request,
    { params }: { params: Params }
) {
    const { landlordId } = params;

    if (!landlordId) {
        return NextResponse.json({ error: "Missing landlordId" }, { status: 400 });
    }

    const sql = `
        SELECT
            pv.visit_id,
            pv.visit_date,
            pv.visit_time,
            pv.status,
            u.unit_name,
            usr.firstName,
            usr.lastName
        FROM PropertyVisit pv
                 JOIN Unit u ON pv.unit_id = u.unit_id
                 JOIN Property p ON u.property_id = p.property_id
                 LEFT JOIN User usr ON pv.tenant_id = usr.user_id
        WHERE p.landlord_id = ? AND pv.visit_date >= CURDATE()
        ORDER BY pv.visit_date, pv.visit_time
    `;

    try {
        // @ts-ignore
        const [rows] = await db.query<Visit[]>(sql, [landlordId]);

        // Format tenant_name by combining firstName and lastName (handle nulls)
        const formatted = rows.map((v) => ({
            visit_id: v.visit_id,
            visit_date: v.visit_date,
            visit_time: v.visit_time,
            status: v.status,
            unit_name: v.unit_name,
            tenant_name:
                v.firstName || v.lastName
                    ? `${v.firstName ?? ""} ${v.lastName ?? ""}`.trim()
                    : null,
        }));

        return NextResponse.json(formatted);
    } catch (error) {
        console.error("Error fetching upcoming visits:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
