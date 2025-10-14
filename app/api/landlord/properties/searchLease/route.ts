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
            const emailHashed = crypto.createHash("sha256").update(q.toLowerCase()).digest("hex");

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
                    WHERE p.landlord_id = ? AND usr.emailHashed = ?
                    LIMIT 5
                `,
                [landlord_id, emailHashed]
            );
        } else {
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
                    LIMIT 200
                `,
                [landlord_id]
            );
        }

        // 🧠 Decrypt directly (same as your getLandlordName)
        const decrypted = rows.map((r: any) => {
            let firstName = "";
            let lastName = "";
            let email = "";

            try {
                firstName = decryptData(JSON.parse(r.firstName), secret);
            } catch {}
            try {
                lastName = decryptData(JSON.parse(r.lastName), secret);
            } catch {}
            try {
                email = decryptData(JSON.parse(r.email), secret);
            } catch {}

            return {
                ...r,
                firstName,
                lastName,
                email,
            };
        });

        // 🔍 Simple fuzzy search for names/units/properties
        const filtered = isEmail
            ? decrypted
            : decrypted
                .map((r: any) => {
                    const searchable = [
                        r.firstName,
                        r.lastName,
                        `${r.firstName} ${r.lastName}`,
                        `${r.lastName} ${r.firstName}`,
                        r.property_name,
                        r.unit_name,
                    ]
                        .join(" ")
                        .toLowerCase();

                    const matchScore = q
                        .toLowerCase()
                        .split(" ")
                        .filter((word) => searchable.includes(word)).length;

                    return { ...r, matchScore };
                })
                .filter((r: any) => r.matchScore > 0)
                .sort((a: any, b: any) => b.matchScore - a.matchScore)
                .slice(0, 10);

        // ✅ Return clean results
        return NextResponse.json(
            filtered.map((r: any) => ({
                agreement_id: r.agreement_id,
                lease_status: r.lease_status,
                property_name: r.property_name,
                unit_name: r.unit_name,
                firstName: r.firstName,
                lastName: r.lastName,
                email: r.email,
            }))
        );
    } catch (error) {
        console.error("❌ Error searching leases:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
