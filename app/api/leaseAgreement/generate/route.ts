
import { NextRequest, NextResponse } from "next/server";
import PDFDocument from "pdfkit";
import { db } from "@/lib/db"; // if you want to save in DB

export async function POST(req: NextRequest) {
    try {
        const {
            tenantName,
            tenantEmail,
            propertyName,
            unitName,
            startDate,
            endDate,
            unitId,
            monthlyRent,
            securityDeposit,
        } = await req.json();

        if (!tenantName || !propertyName || !unitName || !startDate || !endDate) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        // Create a PDF
        const doc = new PDFDocument({ margin: 50 });
        const chunks: Uint8Array[] = [];

        doc.on("data", (chunk) => chunks.push(chunk));
        const streamFinished = new Promise<void>((resolve) =>
            doc.on("end", () => resolve())
        );

        // Title
        doc.fontSize(20).text("Lease Agreement", { align: "center" }).moveDown(2);

        // Parties
        doc.fontSize(12).text(`This Lease Agreement is made between:`);
        doc.text(`Landlord: __________________________`);
        doc.text(`Tenant: ${tenantName} (${tenantEmail || "N/A"})`);
        doc.text(`Property: ${propertyName} - Unit ${unitName}`).moveDown();

        // Lease Terms
        doc.text(`Lease Start Date: ${startDate}`);
        doc.text(`Lease End Date: ${endDate}`);
        doc.text(`Monthly Rent: ₱${monthlyRent || "________"}`);
        doc.text(`Security Deposit: ₱${securityDeposit || "________"}`).moveDown();

        // Sample clauses
        doc.moveDown().text("Terms and Conditions:", { underline: true }).moveDown(0.5);
        doc.text("1. Tenant agrees to pay rent on or before the due date.");
        doc.text("2. Tenant shall keep the premises in good condition.");
        doc.text("3. Subleasing is not allowed without landlord’s consent.");
        doc.text("4. Utilities and dues shall be paid by the tenant.");
        doc.text("5. Violation of terms may result in termination of lease.");

        doc.moveDown(3);
        doc.text("_________________________", { continued: true });
        doc.text("          ", { continued: true });
        doc.text("_________________________");
        doc.text("Landlord Signature          Tenant Signature");

        doc.end();
        await streamFinished;

        const pdfBuffer = Buffer.concat(chunks);

        // (Optional) save to DB
        // await db.query(
        //   `INSERT INTO LeaseAgreement (unit_id, start_date, end_date, agreement_url)
        //    VALUES (?, ?, ?, ?)`,
        //   [unitId, startDate, endDate, "/storage/lease/Lease_" + unitId + ".pdf"]
        // );

        return new NextResponse(pdfBuffer, {
            status: 200,
            headers: {
                "Content-Type": "application/pdf",
                "Content-Disposition": `attachment; filename="Lease_Agreement_${tenantName}.pdf"`,
            },
        });
    } catch (error: any) {
        console.error("Error generating lease:", error);
        return NextResponse.json(
            { error: "Failed to generate lease", details: error.message },
            { status: 500 }
        );
    }
}
