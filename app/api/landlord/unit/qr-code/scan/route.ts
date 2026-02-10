// import { NextRequest, NextResponse } from "next/server";
// import { db } from "@/lib/db";
//
// export const runtime = "nodejs";
//
// export async function GET(req: NextRequest) {
//     const { searchParams } = new URL(req.url);
//
//     const property_id = searchParams.get("property_id");
//     const unit_id = searchParams.get("unit_id");
//
//     // ❌ Missing params
//     if (!property_id || !unit_id) {
//         return NextResponse.redirect(
//             new URL("/qr/invalid", req.url)
//         );
//     }
//
//     try {
//         const [rows]: any = await db.query(
//             `
//             SELECT
//                 u.status,
//                 u.publish,
//                 u.qr_enabled
//             FROM Unit u
//             WHERE u.unit_id = ?
//               AND u.property_id = ?
//             `,
//             [unit_id, property_id]
//         );
//
//         // ❌ Unit not found
//         if (!rows || rows.length === 0) {
//             return NextResponse.redirect(
//                 new URL("/qr/not-found", req.url)
//             );
//         }
//
//         const unit = rows[0];
//
//         // ❌ QR disabled
//         if (!unit.qr_enabled) {
//             return NextResponse.redirect(
//                 new URL("/qr/disabled", req.url)
//             );
//         }
//
//         /**
//          * ✅ FINAL DESTINATION RULES
//          */
//
//         // 🔒 Occupied unit → unit QR landing
//         if (unit.status === "occupied") {
//             return NextResponse.redirect(
//                 new URL(`/unit/${unit_id}/qr`, req.url)
//             );
//         }
//
//         // 🟢 Available + published → unit landing page
//         if (unit.publish) {
//             return NextResponse.redirect(
//                 new URL(`/unit/${unit_id}`, req.url)
//             );
//         }
//
//         // ⚠️ Everything else
//         return NextResponse.redirect(
//             new URL("/qr/unavailable", req.url)
//         );
//     } catch (error) {
//         console.error("❌ QR Resolve Error:", error);
//
//         return NextResponse.redirect(
//             new URL("/qr/error", req.url)
//         );
//     }
// }

import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);

    const unit_id = searchParams.get("unit_id");

    // ❌ Missing unit_id
    if (!unit_id) {
        return NextResponse.redirect(
            new URL("/qr/invalid", req.url)
        );
    }

    // ✅ Always redirect to unit landing page
    return NextResponse.redirect(
        new URL(
            `/pages/unit/${unit_id}`,
            process.env.APP_URL
        )
    );

}
