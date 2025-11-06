// app/api/auth/test/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    console.log("Test API called");
    
    try {
        const body = await req.json();
        console.log("Received body:", body);
        
        return NextResponse.json({
            message: "Test API working!",
            receivedData: body,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error("Test API error:", error);
        return NextResponse.json(
            { error: "Test API failed", details: error.message },
            { status: 500 }
        );
    }
}

export async function GET() {
    return NextResponse.json({
        message: "Test API GET working!",
        timestamp: new Date().toISOString()
    });
}