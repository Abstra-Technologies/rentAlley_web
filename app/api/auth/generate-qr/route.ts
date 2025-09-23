import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    console.log("Generate QR API called");
    
    try {
        const body = await req.json();
        const { user_id } = body;

        if (!user_id) {
            return NextResponse.json(
                { error: "User ID is required." },
                { status: 400 }
            );
        }

        // Generate a simple random secret
        const secret = Array.from({length: 32}, () => 
            'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'[Math.floor(Math.random() * 32)]
        ).join('');
        
        const userEmail = `user${user_id}@myapp.com`;
        const appName = "Hestia";
        
        // Create TOTP URL
        const totpUrl = `otpauth://totp/${appName}:${userEmail}?secret=${secret}&issuer=${appName}`;
        
        // Generate QR code URL
        const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(totpUrl)}`;
        
        console.log("QR code generated successfully");
        
        return NextResponse.json({
            qrCodeUrl,
            manualKey: secret,
            success: true
        });
        
    } catch (error) {
        console.error("Error in generate-qr:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}