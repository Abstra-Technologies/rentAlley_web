import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";


//
//  GET — Fetch checklist requirements
//
export async function GET(req: NextRequest) {
    const agreement_id = req.nextUrl.searchParams.get("agreement_id");

    if (!agreement_id) {
        return NextResponse.json(
            { error: "Missing agreement_id" },
            { status: 400 }
        );
    }

    try {
        // 1️⃣ Fetch setup requirements
        const [reqRows]: any = await db.query(
            `
                SELECT *
                FROM rentalley_db.LeaseSetupRequirements
                WHERE agreement_id = ?
                LIMIT 1
            `,
            [agreement_id]
        );

        const requirements = reqRows?.[0] || null;

        // 2️⃣ Check if LeaseAgreement document is uploaded
        const [agreementRows]: any = await db.query(
            `
            SELECT agreement_url
            FROM rentalley_db.LeaseAgreement
            WHERE agreement_id = ?
            LIMIT 1
            `,
            [agreement_id]
        );

        let document_uploaded = false;

        if (agreementRows.length > 0) {
            const url = agreementRows[0].agreement_url;

            // If encrypted JSON string exists & not empty
            if (url !== null && url !== "" && url !== "null") {
                document_uploaded = true;
            }
        }

        return NextResponse.json(
            {
                success: true,
                requirements,
                document_uploaded, // 🔥 NEW FIELD
            },
            { status: 200 }
        );

    } catch (error) {
        console.error("❌ Error fetching checklist:", error);
        return NextResponse.json(
            { error: "Failed to fetch checklist" },
            { status: 500 }
        );
    }
}



//
//  POST — Create checklist requirements
//
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const {
            agreement_id,
            lease_agreement,
            move_in_checklist,
            security_deposit,
            advance_payment,
            other_essential
        } = body;

        if (!agreement_id) {
            return NextResponse.json(
                { error: "Missing agreement_id" },
                { status: 400 }
            );
        }

        await db.query(
            `
            INSERT INTO rentalley_db.LeaseSetupRequirements
            (agreement_id, lease_agreement, move_in_checklist, security_deposit, advance_payment, other_essential)
            VALUES (?, ?, ?, ?, ?, ?)
            `,
            [
                agreement_id,
                lease_agreement ? 1 : 0,
                move_in_checklist ? 1 : 0,
                security_deposit ? 1 : 0,
                advance_payment ? 1 : 0,
                other_essential ? 1 : 0
            ]
        );

        return NextResponse.json(
            { success: true, message: "Checklist created successfully" },
            { status: 201 }
        );
    } catch (error) {
        console.error("❌ Error creating checklist:", error);
        return NextResponse.json(
            { error: "Failed to create checklist" },
            { status: 500 }
        );
    }
}



//
//  PUT — Update existing checklist
//
export async function PUT(req: NextRequest) {
    try {
        const body = await req.json();
        const {
            agreement_id,
            lease_agreement,
            move_in_checklist,
            security_deposit,
            advance_payment,
            other_essential
        } = body;

        if (!agreement_id) {
            return NextResponse.json(
                { error: "Missing agreement_id" },
                { status: 400 }
            );
        }

        await db.query(
            `
            UPDATE rentalley_db.LeaseSetupRequirements
            SET
                lease_agreement = ?,
                move_in_checklist = ?,
                security_deposit = ?,
                advance_payment = ?,
                other_essential = ?
            WHERE agreement_id = ?
            `,
            [
                lease_agreement ? 1 : 0,
                move_in_checklist ? 1 : 0,
                security_deposit ? 1 : 0,
                advance_payment ? 1 : 0,
                other_essential ? 1 : 0,
                agreement_id
            ]
        );

        return NextResponse.json(
            { success: true, message: "Checklist updated successfully" },
            { status: 200 }
        );
    } catch (error) {
        console.error("❌ Error updating checklist:", error);
        return NextResponse.json(
            { error: "Failed to update checklist" },
            { status: 500 }
        );
    }
}
