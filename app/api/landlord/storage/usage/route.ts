import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { parse } from "cookie";
import { jwtVerify } from "jose";

export async function GET(req: NextRequest) {
    try {

        const cookieHeader = req.headers.get("cookie");
        const cookies = cookieHeader ? parse(cookieHeader) : null;

        if (!cookies?.token) {
            return NextResponse.json(
                { message: "Unauthorized" },
                { status: 401 }
            );
        }

        const secretKey = new TextEncoder().encode(process.env.JWT_SECRET!);
        const { payload } = await jwtVerify(cookies.token, secretKey);

        const userId = payload.user_id as string;
        if (!userId) {
            return NextResponse.json(
                { message: "Unauthorized" },
                { status: 401 }
            );
        }

        /* -------------------------------------------
           2️⃣ GET & VALIDATE property_id
        ------------------------------------------- */
        const { searchParams } = new URL(req.url);
        const propertyId = searchParams.get("property_id");

        if (!propertyId) {
            return NextResponse.json(
                { message: "Missing property_id" },
                { status: 400 }
            );
        }

        /* -------------------------------------------
           3️⃣ VERIFY LANDLORD OWNS PROPERTY
        ------------------------------------------- */
        const [propRows]: any = await db.query(
            `
      SELECT p.property_id, l.landlord_id
      FROM rentalley_db.Property p
      JOIN rentalley_db.Landlord l ON p.landlord_id = l.landlord_id
      WHERE p.property_id = ? AND l.user_id = ?
      LIMIT 1
      `,
            [propertyId, userId]
        );

        if (!propRows.length) {
            return NextResponse.json(
                { message: "Property not found or access denied" },
                { status: 403 }
            );
        }

        const landlordId = propRows[0].landlord_id;

        /* -------------------------------------------
           4️⃣ CALCULATE STORAGE USAGE
        ------------------------------------------- */
        const [rows]: any = await db.query(
            `
      SELECT COALESCE(SUM(file_size), 0) AS total_bytes
      FROM rentalley_db.PropertyDocument
      WHERE property_id = ? AND landlord_id = ?
      `,
            [propertyId, landlordId]
        );

        /* -------------------------------------------
           5️⃣ RETURN RESULT
        ------------------------------------------- */
        return NextResponse.json({
            property_id: propertyId,
            total_bytes: Number(rows[0]?.total_bytes || 0),
        });

    } catch (error) {
        console.error("[STORAGE_USAGE_API_ERROR]", error);
        return NextResponse.json(
            { message: "Internal server error" },
            { status: 500 }
        );
    }
}
