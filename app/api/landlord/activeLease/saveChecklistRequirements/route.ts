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
        const [rows]: any = await db.query(
            `
            SELECT *
            FROM rentalley_db.LeaseSetupRequirements
            WHERE agreement_id = ?
            LIMIT 1
            `,
            [agreement_id]
        );

        return NextResponse.json(
            { success: true, requirements: rows?.[0] || null },
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
