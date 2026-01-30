import { Resend } from "resend";
import PasswordResetOtpTemplate from "@/lib/email/PasswordResetOtpTemplate";

const resend = new Resend(process.env.RESEND_API_KEY!);

interface SendPasswordResetOtpEmailParams {
    email: string;
    firstName?: string;
    otp: string;
    expiresAt: string;
    timezone: string;
}

export async function sendPasswordResetOtpEmail({
                                                    email,
                                                    firstName,
                                                    otp,
                                                    expiresAt,
                                                    timezone,
                                                }: SendPasswordResetOtpEmailParams) {
    await resend.emails.send({
        from: "Upkyp <noreply@upkyp.com>",
        to: [email],
        subject: "Reset Your Upkyp Password – One-Time Passcode",

        react: PasswordResetOtpTemplate({
            firstName: firstName || "there",
            otp,
            expiresAt,
            timezone,
        }),

        tags: [
            { name: "type", value: "transactional" },
            { name: "category", value: "password-reset" },
        ],
    });
}
