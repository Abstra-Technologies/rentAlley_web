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
        /* ---------- CHECKLIST ---------- */
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

        /* ---------- LEASE ---------- */
        const [leaseRows]: any = await db.query(
            `
      SELECT agreement_url, start_date, end_date, status
      FROM rentalley_db.LeaseAgreement
      WHERE agreement_id = ?
      LIMIT 1
      `,
            [agreement_id]
        );

        const lease = leaseRows?.[0] || {};

        const document_uploaded =
            !!lease.agreement_url && lease.agreement_url !== "null";

        /* ---------- COMPUTE COMPLETION ---------- */
        const setup_completed =
            requirements &&
            (!requirements.lease_agreement || document_uploaded) &&
            (!requirements.move_in_checklist || lease.start_date) &&
            (!requirements.security_deposit || true) &&
            (!requirements.advance_payment || true);

        return NextResponse.json({
            success: true,
            requirements,
            document_uploaded,
            lease_start_date: lease.start_date || null,
            lease_end_date: lease.end_date || null,
            setup_completed,
            lease_status: lease.status,
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
   POST — Create checklist + auto-activate lease
====================================================== */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const {
            agreement_id,
            lease_agreement = false,
            move_in_checklist = false,
            security_deposit = false,
            advance_payment = false,
            other_essential = false,
            lease_start_date,
            lease_end_date,
        } = body;

        if (!agreement_id) {
            return NextResponse.json({ error: "Missing agreement_id" }, { status: 400 });
        }

        /* ---------- INSERT CHECKLIST ---------- */
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
                other_essential ? 1 : 0,
            ]
        );

        /* ---------- SAVE DATES ---------- */
        if (lease_start_date || lease_end_date) {
            await db.query(
                `
        UPDATE rentalley_db.LeaseAgreement
        SET
          start_date = COALESCE(?, start_date),
          end_date = COALESCE(?, end_date)
        WHERE agreement_id = ?
        `,
                [lease_start_date || null, lease_end_date || null, agreement_id]
            );
        }

        /* ---------- AUTO-ACTIVATE ---------- */
        await maybeActivateLease(agreement_id);

        return NextResponse.json(
            { success: true, message: "Checklist created and evaluated" },
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

/* ======================================================
   PUT — Update checklist + auto-activate lease
====================================================== */
export async function PUT(req: NextRequest) {
    try {
        const body = await req.json();
        const {
            agreement_id,
            lease_agreement,
            move_in_checklist,
            security_deposit,
            advance_payment,
            other_essential,
            lease_start_date,
            lease_end_date,
        } = body;

        if (!agreement_id) {
            return NextResponse.json({ error: "Missing agreement_id" }, { status: 400 });
        }

        /* ---------- UPDATE CHECKLIST ---------- */
        await db.query(
            `
      UPDATE rentalley_db.LeaseSetupRequirements
      SET
        lease_agreement = COALESCE(?, lease_agreement),
        move_in_checklist = COALESCE(?, move_in_checklist),
        security_deposit = COALESCE(?, security_deposit),
        advance_payment = COALESCE(?, advance_payment),
        other_essential = COALESCE(?, other_essential)
      WHERE agreement_id = ?
      `,
            [
                lease_agreement !== undefined ? (lease_agreement ? 1 : 0) : null,
                move_in_checklist !== undefined ? (move_in_checklist ? 1 : 0) : null,
                security_deposit !== undefined ? (security_deposit ? 1 : 0) : null,
                advance_payment !== undefined ? (advance_payment ? 1 : 0) : null,
                other_essential !== undefined ? (other_essential ? 1 : 0) : null,
                agreement_id,
            ]
        );

        /* ---------- UPDATE DATES ---------- */
        if (lease_start_date !== undefined || lease_end_date !== undefined) {
            await db.query(
                `
        UPDATE rentalley_db.LeaseAgreement
        SET
          start_date = COALESCE(?, start_date),
          end_date = COALESCE(?, end_date)
        WHERE agreement_id = ?
        `,
                [lease_start_date || null, lease_end_date || null, agreement_id]
            );
        }

        /* ---------- AUTO-ACTIVATE ---------- */
        await maybeActivateLease(agreement_id);

        return NextResponse.json(
            { success: true, message: "Checklist updated and evaluated" },
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

/* ======================================================
   HELPER — Activate lease if requirements satisfied
====================================================== */
async function maybeActivateLease(agreement_id: string) {
    const [[req]]: any = await db.query(
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

    if (!req || !lease) return;

    const document_uploaded =
        !!lease.agreement_url && lease.agreement_url !== "null";

    const setup_completed =
        (!req.lease_agreement || document_uploaded) &&
        (!req.move_in_checklist || lease.start_date) &&
        (!req.security_deposit || true) &&
        (!req.advance_payment || true);

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
