import { Resend } from "resend";
import InviteTenantTemplate from "@/lib/email/InviteTenantTemplate";

const resend = new Resend(process.env.RESEND_API_KEY!);

type InviteTenantEmailParams = {
    email: string;
    propertyName: string;
    unitName: string;
    inviteCode: string;
    datesDeferred: boolean;
};

export async function sendInviteTenantEmail({
                                                email,
                                                propertyName,
                                                unitName,
                                                inviteCode,
                                                datesDeferred,
                                            }: InviteTenantEmailParams) {
    const registrationUrl = `${process.env.BASE_URL}/pages/InviteRegister?invite=${inviteCode}`;

    const title = `Upkyp: You’re invited to join ${propertyName}`;

    await resend.emails.send({
        from: "Upkyp <hello@upkyp.com>",
        to: [email],
        subject: title,

        react: InviteTenantTemplate({
            propertyName,
            unitName,
            registrationUrl,
            datesDeferred,
        }),

        tags: [
            { name: "type", value: "transactional" },
            { name: "category", value: "tenant-invite" },
            { name: "datesDeferred", value: String(datesDeferred) },
        ],
    });
}
