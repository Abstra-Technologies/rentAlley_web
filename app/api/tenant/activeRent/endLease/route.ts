import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
    try {
        const { agreement_id, tenant_id } = await req.json();

        if (!agreement_id || !tenant_id) {
            return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
        }

        // ✅ 1. Verify lease belongs to the tenant
        const [leaseRows]: any = await db.query(
            `SELECT tenant_id, status FROM LeaseAgreement WHERE agreement_id = ? LIMIT 1`,
            [agreement_id]
        );

        if (!leaseRows.length) {
            return NextResponse.json({ error: "Lease not found." }, { status: 404 });
        }

        const lease = leaseRows[0];
        if (lease.tenant_id !== tenant_id) {
            return NextResponse.json({ error: "Unauthorized action." }, { status: 403 });
        }

        // ✅ 2. Prevent duplicate ending of already-ended lease
        if (["cancelled", "expired"].includes(lease.status)) {
            return NextResponse.json({ error: "Lease is already inactive." }, { status: 409 });
        }

        // ✅ 3. Check for unpaid or overdue billings
        const [unpaidRows]: any = await db.query(
            `
      SELECT billing_id, status, total_amount_due
      FROM Billing
      WHERE lease_id = ?
        AND (status = 'unpaid' OR status = 'overdue')
      `,
            [agreement_id]
        );

        if (unpaidRows.length > 0) {
            const unpaidCount = unpaidRows.length;
            const totalDue = unpaidRows.reduce(
                (sum: number, b: any) => sum + Number(b.total_amount_due || 0),
                0
            );
            return NextResponse.json(
                {
                    error: `Cannot end lease. There are ${unpaidCount} pending billing payment(s) totaling ₱${totalDue.toLocaleString(
                        "en-PH",
                        { minimumFractionDigits: 2 }
                    )}. Please settle all dues first.`,
                },
                { status: 400 }
            );
        }

        await db.query(
            `UPDATE LeaseAgreement SET status = 'expired', updated_at = NOW() WHERE agreement_id = ?`,
            [agreement_id]
        );

        // ✅ 5. Notify landlord automatically
        await db.query(
            `
      INSERT INTO Notification (user_id, title, body, url)
      SELECT u.user_id, 'Tenant Ended Lease',
             CONCAT('A tenant has ended the lease for Unit ', un.unit_name),
             '/pages/landlord/lease-management'
      FROM LeaseAgreement la
      JOIN Unit un ON la.unit_id = un.unit_id
      JOIN Property p ON un.property_id = p.property_id
      JOIN Landlord l ON p.landlord_id = l.landlord_id
      JOIN User u ON u.user_id = l.user_id
      WHERE la.agreement_id = ?
      `,
            [agreement_id]
        );

        return NextResponse.json({
            success: true,
            message: "Lease ended successfully. Your landlord has been notified.",
        });
    } catch (err: any) {
        console.error("❌ Error ending lease:", err);
        return NextResponse.json(
            { error: "Failed to end lease. Please try again later." },
            { status: 500 }
        );
    }
}
