import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
    const connection = await db.getConnection();

    try {
        let body: any = {};
        try {
            body = await req.json();
        } catch {
            body = {};
        }

        const { user_id } = body;

        if (!user_id) {
            return NextResponse.json(
                { error: "Missing user_id" },
                { status: 400 }
            );
        }

        await connection.beginTransaction();

        /* ===============================
           1️⃣ Get Landlord Info
        ================================ */
        const [landlordRows]: any = await connection.query(
            `
            SELECT l.landlord_id,
                   CONCAT(u.firstName, ' ', u.lastName) AS full_name,
                   u.email
            FROM rentalley_db.Landlord l
            JOIN rentalley_db.User u ON l.user_id = u.user_id
            WHERE l.user_id = ?
            LIMIT 1
            `,
            [user_id]
        );

        if (!landlordRows.length) {
            throw new Error("Landlord not found");
        }

        const landlord = landlordRows[0];
        const landlord_id: string = landlord.landlord_id;
        const full_name: string = landlord.full_name;
        const email: string = landlord.email;

        /* ===============================
           2️⃣ Enforce 50 Beta Limit
        ================================ */
        const [betaCountRows]: any = await connection.query(
            `SELECT COUNT(*) as total FROM rentalley_db.BetaUsers`
        );

        if (betaCountRows[0].total >= 50) {
            throw new Error("Beta program is full. All 50 slots are taken.");
        }

        /* ===============================
           3️⃣ Prevent Duplicate Beta Entry
        ================================ */
        const [existingBeta]: any = await connection.query(
            `
            SELECT beta_id 
            FROM rentalley_db.BetaUsers
            WHERE landlord_id = ?
            LIMIT 1
            `,
            [landlord_id]
        );

        if (existingBeta.length > 0) {
            throw new Error("You are already registered in the Beta program.");
        }

        /* ===============================
           4️⃣ Prevent Existing Subscription
        ================================ */
        const [existingSubs]: any = await connection.query(
            `
            SELECT subscription_id 
            FROM rentalley_db.Subscription
            WHERE landlord_id = ?
            LIMIT 1
            `,
            [landlord_id]
        );

        if (existingSubs.length > 0) {
            throw new Error(
                "You already have a subscription. Beta is only available for new landlords."
            );
        }

        /* ===============================
           5️⃣ Optional Stats Calculation
        ================================ */
        const [propertyCount]: any = await connection.query(
            `
            SELECT COUNT(*) as total
            FROM rentalley_db.Property
            WHERE landlord_id = ?
            `,
            [landlord_id]
        );

        const properties_count = propertyCount[0].total;

        /* ===============================
           6️⃣ Insert into BetaUsers
        ================================ */
        await connection.query(
            `
            INSERT INTO rentalley_db.BetaUsers (
                landlord_id,
                full_name,
                email,
                properties_count,
                avg_units_per_property,
                region,
                province,
                city,
                status,
                is_activated
            ) VALUES (
                ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
            )
            `,
            [
                landlord_id,
                full_name,
                email,
                properties_count,
                0, // avg_units_per_property (set properly later if needed)
                "NCR",        // replace dynamically if available
                "Metro Manila",
                "Manila",
                "approved",
                1,
            ]
        );

        /* ===============================
           7️⃣ Create Beta Subscription
        ================================ */
        await connection.query(
            `
            INSERT INTO rentalley_db.Subscription (
                landlord_id,
                plan_name,
                                                   plan_code,
                start_date,
                end_date,
                payment_status,
                request_reference_number,
                is_trial,
                amount_paid,
                is_active
            ) VALUES (
                ?,
                'Beta Program',
                'BETA',
                CURDATE(),
                DATE_ADD(CURDATE(), INTERVAL 60 DAY),
                'paid',
                CONCAT('BETA-', UUID()),
                1,
                0.00,
                1
            )
            `,
            [landlord_id]
        );

        await connection.commit();

        return NextResponse.json(
            {
                success: true,
                message:
                    "Beta activated successfully. Your 60-day access starts today.",
            },
            { status: 201 }
        );

    } catch (error: any) {
        await connection.rollback();
        console.error("[BETA_ACTIVATION_ERROR]", error);

        return NextResponse.json(
            {
                error:
                    error.message ||
                    "Failed to activate beta program",
            },
            { status: 400 }
        );
    } finally {
        connection.release();
    }
}
