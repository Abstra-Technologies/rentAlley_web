import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { decryptData } from "@/crypto/encrypt";
import { RowDataPacket } from "mysql2";

interface CombinedQueryResult extends RowDataPacket {
  unit_id: number;
  rent_amount: string;
  security_deposit_months: number;
  advance_payment_months: number;
  description: string;

  landlord_id: number;
  user_id: string;

  property_amenities: string;
  property_name: string;
  property_type: string;

  [key: string]: any;
}

interface UserResult extends RowDataPacket {
  firstName: string;
  lastName: string;
  phoneNumber: string;
  profilePicture: string;
}

const SECRET_KEY = process.env.ENCRYPTION_SECRET;

export async function GET(req: NextRequest) {
  const rentId = req.nextUrl.searchParams.get("rentId");

  if (!rentId) {
    return NextResponse.json(
        { message: "Unit ID is required" },
        { status: 400 }
    );
  }

  try {
    const combinedQuery = `
      SELECT
        u.*,
        p.property_name, p.property_type, p.amenities AS property_amenities,
        p.property_id,
        p.description,
        p.street, p.brgy_district, p.city, p.province, p.zip_code, p.latitude, p.longitude,
        p.flexipay_enabled, p.late_fee,
        p.min_stay,
        p.accepted_payment_methods,
        p.security_deposit_months,
        p.advance_payment_months,
        p.landlord_id,
        l.user_id
      FROM Unit u
             JOIN Property p ON u.property_id = p.property_id
             LEFT JOIN Landlord l ON p.landlord_id = l.landlord_id
      WHERE u.unit_id = ?
    `;

    const [results] = await db.execute<CombinedQueryResult[]>(combinedQuery, [
      rentId,
    ]);

    if (!results || results.length === 0) {
      return NextResponse.json({ message: "Unit not found" }, { status: 404 });
    }

    const rawDetails = results[0] as CombinedQueryResult;
    const userId = rawDetails.user_id;

    let userInfo: Partial<UserResult> & { full_name?: string } = {
      firstName: "Landlord",
      lastName: "Unavailable",
      phoneNumber: "",
      profilePicture: "",
      full_name: "Landlord Name Unavailable",
    };

    if (userId) {
      try {
        const userQuery = `
          SELECT firstName, lastName, phoneNumber, profilePicture
          FROM User
          WHERE user_id = ?
        `;

        const [userResults] = await db.execute<UserResult[]>(userQuery, [
          userId,
        ]);
        if (userResults && userResults.length > 0) {
          userInfo = {
            ...userResults[0],
            full_name: `${userResults[0].firstName ?? ""} ${
                userResults[0].lastName ?? ""
            }`.trim(),
          };
        }
      } catch (userError) {
        console.error("Error fetching user details:", userError);
      }
    }

    const [photoResults] = await db.query(
        `SELECT photo_url FROM UnitPhoto WHERE unit_id = ?`,
        [rentId]
    );

    const decryptedPhotos = (photoResults as any[])
        .map((photo: any) => {
          try {
            if (!photo.photo_url) return null;
            return decryptData(JSON.parse(photo.photo_url), SECRET_KEY);
          } catch (error) {
            console.warn("Photo decryption failed:", error);
            return null;
          }
        })
        .filter(Boolean);

    const rentAmount = parseFloat(rawDetails.rent_amount);

    const finalUnitData = {
      ...rawDetails,

      property_description: rawDetails.description,
      sec_deposit: rawDetails.security_deposit_months * rentAmount,
      advanced_payment: rawDetails.advance_payment_months * rentAmount,

      is_advance_payment_paid: 0,
      is_security_deposit_paid: 0,

      landlord_name: userInfo.full_name,
      landlord_contact: userInfo.phoneNumber || "",
      landlord_photo: userInfo.profilePicture || "",

      photos: decryptedPhotos,

      agreement_id: null,
      start_date: null,
      end_date: null,
      has_pending_proof: false,
    };

    return NextResponse.json(finalUnitData);
  } catch (error) {
    console.error("Critical error fetching unit details:", error);
    return NextResponse.json(
        { message: "Internal Server Error" },
        { status: 500 }
    );
  }
}
