import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { token, amount, planId, planName, prorated } = body;

        console.log("🔵 Google Pay TEST Token Received:", token);

        if (!token) {
            return NextResponse.json(
                { success: false, error: "Missing Google Pay token" },
                { status: 400 }
            );
        }

        // TEST MODE: Google Pay returns test tokens - always accept
        const isTestToken =
            token.includes("test") ||
            token.length > 10 ||
            token.toLowerCase().includes("mock");

        if (isTestToken) {
            console.log("🟢 Google Pay TEST PAYMENT ACCEPTED");

            // Here you will later insert subscription activation logic

            return NextResponse.json(
                {
                    success: true,
                    message: "Google Pay TEST payment approved",
                    testMode: true,
                    planName,
                    amount,
                },
                { status: 200 }
            );
        }

        // ----------- LIVE MODE (future) -----------
        return NextResponse.json(
            {
                success: false,
                message:
                    "Live Google Pay payments require a payment processor (Stripe, Braintree, Adyen).",
            },
            { status: 400 }
        );
    } catch (error: any) {
        console.error("❌ Google Pay Handler Error:", error);
        return NextResponse.json(
            { success: false, error: "Server error processing Google Pay." },
            { status: 500 }
        );
    }
}
