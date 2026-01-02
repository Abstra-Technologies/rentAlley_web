import { NextResponse } from "next/server";

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q");

    if (!q) {
        return NextResponse.json([], { status: 400 });
    }

    try {
        const res = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
                q
            )}&addressdetails=1&countrycodes=ph`,
            {
                headers: {
                    // REQUIRED by Nominatim usage policy
                    "User-Agent": "Upkyp/1.0 (contact@upkyp.com)",
                    "Accept-Language": "en",
                },
            }
        );

        const data = await res.json();
        return NextResponse.json(data);
    } catch (err) {
        return NextResponse.json([], { status: 500 });
    }
}
