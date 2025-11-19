import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
    let connection: any;

    try {
        const body = await req.json();
        console.log("Received payload:", body);

        const {
            landlord_id,
            payout_method,
            account_name,
            account_number,
            bank_name
        } = body;

        // Basic validation
        if (!landlord_id || !payout_method || !account_name || !account_number) {
            return NextResponse.json(
                { error: "Missing required fields." },
                { status: 400 }
            );
        }

        connection = await db.getConnection();

        // Check if payout record exists
        const [existing]: any = await connection.query(
            `SELECT payout_id
             FROM LandlordPayoutAccount
             WHERE landlord_id = ?
             LIMIT 1`,
            [landlord_id]
        );

        await connection.beginTransaction();

        if (existing && existing.length > 0) {
            // UPDATE existing payout method
            await connection.query(
                `UPDATE LandlordPayoutAccount
                 SET payout_method = ?,
                     account_name = ?,
                     account_number = ?,
                     bank_name = ?
                 WHERE landlord_id = ?`,
                [payout_method, account_name, account_number, bank_name, landlord_id]
            );

            await connection.commit();

            return NextResponse.json(
                { success: true, message: "Payout details updated successfully." },
                { status: 200 }
            );
        }

        // INSERT new payout record
        await connection.query(
            `INSERT INTO LandlordPayoutAccount
             (landlord_id, payout_method, account_name, account_number, bank_name)
             VALUES (?, ?, ?, ?, ?)`,
            [landlord_id, payout_method, account_name, account_number, bank_name]
        );

        await connection.commit();

        return NextResponse.json(
            { success: true, message: "Payout details saved successfully." },
            { status: 201 }
        );

    } catch (error) {
        console.error("Save payout error:", error);
        if (connection) await connection.rollback();

        return NextResponse.json(
            { error: "Internal server error." },
            { status: 500 }
        );

    } finally {
        if (connection) connection.release();
    }
}
