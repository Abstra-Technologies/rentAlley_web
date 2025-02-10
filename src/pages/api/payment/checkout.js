// import axios from "axios";
//
// export default async function handler(req, res) {
//     if (req.method !== "POST") {
//         return res.status(405).json({ message: "Only POST method is allowed." });
//     }
//
//     const { amount, description, email, firstName, lastName, redirectUrl, landlordId } = req.body;
//
//     // Secure API keys from environment variables
//     const publicKey = process.env.MAYA_PUBLIC_KEY;
//     const secretKey = process.env.MAYA_SECRET_KEY;
//     const dbHost = process.env.DB_HOST;
//     const dbUser = process.env.DB_USER;
//     const dbPassword = process.env.DB_PASSWORD;
//     const dbName = process.env.DB_NAME;
//
//
//     if (!publicKey || !secretKey) {
//         return res.status(500).json({ error: "Maya API keys are missing in environment variables." });
//     }
//
//     const payload = {
//         totalAmount: {
//             value: amount,
//             currency: "PHP",
//         },
//         buyer: {
//             firstName: firstName,
//             lastName: lastName,
//             contact: {
//                 email: email,
//             },
//         },
//         redirectUrl: {
//             success: redirectUrl.success,
//             failure: redirectUrl.failure,
//             cancel: redirectUrl.cancel,
//         },
//         requestReferenceNumber: `REF-${Date.now()}`,
//         isRedirect: true, // Ensures Maya will handle redirects properly
//         items:[
//             {
//                 name: description + " tier", // Display the description in the Maya checkout page
//                 quantity: 1,
//                 totalAmount: {
//                     value: amount,
//                     currency: "PHP",
//                 },
//             }
//         ]
//     };
//
//     try {
//         const response = await axios.post(
//             "https://pg-sandbox.paymaya.com/checkout/v1/checkouts",
//             payload,
//             {
//                 headers: {
//                     "Content-Type": "application/json",
//                     Authorization: `Basic ${Buffer.from(`${publicKey}:${secretKey}`).toString("base64")}`,
//                 },
//             }
//         );
//
//         return res.status(200).json({ checkoutUrl: response.data.redirectUrl });
//     } catch (error) {
//         console.error("Error during Maya payment initiation:", error.response?.data || error.message);
//         return res.status(500).json({
//             error: "Payment initiation failed. Please check your payload and API keys.",
//             details: error.response?.data,
//         });
//     }
// }

// import axios from "axios";
// import mysql from "mysql2/promise"; // Using MySQL2 for database connection
//
// export default async function handler(req, res) {
//     if (req.method !== "POST") {
//         return res.status(405).json({ message: "Only POST method is allowed." });
//     }
//     const { amount, description, email, firstName, lastName, redirectUrl, landlord_id, plan_name } = req.body;
//     console.log("🔍 Debug - Incoming Request Data:", {
//         amount, description, email, firstName, lastName, redirectUrl, landlord_id, plan_name
//     });
//     // Secure API keys from environment variables
//     const publicKey = process.env.MAYA_PUBLIC_KEY;
//     const secretKey = process.env.MAYA_SECRET_KEY;
//     const dbHost = process.env.DB_HOST;
//     const dbUser = process.env.DB_USER;
//     const dbPassword = process.env.DB_PASSWORD;
//     const dbName = process.env.DB_NAME;
//
//     // Set subscription start_date as today
//     const start_date = new Date().toISOString().split("T")[0]; // Format: YYYY-MM-DD
//     const trialDays = plan_name === "Standard" ? 10 : plan_name === "Premium" ? 14 : 0; // Example trial days
//
//     const trialStartDate = new Date(start_date); // Parse start_date
//     const trialEndDate = new Date(trialStartDate);
//
//     trialEndDate.setDate(trialStartDate.getDate() + trialDays); // Add trial days
//     const formattedTrialEndDate = trialEndDate.toISOString().split("T")[0];
//
// // Set end_date to 1 month later
//     const end_date = new Date();
//     end_date.setMonth(end_date.getMonth() + 1);
//     const formatted_end_date = end_date.toISOString().split("T")[0]; // Format: YYYY-MM-DD
//
//
//     console.log("📅 Debug - Subscription Dates:", { start_date, formatted_end_date });
//
//     if (!landlord_id || !plan_name) {
//         console.error("🚨 Error - Missing landlord_id or plan_name");
//         return res.status(400).json({ error: "Missing landlord_id or plan_name." });
//     }
//
//     if (!amount || isNaN(amount)) {
//         console.error("🚨 Error - Invalid Amount:", amount);
//         return res.status(400).json({ error: "Invalid amount." });
//     }
//
//
//     if (!publicKey || !secretKey || !dbHost || !dbUser || !dbPassword || !dbName) {
//         return res.status(500).json({ error: "Missing API keys or database credentials in environment variables." });
//     }
//
//     // Generate a unique reference number
//     const requestReferenceNumber = `REF-${Date.now()}`;
//     console.log("🔑 Debug - Generated Reference Number:", requestReferenceNumber);
//     // Connect to the database
//     let connection;
//     try {
//         connection = await mysql.createConnection({
//             host: dbHost,
//             user: dbUser,
//             password: dbPassword,
//             database: dbName,
//         });
//         console.log("✅ Debug - Database Connection Established");
//         // 1️⃣ **Insert Subscription (Before Payment)**
//         const [result] = await connection.execute(
//             "INSERT INTO Subscription (landlord_id, plan_name, status, start_date, end_date, payment_status, created_at, request_reference_number, is_trial, trial_end_date) VALUES (?, ?, ?, ?, ?, ?, NOW(),?, ? , ?)",
//             [landlord_id, plan_name, "pending", start_date, formatted_end_date, "unpaid", requestReferenceNumber, trialDays > 0 , formattedTrialEndDate],
//         );
//
//         const subscriptionId = result.insertId; // Get the inserted ID
//         console.log("📌 Debug - Inserted Subscription ID:", subscriptionId);
//         // 2️⃣ **Create Maya Checkout Payload**
//         const payload = {
//             totalAmount: {
//                 value: amount,
//                 currency: "PHP",
//             },
//             buyer: {
//                 firstName: firstName,
//                 lastName: lastName,
//                 contact: {
//                     email: email,
//                 },
//             },
//             redirectUrl: {
//                 success: `http://localhost:3000/pages/payment/success?requestReferenceNumber=${encodeURIComponent(requestReferenceNumber)}`, // Inject reference number                failure: redirectUrl.failure,
//                 cancel: redirectUrl.cancel,
//             },
//             requestReferenceNumber: requestReferenceNumber,
//             isRedirect: true,
//             items: [
//                 {
//                     name: description,
//                     quantity: 1,
//                     totalAmount: {
//                         value: amount,
//                         currency: "PHP",
//                     },
//                 },
//             ],
//         };
//         console.log("📦 Debug - Maya Checkout Payload:", payload);
//         // 3️⃣ **Send Payment Request to Maya**
//         const response = await axios.post(
//             "https://pg-sandbox.paymaya.com/checkout/v1/checkouts",
//             payload,
//             {
//                 headers: {
//                     "Content-Type": "application/json",
//                     Authorization: `Basic ${Buffer.from(`${publicKey}:${secretKey}`).toString("base64")}`,
//                 },
//             }
//         );
//         console.log("✅ Debug - Maya Response:", response.data);
//         // 4️⃣ **Close Database Connection**
//         await connection.end();
//
//         // 5️⃣ **Return Checkout URL & Subscription ID**
//         return res.status(200).json({
//             checkoutUrl: response.data.redirectUrl,
//             subscriptionId: subscriptionId, // Return the inserted subscription ID
//             requestReferenceNumber: requestReferenceNumber, // Return the reference number for tracking
//             trialEndDate: formattedTrialEndDate,
//             subscriptionEndDate: formatted_end_date,
//         });
//     } catch (error) {
//         console.error("Error during Maya payment initiation:", error.response?.data || error.message);
//
//         if (connection) await connection.end();
//
//         return res.status(500).json({
//             error: "Payment initiation failed. Please check your payload and API keys.",
//             details: error.response?.data || error.message,        });
//     }
// }

// import axios from "axios";
// import mysql from "mysql2/promise";
//
// export default async function handler(req, res) {
//     if (req.method !== "POST") {
//         return res.status(405).json({ message: "Only POST method is allowed." });
//     }
//
//     const { amount, description, email, firstName, lastName, redirectUrl, landlord_id, plan_name } = req.body;
//
//     console.log("🔍 Debug - Incoming Request Data:", {
//         amount, description, email, firstName, lastName, redirectUrl, landlord_id, plan_name
//     });
//
//     const publicKey = process.env.MAYA_PUBLIC_KEY;
//     const secretKey = process.env.MAYA_SECRET_KEY;
//     const dbHost = process.env.DB_HOST;
//     const dbUser = process.env.DB_USER;
//     const dbPassword = process.env.DB_PASSWORD;
//     const dbName = process.env.DB_NAME;
//
//     const start_date = new Date().toISOString().split("T")[0];
//     const trialDays = plan_name === "Standard" ? 10 : plan_name === "Premium" ? 14 : 0;
//
//     const trialStartDate = new Date(start_date);
//     const trialEndDate = new Date(trialStartDate);
//     trialEndDate.setDate(trialStartDate.getDate() + trialDays);
//     const formattedTrialEndDate = trialEndDate.toISOString().split("T")[0];
//
//     const end_date = new Date();
//     end_date.setMonth(end_date.getMonth() + 1);
//     const formatted_end_date = end_date.toISOString().split("T")[0];
//
//     if (!landlord_id || !plan_name) {
//         return res.status(400).json({ error: "Missing landlord_id or plan_name." });
//     }
//
//     if (amount === 0) {
//         // Handle Free Plan
//         console.log("📦 Free Plan - Activating directly...");
//         let connection;
//         try {
//             connection = await mysql.createConnection({
//                 host: dbHost,
//                 user: dbUser,
//                 password: dbPassword,
//                 database: dbName,
//             });
//
//             const [result] = await connection.execute(
//                 "INSERT INTO Subscription (landlord_id, plan_name, status, start_date, end_date, payment_status, created_at, request_reference_number, is_trial, trial_end_date) VALUES (?, ?, ?, ?, ?, ?, NOW(), ?, ?, ?)",
//                 [
//                     landlord_id,
//                     plan_name,
//                     "active",
//                     start_date,
//                     formatted_end_date,
//                     "paid",
//                     `REF-${Date.now()}`,
//                     trialDays > 0,
//                     formattedTrialEndDate,
//                 ]
//             );
//
//             console.log("✅ Free Plan Activated Successfully");
//             await connection.end();
//             return res.status(201).json({
//                 message: "Free plan activated successfully.",
//                 subscriptionId: result.insertId,
//                 trialEndDate: formattedTrialEndDate,
//                 subscriptionEndDate: formatted_end_date,
//             });
//         } catch (error) {
//             console.error("🚨 Error Activating Free Plan:", error.message);
//             if (connection) await connection.end();
//             return res.status(500).json({ error: "Failed to activate free plan." });
//         }
//     }
//
//     if (!amount || isNaN(amount)) {
//         return res.status(400).json({ error: "Invalid amount." });
//     }
//
//     const requestReferenceNumber = `REF-${Date.now()}`;
//     console.log("🔑 Debug - Generated Reference Number:", requestReferenceNumber);
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
//         const [result] = await connection.execute(
//             "INSERT INTO Subscription (landlord_id, plan_name, status, start_date, end_date, payment_status, created_at, request_reference_number, is_trial, trial_end_date) VALUES (?, ?, ?, ?, ?, ?, NOW(), ?, ?, ?)",
//             [landlord_id, plan_name, "pending", start_date, formatted_end_date, "unpaid", requestReferenceNumber, 1, formattedTrialEndDate]
//         );
//
//         const subscriptionId = result.insertId;
//         console.log("📌 Debug - Inserted Subscription ID:", subscriptionId);
//
//         const payload = {
//             totalAmount: { value: amount, currency: "PHP" },
//             buyer: { firstName, lastName, contact: { email } },
//             redirectUrl: {
//                 success: `${redirectUrl.success}?requestReferenceNumber=${encodeURIComponent(requestReferenceNumber)}`,
//                 failure: redirectUrl.failure,
//                 cancel: redirectUrl.cancel,
//             },
//             requestReferenceNumber,
//             items: [{ name: description, quantity: 1, totalAmount: { value: amount, currency: "PHP" } }],
//         };
//
//         const response = await axios.post(
//             "https://pg-sandbox.paymaya.com/checkout/v1/checkouts",
//             payload,
//             { headers: { "Content-Type": "application/json", Authorization: `Basic ${Buffer.from(`${publicKey}:${secretKey}`).toString("base64")}` } }
//         );
//
//         await connection.end();
//
//         return res.status(200).json({
//             checkoutUrl: response.data.redirectUrl,
//             subscriptionId,
//             requestReferenceNumber,
//             trialEndDate: formattedTrialEndDate,
//             subscriptionEndDate: formatted_end_date,
//         });
//     } catch (error) {
//         console.error("🚨 Error during Maya checkout:", error.message);
//         if (connection) await connection.end();
//         return res.status(500).json({ error: "Payment initiation failed.", details: error.response?.data || error.message });
//     }
// }

import axios from "axios";
import mysql from "mysql2/promise";

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ message: "Only POST method is allowed." });
    }

    const { amount, description, email, firstName, lastName, redirectUrl, landlord_id, plan_name } = req.body;
    if (!landlord_id) {
        return res.status(400).json({ error: "Missing landlord_id in request." });
    }
    console.log("🔍 Debug - Incoming Request Data:", {
        amount, description, email, firstName, lastName, redirectUrl, landlord_id, plan_name
    });

    const publicKey = process.env.MAYA_PUBLIC_KEY;
    const secretKey = process.env.MAYA_SECRET_KEY;
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

        // 1️⃣ **Check if landlord has already used a trial (tracked at user level)**
        const [landlordData] = await connection.execute(
            "SELECT is_trial_used FROM Landlord WHERE landlord_id = ? LIMIT 1",
            [landlord_id]
        );

        const hasUsedTrial = landlordData.length > 0 && landlordData[0].is_trial_used;
        console.log("🔍 Debug - Has Used Trial Before?", hasUsedTrial);

        // 2️⃣ **Determine Trial Days Based on Plan**
        const start_date = new Date().toISOString().split("T")[0];
        const trialDays = plan_name === "Standard" ? 10 : plan_name === "Premium" ? 14 : 0;
        const trialStartDate = new Date(start_date);
        const trialEndDate = new Date(trialStartDate);
        trialEndDate.setDate(trialStartDate.getDate() + trialDays);
        const formattedTrialEndDate = trialEndDate.toISOString().split("T")[0];

        const end_date = new Date();
        end_date.setMonth(end_date.getMonth() + 1);
        const formatted_end_date = end_date.toISOString().split("T")[0];

        // 3️⃣ **If trial has NOT been used before, grant it**
        if (!hasUsedTrial && (plan_name === "Standard" || plan_name === "Premium")) {
            console.log("🎉 Granting One-Time Free Trial!");

            // Update landlord's trial status to prevent future trials
            await connection.execute(
                "UPDATE Landlord SET is_trial_used = 1 WHERE landlord_id = ?",
                [landlord_id]
            );

            // Check if a subscription already exists
            const [existingSubscription] = await connection.execute(
                "SELECT subscription_id FROM Subscription WHERE landlord_id = ? LIMIT 1",
                [landlord_id]
            );

            if (existingSubscription.length > 0) {
                // Update existing subscription with trial
                await connection.execute(
                    "UPDATE Subscription SET plan_name = ?, status = 'trial', start_date = ?, end_date = ?, payment_status = 'pending', is_trial = 1, trial_end_date = ? WHERE landlord_id = ?",
                    [plan_name, start_date, formattedTrialEndDate, formattedTrialEndDate, landlord_id]
                );
            } else {
                // Insert new subscription (if landlord never had one)
                await connection.execute(
                    "INSERT INTO Subscription (landlord_id, plan_name, status, start_date, end_date, payment_status, created_at, request_reference_number, is_trial, trial_end_date) VALUES (?, ?, ?, ?, ?, ?, NOW(), ?, ?, ?)",
                    [
                        landlord_id,
                        plan_name,
                        "trial",
                        start_date,
                        formattedTrialEndDate,
                        "pending",
                        `TRIAL-${Date.now()}`,
                        1, // Mark as trial
                        formattedTrialEndDate,
                    ]
                );
            }

            await connection.end();
            return res.status(201).json({
                message: "Free trial activated successfully.",
                trialEndDate: formattedTrialEndDate,
                subscriptionEndDate: formattedTrialEndDate,
            });
        }

        // 4️⃣ **If the user has already used the trial, proceed to payment**
        if (!amount || isNaN(amount)) {
            return res.status(400).json({ error: "Invalid amount." });
        }

        const requestReferenceNumber = `REF-${Date.now()}`;
        console.log("🔑 Debug - Generated Reference Number:", requestReferenceNumber);

        // Check if an existing subscription exists
        const [existingSubscription] = await connection.execute(
            "SELECT subscription_id FROM Subscription WHERE landlord_id = ? LIMIT 1",
            [landlord_id]
        );

        if (existingSubscription.length > 0) {
            // Update existing subscription to a paid plan
            await connection.execute(
                "UPDATE Subscription SET plan_name = ?, status = 'pending', start_date = ?, end_date = ?, payment_status = 'unpaid', request_reference_number = ?, is_trial = 0, trial_end_date = NULL WHERE landlord_id = ?",
                [plan_name, start_date, formatted_end_date, requestReferenceNumber, landlord_id]
            );
        } else {
            // Insert new subscription if one does not exist
            await connection.execute(
                "INSERT INTO Subscription (landlord_id, plan_name, status, start_date, end_date, payment_status, created_at, request_reference_number, is_trial, trial_end_date) VALUES (?, ?, ?, ?, ?, ?, NOW(), ?, ?, NULL)",
                [landlord_id, plan_name, "pending", start_date, formatted_end_date, "unpaid", requestReferenceNumber, 0]
            );
        }

        const payload = {
            totalAmount: { value: amount, currency: "PHP" },
            buyer: { firstName, lastName, contact: { email } },
            redirectUrl: {
                success: `${redirectUrl.success}?requestReferenceNumber=${encodeURIComponent(requestReferenceNumber)}&landlord_id=${landlord_id}`,
                failure: redirectUrl.failure,
                cancel: redirectUrl.cancel,
            },
            requestReferenceNumber,
            items: [{ name: description, quantity: 1, totalAmount: { value: amount, currency: "PHP" } }],
        };

        const response = await axios.post(
            "https://pg-sandbox.paymaya.com/checkout/v1/checkouts",
            payload,
            { headers: { "Content-Type": "application/json", Authorization: `Basic ${Buffer.from(`${publicKey}:${secretKey}`).toString("base64")}` } }
        );

        await connection.end();

        return res.status(200).json({
            checkoutUrl: response.data.redirectUrl,
            requestReferenceNumber,
            landlord_id,
            subscriptionEndDate: formatted_end_date,
        });
    } catch (error) {
        console.error("🚨 Error during Maya checkout:", error.message);
        if (connection) await connection.end();
        return res.status(500).json({ error: "Payment initiation failed.", details: error.response?.data || error.message });
    }
}
