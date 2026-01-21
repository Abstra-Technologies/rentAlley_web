import { NextResponse } from "next/server";

// Node-only package (SAFE here)
const phBanks = require("ph-banks");

export async function GET() {
    const banks = Array.isArray(phBanks)
        ? phBanks
        : phBanks.default || [];

    return NextResponse.json(
        banks.map((b: any) => ({
            name: b.name,
            code: b.code || b.name,
        }))
    );
}
