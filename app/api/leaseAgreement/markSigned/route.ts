
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
    try {
        const { envelopeId, userType } = await req.json();
        console.log("marksigned envelopeId:", envelopeId);
        console.log("marksigned userType:", userType);

        if (!envelopeId || !userType) {
            return NextResponse.json(
                { error: "Missing envelopeId or userType" },
                { status: 400 }
            );
        }

        // 1️⃣ Find the lease by envelopeId
        const [leaseRows]: any = await db.query(
            `SELECT agreement_id FROM LeaseAgreement WHERE docusign_envelope_id = ?`,
            [envelopeId]
        );

        if (!leaseRows || leaseRows.length === 0) {
            return NextResponse.json(
                { error: "No lease found for this envelopeId" },
                { status: 404 }
            );
        }

        const agreementId = leaseRows[0].agreement_id;

        // 2️⃣ Mark this signer as signed
        await db.execute(
            `UPDATE LeaseSignature
             SET status = 'signed', signed_at = NOW()
             WHERE agreement_id = ? AND role = ?`,
            [agreementId, userType]
        );

        // 3️⃣ Check how many signatures are completed
        const [checkRows]: any = await db.query(
            `SELECT COUNT(*) as total,
                    SUM(status = 'signed') as signedCount
             FROM LeaseSignature
             WHERE agreement_id = ?`,
            [agreementId]
        );

        const total = checkRows[0].total;
        const signedCount = checkRows[0].signedCount;

        // 4️⃣ Update LeaseAgreement status
        if (signedCount === total) {
            await db.execute(
                `UPDATE LeaseAgreement 
                 SET status = 'active', activated_at = NOW()
                 WHERE agreement_id = ?`,
                [agreementId]
            );
            console.log(`✅ Lease ${agreementId} is now ACTIVE`);
        } else {
            await db.execute(
                `UPDATE LeaseAgreement 
                 SET status = 'pending' 
                 WHERE agreement_id = ?`,
                [agreementId]
            );
            console.log(`⏳ Lease ${agreementId} is partially signed still pending`);
        }

        return NextResponse.json({
            success: true,
            message:
                signedCount === total
                    ? "Lease fully signed ✅ Lease is now active"
                    : `${userType} signed, waiting for others...`,
        });
    } catch (err) {
        console.error("🔥 Error in markSigned:", err);
        return NextResponse.json(
            { error: "Failed to update lease signing", details: String(err) },
            { status: 500 }
        );
    }
}





// export async function POST(req: NextRequest) {
//     try {
//         const { envelopeId, userType } = await req.json();
//         console.log('marksigned envelopeId', envelopeId);
//         console.log('marksigned userType', userType);
//
//         if (!envelopeId || !userType) {
//             return NextResponse.json(
//                 { error: "Missing envelopeId or userType" },
//                 { status: 400 }
//             );
//         }
//
//         // 1️⃣ Find the lease by envelopeId
//         const [leaseRows]: any = await db.query(
//             `SELECT agreement_id FROM LeaseAgreement WHERE docusign_envelope_id = ?`,
//             [envelopeId]
//         );
//
//         if (!leaseRows || leaseRows.length === 0) {
//             return NextResponse.json(
//                 { error: "No lease found for this envelopeId" },
//                 { status: 404 }
//             );
//         }
//
//         const agreementId = leaseRows[0].agreement_id;
//
//         // 2️⃣ Mark this signer as signed
//         await db.execute(
//             `UPDATE LeaseSignature
//        SET status = 'signed', signed_at = NOW()
//        WHERE agreement_id = ? AND role = ?`,
//             [agreementId, userType]
//         );
//
//         // 3️⃣ Check how many signatures are completed
//         const [checkRows]: any = await db.query(
//             `SELECT COUNT(*) as total, SUM(status = 'signed') as signedCount
//        FROM LeaseSignature
//        WHERE agreement_id = ?`,
//             [agreementId]
//         );
//
//         const total = checkRows[0].total;
//         const signedCount = checkRows[0].signedCount;
//
//         // 4️⃣ Update LeaseAgreement status based on progress
//         // if (signedCount === total) {
//         //     await db.execute(
//         //         `UPDATE LeaseAgreement SET status = 'completed' WHERE agreement_id = ?`,
//         //         [agreementId]
//         //     );
//         // } else {
//         //     await db.execute(
//         //         `UPDATE LeaseAgreement SET status = 'partially_signed' WHERE agreement_id = ?`,
//         //         [agreementId]
//         //     );
//         // }
//
//         return NextResponse.json({
//             success: true,
//             message:
//                 signedCount === total
//                     ? "Lease fully signed"
//                     : `${userType} signed, waiting for others`,
//         });
//     } catch (err) {
//         console.error("🔥 Error in markSigned:", err);
//         return NextResponse.json(
//             { error: "Failed to update lease signing", details: String(err) },
//             { status: 500 }
//         );
//     }
// }


