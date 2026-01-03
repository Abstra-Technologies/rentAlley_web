import { Resend } from "resend";
import BetaDecisionTemplate from "@/lib/email/BetaDecisionTemplate";

const resend = new Resend(process.env.RESEND_API_KEY!);

type BetaDecisionEmailParams = {
    email: string;
    firstName?: string;
    decision: "approved" | "rejected";
    startDate?: Date; // for approved
    endDate?: Date;   // for approved
    rejectionReason?: string; // for rejected
};

export async function sendBetaDecisionEmail({
                                                email,
                                                firstName,
                                                decision,
                                                startDate,
                                                endDate,
                                                rejectionReason,
                                            }: BetaDecisionEmailParams) {
    const isApproved = decision === "approved";

    const title = isApproved
        ? "🎉 You’re Approved for the Upkyp Beta Program"
        : "Update on Your Upkyp Beta Application";

    const formattedStartDate = startDate
        ? startDate.toLocaleDateString("en-US", { dateStyle: "medium" })
        : undefined;

    const formattedEndDate = endDate
        ? endDate.toLocaleDateString("en-US", { dateStyle: "medium" })
        : undefined;

    await resend.emails.send({
        from: "Upkyp <noreply@upkyp.com>",
        to: [email],
        subject: title,

        react: BetaDecisionTemplate({
            title,
            firstName: firstName || "there",
            decision,
            startDate: formattedStartDate,
            endDate: formattedEndDate,
            rejectionReason,
        }),

        tags: [
            { name: "type", value: "transactional" },
            { name: "category", value: "beta-decision" },
            { name: "decision", value: decision },
        ],
    });
}
