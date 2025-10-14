import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { decryptData } from "@/crypto/encrypt";
import crypto from "crypto";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const q = searchParams.get("q")?.trim();
        const landlord_id = searchParams.get("landlord_id");

        if (!q || !landlord_id) {
            return NextResponse.json(
                { error: "Missing query or landlord_id" },
                { status: 400 }
            );
        }

        const secret = process.env.ENCRYPTION_SECRET!;
        const isEmail = q.includes("@");

        let rows: any[] = [];

        if (isEmail) {
            // 🔐 Hash email for search
            const emailHashed = crypto
                .createHash("sha256")
                .update(q.toLowerCase())
                .digest("hex");

            [rows] = await db.query(
                `
                    SELECT
                        la.agreement_id,
                        la.status AS lease_status,
                        p.property_name,
                        u.unit_name,
                        usr.firstName,
                        usr.lastName,
                        usr.email
                    FROM LeaseAgreement la
                             JOIN Tenant t ON la.tenant_id = t.tenant_id
                             JOIN User usr ON t.user_id = usr.user_id
                             JOIN Unit u ON la.unit_id = u.unit_id
                             JOIN Property p ON u.property_id = p.property_id
                    WHERE p.landlord_id = ?
                      AND usr.emailHashed = ?
                      AND la.status = 'active'
                    LIMIT 10
                `,
                [landlord_id, emailHashed]
            );
        } else {
            const search = `%${q}%`;

            [rows] = await db.query(
                `
                    SELECT
                        la.agreement_id,
                        la.status AS lease_status,
                        p.property_name,
                        u.unit_name,
                        usr.firstName,
                        usr.lastName,
                        usr.email
                    FROM LeaseAgreement la
                             JOIN Tenant t ON la.tenant_id = t.tenant_id
                             JOIN User usr ON t.user_id = usr.user_id
                             JOIN Unit u ON la.unit_id = u.unit_id
                             JOIN Property p ON u.property_id = p.property_id
                    WHERE p.landlord_id = ?
                      AND la.status = 'active'
                      AND (
                        p.property_name LIKE ? OR
                        u.unit_name LIKE ? OR
                        usr.firstName LIKE ? OR
                        usr.lastName LIKE ?
                        )
                    LIMIT 15
                `,
                [landlord_id, search, search, search, search]
            );
        }

        // 🧠 Decrypt fields safely
        const decrypted = rows.map((r: any) => {
            const safeDecrypt = (value: any) => {
                try {
                    return decryptData(JSON.parse(value), secret);
                } catch {
                    return "";
                }
            };
            return {
                agreement_id: r.agreement_id,
                lease_status: r.lease_status,
                property_name: r.property_name,
                unit_name: r.unit_name,
                firstName: safeDecrypt(r.firstName),
                lastName: safeDecrypt(r.lastName),
                email: safeDecrypt(r.email),
            };
        });

        return NextResponse.json(decrypted);
    } catch (error) {
        console.error("❌ Error searching leases:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
