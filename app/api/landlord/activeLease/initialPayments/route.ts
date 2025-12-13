import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
    const agreement_id = req.nextUrl.searchParams.get("agreement_id");

    if (!agreement_id) {
        return NextResponse.json(
            { error: "agreement_id is required" },
            { status: 400 }
        );
    }

    try {
        const [security] = await db.query(
            `
      SELECT amount
      FROM SecurityDeposit
      WHERE lease_id = ?
      LIMIT 1
      `,
            [agreement_id]
        );

        const [advance] = await db.query(
            `
      SELECT amount
      FROM AdvancePayment
      WHERE lease_id = ?
      LIMIT 1
      `,
            [agreement_id]
        );

        const [requirements] = await db.query(
            `
      SELECT
        security_deposit_months,
        advance_payment_months
      FROM LeaseSetupRequirements
      WHERE agreement_id = ?
      LIMIT 1
      `,
            [agreement_id]
        );

        return NextResponse.json({
            security_deposit_amount: security?.[0]?.amount || "",
            advance_payment_amount: advance?.[0]?.amount || "",
            security_deposit_months:
                requirements?.[0]?.security_deposit_months || 1,
            advance_payment_months:
                requirements?.[0]?.advance_payment_months || 1,
            saved: !!(security?.length || advance?.length),
        });
    } catch (err) {
        console.error("❌ initialPayments GET error:", err);
        return NextResponse.json(
            { error: "Failed to load initial payments" },
            { status: 500 }
        );
    }
}

export async function POST(req: NextRequest) {
    try {
        const {
            agreement_id,
            security_deposit_amount,
            security_deposit_months,
            advance_payment_amount,
            advance_payment_months,
        } = await req.json();

        if (!agreement_id) {
            return NextResponse.json(
                { error: "agreement_id is required" },
                { status: 400 }
            );
        }

        const [lease] = await db.query(
            `
      SELECT tenant_id
      FROM LeaseAgreement
      WHERE agreement_id = ?
      LIMIT 1
      `,
            [agreement_id]
        );

        if (!lease?.[0]?.tenant_id) {
            return NextResponse.json(
                { error: "Lease agreement not found" },
                { status: 404 }
            );
        }

        const tenant_id = lease[0].tenant_id;

        /* ---------------- SECURITY DEPOSIT ---------------- */
        if (security_deposit_amount !== undefined) {
            const [existingSecurity] = await db.query(
                `
        SELECT deposit_id
        FROM SecurityDeposit
        WHERE lease_id = ?
        LIMIT 1
        `,
                [agreement_id]
            );

            if (existingSecurity.length) {
                await db.query(
                    `
          UPDATE SecurityDeposit
          SET amount = ?
          WHERE lease_id = ?
          `,
                    [security_deposit_amount, agreement_id]
                );
            } else {
                await db.query(
                    `
          INSERT INTO SecurityDeposit (lease_id, tenant_id, amount)
          VALUES (?, ?, ?)
          `,
                    [agreement_id, tenant_id, security_deposit_amount]
                );
            }

            await db.query(
                `
        UPDATE LeaseAgreement
        SET security_deposit_amount = ?
        WHERE agreement_id = ?
        `,
                [security_deposit_amount, agreement_id]
            );
        }

        /* ---------------- ADVANCE PAYMENT ---------------- */
        if (advance_payment_amount !== undefined) {
            const [existingAdvance] = await db.query(
                `
        SELECT advance_id
        FROM AdvancePayment
        WHERE lease_id = ?
        LIMIT 1
        `,
                [agreement_id]
            );

            if (existingAdvance.length) {
                await db.query(
                    `
          UPDATE AdvancePayment
          SET amount = ?
          WHERE lease_id = ?
          `,
                    [advance_payment_amount, agreement_id]
                );
            } else {
                await db.query(
                    `
          INSERT INTO AdvancePayment (lease_id, tenant_id, amount)
          VALUES (?, ?, ?)
          `,
                    [agreement_id, tenant_id, advance_payment_amount]
                );
            }

            await db.query(
                `
        UPDATE LeaseAgreement
        SET advance_payment_amount = ?
        WHERE agreement_id = ?
        `,
                [advance_payment_amount, agreement_id]
            );
        }

        /* -------- UPDATE MONTHS IN SETUP REQUIREMENTS -------- */
        await db.query(
            `
      UPDATE LeaseSetupRequirements
      SET
        security_deposit_months = ?,
        advance_payment_months = ?
      WHERE agreement_id = ?
      `,
            [
                security_deposit_months || 1,
                advance_payment_months || 1,
                agreement_id,
            ]
        );

        return NextResponse.json({
            success: true,
            message: "Initial payments saved successfully",
        });
    } catch (err) {
        console.error("❌ initialPayments POST error:", err);
        return NextResponse.json(
            { error: "Failed to save initial payments" },
            { status: 500 }
        );
    }
}
