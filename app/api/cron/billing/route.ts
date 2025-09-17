
import sendBillingNotifications from "@/utils/billingCron";

export async function POST() {
    try {
        const result = await sendBillingNotifications();
        return Response.json({ ok: true, message: result });
    } catch (error) {

        return Response.json(// @ts-ignore
            { ok: false, error: error.message },
            { status: 500 }
        );
    }
}
