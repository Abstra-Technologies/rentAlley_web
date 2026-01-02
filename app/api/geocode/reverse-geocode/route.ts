import { NextResponse } from "next/server";

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const lat = searchParams.get("lat");
    const lng = searchParams.get("lng");

    if (!lat || !lng) return NextResponse.json({});

    const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`,
        {
            headers: {
                "User-Agent": "Upkyp/1.0 (contact@upkyp.com)",
                "Accept-Language": "en",
            },
        }
    );

    const data = await res.json();
    return NextResponse.json(data);
}
