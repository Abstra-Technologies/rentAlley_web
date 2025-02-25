import { db } from "../../../lib/db";
import { parse } from "cookie";
import { jwtVerify } from "jose";
import { sendFCMNotification } from "../../../lib/firebaseAdmin";
import {deleteFromS3} from "../../../lib/s3";

// export default async function updateandlordStatus(req, res) {
//
// //region get admin id
//     const cookies = req.headers.cookie ? parse(req.headers.cookie) : null;
//     if (!cookies || !cookies.token) {
//         return res.status(401).json({ success: false, message: "Unauthorized" });
//     }
//
//     const secretKey = new TextEncoder().encode(process.env.JWT_SECRET);
//     let decoded;
//     try {
//         const { payload } = await jwtVerify(cookies.token, secretKey);
//         decoded = payload;
//     } catch (err) {
//         return res.status(401).json({ success: false, message: "Invalid Token" });
//     }
//
//     if (!decoded || !decoded.admin_id) {
//         return res.status(401).json({ success: false, message: "Invalid Token Data" });
//     }
//
//     const currentadmin_id = decoded.admin_id;
// //endregion
//
//     const { landlord_id, status, message } = req.body;
//
//     const [rows] = await db.execute(
//         `SELECT lv.status AS verification_status,
//                 lv.reviewed_by,
//                 l.user_id,
//                 u.fcm_token
//          FROM LandlordVerification lv
//                   JOIN Landlord l ON lv.landlord_id = l.landlord_id
//                   JOIN User u ON l.user_id = u.user_id
//          WHERE lv.landlord_id = ?`,
//         [landlord_id]
//     );
//
//     const { user_id, fcm_token } = rows[0];
//
//     try {
//
//         await db.query(
//             "UPDATE LandlordVerification SET status = ?, reviewed_by = ?, review_date = NOW(), message = ? WHERE landlord_id = ?",
//             [status, currentadmin_id,  message, landlord_id]
//         );
//
//         const isVerified = status.toLowerCase() === "approved" ? 1 : 0;
//         await db.execute(
//             `UPDATE Landlord
//              SET is_verified = ?
//              WHERE landlord_id = ?`,
//             [isVerified, landlord_id]
//         );
//
//         const notificationTitle = `Landlord Verification ${status}`;
//         const notificationBody = `Your landlord verification has been ${status.toUpperCase()} by the admin. ${
//             message ? `Message: ${message}` : ""
//         }`;
//
//         await db.execute(
//             "INSERT INTO Notification (user_id, title, body, is_read, created_at) VALUES (?, ?, ?, 0, NOW())",
//             [user_id, notificationTitle, notificationBody]
//         );
//
//         await sendFCMNotification(fcm_token, notificationTitle, notificationBody);
//
//
//         return res.status(200).json({ message: `Verification ${status} successfully.` });
//     } catch (error) {
//         console.error("Error updating verification:", error);
//         return res.status(500).json({ error: "Internal server error" });
//     }
// }


export default async function updateLandlordStatus(req, res) {
    //region Get Admin ID
    const cookies = req.headers.cookie ? parse(req.headers.cookie) : null;
    if (!cookies || !cookies.token) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const secretKey = new TextEncoder().encode(process.env.JWT_SECRET);
    let decoded;
    try {
        const { payload } = await jwtVerify(cookies.token, secretKey);
        decoded = payload;
    } catch (err) {
        return res.status(401).json({ success: false, message: "Invalid Token", err });
    }

    if (!decoded || !decoded.admin_id) {
        return res.status(401).json({ success: false, message: "Invalid Token Data" });
    }

    const currentadmin_id = decoded.admin_id;
    //endregion

    const { landlord_id, status, message } = req.body;

    try {
        // ✅ Fetch landlord verification data
        const [rows] = await db.execute(
            `SELECT lv.status AS verification_status,
                    lv.reviewed_by,
                    lv.document_url,
                    lv.selfie_url,
                    l.user_id,
                    u.fcm_token
             FROM LandlordVerification lv
             JOIN Landlord l ON lv.landlord_id = l.landlord_id
             JOIN User u ON l.user_id = u.user_id
             WHERE lv.landlord_id = ?`,
            [landlord_id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: "Landlord not found." });
        }

        const { user_id, fcm_token, document_url, selfie_url } = rows[0];

        if (status.toLowerCase() === "rejected") {

            // Delete files from S3
            if (document_url) {
                await deleteFromS3(document_url);
                console.log("📂 Deleted document from S3:", document_url);
            }
            if (selfie_url) {
                await deleteFromS3(selfie_url);
                console.log("📂 Deleted selfie from S3:", selfie_url);
            }

            // ✅ Delete verification record
            await db.execute("DELETE FROM LandlordVerification WHERE landlord_id = ?", [landlord_id]);
            console.log("🗑 Deleted verification record for landlord:", landlord_id);

            const notificationTitle = "Landlord Verification Rejected";
            const notificationBody = `Your verification has been REJECTED. Please submit again. ${
                message ? `Reason: ${message}` : ""
            }`;

            await db.execute(
                "INSERT INTO Notification (user_id, title, body, is_read, created_at) VALUES (?, ?, ?, 0, NOW())",
                [user_id, notificationTitle, notificationBody]
            );

            await sendFCMNotification(fcm_token, notificationTitle, notificationBody);

            return res.status(200).json({ message: "Verification rejected and data deleted successfully." });
        } else {

            await db.query(
                "UPDATE LandlordVerification SET status = ?, reviewed_by = ?, review_date = NOW(), message = ? WHERE landlord_id = ?",
                [status, currentadmin_id, message, landlord_id]
            );

            const isVerified = status.toLowerCase() === "approved" ? 1 : 0;
            await db.execute(
                `UPDATE Landlord 
                 SET is_verified = ? 
                 WHERE landlord_id = ?`,
                [isVerified, landlord_id]
            );

            const notificationTitle = `Landlord Verification ${status}`;
            const notificationBody = `Your landlord verification has been ${status.toUpperCase()} by the admin. ${
                message ? `Message: ${message}` : ""
            }`;

            await db.execute(
                "INSERT INTO Notification (user_id, title, body, is_read, created_at) VALUES (?, ?, ?, 0, NOW())",
                [user_id, notificationTitle, notificationBody]
            );

            await sendFCMNotification(fcm_token, notificationTitle, notificationBody);

            return res.status(200).json({ message: `Verification ${status} successfully.` });
        }
    } catch (error) {
        console.error("Error updating verification:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
}
