import { db } from "@/lib/db";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { encryptData } from "@/crypto/encrypt";
import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { generateNameHash, generateNameTokens } from "@/utils/nameHash";

export async function POST(req: NextRequest) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get("token")?.value;

        if (!token) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const secret = new TextEncoder().encode(process.env.JWT_SECRET);
        const { payload } = await jwtVerify(token, secret);
        const userId = payload?.user_id;

        if (!userId) {
            return NextResponse.json(
                { error: "Invalid user session" },
                { status: 400 }
            );
        }

        const body = await req.json();
        const {
            firstName,
            lastName,
            phoneNumber,
            civil_status,
            occupation,
            citizenship,
            address,companyName
        } = body;

        if (!firstName || !lastName) {
            return NextResponse.json(
                { error: "First name and last name are required" },
                { status: 400 }
            );
        }

        /* ---------- ENCRYPT FIELDS ---------- */
        const secretKey = process.env.ENCRYPTION_SECRET!;
        const fnameEncrypted = JSON.stringify(
            await encryptData(firstName, secretKey)
        );
        const lnameEncrypted = JSON.stringify(
            await encryptData(lastName, secretKey)
        );
        const phoneEncrypted = phoneNumber
            ? JSON.stringify(await encryptData(phoneNumber, secretKey))
            : null;

        /* ---------- GENERATE SEARCH HASHES ---------- */
        const nameHashed = generateNameHash(firstName, lastName);
        const nameTokens = generateNameTokens(firstName, lastName);

        /* ---------- UPDATE USER ---------- */
        await db.query(
            `
      UPDATE User
      SET
        firstName = ?,
        lastName = ?,
        phoneNumber = ?,
        civil_status = ?,
        occupation = ?,
        citizenship = ?,
        address = ?,
        nameHashed = ?,
        companyName = ?,
        nameTokens = ?
      WHERE user_id = ?
      `,
            [
                fnameEncrypted,
                lnameEncrypted,
                phoneEncrypted,
                civil_status,
                occupation,
                citizenship,
                address,
                nameHashed,
                companyName,
                nameTokens,
                userId,
            ]
        );

        /* ---------- ACTIVITY LOG ---------- */
        await db.query(
            `INSERT INTO ActivityLog (user_id, action, timestamp)
       VALUES (?, ?, NOW())`,
            [userId, "Updated Profile"]
        );

        return NextResponse.json({ message: "Profile updated successfully" });
    } catch (error) {
        console.error("[Profile Update] Error:", error);
        return NextResponse.json(
            { message: "Failed to update profile" },
            { status: 500 }
        );
    }
}
