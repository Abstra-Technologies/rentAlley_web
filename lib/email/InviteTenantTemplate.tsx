import * as React from "react";

type InviteTenantTemplateProps = {
    propertyName: string;
    unitName: string;
    registrationUrl: string;
    datesDeferred: boolean;
};

export default function InviteTenantTemplate({
                                                 propertyName,
                                                 unitName,
                                                 registrationUrl,
                                                 datesDeferred,
                                             }: InviteTenantTemplateProps) {
    return (
        <div style={{ fontFamily: "Arial, sans-serif", lineHeight: "1.6" }}>
            <h2>You’re invited to join {propertyName}</h2>

            <p>
                You’ve been invited to rent a unit at{" "}
                <strong>{propertyName}</strong>.
            </p>

            <p>
                <strong>Unit:</strong> {unitName}
            </p>

            <p>
                Click the button below to accept your invitation and complete
                your registration.
            </p>

            <a
                href={registrationUrl}
                style={{
                    display: "inline-block",
                    marginTop: "16px",
                    padding: "10px 18px",
                    backgroundColor: "#2563eb",
                    color: "#ffffff",
                    textDecoration: "none",
                    borderRadius: "6px",
                    fontWeight: 600,
                }}
            >
                Accept Invitation
            </a>

            {datesDeferred && (
                <p style={{ marginTop: "16px", color: "#555" }}>
                    <em>
                        Lease dates will be finalized after you accept the
                        invitation.
                    </em>
                </p>
            )}

            <hr style={{ margin: "24px 0" }} />

            <p style={{ fontSize: "12px", color: "#888" }}>
                If you were not expecting this invitation, you may safely ignore
                this email.
            </p>
        </div>
    );
}
