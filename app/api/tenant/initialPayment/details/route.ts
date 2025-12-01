import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
    try {
        const agreementId = req.nextUrl.searchParams.get("agreement_id");

        if (!agreementId) {
            return NextResponse.json(
                { message: "agreement_id is required" },
                { status: 400 }
            );
        }

        const [leaseRows]: any = await db.query(
            `
      SELECT 
        agreement_id,
        tenant_id,
        unit_id,
        start_date,
        end_date,
        rent_amount
      FROM LeaseAgreement
      WHERE agreement_id = ?
      LIMIT 1
      `,
            [agreementId]
        );

        if (!leaseRows?.length) {
            return NextResponse.json(
                { message: "Lease not found" },
                { status: 404 }
            );
        }

        const lease = leaseRows[0];

        /* ---------------------------------------------------------
           2) SECURITY DEPOSIT (if ANY)
        --------------------------------------------------------- */
        const [secRows]: any = await db.query(
            `
      SELECT amount, status
      FROM SecurityDeposit
      WHERE lease_id = ?
      ORDER BY deposit_id DESC
      LIMIT 1
      `,
            [agreementId]
        );

        let securityDeposit = null;

        if (secRows?.length > 0) {
            securityDeposit = {
                amount: Number(secRows[0].amount),
                status: secRows[0].status,
            };
        }

        /* ---------------------------------------------------------
           3) ADVANCE PAYMENT (if ANY)
        --------------------------------------------------------- */
        const [advRows]: any = await db.query(
            `
      SELECT amount, status
      FROM AdvancePayment
      WHERE lease_id = ?
      ORDER BY advance_id DESC
      LIMIT 1
      `,
            [agreementId]
        );

        let advancePayment = null;

        if (advRows?.length > 0) {
            advancePayment = {
                amount: Number(advRows[0].amount),
                status: advRows[0].status,
            };
        }

        return NextResponse.json(
            {
                agreement_id: lease.agreement_id,
                tenant_id: lease.tenant_id,
                unit_id: lease.unit_id,

                start_date: lease.start_date,
                end_date: lease.end_date,
                rent_amount: lease.rent_amount,

                security_deposit: securityDeposit, // null if no record
                advance_payment: advancePayment,   // null if no record
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("❌ Error: initialPayment/details", error);
        return NextResponse.json(
            { message: "Internal Server Error" },
            { status: 500 }
        );
    }
}
