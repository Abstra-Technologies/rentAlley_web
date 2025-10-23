import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import nodemailer from "nodemailer";
import crypto from "crypto";

export async function POST(req: NextRequest) {
    try {
        const { email, unitId, propertyName, unitName, startDate, endDate } =
            await req.json();

        console.log(email, unitId, propertyName, unitName, startDate, endDate);
        console.log('property name', propertyName);
        console.log('unit name', unitName);


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

        await db.query(
            `
                INSERT INTO InviteCode (code, email, unitId, start_date, end_date, status, expiresAt)
                VALUES (?, ?, ?, ?, ?, 'PENDING', DATE_ADD(NOW(), INTERVAL 7 DAY))
            `,
            [inviteCode, email, unitId, startDate, endDate]
        );

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
            message: "Invite sent successfully with lease dates saved.",
        });
    } catch (error) {
        console.error("Error sending invite:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
