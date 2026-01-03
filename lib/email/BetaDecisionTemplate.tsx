import * as React from "react";

interface Props {
    title: string;
    firstName: string;
    decision: "approved" | "rejected";
    startDate?: string;
    endDate?: string;
    rejectionReason?: string;
}

export default function BetaDecisionTemplate({
                                                 title,
                                                 firstName,
                                                 decision,
                                                 startDate,
                                                 endDate,
                                                 rejectionReason,
                                             }: Props) {
    return (
        <div style={{ fontFamily: "Arial, sans-serif", lineHeight: 1.6 }}>
            <h2>{title}</h2>

            <p>Hello {firstName},</p>

            {decision === "approved" ? (
                <>
                    <p>
                        Congratulations! 🎉 Your application for the
                        <strong> Upkyp Beta Program</strong> has been approved.
                    </p>

                    <p>
                        <strong>Your Beta access:</strong><br />
                        Start Date: {startDate}<br />
                        End Date: {endDate}
                    </p>

                    <p>
                        You can now access all beta features and start managing
                        your properties right away.
                    </p>

                    <a
                        href={`https://www.upkyp.com/`}
                        style={{
                            display: "inline-block",
                            padding: "12px 18px",
                            background: "#2563eb",
                            color: "#ffffff",
                            borderRadius: "6px",
                            textDecoration: "none",
                            marginTop: "12px",
                        }}
                    >
                        Login to the App Now.
                    </a>
                </>
            ) : (
                <>
                    <p>
                        Thank you for applying to the Upkyp Beta Program.
                    </p>

                    <p>
                        After careful review, we’re unable to approve your
                        application at this time.
                    </p>

                    {rejectionReason && (
                        <p>
                            <strong>Reason:</strong><br />
                            {rejectionReason}
                        </p>
                    )}

                    <p>
                        We encourage you to apply again in the future as the
                        platform evolves.
                    </p>
                </>
            )}

            <p style={{ marginTop: "24px" }}>
                — <strong>The Upkyp Team</strong>
            </p>
        </div>
    );
}
