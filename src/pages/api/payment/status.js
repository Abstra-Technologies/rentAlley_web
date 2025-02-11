// import axios from "axios";
// import mysql from "mysql2/promise"; // Using MySQL2 for database connection
//
// export default async function handler(req, res) {
//     if (req.method !== "POST") {
//         return res.status(405).json({ message: "Only POST method is allowed." });
//     }
//
//     const { requestReferenceNumber } = req.body;
//
//     if (!requestReferenceNumber) {
//         return res.status(400).json({ error: "Missing requestReferenceNumber." });
//     }
//
//     // Secure API keys from environment variables
//     const publicKey = process.env.MAYA_PUBLIC_KEY;
//     const secretKey = process.env.MAYA_SECRET_KEY;
//
//
//     const dbHost = process.env.DB_HOST;
//     const dbUser = process.env.DB_USER;
//     const dbPassword = process.env.DB_PASSWORD;
//     const dbName = process.env.DB_NAME;
//
//     let connection;
//     try {
//         connection = await mysql.createConnection({
//             host: dbHost,
//             user: dbUser,
//             password: dbPassword,
//             database: dbName,
//         });
//
//         // **1️⃣ Check Payment Status from Maya API**
//         const response = await axios.get(
//             `https://pg-sandbox.paymaya.com/checkout/v1/checkouts/${requestReferenceNumber}`,
//             {
//                 headers: {
//                     "Content-Type": "application/json",
//                     Authorization: `Basic ${Buffer.from(`${publicKey}:${secretKey}`).toString("base64")}`,                },
//             }
//         );
//
//         const paymentStatus = response.data.status; // Maya's response status
//
//         // **2️⃣ Map Maya status to your Subscription table**
//         let newStatus = "inactive";
//         let newPaymentStatus = "unpaid";
//
//         if (paymentStatus === "PAYMENT_SUCCESS") {
//             newStatus = "active";
//             newPaymentStatus = "paid";
//         } else if (paymentStatus === "PAYMENT_FAILED") {
//             newStatus = "expired";
//             newPaymentStatus = "failed";
//         } else if (paymentStatus === "PAYMENT_PENDING") {
//             newStatus = "pending";
//             newPaymentStatus = "pending";
//         }
//
//         // **3️⃣ Update Subscription Table**
//         const [result] = await connection.execute(
//             "UPDATE Subscription SET status = ?, payment_status = ?, updated_at = NOW() WHERE request_reference_number = ?",
//             [newStatus, newPaymentStatus, requestReferenceNumber]
//         );
//
//         await connection.end();
//
//         if (result.affectedRows > 0) {
//             return res.status(200).json({ message: "Subscription updated successfully.", status: newPaymentStatus });
//         } else {
//             return res.status(404).json({ error: "Subscription not found." });
//         }
//     } catch (error) {
//         console.error("Error checking payment status:", error.response?.data || error.message);
//         if (connection) await connection.end();
//         return res.status(500).json({ error: "Internal server error.", details: error.response?.data });
//     }
// }


// import mysql from "mysql2/promise"; // Use MySQL for database connection
//
// export default async function handler(req, res) {
//     if (req.method !== "POST") {
//         return res.status(405).json({ error: "Only POST method is allowed." });
//     }
//
//     const { requestReferenceNumber } = req.body;
//
//     if (!requestReferenceNumber) {
//         return res.status(400).json({ error: "Missing requestReferenceNumber." });
//     }
//
//     // Database connection setup
//     const dbHost = process.env.DB_HOST;
//     const dbUser = process.env.DB_USER;
//     const dbPassword = process.env.DB_PASSWORD;
//     const dbName = process.env.DB_NAME;
//
//     try {
//         const connection = await mysql.createConnection({
//             host: dbHost,
//             user: dbUser,
//             password: dbPassword,
//             database: dbName,
//         });
//
//         // Update subscription status in the database
//         const [result] = await connection.execute(
//             "UPDATE Subscription SET status = 'active', payment_status = 'paid', updated_at = NOW() WHERE request_reference_number = ?",
//             [requestReferenceNumber]
//         );
//
//         await connection.end();
//
//         // Check if the subscription was updated
//         if (result.affectedRows > 0) {
//             console.log(`✅ Subscription updated for reference: ${requestReferenceNumber}`);
//             return res.status(200).json({ message: "Subscription updated successfully." });
//         } else {
//             console.error(`🚨 No subscription found for reference: ${requestReferenceNumber}`);
//             return res.status(404).json({ error: "No subscription found with the given reference." });
//         }
//     } catch (error) {
//         console.error("🚨 Database update failed:", error);
//         return res.status(500).json({ error: "Internal server error." });
//     }
// }

import mysql from "mysql2/promise"; // MySQL for database connection

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Only POST method is allowed." });
    }

    const { requestReferenceNumber, landlord_id } = req.body;

    // ✅ Validate required parameters
    if (!requestReferenceNumber || !landlord_id) {
        return res.status(400).json({ error: "Missing requestReferenceNumber or landlord_id." });
    }

    // Database connection setup
    const dbHost = process.env.DB_HOST;
    const dbUser = process.env.DB_USER;
    const dbPassword = process.env.DB_PASSWORD;
    const dbName = process.env.DB_NAME;

    let connection;
    try {
        connection = await mysql.createConnection({
            host: dbHost,
            user: dbUser,
            password: dbPassword,
            database: dbName,
        });

        // ✅ Ensure the subscription exists before updating
        const [existingSubscription] = await connection.execute(
            "SELECT subscription_id, is_trial, trial_end_date, status FROM Subscription WHERE request_reference_number = ? AND landlord_id = ? LIMIT 1",
            [requestReferenceNumber, landlord_id]
        );

        if (existingSubscription.length === 0) {
            console.error(`🚨 No subscription found for reference: ${requestReferenceNumber} and landlord_id: ${landlord_id}`);
            await connection.end();
            return res.status(404).json({ error: "No subscription found with the given reference and landlord_id." });
        }

        const { is_trial, trial_end_date } = existingSubscription[0];
        const today = new Date().toISOString().split("T")[0];

        // ✅ If trial has expired, force payment
        if (is_trial && trial_end_date < today) {
            console.log(`🔴 Trial has ended for landlord_id: ${landlord_id}. Payment required.`);
            return res.status(403).json({ error: "Trial has ended. Please subscribe to continue." });
        }

        // ✅ If the payment is successful, activate the subscription
        console.log(`🔵 Converting trial to paid subscription for landlord_id: ${landlord_id}`);

        await connection.execute(
            "UPDATE Subscription SET status = 'active', payment_status = 'paid', is_trial = 0, trial_end_date = NULL, updated_at = NOW() WHERE request_reference_number = ? AND landlord_id = ?",
            [requestReferenceNumber, landlord_id]
        );

        // ✅ Ensure landlord can't get another trial in the future
        await connection.execute(
            "UPDATE Landlord SET is_trial_used = 1 WHERE landlord_id = ?",
            [landlord_id]
        );

        await connection.end();

        return res.status(200).json({ message: "Subscription activated successfully." });

    } catch (error) {
        console.error("🚨 Database update failed:", error);
        if (connection) await connection.end();
        return res.status(500).json({ error: "Internal server error." });
    }
}
