import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { decryptData } from "@/crypto/encrypt";

const SECRET_KEY = process.env.ENCRYPTION_SECRET;

/**
 * @method      GET
 * @route       app/api/leaseAgreement/getDetailedLeaseInfo/[agreement_id]
 * @desc        Fetch detailed lease info with rent fallback logic and decrypted URL.
 * @param       agreement_id
 * @usedIn      LeaseDetailsPage
 */
export async function GET(
    req: NextRequest,
    { params }: { params: { agreement_id: string } }
) {
    const { agreement_id } = params;

    if (!agreement_id) {
        return NextResponse.json({ message: "Lease ID is required" }, { status: 400 });
    }

    try {
        // 🔑 Fetch Lease + Unit + Property + Tenant + PropertyConfig
        const [leaseRows]: any = await db.execute(
            `
      SELECT
          la.agreement_id AS lease_id,
          la.start_date,
          la.end_date,
          la.status AS lease_status,
          la.agreement_url,
          la.security_deposit_amount,
          la.advance_payment_amount,
          la.is_security_deposit_paid,
          la.is_advance_payment_paid,
          la.grace_period_days AS lease_grace_period,
          la.late_penalty_amount AS lease_late_fee,
          la.billing_due_day AS lease_due_day,
          la.rent_amount AS lease_rent_amount,
          p.property_id,
          p.property_name,
          u.unit_name,
          u.rent_amount AS unit_default_rent_amount,
          t.tenant_id,
          usr.firstName AS enc_firstName,
          usr.lastName AS enc_lastName,
          usr.email AS enc_email,
          usr.phoneNumber as enc_phoneNumber,
          pc.billingDueDay AS config_due_day,
          pc.gracePeriodDays AS config_grace_period,
          pc.lateFeeAmount AS config_late_fee
      FROM LeaseAgreement la
          JOIN Unit u ON la.unit_id = u.unit_id
          JOIN Property p ON u.property_id = p.property_id
          JOIN Tenant t ON la.tenant_id = t.tenant_id
          JOIN User usr ON t.user_id = usr.user_id
          LEFT JOIN PropertyConfiguration pc ON pc.property_id = p.property_id
      WHERE la.agreement_id = ?;
      `,
            [agreement_id]
        );

        if (!leaseRows || leaseRows.length === 0) {
            return NextResponse.json({ message: "Lease not found" }, { status: 404 });
        }

        const lease: any = leaseRows[0];

        // 💰 Rent fallback rule: if lease rent is 0 or null → use unit rent
        const rent_amount =
            lease.lease_rent_amount && lease.lease_rent_amount > 0
                ? lease.lease_rent_amount
                : lease.unit_default_rent_amount;

        // ⚙️ Property configuration fallback logic
        const billing_due_day = lease.config_due_day ?? lease.lease_due_day ?? 1;
        const grace_period_days = lease.config_grace_period ?? lease.lease_grace_period ?? 3;
        const late_penalty_amount = lease.config_late_fee ?? lease.lease_late_fee ?? 0;

        const info_source = {
            billing_due_day: lease.config_due_day ? "property_config" : "lease",
            grace_period_days: lease.config_grace_period ? "property_config" : "lease",
            late_penalty_amount: lease.config_late_fee ? "property_config" : "lease",
        };

        // 🔐 Decrypt tenant info
        let tenantFirstName = "",
            tenantLastName = "",
            tenantEmail = "",
            tenantPhoneNumber = "";

        try {
            tenantFirstName = decryptData(JSON.parse(lease.enc_firstName), SECRET_KEY);
            tenantLastName = decryptData(JSON.parse(lease.enc_lastName), SECRET_KEY);
            tenantEmail = decryptData(JSON.parse(lease.enc_email), SECRET_KEY);
            tenantPhoneNumber = lease.enc_phoneNumber
                ? decryptData(JSON.parse(lease.enc_phoneNumber), SECRET_KEY)
                : lease.enc_phoneNumber || "";
        } catch (err) {
            console.error("Decryption failed for tenant info:", err);
        }

        // 🧾 Decrypt agreement URL
        let agreementUrl: string | null = null;
        try {
            if (lease.agreement_url) {
                const parsed = JSON.parse(lease.agreement_url);
                agreementUrl = decryptData(parsed, SECRET_KEY);
            }
        } catch (err) {
            console.warn("⚠️ Failed to decrypt agreement URL:", err);
            agreementUrl = null;
        }

        // 🧾 Fetch PDCs
        const [pdcRows]: any = await db.execute(
            `
      SELECT
          pdc_id,
          check_number,
          bank_name,
          amount,
          due_date,
          uploaded_image_url,
          status
      FROM PostDatedCheck
      WHERE lease_id = ?
      ORDER BY due_date ASC;
      `,
            [agreement_id]
        );

        // ✅ Final JSON response
        return NextResponse.json(
            {
                lease_id: lease.lease_id,
                property_name: lease.property_name,
                unit_name: lease.unit_name,
                tenant_name: `${tenantFirstName} ${tenantLastName}`,
                start_date: lease.start_date,
                end_date: lease.end_date,
                lease_status: lease.lease_status,
                agreement_url: agreementUrl, // ✅ decrypted, direct link
                email: tenantEmail,
                phoneNumber: tenantPhoneNumber,
                property_id: lease.property_id,

                // 💰 Financial terms
                rent_amount,
                default_rent_amount: lease.unit_default_rent_amount,
                security_deposit_amount: lease.security_deposit_amount,
                advance_payment_amount: lease.advance_payment_amount,
                is_security_deposit_paid: lease.is_security_deposit_paid,
                is_advance_payment_paid: lease.is_advance_payment_paid,

                // ⚙️ Property configuration defaults
                billing_due_day,
                grace_period_days,
                late_penalty_amount,
                info_source,

                // 🧾 PDC list
                pdcs: pdcRows,
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("Error fetching lease details:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}
