import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
    try {
        const {
            items,
            firstName,
            lastName,
            email,
            payment_method_id,
            agreement_id,
            redirectUrl,
        } = await req.json();

        if (!agreement_id || !firstName || !lastName || !email) {
            return NextResponse.json(
                { error: "Missing required fields." },
                { status: 400 }
            );
        }

        if (!Array.isArray(items) || items.length === 0) {
            return NextResponse.json(
                { error: "Missing item details." },
                { status: 400 }
            );
        }

        let totalAmount = 0;
        const mayaItems = [];
        const paymentTypes: string[] = [];

        for (const item of items) {
            const amountValue = Number(item.amount);
            if (!item.type || !amountValue || amountValue <= 0) {
                return NextResponse.json(
                    { error: "Invalid item format." },
                    { status: 400 }
                );
            }

            totalAmount += amountValue;
            paymentTypes.push(item.type);

            mayaItems.push({
                name:
                    item.type === "security_deposit"
                        ? "Security Deposit"
                        : "Advance Rent",
                quantity: 1,
                totalAmount: { value: amountValue, currency: "PHP" },
            });
        }

        const publicKey = process.env.MAYA_PUBLIC_KEY;
        const secretKey = process.env.MAYA_SECRET_KEY;

        const requestReferenceNumber = `PAY-${agreement_id}-${Date.now()}`;

        const encodedPaymentTypes = encodeURIComponent(paymentTypes.join(","));

        const payload = {
            totalAmount: {
                value: parseFloat(totalAmount.toFixed(2)),
                currency: "PHP",
            },
            buyer: {
                firstName,
                lastName,
                contact: { email },
            },
            redirectUrl: {
                success: `${redirectUrl.success}?agreement_id=${agreement_id}&ref=${requestReferenceNumber}&status=success&types=${encodedPaymentTypes}&totalAmount=${totalAmount}`,
                failure: `${redirectUrl.failure}?agreement_id=${agreement_id}&ref=${requestReferenceNumber}&status=failed&types=${encodedPaymentTypes}&totalAmount=${totalAmount}`,
                cancel: `${redirectUrl.cancel}?agreement_id=${agreement_id}&ref=${requestReferenceNumber}&status=cancelled&types=${encodedPaymentTypes}&totalAmount=${totalAmount}`,
            },

            requestReferenceNumber,
            items: mayaItems,
        };

        const response = await axios.post(
            "https://pg-sandbox.paymaya.com/checkout/v1/checkouts",
            payload,
            {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Basic ${Buffer.from(`${publicKey}:${secretKey}`).toString("base64")}`,
                },
            }
        );

        return NextResponse.json({
            checkoutUrl: response.data.redirectUrl,
            requestReferenceNumber,
        });
    } catch (error: any) {
        console.error(
            "PayMaya Error:",
            error.response?.data || error.message
        );

        return NextResponse.json(
            {
                error: "Payment initiation failed.",
                details: error.response?.data || error.message,
            },
            { status: 500 }
        );
    }
}
