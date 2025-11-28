import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import nodemailer from "nodemailer";
import crypto from "crypto";
import { generateLeaseId } from "@/utils/id_generator";

export async function POST(req: NextRequest) {
    try {
        const { email, unitId, propertyName: incomingName, unitName, startDate, endDate } =
            await req.json();

        console.log(email, unitId, incomingName, unitName, startDate, endDate);

        if (!email || !unitId || !unitName) {
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
        const leaseId = generateLeaseId();

        const conn = await db.getConnection();
        await conn.beginTransaction();

        try {
            // Insert invite record
            await conn.query(
                `
                INSERT INTO InviteCode (code, email, unitId, start_date, end_date, status, expiresAt)
                VALUES (?, ?, ?, ?, ?, 'PENDING', DATE_ADD(NOW(), INTERVAL 7 DAY))
                `,
                [inviteCode, email, unitId, startDate, endDate]
            );

            // Get property_id & rent amount from the unit
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
                    { error: "Unit not found." },
                    { status: 404 }
                );
            }

            const { property_id: propertyId, rent_amount: rentAmount } = unitData[0];

            // 🔍 Auto-fetch property name if not provided
            let propertyName = incomingName;
            if (!propertyName) {
                const [propRows]: any = await conn.query(
                    `SELECT property_name FROM Property WHERE property_id = ?`,
                    [propertyId]
                );

                if (!propRows.length) {
                    await conn.rollback();
                    return NextResponse.json(
                        { error: "Property not found." },
                        { status: 404 }
                    );
                }

                propertyName = propRows[0].property_name;
            }

            // Insert lease agreement draft
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

            // Setup email
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
                html: `... same email template ...`,
            });

            return NextResponse.json({
                success: true,
                code: inviteCode,
                lease_id: leaseId,
                rent_amount: rentAmount,
                propertyName,
                message: "Invite sent successfully.",
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
