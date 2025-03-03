import { db } from "../../../lib/db";

export default async function DeleteAccount(req, res) {
    try {
        console.log("Received request:", req.method, req.body);

        if (req.method !== "POST") {
            return res.status(405).json({ error: "Method Not Allowed. Use POST." });
        }

        const { user_id, userType } = req.body;

        if (!user_id || !userType) {
            return res.status(400).json({ error: "Missing user_id or userType in request." });
        }

        let landlordId = null;

        if (userType === "landlord") {
            console.log("Checking if user is a landlord...");

            const [landlordRows] = await db.query(
                `SELECT landlord_id FROM Landlord WHERE user_id = ?`,
                [user_id]
            );

            if (!landlordRows || landlordRows.length === 0) {
                console.error("❌ No landlord found for user_id:", user_id);
            }

            landlordId = landlordRows[0].landlord_id;
            console.log("✅ Landlord found:", landlordId);

            const [leaseRows] = await db.query(
                `SELECT COUNT(*) AS active_lease_count
                 FROM LeaseAgreement l
                          JOIN ProspectiveTenant pt ON l.prospective_tenant_id = pt.id
                          JOIN Unit u ON pt.unit_id = u.unit_id
                          JOIN Property p ON u.property_id = p.property_id
                 WHERE p.landlord_id = ? AND l.status = 'active'`,
                [landlordId]
            );

            if (!leaseRows || leaseRows.length === 0) {
                console.error("No lease count received");
            }

            const activeLeaseCount = parseInt(leaseRows[0]?.active_lease_count || 0);
            console.log("✅ Active Lease Count:", activeLeaseCount);

            if (activeLeaseCount > 0) {
                console.error("Cannot deactivate account, active leases exist.");
                return res.status(400).json({ error: "You cannot deactivate your account. You have active leases." });
            }
        }
        console.log("Deactivating user account...");
        await db.query(`UPDATE User SET is_active = 0 WHERE user_id = ?`, [user_id]);

        res.setHeader(
            "Set-Cookie",
            "token=; HttpOnly; Path=/; Max-Age=0; SameSite=Strict"
        );

        return res.json({ message: "Your account has been deactivated. You can reactivate anytime by logging in." });

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
        return res.status(500).json({ error: "Failed to deactivate account." });
    }
}
