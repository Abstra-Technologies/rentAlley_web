import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { agreement_id, feedback_text, ratings } = body;

        if (!agreement_id || !feedback_text || !ratings) {
            return NextResponse.json(
                { error: "Missing required fields." },
                { status: 400 }
            );
        }

        const requiredKeys = [
            "communication",
            "maintenance",
            "condition",
            "safety",
            "value",
            "professionalism",
            "support",
        ];

        for (const key of requiredKeys) {
            if (
                typeof ratings[key] !== "number" ||
                ratings[key] < 1 ||
                ratings[key] > 5
            ) {
                return NextResponse.json(
                    { error: `Invalid rating value for ${key}.` },
                    { status: 400 }
                );
            }
        }

        const avgRating =
            Object.values(ratings).reduce((a, b) => a + b, 0) / requiredKeys.length;

        // ✅ Insert or Update Review (idempotent per tenant/unit)
        const query = `
            INSERT INTO Review (
                tenant_id,
                unit_id,
                rating_communication,
                rating_maintenance,
                rating_condition,
                rating_safety,
                rating_value,
                rating_professionalism,
                rating_support,
                review_text,
                created_at,
                updated_at
            )
            SELECT
                t.tenant_id,
                u.unit_id,
                ?, ?, ?, ?, ?, ?, ?,
                ?,
                NOW(), NOW()
            FROM LeaseAgreement la
                     JOIN Tenant t ON la.tenant_id = t.tenant_id
                     JOIN Unit u ON la.unit_id = u.unit_id
            WHERE la.agreement_id = ?
            ON DUPLICATE KEY UPDATE
                                 rating_communication = VALUES(rating_communication),
                                 rating_maintenance = VALUES(rating_maintenance),
                                 rating_condition = VALUES(rating_condition),
                                 rating_safety = VALUES(rating_safety),
                                 rating_value = VALUES(rating_value),
                                 rating_professionalism = VALUES(rating_professionalism),
                                 rating_support = VALUES(rating_support),
                                 review_text = VALUES(review_text),
                                 updated_at = NOW();
        `;

        const params = [
            ratings.communication,
            ratings.maintenance,
            ratings.condition,
            ratings.safety,
            ratings.value,
            ratings.professionalism,
            ratings.support,
            feedback_text.trim(),
            agreement_id,
        ];

        await db.execute(query, params);

        return NextResponse.json(
            {
                message: "Feedback submitted successfully",
                average_rating: avgRating.toFixed(2),
            },
            { status: 201 }
        );
    } catch (error: any) {
        console.error("❌ Error submitting feedback:", error);
        return NextResponse.json(
            { error: error.message || "Internal server error while submitting feedback." },
            { status: 500 }
        );
    }
}

// Handle non-POST methods gracefully
export function GET() {
    return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
