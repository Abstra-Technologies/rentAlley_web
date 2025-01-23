import { serialize } from 'cookie';
import jwt from "jsonwebtoken";
import { db } from "../../lib/db";
import qs from 'qs';
import axios from 'axios';
import {
    encryptEmail,
    encryptFName,
    encryptLName,
    encryptPhone,
} from "../../crypto/encrypt";
import CryptoJS from "crypto-js";
import crypto from "crypto";


// export default async function handler(req, res) {
//     const { code, state } = req.query;
//     const { firstName, lastName, email, dob, mobileNumber } = req.body;
//     if (!code || !state) {
//         return res.status(400).json({ error: 'Code and state are required' });
//     }
//
//     try {
//         const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, REDIRECT_URI, JWT_SECRET, NODE_ENV } = process.env;
//
//         // Decode state to get the role
//         const { role } = JSON.parse(decodeURIComponent(state)) || { role: 'tenant' };
//         const emailHash = CryptoJS.SHA256(email).toString();
//         const birthDate = dob; // Map `dob` to `birthDate`
//         const phoneNumber = mobileNumber;
//         // Exchange code for tokens
//         const tokenResponse = await axios.post(
//             'https://oauth2.googleapis.com/token',
//             qs.stringify({
//                 code,
//                 client_id: GOOGLE_CLIENT_ID,
//                 client_secret: GOOGLE_CLIENT_SECRET,
//                 redirect_uri: REDIRECT_URI,
//                 grant_type: 'authorization_code',
//             }),
//             { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
//         );
//
//         const { access_token } = tokenResponse.data;
//
//         // Fetch user info
//         const userInfoResponse = await axios.get(
//             'https://www.googleapis.com/oauth2/v3/userinfo',
//             {
//                 headers: { Authorization: `Bearer ${access_token}` },
//             }
//         );
//
//         const user = userInfoResponse.data;
//         user.role = role; // Attach the role to the user object
//
//         console.log('User Info with Role:', user);
//
//         const emailEncrypted = encryptEmail(email);
//         const fnameEncrypted = encryptFName(firstName);
//         const lnameEncrypted = encryptLName(lastName);
//         const phoneEncrypted = encryptPhone(phoneNumber);
//         // Check if the user already exists in the database
//
//         const [rows] = await db.execute('SELECT * FROM User WHERE email = ?', [user.email]);
//         const emailConfirmationToken = crypto.randomBytes(32).toString("hex");
//         console.log("Inserting user into database...");
//         const tokenExpiry = new Date(Date.now() + 60 * 60 * 1000);
//         let dbUser;
//         if (rows.length > 0) {
//             // User exists
//             dbUser = rows[0];
//             console.log('User already exists:', dbUser);
//         } else {
//             // Insert new user
//             const [result] = await db.execute(
//                 `INSERT INTO User (userID,firstName, lastName, email, emailHashed, password, birthDate, phoneNumber, userType, verificationToken, tokenExpiresAt, createdAt, updatedAt) VALUES (uuid(),?, ?, ?, ?, ?, ?, ?, ?, ?,?, NOW(), NOW())`,
//                 [
//                     fnameEncrypted,
//                     lnameEncrypted,
//                     emailEncrypted,
//                     emailHash,
//                     null, // Empty password for OAuth users
//                     birthDate,
//                     phoneEncrypted,
//                     role,
//                     emailConfirmationToken,
//                     tokenExpiry,
//                 ]
//             );
//
//             const [user] = await db.execute(
//                 `SELECT userID FROM User WHERE emailHashed = ?`,
//                 [emailHash]
//             );
//
//             if (!user || user.length === 0) {
//                  new Error("Failed to retrieve userID after User creation");
//             }
//
//             const userId = user[0].userID;
//             console.log("Generated userID:", userId);
//
//             if (role === "tenant") {
//                 console.log("Inserting into Tenant table...");
//                 await db.execute(
//                     `INSERT INTO tenants (userID) VALUES (?)`,
//                     [userId]
//                 );
//             } else if (role === "landlord") {
//                 console.log("Inserting into Landlord table...");
//                 await db.execute(
//                     `INSERT INTO landlords (userID) VALUES (?)`,
//                     [userId]
//                 );
//             }
//
//             console.log("Logging registration activity...");
//             await db.execute(
//                 `INSERT INTO ActivityLog (userID, action, timestamp)
//          VALUES (?, ?, NOW())`,
//                 [userId, "User registered"]
//             );
//
//             dbUser = {
//                 userID: result.insertId,
//                 username: user.name,
//                 email: user.email,
//                 roles: role,
//             };
//             console.log('User inserted with ID:', result.insertId);
//         }
//
//         // Generate a JWT for the session
//         const token = jwt.sign(
//             {
//                 userId: dbUser.user_id,
//                 username: dbUser.username,
//                 roles: dbUser.roles,
//             },
//             JWT_SECRET,
//             { expiresIn: '1h' }
//         );
//
//         // Set JWT as an HTTP-only cookie
//         const cookie = serialize('auth_token', token, {
//             httpOnly: true,
//             secure: NODE_ENV === 'development', // Use secure cookies in production
//             sameSite: 'strict',
//             path: '/',
//         });
//
//         res.setHeader('Set-Cookie', cookie);
//
//         // Redirect user based on their role
//         if (dbUser.roles === 'tenant') {
//             return res.redirect('/pages/dashboard');
//         } else if (dbUser.roles === 'landlord') {
//             return res.redirect('/dashboard/landlord');
//         } else {
//             return res.redirect('/');
//         }
//     } catch (error) {
//         console.error('Error during Google OAuth:', error.response?.data || error.message);
//         return res.status(500).json({ error: 'Failed to authenticate' });
//     }
// }

export default async function handler(req, res) {
    const { code, state } = req.query;
    const { email, dob, mobileNumber } = req.body || {};

    if (!code || !state) {
        return res.status(400).json({ error: 'Code and state are required' });
    }

    try {
        const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, REDIRECT_URI, JWT_SECRET, NODE_ENV } = process.env;

        // Decode state to get the role
        const { role } = JSON.parse(decodeURIComponent(state)) || { role: 'tenant' };

        // Exchange code for tokens
        const tokenResponse = await axios.post(
            'https://oauth2.googleapis.com/token',
            qs.stringify({
                code,
                client_id: GOOGLE_CLIENT_ID,
                client_secret: GOOGLE_CLIENT_SECRET,
                redirect_uri: REDIRECT_URI,
                grant_type: 'authorization_code',
            }),
            { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
        );

        const { access_token } = tokenResponse.data;

        // Fetch user info
        const userInfoResponse = await axios.get(
            'https://www.googleapis.com/oauth2/v3/userinfo',
            {
                headers: { Authorization: `Bearer ${access_token}` },
            }
        );

        const user = userInfoResponse.data;
        user.role = role; // Attach the role to the user object

        const firstName = user.given_name || 'Unknown';
        const lastName = user.family_name || 'Unknown';
        const emailHash = user.email ? CryptoJS.SHA256(user.email).toString() : null;
        const birthDate = dob || null; // Handle undefined `dob`
        const phoneNumber = mobileNumber || null; // Handle undefined `mobileNumber`

        console.log('User Info with Role:', user);

        const emailEncrypted = user.email ? encryptEmail(user.email) : null;
        const fnameEncrypted = firstName ? encryptFName(firstName) : null;
        const lnameEncrypted = lastName ? encryptLName(lastName) : null;
        const phoneEncrypted = phoneNumber ? encryptPhone(phoneNumber) : null;

        // Check if the user already exists in the database
        const [rows] = await db.execute('SELECT * FROM User WHERE email = ?', [user.email]);

        let dbUser;
        if (rows.length > 0) {
            // User exists
            dbUser = rows[0];
            console.log('User already exists:', dbUser);
        } else {
            // Insert new user
            const emailConfirmationToken = crypto.randomBytes(32).toString("hex");
            const tokenExpiry = new Date(Date.now() + 60 * 60 * 1000);

            console.log("Inserting user into database...");
            const [result] = await db.execute(
                `INSERT INTO User (userID, firstName, lastName, email, emailHashed, password, birthDate, phoneNumber, userType, verificationToken, tokenExpiresAt, createdAt, updatedAt)
                 VALUES (uuid(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
                [
                    fnameEncrypted,
                    lnameEncrypted,
                    emailEncrypted,
                    emailHash,
                    " ", // Empty password for OAuth users
                    birthDate,
                    phoneEncrypted,
                    role,
                    emailConfirmationToken,
                    tokenExpiry,
                ]
            );

            const [user] = await db.execute(
                `SELECT userID FROM User WHERE emailHashed = ?`,
                [emailHash]
            );

            if (!user || user.length === 0) {
                throw new Error("Failed to retrieve userID after User creation");
            }

            const userId = user[0].userID;
            console.log("Generated userID:", userId);

            if (role === "tenant") {
                console.log("Inserting into Tenant table...");
                await db.execute(
                    `INSERT INTO tenants (userID) VALUES (?)`,
                    [userId]
                );
            } else if (role === "landlord") {
                console.log("Inserting into Landlord table...");
                await db.execute(
                    `INSERT INTO landlords (userID) VALUES (?)`,
                    [userId]
                );
            }

            console.log("Logging registration activity...");
            await db.execute(
                `INSERT INTO ActivityLog (userID, action, timestamp)
                 VALUES (?, ?, NOW())`,
                [userId, "User registered"]
            );

            dbUser = {
                userID: userId,
                username: `${firstName} ${lastName}`,
                email: user.email,
                roles: role,
            };
            console.log('User inserted with ID:', userId);
        }

        // Generate a JWT for the session
        const token = jwt.sign(
            {
                userId: dbUser.userID,
                username: dbUser.username,
                roles: dbUser.roles,
            },
            JWT_SECRET,
            { expiresIn: '1h' }
        );

        // Set JWT as an HTTP-only cookie
        const cookie = serialize('auth_token', token, {
            httpOnly: true,
            secure: NODE_ENV !== 'development', // Use secure cookies in production
            sameSite: 'strict',
            path: '/',
        });

        res.setHeader('Set-Cookie', cookie);

        // Redirect user based on their role
        if (dbUser.roles === 'tenant') {
            return res.redirect('/pages/tenant/dashboard');
        } else if (dbUser.roles === 'landlord') {
            return res.redirect('/dashboard/landlord');
        } else {
            return res.redirect('/');
        }
    } catch (error) {
        console.error('Error during Google OAuth:', error.response?.data || error.message);
        return res.status(500).json({ error: 'Failed to authenticate' });
    }
}
