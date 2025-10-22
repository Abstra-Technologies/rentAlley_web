

import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import type { RowDataPacket, FieldPacket } from "mysql2";
import { decryptData } from "@/crypto/encrypt";

const SECRET_KEY = process.env.ENCRYPTION_SECRET;

export async function GET(
    request: Request,
    { params }: { params: { landlord_id: string } }
) {
  const { landlord_id } = params;

  try {
    // 🔑 Join Landlord → User to fetch details
    const [rows]: [RowDataPacket[], FieldPacket[]] = await db.execute(
        `
          SELECT
            l.landlord_id,
            u.firstName AS enc_firstName,
            u.lastName AS enc_lastName,
            u.email AS enc_email,
            u.phoneNumber AS enc_phone,
            u.profilePicture AS enc_profile
          FROM Landlord l
                 JOIN User u ON l.user_id = u.user_id
          WHERE l.landlord_id = ?;
        `,
        [landlord_id]
    );

    if (rows.length === 0) {
      return NextResponse.json(
          { message: "Landlord not found" },
          { status: 404 }
      );
    }

    const landlord = rows[0];

    // 🧩 Decrypt values
    let firstName = "";
    let lastName = "";
    let email = "";
    let phone = "";
    let photoUrl = null;

    try {
      firstName = decryptData(JSON.parse(landlord.enc_firstName), SECRET_KEY) || "Unknown";
      lastName = decryptData(JSON.parse(landlord.enc_lastName), SECRET_KEY) || "Unknown";
      email = decryptData(JSON.parse(landlord.enc_email), SECRET_KEY);
      phone = landlord.enc_phone
          ? decryptData(JSON.parse(landlord.enc_phone), SECRET_KEY)
          : "";
      photoUrl = landlord.enc_profile
          ? decryptData(JSON.parse(landlord.enc_profile), SECRET_KEY)
          : null;
    } catch (err) {
      console.error("Decryption failed for landlord fields:", err);
    }

    return NextResponse.json({
      landlord_id: landlord.landlord_id,
      name: `${firstName} ${lastName}`.trim(),
      email,
      phone,
      photoUrl,
    });
  } catch (error) {
    console.error("Error fetching landlord:", error);
    return NextResponse.json(
        { message: "Internal server error" },
        { status: 500 }
    );
  }
}

export async function POST() {
  return NextResponse.json(
      { message: "Method not allowed" },
      { status: 405 }
  );
}
