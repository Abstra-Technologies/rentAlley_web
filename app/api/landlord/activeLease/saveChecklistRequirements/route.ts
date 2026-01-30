import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

/* ======================================================
   GET — Fetch checklist + computed setup status
====================================================== */
export async function GET(req: NextRequest) {
    const agreement_id = req.nextUrl.searchParams.get("agreement_id");

    if (!agreement_id) {
        return NextResponse.json({ error: "Missing agreement_id" }, { status: 400 });
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
            SELECT start_date, end_date, agreement_url, status
            FROM rentalley_db.LeaseAgreement
            WHERE agreement_id = ?
            LIMIT 1
            `,
            [agreement_id]
        );

        if (!lease) {
            return NextResponse.json({ error: "Lease not found" }, { status: 404 });
        }

        const document_uploaded =
            !!lease.agreement_url && lease.agreement_url !== "null";

        const setup_completed = computeSetupCompleted(
            requirements,
            lease,
            document_uploaded
        );

        return NextResponse.json({
            success: true,
            requirements: requirements || null,
            document_uploaded,
            lease_start_date: lease.start_date,
            lease_end_date: lease.end_date,
            lease_status: lease.status,
            setup_completed,
        });
    } catch (error) {
        console.error("❌ GET lease setup failed:", error);
        return NextResponse.json(
            { error: "Failed to fetch lease setup" },
            { status: 500 }
        );
    }
}

/* ======================================================
   POST — Safe create/update (idempotent)
   - Dates-only = UPDATE ONLY
   - Checklist = UPSERT
====================================================== */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { agreement_id } = body;

        if (!agreement_id) {
            return NextResponse.json({ error: "Missing agreement_id" }, { status: 400 });
        }

        /* -----------------------------------------------
           1️⃣ Update lease dates (NO side effects)
        ----------------------------------------------- */
        if (body.lease_start_date || body.lease_end_date) {
            await db.query(
                `
                UPDATE rentalley_db.LeaseAgreement
                SET
                    start_date = COALESCE(?, start_date),
                    end_date   = COALESCE(?, end_date)
                WHERE agreement_id = ?
                `,
                [
                    body.lease_start_date ?? null,
                    body.lease_end_date ?? null,
                    agreement_id,
                ]
            );
        }

        /* -----------------------------------------------
           2️⃣ Checklist UPSERT (only if any flag exists)
        ----------------------------------------------- */
        const checklistKeys = [
            "lease_agreement",
            "move_in_checklist",
            "move_out_checklist",
            "security_deposit",
            "advance_payment",
            "other_essential",
        ];

        const hasChecklist = checklistKeys.some((key) => key in body);

        if (hasChecklist) {
            await db.query(
                `
                INSERT INTO rentalley_db.LeaseSetupRequirements (
                    agreement_id,
                    lease_agreement,
                    move_in_checklist,
                    move_out_checklist,
                    security_deposit,
                    advance_payment,
                    other_essential
                )
                VALUES (?, ?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE
                    lease_agreement    = VALUES(lease_agreement),
                    move_in_checklist  = VALUES(move_in_checklist),
                    move_out_checklist = VALUES(move_out_checklist),
                    security_deposit   = VALUES(security_deposit),
                    advance_payment    = VALUES(advance_payment),
                    other_essential    = VALUES(other_essential)
                `,
                [
                    agreement_id,
                    body.lease_agreement ? 1 : 0,
                    body.move_in_checklist ? 1 : 0,
                    body.move_out_checklist ? 1 : 0,
                    body.security_deposit ? 1 : 0,
                    body.advance_payment ? 1 : 0,
                    body.other_essential ? 1 : 0,
                ]
            );
        }

        await maybeActivateLease(agreement_id);

        return NextResponse.json({
            success: true,
            message: "Lease setup saved successfully",
        });
    } catch (error) {
        console.error("❌ POST lease setup failed:", error);
        return NextResponse.json(
            { error: "Failed to save lease setup" },
            { status: 500 }
        );
    }
}

/* ======================================================
   PUT — Explicit update (alias of POST for safety)
====================================================== */
export async function PUT(req: NextRequest) {
    return POST(req);
}

/* ======================================================
   HELPER — Activate lease safely (NO side effects)
====================================================== */
async function maybeActivateLease(agreement_id: string) {
    const [[lease]]: any = await db.query(
        `
        SELECT start_date, agreement_url, status
        FROM rentalley_db.LeaseAgreement
        WHERE agreement_id = ?
        LIMIT 1
        `,
        [agreement_id]
    );

    if (!lease || lease.status === "active") return;

    const [[requirements]]: any = await db.query(
        `
        SELECT *
        FROM rentalley_db.LeaseSetupRequirements
        WHERE agreement_id = ?
        LIMIT 1
        `,
        [agreement_id]
    );

    const document_uploaded =
        !!lease.agreement_url && lease.agreement_url !== "null";

    /* Dates-only activation */
    if (!requirements) {
        if (lease.start_date) {
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

    /* Checklist-based activation */
    const setup_completed =
        (!requirements.lease_agreement || document_uploaded) &&
        (!requirements.move_in_checklist || lease.start_date) &&
        (!requirements.security_deposit || true) &&
        (!requirements.advance_payment || true);

    if (setup_completed) {
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
   PURE FUNCTION — Setup completion checker
====================================================== */
function computeSetupCompleted(
    requirements: any,
    lease: any,
    document_uploaded: boolean
) {
    if (!lease) return false;

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
