import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * @route   PUT /api/unitListing/publish
 * @desc    Toggle a unit's published visibility
 * @body    { unit_id: string, publish: boolean }
 */

export async function PUT(req: NextRequest) {
    try {
        const { unit_id, publish } = await req.json();

        /* ---------- VALIDATION ---------- */
        if (!unit_id || typeof publish !== "boolean") {
            return NextResponse.json(
                { success: false, message: "Missing or invalid parameters." },
                { status: 400 }
            );
        }

        /* ---------- SAFEGUARD: PROPERTY MUST BE VERIFIED ---------- */
        if (publish === true) {
            const [[verification]]: any = await db.query(
                `
                SELECT pv.verified, pv.status
                FROM rentalley_db.Unit u
                INNER JOIN rentalley_db.Property p
                    ON p.property_id = u.property_id
                LEFT JOIN rentalley_db.PropertyVerification pv
                    ON pv.property_id = p.property_id
                WHERE u.unit_id = ?
                LIMIT 1
                `,
                [unit_id]
            );

            if (!verification) {
                return NextResponse.json(
                    { success: false, message: "Unit or property not found." },
                    { status: 404 }
                );
            }

            const isVerified =
                verification.verified === 1 ||
                verification.status === "Verified";

            if (!isVerified) {
                return NextResponse.json(
                    {
                        success: false,
                        message:
                            "This property is not verified. You must verify the property before publishing units.",
                    },
                    { status: 403 } // Forbidden is correct
                );
            }
        }

        /* ---------- UPDATE UNIT ---------- */
        const [result]: any = await db.execute(
            `
            UPDATE rentalley_db.Unit
            SET publish = ?, updated_at = CURRENT_TIMESTAMP
            WHERE unit_id = ?
            `,
            [publish ? 1 : 0, unit_id]
        );

        if (result.affectedRows === 0) {
            return NextResponse.json(
                { success: false, message: "Unit not found or update failed." },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            message: publish
                ? "Unit successfully published."
                : "Unit successfully hidden.",
        });

    } catch (error: any) {
        console.error("🔥 Publish toggle failed:", error);
        return NextResponse.json(
            {
                success: false,
                message: "Internal server error",
                error: error.message,
            },
            { status: 500 }
        );
    }
}
