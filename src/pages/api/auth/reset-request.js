import nodemailer from "nodemailer";
import { db } from "../../lib/db";
import {decryptEmail} from "../../crypto/encrypt";
import crypto from "crypto";

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ message: 'Email is required.' });
    }

    try {
        // Fetch all users and decrypt emails to find a match
        const [users] = await db.execute('SELECT * FROM User');
        const user = users.find((u) => decryptEmail(u.email) === email);

        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        // Generate a reset token
        const resetToken = crypto.randomBytes(20).toString('hex');
        const resetTokenExpiry = new Date(Date.now() + 3600000); // 1-hour expiry

        console.log('Generated Reset Token:', resetToken);
        console.log('Token Expiry:', resetTokenExpiry);

        // Store the reset token and expiry in the database
        const [result] = await db.execute(
            'UPDATE User SET resetToken = ?, resetTokenExpiry = ? WHERE email = ?',
            [resetToken, resetTokenExpiry, user.email] // Use the original encrypted email
        );

        if (result.affectedRows === 0) {
            return res.status(500).json({ message: 'Failed to details user with reset token.' });
        }

        // Send the reset email
        const transporter = nodemailer.createTransport({
            service: 'Gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
            tls: {
                rejectUnauthorized: false,
            },
        });

        const resetLink = `${process.env.NEXTAUTH_URL}/pages/auth/reset/token?token=${resetToken}`;

        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email, // Send email to plaintext email
            subject: 'Password Reset Request',
            html: `<p>Click <a href="${resetLink}">here</a> to reset your password.</p>`,
        });

        res.status(200).json({ message: 'Password reset email sent successfully.' });
    } catch (error) {
        console.error('Error during forgot password process:', error);
        res.status(500).json({ message: 'An error occurred. Please try again later.' });
    }
}