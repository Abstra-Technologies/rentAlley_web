import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

/* ======================================================
   GET — Fetch checklist + computed setup status
====================================================== */
export async function GET(req: NextRequest) {
    const agreement_id = req.nextUrl.searchParams.get("agreement_id");

    if (!agreement_id) {
        return NextResponse.json(
            { error: "Missing agreement_id" },
            { status: 400 }
        );
    }

    try {
        const [[requirements]]: any = await db.query(
            `
                SELECT *
                FROM rentalley_db.LeaseSetupRequirements
                WHERE agreement_id = ?
                LIMIT 1
            `,
            [agreement_id]
        );

        const [[lease]]: any = await db.query(
            `
                SELECT agreement_url, start_date, end_date, status
                FROM rentalley_db.LeaseAgreement
                WHERE agreement_id = ?
                LIMIT 1
            `,
            [agreement_id]
        );

        const document_uploaded =
            !!lease?.agreement_url && lease.agreement_url !== "null";

        const setup_completed = computeSetupCompleted(
            requirements,
            lease,
            document_uploaded
        );

        return NextResponse.json({
            success: true,
            requirements: requirements || null,
            document_uploaded,
            lease_start_date: lease?.start_date || null,
            lease_end_date: lease?.end_date || null,
            setup_completed,
            lease_status: lease?.status,
        });
    } catch (error) {
        console.error("❌ Error fetching checklist:", error);
        return NextResponse.json(
            { error: "Failed to fetch checklist" },
            { status: 500 }
        );
    }
}

/* ======================================================
   POST — Create checklist OR dates-only setup
====================================================== */
export async function POST(req: NextRequest) {
    try {
        const {
            agreement_id,
            lease_agreement = false,
            move_in_checklist = false,
            move_out_checklist = false,
            security_deposit = false,
            advance_payment = false,
            other_essential = false,
            lease_start_date,
            lease_end_date,
        } = await req.json();

        if (!agreement_id) {
            return NextResponse.json(
                { error: "Missing agreement_id" },
                { status: 400 }
            );
        }

        const hasChecklist =
            lease_agreement ||
            move_in_checklist ||
            move_out_checklist ||
            security_deposit ||
            advance_payment ||
            other_essential;

        if (hasChecklist) {
            await db.query(
                `
                    INSERT INTO rentalley_db.LeaseSetupRequirements
                    (
                        agreement_id,
                        lease_agreement,
                        move_in_checklist,
                        move_out_checklist,
                        security_deposit,
                        advance_payment,
                        other_essential
                    )
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                `,
                [
                    agreement_id,
                    lease_agreement ? 1 : 0,
                    move_in_checklist ? 1 : 0,
                    move_out_checklist ? 1 : 0,
                    security_deposit ? 1 : 0,
                    advance_payment ? 1 : 0,
                    other_essential ? 1 : 0,
                ]
            );
        }

        if (lease_start_date || lease_end_date) {
            await db.query(
                `
                    UPDATE rentalley_db.LeaseAgreement
                    SET
                        start_date = COALESCE(?, start_date),
                        end_date   = COALESCE(?, end_date)
                    WHERE agreement_id = ?
                `,
                [lease_start_date || null, lease_end_date || null, agreement_id]
            );
        }

        await maybeActivateLease(agreement_id);

        return NextResponse.json({
            success: true,
            message: "Checklist saved and lease evaluated",
        });
    } catch (error) {
        console.error("❌ Error creating checklist:", error);
        return NextResponse.json(
            { error: "Failed to create checklist" },
            { status: 500 }
        );
    }
}

/* ======================================================
   PUT — Update checklist + re-evaluate lease
====================================================== */
export async function PUT(req: NextRequest) {
    try {
        const {
            agreement_id,
            lease_agreement,
            move_in_checklist,
            move_out_checklist, // ✅ NEW
            security_deposit,
            advance_payment,
            other_essential,
            lease_start_date,
            lease_end_date,
        } = await req.json();

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
                    lease_agreement     = COALESCE(?, lease_agreement),
                    move_in_checklist   = COALESCE(?, move_in_checklist),
                    move_out_checklist  = COALESCE(?, move_out_checklist),
                    security_deposit    = COALESCE(?, security_deposit),
                    advance_payment     = COALESCE(?, advance_payment),
                    other_essential     = COALESCE(?, other_essential)
                WHERE agreement_id = ?
            `,
            [
                lease_agreement !== undefined ? (lease_agreement ? 1 : 0) : null,
                move_in_checklist !== undefined ? (move_in_checklist ? 1 : 0) : null,
                move_out_checklist !== undefined ? (move_out_checklist ? 1 : 0) : null,
                security_deposit !== undefined ? (security_deposit ? 1 : 0) : null,
                advance_payment !== undefined ? (advance_payment ? 1 : 0) : null,
                other_essential !== undefined ? (other_essential ? 1 : 0) : null,
                agreement_id,
            ]
        );

        if (lease_start_date !== undefined || lease_end_date !== undefined) {
            await db.query(
                `
                    UPDATE rentalley_db.LeaseAgreement
                    SET
                        start_date = COALESCE(?, start_date),
                        end_date   = COALESCE(?, end_date)
                    WHERE agreement_id = ?
                `,
                [lease_start_date || null, lease_end_date || null, agreement_id]
            );
        }

        await maybeActivateLease(agreement_id);

        return NextResponse.json({
            success: true,
            message: "Checklist updated and lease evaluated",
        });
    } catch (error) {
        console.error("❌ Error updating checklist:", error);
        return NextResponse.json(
            { error: "Failed to update checklist" },
            { status: 500 }
        );
    }
}

/* ======================================================
   HELPER — Decide if lease should be ACTIVE
====================================================== */
async function maybeActivateLease(agreement_id: string) {
    const [[requirements]]: any = await db.query(
        `
        SELECT *
        FROM rentalley_db.LeaseSetupRequirements
        WHERE agreement_id = ?
        LIMIT 1
        `,
        [agreement_id]
    );

    const [[lease]]: any = await db.query(
        `
        SELECT agreement_url, start_date, status
        FROM rentalley_db.LeaseAgreement
        WHERE agreement_id = ?
        LIMIT 1
        `,
        [agreement_id]
    );

    if (!lease) return;

    const document_uploaded =
        !!lease.agreement_url && lease.agreement_url !== "null";

    /**
     * 🟢 CASE 1: NO CHECKLIST → dates-only setup
     */
    if (!requirements) {
        if (lease.start_date && lease.status !== "active") {
            await db.query(
                `
                UPDATE rentalley_db.LeaseAgreement
                SET status = 'active'
                WHERE agreement_id = ?
                `,
                [agreement_id]
            );
        }
        return;
    }

    /**
     * 🟢 CASE 2: CHECKLIST EXISTS → validate
     */
    const setup_completed =
        (!requirements.lease_agreement || document_uploaded) &&
        (!requirements.move_in_checklist || lease.start_date) &&
        (!requirements.security_deposit || true) &&
        (!requirements.advance_payment || true);

    if (setup_completed && lease.status !== "active") {
        await db.query(
            `
            UPDATE rentalley_db.LeaseAgreement
            SET status = 'active'
            WHERE agreement_id = ?
            `,
            [agreement_id]
        );
    }
}

/* ======================================================
   PURE FUNCTION — used by GET
====================================================== */
function computeSetupCompleted(
    requirements: any,
    lease: any,
    document_uploaded: boolean
) {
    if (!lease) return false;

    // dates-only
    if (!requirements) {
        return !!lease.start_date;
    }

    return (
        (!requirements.lease_agreement || document_uploaded) &&
        (!requirements.move_in_checklist || lease.start_date) &&
        (!requirements.security_deposit || true) &&
        (!requirements.advance_payment || true)
    );
}
