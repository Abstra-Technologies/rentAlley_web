import * as React from "react";

type LeaseOtpTemplateProps = {
    otp: string;
    expiryLocal: string;
    timezone: string;
    propertyName: string;
    unitName: string;
    landlordName: string;
    tenantName: string;
};

export default function LeaseOtpTemplate({
                                             otp,
                                             expiryLocal,
                                             timezone,
                                             propertyName,
                                             unitName,
                                             landlordName,
                                             tenantName,
                                         }: LeaseOtpTemplateProps) {
    return (
        <div style={{ fontFamily: "Arial, sans-serif", lineHeight: "1.6" }}>
            <h2 style={{ color: "#2563eb" }}>Lease Verification Required</h2>

            <p>
                This email confirms that a lease agreement has been generated
                and requires verification to proceed.
            </p>

            <p>
                <strong>Property:</strong> {propertyName}
                <br />
                <strong>Unit:</strong> {unitName}
            </p>

            <p>
                <strong>Lessor (Landlord):</strong> {landlordName}
                <br />
                <strong>Lessee (Tenant):</strong> {tenantName}
            </p>

            <p>
                To verify and authorize this lease document, please enter the
                one-time verification code below in the UpKyp system.
            </p>

            <div
                style={{
                    fontSize: "2rem",
                    fontWeight: "bold",
                    color: "#059669",
                    letterSpacing: "4px",
                    margin: "16px 0",
                    textAlign: "center",
                }}
            >
                {otp}
            </div>

            <p>
                This verification code will expire on{" "}
                <strong>{expiryLocal}</strong> ({timezone}).
            </p>

            <p style={{ color: "#555" }}>
                If you did not initiate this lease or believe this message was
                sent in error, you may safely ignore this email. No action will
                be taken without successful verification.
            </p>

            <hr style={{ margin: "24px 0" }} />

            <p style={{ fontSize: "12px", color: "#888" }}>
                This is a system-generated message from UpKyp. Please do not
                reply to this email.
                <br />
                © {new Date().getFullYear()} UpKyp. All rights reserved.
            </p>
        </div>
    );
}
