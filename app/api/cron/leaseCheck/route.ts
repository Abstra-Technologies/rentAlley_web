
import { checkExpiringLeases } from "@/utils/leaseCron";

export async function POST() {
    try {
        const count = await checkExpiringLeases();
        return Response.json({ ok: true, message: `Checked ${count} leases` });
    } catch (err) {

        return Response.json(// @ts-ignore
            { ok: false, error: err.message },
            { status: 500 }
        );
    }
}
