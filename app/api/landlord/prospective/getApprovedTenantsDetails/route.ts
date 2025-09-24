import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { decryptData } from "@/crypto/encrypt";

const SECRET_KEY = process.env.ENCRYPTION_SECRET!;

// helper for safe decryption
function safeDecrypt(value: any) {
  if (!value) return null;
  try {
    return decryptData(JSON.parse(value), SECRET_KEY);
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const unit_id = req.nextUrl.searchParams.get("unit_id");

  if (!unit_id) {
    return NextResponse.json({ error: "Unit ID is required" }, { status: 400 });
  }

  let connection;
  try {
    connection = await db.getConnection();

    // Step 1: Check LeaseAgreement (pending or active)
    const [leaseRows] = await connection.execute(
        `SELECT tenant_id
         FROM LeaseAgreement
         WHERE unit_id = ? AND status IN ('pending','active')
         LIMIT 1`,
        [unit_id]
    );

    let tenant_id: string | null = null;
    let valid_id_encrypted: string | null = null;

    if ((leaseRows as any[]).length > 0) {
      tenant_id = (leaseRows as any[])[0].tenant_id;

      // try to fetch valid_id if already in ProspectiveTenant
      const [pt] = await connection.execute(
          `SELECT valid_id
           FROM ProspectiveTenant
           WHERE tenant_id = ? AND unit_id = ?
           LIMIT 1`,
          [tenant_id, unit_id]
      );
      if ((pt as any[]).length > 0) {
        valid_id_encrypted = (pt as any[])[0].valid_id;
      }
    } else {
      // Step 2: Fallback to ProspectiveTenant (approved only)
      const [prospective] = await connection.execute(
          `SELECT tenant_id, valid_id
           FROM ProspectiveTenant
           WHERE unit_id = ? AND status = 'approved'
           LIMIT 1`,
          [unit_id]
      );

      if ((prospective as any[]).length === 0) {
        return NextResponse.json(
            { error: "No tenant found for this unit" },
            { status: 404 }
        );
      }

      tenant_id = (prospective as any[])[0].tenant_id;
      valid_id_encrypted = (prospective as any[])[0].valid_id;
    }

    // Step 3: Get tenant + user details
    const [tenantDetails] = await connection.execute(
        `SELECT
           t.employment_type, t.monthly_income,
           u.firstName, u.lastName, u.birthDate, u.phoneNumber, u.email, u.profilePicture,
           u.address, u.occupation
         FROM Tenant t
                JOIN User u ON t.user_id = u.user_id
         WHERE t.tenant_id = ?`,
        [tenant_id]
    );

    if ((tenantDetails as any[]).length === 0) {
      return NextResponse.json(
          { error: "Tenant details not found" },
          { status: 404 }
      );
    }

    const tenant = (tenantDetails as any[])[0];

    const response = {
      firstName: safeDecrypt(tenant.firstName),
      lastName: safeDecrypt(tenant.lastName),
      birthDate: safeDecrypt(tenant.birthDate),
      phoneNumber: safeDecrypt(tenant.phoneNumber),
      profilePicture: safeDecrypt(tenant.profilePicture),
      email: safeDecrypt(tenant.email),
      address: tenant.address ? tenant.address.toString("utf8") : null,
      occupation: tenant.occupation,
      employmentType: tenant.employment_type,
      monthlyIncome: tenant.monthly_income,
      validId: valid_id_encrypted ? safeDecrypt(valid_id_encrypted) : null,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error: any) {
    console.error("❌ Error fetching tenant details:", error);
    return NextResponse.json(
        { error: "Internal Server Error", details: error.message },
        { status: 500 }
    );
  } finally {
    if (connection) connection.release();
  }
}
