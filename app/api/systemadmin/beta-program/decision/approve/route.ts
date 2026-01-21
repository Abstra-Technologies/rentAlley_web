import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { safeDecrypt } from "@/utils/decrypt/safeDecrypt";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function PATCH(req: NextRequest) {
    const { beta_id, landlord_id, admin_id } = await req.json();

    if (!beta_id || !landlord_id || !admin_id) {
        return NextResponse.json(
            { error: "Missing required fields" },
            { status: 400 }
        );
    }

    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        /* =====================================================
           1. Approve Beta Application (NO subscription logic)
        ===================================================== */
        const [approveResult]: any = await connection.query(
            `
      UPDATE BetaUsers
      SET
        status = 'approved',
        approved_by = ?,
        approved_at = NOW(),
        rejection_reason = NULL
      WHERE beta_id = ?
        AND status = 'pending'
      `,
            [admin_id, beta_id]
        );

        if (approveResult.affectedRows === 0) {
            throw new Error("Beta user not found or already processed");
        }

        /* =====================================================
           2. Fetch landlord details for email
        ===================================================== */
        const [rows]: any = await connection.query(
            `
      SELECT 
        u.email,
        u.firstName
      FROM Landlord l
      JOIN User u ON u.user_id = l.user_id
      WHERE l.landlord_id = ?
      `,
            [landlord_id]
        );

        const landlord = rows?.[0];

        await connection.commit();

        /* =====================================================
           3. Send Beta Program Accepted Email (Resend)
           (POST-COMMIT — SAFE)
        ===================================================== */
        const email = safeDecrypt(landlord?.email);
        const firstName = safeDecrypt(landlord?.firstName);

        if (email) {
            await resend.emails.send({
                from: "Upkyp Beta Program <hello@upkyp.com>",
                to: email,
                subject: "🎉 You’re Accepted into the Upkyp Beta Program",
                html: `
<!DOCTYPE html>
<html>
  <body style="margin:0; padding:0; background-color:#f4f6f8;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f6f8; padding:40px 0;">
      <tr>
        <td align="center">
          <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff; border-radius:14px; box-shadow:0 10px 30px rgba(0,0,0,0.08); overflow:hidden;">
            
            <!-- Header -->
            <tr>
              <td style="background:linear-gradient(135deg,#0f172a,#2563eb); padding:28px 32px;">
                <h1 style="margin:0; font-family:Arial,sans-serif; font-size:22px; color:#ffffff;">
                  🎉 Welcome to the Upkyp Beta
                </h1>
                <p style="margin:8px 0 0; font-family:Arial,sans-serif; font-size:14px; color:#c7d2fe;">
                  Early access confirmed
                </p>
              </td>
            </tr>

            <!-- Body -->
            <tr>
              <td style="padding:32px;">
                <p style="margin:0 0 14px; font-family:Arial,sans-serif; font-size:15px; color:#111827;">
                  Hi ${firstName || "there"},
                </p>

                <p style="margin:0 0 14px; font-family:Arial,sans-serif; font-size:15px; color:#374151;">
                  We’re excited to let you know that your application to the
                  <strong>Upkyp Beta Program</strong> has been
                  <strong style="color:#16a34a;">accepted</strong>.
                </p>

                <p style="margin:0 0 14px; font-family:Arial,sans-serif; font-size:15px; color:#374151;">
                  You now have early access to upcoming features designed to
                  streamline property management, billing, and tenant workflows.
                </p>

                <!-- Highlight Box -->
                <div style="margin:22px 0; padding:16px; background:#f0f9ff; border-left:4px solid #2563eb; border-radius:8px;">
                  <p style="margin:0; font-family:Arial,sans-serif; font-size:14px; color:#1e3a8a;">
                    <strong>No subscription has been activated automatically.</strong><br/>
                    You’re in full control — activate your beta access only when
                    you’re ready.
                  </p>
                </div>

                <!-- CTA -->
                <div style="margin:30px 0; text-align:center;">
                  <a href="https://app.upkyp.com/login"
                     style="display:inline-block; padding:14px 26px; font-family:Arial,sans-serif;
                            font-size:15px; font-weight:bold; color:#ffffff;
                            background:linear-gradient(135deg,#2563eb,#1d4ed8);
                            text-decoration:none; border-radius:10px;">
                    Go to Dashboard
                  </a>
                </div>

                <p style="margin:0 0 14px; font-family:Arial,sans-serif; font-size:14px; color:#374151;">
                  Your feedback during this beta phase will directly shape the
                  future of Upkyp.
                </p>

                <p style="margin:24px 0 0; font-family:Arial,sans-serif; font-size:14px; color:#6b7280;">
                  — The Upkyp Team
                </p>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="background:#f9fafb; padding:18px 32px; text-align:center;">
                <p style="margin:0; font-family:Arial,sans-serif; font-size:12px; color:#9ca3af;">
                  © ${new Date().getFullYear()} Upkyp. All rights reserved.
                </p>
              </td>
            </tr>

          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
    `,
            });
        }


        return NextResponse.json({
            success: true,
            message: "Beta approved and acceptance email sent via Resend",
        });
    } catch (error: any) {
        await connection.rollback();
        console.error("[BETA_APPROVAL_ERROR]", error);

        return NextResponse.json(
            { error: error.message || "Failed to approve beta user" },
            { status: 500 }
        );
    } finally {
        connection.release();
    }
}
