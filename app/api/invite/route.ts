import { NextResponse } from "next/server";
import { generateInviteCode } from "@/utils/inviteCode";

export async function POST(req: Request) {
    const { unitId, propertyName } = await req.json();

    if (!unitId || !propertyName) {
        return NextResponse.json({ error: "Missing data" }, { status: 400 });
    }

    const code = generateInviteCode(unitId, propertyName);
    return NextResponse.json({ code });
}
