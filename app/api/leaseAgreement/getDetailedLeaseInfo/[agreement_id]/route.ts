import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { decryptData } from "@/crypto/encrypt";

const SECRET_KEY = process.env.ENCRYPTION_SECRET;

export async function GET(req: NextRequest, { params }: { params: { agreement_id: string } }) {

    // @ts-ignore
    const { agreement_id } = params;

    if (!agreement_id) {
        return NextResponse.json({ message: "Lease ID is required" }, { status: 400 });
    }

console.log('areehemrtn id api: ', agreement_id);

    try {
        // 🔑 Lease + Property + Unit + Tenant
        const [leaseRows] = await db.execute(
            `SELECT 
          la.agreement_id AS lease_id,
          la.start_date,
          la.end_date,
          la.status AS lease_status,
          la.agreement_url,
          u.sec_deposit AS security_deposit,
          u.advanced_payment AS advance_payment,
          p.property_name,
          u.unit_name,
          t.tenant_id,
          usr.firstName AS enc_firstName,
          usr.lastName AS enc_lastName
       FROM LeaseAgreement la
       JOIN Unit u ON la.unit_id = u.unit_id
       JOIN Property p ON u.property_id = p.property_id
       JOIN Tenant t ON la.tenant_id = t.tenant_id
       JOIN User usr ON t.user_id = usr.user_id
       WHERE la.agreement_id = ?;`,
            [agreement_id]
        );

        // @ts-ignore
        if (!leaseRows.length) {
            return NextResponse.json({ message: "Lease not found" }, { status: 404 });
        }

        // @ts-ignore
        const lease = leaseRows[0];

        // 🧑‍🤝‍🧑 Decrypt tenant name
        let tenantFirstName = "";
        let tenantLastName = "";
        try {
            // @ts-ignore
            tenantFirstName = decryptData(JSON.parse(lease.enc_firstName), SECRET_KEY);
            // @ts-ignore
            tenantLastName = decryptData(JSON.parse(lease.enc_lastName), SECRET_KEY);
        } catch (err) {
            console.error("Decryption failed for tenant name:", err);
        }

        // 📝 PDCs
        const [pdcRows] = await db.execute(
            `SELECT 
          pdc_id,
          check_number,
          bank_name,
          amount,
          due_date,
          status
       FROM PostDatedCheck
       WHERE lease_id = ?
       ORDER BY due_date ASC;`,
            [agreement_id]
        );

        // 💳 Payments (if you track them separately)
        const [paymentRows] = await db.execute(
            `SELECT 
          payment_id,
          amount,
          method,
          paid_on,
          status
       FROM Payment
       WHERE lease_id = ?
       ORDER BY paid_on DESC;`,
            [agreement_id]
        );

        // ✅ Response
        return NextResponse.json({
            lease_id: lease.lease_id,
            property_name: lease.property_name,
            unit_name: lease.unit_name,
            tenant_name: `${tenantFirstName} ${tenantLastName}`,
            start_date: lease.start_date,
            end_date: lease.end_date,
            lease_status: lease.lease_status,
            agreement_url: lease.agreement_url,
            security_deposit: lease.security_deposit,
            advance_payment: lease.advance_payment,
            pdcs: pdcRows,
            payments: paymentRows,
        });
    } catch (error) {
        console.error("Error fetching lease details:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}

