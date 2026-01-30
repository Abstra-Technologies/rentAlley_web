import * as React from "react";

interface Props {
    firstName: string;
    otp: string;
    expiresAt: string;
    timezone: string;
}

export default function PasswordResetOtpTemplate({
                                                     firstName,
                                                     otp,
                                                     expiresAt,
                                                     timezone,
                                                 }: Props) {
    return (
        <div style={{ fontFamily: "Arial, sans-serif", lineHeight: 1.6 }}>
            <h2>Reset Your Password</h2>

            <p>Hello {firstName},</p>

            <p>
                We received a request to reset your <strong>Upkyp</strong> account
                password.
            </p>

            <p style={{ marginTop: "16px" }}>
                <strong>Your One-Time Passcode (OTP):</strong>
            </p>

            <div
                style={{
                    fontSize: "24px",
                    fontWeight: "bold",
                    letterSpacing: "4px",
                    margin: "12px 0",
                }}
            >
                {otp}
            </div>

            <p>
                This code will expire at <strong>{expiresAt}</strong> ({timezone}).
            </p>

            <p>
                If you did not request a password reset, you can safely ignore
                this email.
            </p>

            <p style={{ marginTop: "24px" }}>
                — <strong>The Upkyp Team</strong>
            </p>
        </div>
    );
}
