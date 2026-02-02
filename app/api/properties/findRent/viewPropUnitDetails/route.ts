import { NextRequest, NextResponse } from "next/server";
import { RowDataPacket } from "mysql2";
import { db } from "@/lib/db";
import { decryptData } from "@/crypto/encrypt";

const SECRET_KEY = process.env.ENCRYPTION_SECRET!;

/* ================================
   Types
================================ */

interface PropertyUnitRow extends RowDataPacket {
    // Unit
    unit_id: string;
    property_id: string;
    unit_name: string;
    unit_size: number;
    unit_style: string;
    rent_amount: string;
    furnish: string;
    amenities: string;
    status: string;
    publish: number;

    // Property
    property_name: string;
    property_type: string;
    property_amenities: string;
    street: string;
    brgy_district: string;
    city: string;
    zip_code: number;
    province: string;
    water_billing_type: string;
    electricity_billing_type: string;
    description: string;
    floor_area: number;
    late_fee: number;
    assoc_dues: number;
    flexipay_enabled: number;
    property_preferences: string;
    accepted_payment_methods: string;
    latitude: number;
    longitude: number;
    rent_increase_percent: number;

    // Landlord
    landlord_id: string;
    user_id: string;
}

interface UserRow extends RowDataPacket {
    firstName: string;
    lastName: string;
    phoneNumber: string;
    profilePicture: string;
}

/* ================================
   GET
================================ */

export async function GET(req: NextRequest) {
    const rentId = req.nextUrl.searchParams.get("rentId");

    if (!rentId) {
        return NextResponse.json(
            { message: "Unit ID (rentId) is required" },
            { status: 400 }
        );
    }

    try {
        /* ================================
           1. Unit + Property + Landlord
        ================================ */
        const [rows] = await db.execute<PropertyUnitRow[]>(
            `
      SELECT
        u.*,
        p.property_name,
        p.property_type,
        p.amenities AS property_amenities,
        p.street,
        p.brgy_district,
        p.city,
        p.zip_code,
        p.province,
        p.water_billing_type,
        p.electricity_billing_type,
        p.description,
        p.floor_area,
        p.late_fee,
        p.assoc_dues,
        p.flexipay_enabled,
        p.property_preferences,
        p.accepted_payment_methods,
        p.latitude,
        p.longitude,
        p.rent_increase_percent,
        l.landlord_id,          -- ✅ INCLUDED
        l.user_id
      FROM Unit u
      JOIN Property p ON u.property_id = p.property_id
      LEFT JOIN Landlord l ON p.landlord_id = l.landlord_id
      WHERE u.unit_id = ?
      `,
            [rentId]
        );

        if (rows.length === 0) {
            return NextResponse.json(
                { message: "Unit not found" },
                { status: 404 }
            );
        }

        const raw = rows[0];

        /* ================================
           2. Landlord User Info
        ================================ */
        let landlordInfo = {
            full_name: "Unknown Landlord",
            phoneNumber: "",
            profilePicture: "",
        };

        if (raw.user_id) {
            const [userRows] = await db.execute<UserRow[]>(
                `
        SELECT firstName, lastName, phoneNumber, profilePicture
        FROM User
        WHERE user_id = ?
        `,
                [raw.user_id]
            );

            if (userRows.length > 0) {
                landlordInfo = {
                    full_name: `${userRows[0].firstName ?? ""} ${userRows[0].lastName ?? ""}`.trim(),
                    phoneNumber: userRows[0].phoneNumber ?? "",
                    profilePicture: userRows[0].profilePicture ?? "",
                };
            }
        }

        /* ================================
           3. Unit Photos (decrypt)
        ================================ */
        const [photoRows] = await db.execute<RowDataPacket[]>(
            `SELECT photo_url FROM UnitPhoto WHERE unit_id = ?`,
            [rentId]
        );

        const photos = photoRows
            .map((row) => {
                try {
                    return row.photo_url
                        ? decryptData(JSON.parse(row.photo_url), SECRET_KEY)
                        : null;
                } catch {
                    return null;
                }
            })
            .filter(Boolean);

        /* ================================
           4. Final Response
        ================================ */
        return NextResponse.json({
            // Unit
            unit_id: raw.unit_id,
            property_id: raw.property_id,
            unit_name: raw.unit_name,
            unit_size: raw.unit_size,
            unit_style: raw.unit_style,
            rent_amount: Number(raw.rent_amount),
            furnish: raw.furnish,
            unit_amenities: raw.amenities,
            status: raw.status,
            publish: raw.publish,

            // Property
            property_name: raw.property_name,
            property_type: raw.property_type,
            property_amenities: raw.property_amenities,
            description: raw.description,
            floor_area: raw.floor_area,
            late_fee: raw.late_fee,
            assoc_dues: raw.assoc_dues,
            water_billing_type: raw.water_billing_type,
            electricity_billing_type: raw.electricity_billing_type,
            flexipay_enabled: raw.flexipay_enabled,
            property_preferences: raw.property_preferences,
            accepted_payment_methods: raw.accepted_payment_methods,
            latitude: raw.latitude,
            longitude: raw.longitude,
            rent_increase_percent: raw.rent_increase_percent,
            city: raw.city,
            street: raw.street,
            brgy_district: raw.brgy_district,
            province: raw.province,
            zip_code: raw.zip_code,

            // ✅ Landlord (FIXED)
            landlord_id: raw.landlord_id,
            landlord_name: landlordInfo.full_name,
            landlord_contact: landlordInfo.phoneNumber,
            landlord_photo: landlordInfo.profilePicture,

            // Photos
            photos,
        });
    } catch (error) {
        console.error("❌ viewPropUnitDetails error:", error);
        return NextResponse.json(
            { message: "Internal Server Error" },
            { status: 500 }
        );
    }
}
