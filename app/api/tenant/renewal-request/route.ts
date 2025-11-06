import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { encryptData } from "@/crypto/encrypt";

export async function POST(request: Request) {
    try {
        const { tenant_id, unit_id, agreement_id, requested_start_date, requested_end_date, notes } = await request.json();
        // Validate required fields
        if (!tenant_id || !unit_id || !agreement_id || !requested_start_date || !requested_end_date) {
            return NextResponse.json(
                { message: "Missing required fields: tenant_id, unit_id, agreement_id, requested_start_date, or requested_end_date" },
                { status: 400 }
            );
        }

        // Verify tenant and lease exist
        const [tenant] = await db.execute("SELECT tenant_id FROM Tenant WHERE tenant_id = ?", [tenant_id]);
        if (!tenant.length) {
            return NextResponse.json({ message: "Invalid tenant ID" }, { status: 400 });
        }

        const [lease] = await db.execute(
            "SELECT agreement_id, status FROM LeaseAgreement WHERE agreement_id = ? AND tenant_id = ? AND unit_id = ?",
            [agreement_id, tenant_id, unit_id]
        );
        if (!lease.length) {
            return NextResponse.json({ message: "Invalid lease agreement or unit for this tenant" }, { status: 400 });
        }
        if (lease[0].status !== "active") {
            return NextResponse.json({ message: "Cannot request renewal for a non-active lease" }, { status: 400 });
        }

        // Check for existing pending renewal requests
        const [existingRequest] = await db.execute(
            "SELECT id FROM RenewalRequest WHERE agreement_id = ? AND status = 'pending'",
            [agreement_id]
        );
        if (existingRequest.length) {
            return NextResponse.json({ message: "A pending renewal request already exists for this lease" }, { status: 400 });
        }

        // Insert renewal request
        const [result] = await db.execute(
            `INSERT INTO RenewalRequest (
        tenant_id, agreement_id, unit_id, requested_start_date, requested_end_date, notes, status
      ) VALUES (?, ?, ?, ?, ?, ?, 'pending')`,
            [tenant_id, agreement_id, unit_id, requested_start_date, requested_end_date, notes || null]
        );

        if (!result.insertId) {
            return NextResponse.json({ message: "Database error: Failed to create renewal request" }, { status: 500 });
        }

        // Fetch landlord details for notification
        const [landlord] = await db.execute(
            `SELECT u.email, u.fcm_token
       FROM User u
       JOIN Landlord l ON u.user_id = l.user_id
       JOIN Property p ON l.landlord_id = p.landlord_id
       JOIN Unit un ON p.property_id = un.property_id
       WHERE un.unit_id = ?`,
            [unit_id]
        );

        if (landlord.length) {
            // Example: Send encrypted notification (pseudo-code, implement your notification logic)
            const encryptedEmail = encryptData(landlord[0].email);
            console.log(`Notify landlord at ${encryptedEmail} or FCM token ${landlord[0].fcm_token}`);
            // Add your notification logic here (e.g., email or push notification)
        }

        return NextResponse.json(
            { message: "Renewal request submitted successfully", requestId: result.insertId },
            { status: 200 }
        );
    } catch (error: any) {
        console.error("Error creating renewal request:", error);
        return NextResponse.json(
            { message: `Database error: Failed to submit renewal request - ${error.message}` },
            { status: 500 }
        );
    }
}