import { db } from "../../../../lib/db";

export default async function ReactivateAccount(req, res){

    if (req.method !== "POST") {
        return res.status(405).json({ message: "Method Not Allowed" });
    }
    try {
        console.log("Received request contents:", req.body);

        if (req.method !== "POST") {
            return res.status(405).json({ error: "Method Not Allowed. Use DELETE." });
        }

        const { user_id, userType } = req.body;

        if (!user_id || !userType) {
            return res.status(400).json({ error: "Missing user_id or userType" });
        }

        if (userType === "landlord") {
            console.log("Checking landlord details...");

            const [landlordRows] = await db.query(
                `SELECT landlord_id FROM Landlord WHERE user_id = ?`,
                [user_id]
            );

            if (!landlordRows.length) {
                console.error("No landlord found for user_id:", user_id);
                return res.status(400).json({ error: "Landlord account not found." });
            }

            const landlordId = landlordRows[0].landlord_id;
            console.log("Landlord found:", landlordId);

            await db.query(`UPDATE Property SET status = 'active' WHERE landlord_id = ?`, [landlordId]);
            await db.query(
                `UPDATE Unit u 
                 JOIN Property p ON u.property_id = p.property_id
                 SET u.status = 'active' 
                 WHERE p.landlord_id = ?`,
                [landlordId]
            );

            console.log("Properties and units set to active.");
            await db.query(`UPDATE User SET is_active = 1 WHERE user_id = ?`, [user_id]);
            return res.status(200).json({ success: true, message: "Landlord account reactivated successfully." });
        }

        if (userType === "tenant") {
            console.log("Checking tenant details...");

            const [tenantRows] = await db.query(`SELECT tenant_id FROM Tenant WHERE user_id = ?`, [user_id]);

            if (!tenantRows.length) {
                return res.status(400).json({ error: "Tenant account not found." });
            }

            const tenantId = tenantRows[0].tenant_id;

            const [tenantLeaseRows] = await db.query(
                `SELECT COUNT(*) AS active_lease_count FROM LeaseAgreement WHERE tenant_id = ? AND status = 'active'`,
                [tenantId]
            );

            const activeTenantLeaseCount = tenantLeaseRows[0]?.active_lease_count || 0;
            console.log("Active Tenant Lease Count:", activeTenantLeaseCount);

            if (activeTenantLeaseCount > 0) {
                return res.status(400).json({ error: "You cannot deactivate your account. You have an active lease." });
            }

            console.log("Deactivating user account...");
            await db.query(`UPDATE User SET is_active = 0 WHERE user_id = ?`, [user_id]);
            return res.status(200).json({ success: true, message: "Landlord account reactivated successfully." });

        }


    } catch (error) {
        console.error("Error deactivating account:", error);
        return res.status(500).json({ error: "Failed to deactivate account." });
    }
}