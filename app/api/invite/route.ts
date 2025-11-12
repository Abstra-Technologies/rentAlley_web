import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import nodemailer from "nodemailer";
import crypto from "crypto";
import { generateLeaseId } from "@/utils/id_generator";

export async function POST(req: NextRequest) {
    try {
        const { email, unitId, propertyName, unitName, startDate, endDate } =
            await req.json();

        // 🔍 Basic Validation
        if (!email || !unitId || !propertyName || !unitName) {
            return NextResponse.json(
                { error: "Missing required fields." },
                { status: 400 }
            );
        }

        if (!startDate || !endDate) {
            return NextResponse.json(
                { error: "Start and end date are required." },
                { status: 400 }
            );
        }

        if (new Date(startDate) >= new Date(endDate)) {
            return NextResponse.json(
                { error: "End date must be after start date." },
                { status: 400 }
            );
        }

        const inviteCode = crypto.randomBytes(8).toString("hex");
        const leaseId = generateLeaseId(); // ✅ Generate lease ID

        const conn = await db.getConnection();
        await conn.beginTransaction();

        try {
            // 1️⃣ Insert InviteCode
            await conn.query(
                `
        INSERT INTO InviteCode (code, email, unitId, start_date, end_date, status, expiresAt)
        VALUES (?, ?, ?, ?, ?, 'PENDING', DATE_ADD(NOW(), INTERVAL 7 DAY))
      `,
                [inviteCode, email, unitId, startDate, endDate]
            );

            // 2️⃣ Fetch property_id and rent_amount from Unit
            const [unitData]: any = await conn.query(
                `
        SELECT property_id, rent_amount
        FROM Unit
        WHERE unit_id = ?
      `,
                [unitId]
            );

            if (!unitData.length) {
                await conn.rollback();
                return NextResponse.json(
                    { error: "Unit not found in property." },
                    { status: 404 }
                );
            }

            const { property_id: propertyId, rent_amount: rentAmount } = unitData[0];

            // 3️⃣ Insert LeaseAgreement using generated ID + rent amount
            await conn.query(
                `
        INSERT INTO LeaseAgreement (
          agreement_id,
          tenant_id,
          unit_id,
          start_date,
          end_date,
          rent_amount,
          status,
          created_at
        )
        VALUES (?, NULL, ?, ?, ?, ?, 'draft', NOW())
      `,
                [leaseId, unitId, startDate, endDate, rentAmount || 0.0]
            );

            await conn.commit();

            // 4️⃣ Send Email Invitation
            const transporter = nodemailer.createTransport({
                service: "gmail",
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS,
                },
            });

            const registrationUrl = `${process.env.BASE_URL}/pages/InviteRegister?invite=${inviteCode}`;

            await transporter.sendMail({
                from: `[Upkyp] "${propertyName}" <${process.env.EMAIL_USER}>`,
                to: email,
                subject: `You're invited to join ${propertyName}`,
                html: `
          <div style="background-color:#f4f4f4;padding:40px 20px;font-family:sans-serif">
            <div style="max-width:600px;margin:0 auto;background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.1)">
              <div style="background-color:#4f46e5;padding:20px;text-align:center;color:white">
                <h1 style="margin:0;font-size:24px;">Upkyp</h1>
                <p style="margin:0;">Invitation to Join Unit</p>
              </div>
              <div style="padding:30px;">
                <h2 style="font-size:20px;color:#333;">Invitation to Join ${propertyName}</h2>
                <p style="color:#555;">You’ve been invited to join as a tenant for unit <strong>${unitName}</strong>.</p>
                <p style="color:#555;">Proposed lease period:</p>
                <p><strong>${new Date(startDate).toLocaleDateString("en-PH", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                })}</strong> – <strong>${new Date(endDate).toLocaleDateString(
                    "en-PH",
                    { year: "numeric", month: "short", day: "numeric" }
                )}</strong></p>
                ${
                    rentAmount
                        ? `<p style="color:#555;">Monthly Rent: <strong>₱${Number(
                            rentAmount
                        ).toLocaleString()}</strong></p>`
                        : ""
                }
                <p style="color:#555;">Click below to register and confirm your tenancy:</p>
                <p>
                  <a href="${registrationUrl}" target="_blank" style="display:inline-block;padding:10px 20px;background-color:#4f46e5;color:white;text-decoration:none;border-radius:4px;font-weight:bold;">Join Now</a>
                </p>
                <p style="color:#999;font-size:12px;">This invite will expire in 7 days.</p>
              </div>
            </div>
          </div>
        `,
            });

            return NextResponse.json({
                success: true,
                code: inviteCode,
                lease_id: leaseId,
                rent_amount: rentAmount,
                message:
                    "Invite sent successfully and LeaseAgreement created with rent amount.",
            });
        } catch (err) {
            await conn.rollback();
            console.error("DB transaction failed:", err);
            return NextResponse.json(
                { error: "Database transaction failed." },
                { status: 500 }
            );
        } finally {
            conn.release();
        }
    } catch (error) {
        console.error("Error sending invite:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
