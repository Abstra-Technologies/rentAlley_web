import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generateBillId } from "@/utils/id_generator";
import { parse } from "cookie";
import { jwtVerify } from "jose";
import webpush from "web-push";
import { io } from "socket.io-client";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY!;

webpush.setVapidDetails(
    "mailto:support@upkyp.com",
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY
);

export const runtime = "nodejs";

/* ------------------ HELPERS ------------------ */

// ✅ Normalize any date → YYYY-MM-01
function normalizeBillingPeriod(date: string) {
    const d = new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

async function createBilling(req: NextRequest) {
    const connection = await db.getConnection();

    try {
        /* ---------- AUTH ---------- */
        const cookies = req.headers.get("cookie")
            ? parse(req.headers.get("cookie")!)
            : null;

        if (!cookies?.token) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
        const { payload } = await jwtVerify(cookies.token, secret as any);

        /* ---------- BODY ---------- */
        const {
            unit_id,
            billingDate,
            readingDate,
            dueDate,
            waterPrevReading,
            waterCurrentReading,
            electricityPrevReading,
            electricityCurrentReading,
            totalWaterAmount,
            totalElectricityAmount,
            total_amount_due,
            additionalCharges = [],
        } = await req.json();

        const billingPeriod = normalizeBillingPeriod(billingDate);

        await connection.beginTransaction();

        /* ---------- CHECK EXISTING BILL ---------- */
        const [[existing]]: any = await connection.query(
            `SELECT billing_id FROM Billing WHERE unit_id = ? AND billing_period = ?`,
            [unit_id, billingPeriod]
        );

        if (existing) {
            await connection.rollback();
            return NextResponse.json(
                { error: "Billing already exists for this month" },
                { status: 409 }
            );
        }

        /* ---------- LEASE ---------- */
        const [[lease]]: any = await connection.query(
            `
            SELECT la.agreement_id, la.tenant_id, t.user_id AS tenant_user_id
            FROM LeaseAgreement la
            JOIN Tenant t ON la.tenant_id = t.tenant_id
            WHERE la.unit_id = ?
              AND la.status = 'active'
            LIMIT 1
            `,
            [unit_id]
        );

        if (!lease) {
            await connection.rollback();
            return NextResponse.json({ error: "No active lease" }, { status: 404 });
        }

        const billing_id = generateBillId();

        /* ---------- INSERT BILLING ---------- */
        await connection.query(
            `
            INSERT INTO Billing (
                billing_id,
                lease_id,
                unit_id,
                billing_period,
                total_water_amount,
                total_electricity_amount,
                total_amount_due,
                due_date,
                status,
                created_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'unpaid', NOW())
            `,
            [
                billing_id,
                lease.agreement_id,
                unit_id,
                billingPeriod,
                totalWaterAmount || 0,
                totalElectricityAmount || 0,
                total_amount_due || 0,
                dueDate,
            ]
        );

        /* ---------- CHARGES ---------- */
        for (const c of additionalCharges) {
            await connection.query(
                `
                INSERT INTO BillingAdditionalCharge
                  (billing_id, charge_category, charge_type, amount)
                VALUES (?, ?, ?, ?)
                `,
                [
                    billing_id,
                    c.charge_category,
                    c.charge_type.trim(),
                    Number(c.amount),
                ]
            );
        }

        await connection.commit();

        return NextResponse.json({ success: true, billing_id }, { status: 201 });
    } catch (err: any) {
        await connection.rollback();
        console.error(err);
        return NextResponse.json({ error: "Create billing failed" }, { status: 500 });
    } finally {
        connection.release();
    }
}

async function updateBilling(req: NextRequest) {
    const connection = await db.getConnection();

    try {
        /* ---------- AUTH ---------- */
        const cookies = req.headers.get("cookie")
            ? parse(req.headers.get("cookie")!)
            : null;

        if (!cookies?.token) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const {
            billing_id,
            dueDate,
            readingDate,
            waterPrevReading,
            waterCurrentReading,
            electricityPrevReading,
            electricityCurrentReading,
            totalWaterAmount,
            totalElectricityAmount,
            total_amount_due,
            additionalCharges = [],
        } = await req.json();

        if (!billing_id) {
            return NextResponse.json(
                { error: "billing_id is required" },
                { status: 400 }
            );
        }

        await connection.beginTransaction();

        /* ---------- UPDATE BILLING ---------- */
        const [result]: any = await connection.query(
            `
            UPDATE Billing
            SET
                total_water_amount = ?,
                total_electricity_amount = ?,
                total_amount_due = ?,
                due_date = ?,
                status = 'unpaid',
                updated_at = NOW()
            WHERE billing_id = ?
            `,
            [
                totalWaterAmount || 0,
                totalElectricityAmount || 0,
                total_amount_due || 0,
                dueDate,
                billing_id,
            ]
        );

        if (result.affectedRows === 0) {
            await connection.rollback();
            return NextResponse.json(
                { error: "Billing not found" },
                { status: 404 }
            );
        }

        /* ---------- RESET CHARGES ---------- */
        await connection.query(
            `DELETE FROM BillingAdditionalCharge WHERE billing_id = ?`,
            [billing_id]
        );

        for (const c of additionalCharges) {
            await connection.query(
                `
                INSERT INTO BillingAdditionalCharge
                  (billing_id, charge_category, charge_type, amount)
                VALUES (?, ?, ?, ?)
                `,
                [
                    billing_id,
                    c.charge_category,
                    c.charge_type.trim(),
                    Number(c.amount),
                ]
            );
        }

        await connection.commit();

        return NextResponse.json({ success: true }, { status: 200 });
    } catch (err: any) {
        await connection.rollback();
        console.error(err);
        return NextResponse.json({ error: "Update billing failed" }, { status: 500 });
    } finally {
        connection.release();
    }
}


export async function POST(req: NextRequest) {
    return createBilling(req);
}

export async function PUT(req: NextRequest) {
    return updateBilling(req);
}
