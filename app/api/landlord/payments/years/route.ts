import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const landlordId = searchParams.get("landlord_id");

    if (!landlordId) {
        return NextResponse.json(
            { error: "Missing landlord_id" },
            { status: 400 }
        );
    }

    const [rows]: any = await db.query(
        `
    SELECT MIN(YEAR(p.payment_date)) AS first_year
    FROM Payment p
    JOIN LeaseAgreement la ON p.agreement_id = la.agreement_id
    JOIN Unit u ON la.unit_id = u.unit_id
    JOIN Property pr ON u.property_id = pr.property_id
    WHERE pr.landlord_id = ?
    `,
        [landlordId]
    );

    const firstYear = rows?.[0]?.first_year;

    return NextResponse.json({
        firstYear,
        currentYear: new Date().getFullYear(),
    });
}
