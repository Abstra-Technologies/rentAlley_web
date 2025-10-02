
import { db } from "@/lib/db";
import { decryptData } from "@/crypto/encrypt";
import { NextRequest, NextResponse } from "next/server";

const SECRET_KEY = process.env.ENCRYPTION_SECRET!;

// helper to safely decrypt JSON fields
function safeDecrypt(value: any) {
  if (!value) return null;
  try {
    return decryptData(JSON.parse(value), SECRET_KEY);
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const unitId = searchParams.get("unitId");
  const tenant_id = searchParams.get("tenant_id");

  if (!unitId && !tenant_id) {
    return NextResponse.json(
        {
          message:
              "Missing required parameters: either unitId or tenant_id must be provided",
        },
        { status: 400 }
    );
  }

  try {
    let query = `
      SELECT pt.id, pt.status, pt.message, pt.valid_id, pt.created_at, pt.tenant_id,
             u.firstName, u.lastName, u.email, u.phoneNumber, u.profilePicture, u.birthDate, u.address, u.occupation,
             t.employment_type, t.monthly_income
      FROM ProspectiveTenant pt
      JOIN Tenant t ON pt.tenant_id = t.tenant_id
      JOIN User u ON t.user_id = u.user_id
      WHERE `;

    const params: any[] = [];

    if (tenant_id) {
      query += `pt.tenant_id = ?`;
      params.push(tenant_id);
    } else {
      query += `pt.unit_id = ?`;
      params.push(unitId);
    }

    const [rows]: any[] = await db.query(query, params);

    if (!rows || rows.length === 0) {
      return NextResponse.json([], { status: 200 });
    }

    const decryptedRows = rows.map((tenant: any) => ({
      ...tenant,
      firstName: safeDecrypt(tenant.firstName),
      lastName: safeDecrypt(tenant.lastName),
      email: safeDecrypt(tenant.email),
      birthDate: safeDecrypt(tenant.birthDate),
      phoneNumber: safeDecrypt(tenant.phoneNumber),
      profilePicture: safeDecrypt(tenant.profilePicture),
      valid_id: safeDecrypt(tenant.valid_id),
      address: tenant.address ? tenant.address.toString("utf8") : null,
      occupation: tenant.occupation,
      employment_type: tenant.employment_type,
      monthly_income: tenant.monthly_income,
    }));

    // if tenant_id is provided, return single object instead of array
    if (tenant_id) {
      return NextResponse.json(decryptedRows[0], { status: 200 });
    }

    return NextResponse.json(decryptedRows, { status: 200 });

  } catch (error: any) {
    console.error("❌ Database error:", error);
    return NextResponse.json(
        { message: "Database error", error: error.message },
        { status: 500 }
    );
  }
}
