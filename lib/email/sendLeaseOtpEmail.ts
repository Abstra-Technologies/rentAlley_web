import { Resend } from "resend";
import LeaseOtpTemplate from "@/lib/email/LeaseOtpTemplate";

const resend = new Resend(process.env.RESEND_API_KEY!);

type SendLeaseOtpEmailParams = {
    email: string;
    otp: string;
    expiryLocal: string;
    timezone: string;
    propertyName: string;
    unitName: string;
    landlordName: string;
    tenantName: string;
};

export async function sendLeaseOtpEmail({
                                            email,
                                            otp,
                                            expiryLocal,
                                            timezone,
                                            propertyName,
                                            unitName,
                                            landlordName,
                                            tenantName,
                                        }: SendLeaseOtpEmailParams) {

    console.log('email resend: ', email);
    await resend.emails.send({
        from: "UpKyp <noreply@upkyp.com>",
        to: [email],
        subject: `Lease Verification Code – ${propertyName} (${unitName})`,

        react: LeaseOtpTemplate({
            otp,
            expiryLocal,
            timezone,
            propertyName,
            unitName,
            landlordName,
            tenantName,
        }),

        tags: [
            { name: "type", value: "transactional" },
            { name: "category", value: "lease-otp" },
        ],
    });
}
