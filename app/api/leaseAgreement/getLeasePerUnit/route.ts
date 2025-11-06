import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { decryptData } from "@/crypto/encrypt";

const encryptionSecret = process.env.ENCRYPTION_SECRET!;

export async function GET(req: NextRequest) {
  const unit_id = req.nextUrl.searchParams.get("unit_id");

  if (!unit_id) {
    return NextResponse.json(
        { error: "Missing required parameter: unit_id" },
        { status: 400 }
    );
  }

  let connection;
  try {
    connection = await db.getConnection();

    // 🧩 STEP 1: Try to fetch an existing lease directly
    const [leaseRows]: any = await connection.execute(
        `
      SELECT agreement_id, tenant_id, unit_id, start_date, end_date, agreement_url, status
      FROM LeaseAgreement
      WHERE unit_id = ?
      ORDER BY created_at DESC
      LIMIT 1
      `,
        [unit_id]
    );

    if (leaseRows.length > 0) {
      const row = leaseRows[0];
      let decryptedUrl: string | null = null;

      try {
        if (row.agreement_url) {
          const encryptedData = JSON.parse(row.agreement_url);
          decryptedUrl = decryptData(encryptedData, encryptionSecret);
        }
      } catch {
        // not encrypted, fallback to plain string
        decryptedUrl = row.agreement_url;
      }

      return NextResponse.json(
          {
            agreement_id: row.agreement_id,
            tenant_id: row.tenant_id,
            unit_id: row.unit_id,
            start_date: row.start_date,
            end_date: row.end_date,
            status: row.status,
            agreement_url: decryptedUrl || null,
          },
          { status: 200 }
      );
    }

    // 🧩 STEP 2: Fallback — check if an approved prospective tenant exists
    const [tenantRows]: any = await connection.execute(
        `
      SELECT tenant_id FROM ProspectiveTenant
      WHERE unit_id = ? AND status = 'approved'
      LIMIT 1
      `,
        [unit_id]
    );

    if (tenantRows.length === 0) {
      return NextResponse.json(
          { message: "No lease or approved tenant found for this unit" },
          { status: 200 }
      );
    }

    const tenant_id = tenantRows[0].tenant_id;

    // 🧩 STEP 3: Try to find a lease for that approved tenant
    const [tenantLeaseRows]: any = await connection.execute(
        `
      SELECT agreement_id, tenant_id, unit_id, start_date, end_date, agreement_url, status
      FROM LeaseAgreement
      WHERE tenant_id = ? AND unit_id = ?
      ORDER BY created_at DESC
      LIMIT 1
      `,
        [tenant_id, unit_id]
    );

    if (tenantLeaseRows.length > 0) {
      const row = tenantLeaseRows[0];
      let decryptedUrl: string | null = null;

      try {
        if (row.agreement_url) {
          const encryptedData = JSON.parse(row.agreement_url);
          decryptedUrl = decryptData(encryptedData, encryptionSecret);
        }
      } catch {
        decryptedUrl = row.agreement_url;
      }

      return NextResponse.json(
          {
            agreement_id: row.agreement_id,
            tenant_id: row.tenant_id,
            unit_id: row.unit_id,
            start_date: row.start_date,
            end_date: row.end_date,
            status: row.status,
            agreement_url: decryptedUrl || null,
          },
          { status: 200 }
      );
    }

    // 🧩 STEP 4: No lease found
    return NextResponse.json(
        { message: "No existing lease found for this unit" },
        { status: 200 }
    );
  } catch (error: any) {
    console.error("❌ Error fetching lease agreement:", error);
    return NextResponse.json(
        { error: "Failed to fetch lease agreement: " + error.message },
        { status: 500 }
    );
  } finally {
    if (connection) connection.release();
  }
}
