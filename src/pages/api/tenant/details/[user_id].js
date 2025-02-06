import mysql from "mysql2/promise";

export default async function handler(req, res) {
    if (req.method !== "GET") {
        return res.status(405).json({ error: "Method Not Allowed" });
    }

    const { user_id } = req.query;

    // Establish MySQL Connection
    const db = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
    });

    try {
        // Fetch tenant details by joining User and Tenant tables
        const [tenantResults] = await db.execute(`
            SELECT 
                u.user_id,
                u.firstName,
                u.lastName,
                u.email,
                u.phoneNumber,
                u.birthDate,
                u.userType,
                u.emailVerified,
                t.tenant_id,
                t.profilePicture,
                t.createdAt AS tenantCreatedAt
            FROM User u
            INNER JOIN Tenant t ON u.user_id = t.user_id
            WHERE u.user_id = ?
        `, [user_id]);

        if (tenantResults.length === 0) {
            return res.status(404).json({ error: "Tenant not found" });
        }

        // Fetch activity logs for the user
        const [activityLogs] = await db.execute(`
            SELECT 
                action, 
                timestamp 
            FROM ActivityLog 
            WHERE user_id = ?
            ORDER BY timestamp DESC
        `, [user_id]);

        // Close the DB connection
        await db.end();

        // Construct response data
        const tenantDetails = {
            user_id: tenantResults[0].user_id,
            tenant_id: tenantResults[0].tenant_id,
            firstName: tenantResults[0].firstName,
            lastName: tenantResults[0].lastName,
            email: tenantResults[0].email,
            phoneNumber: tenantResults[0].phoneNumber,
            birthDate: tenantResults[0].birthDate,
            userType: tenantResults[0].userType,
            emailVerified: tenantResults[0].emailVerified ? true : false,
            profilePicture: tenantResults[0].profilePicture,
            tenantCreatedAt: tenantResults[0].tenantCreatedAt,
            activityLogs: activityLogs.map(log => ({
                action: log.action,
                timestamp: log.timestamp
            }))
        };

        return res.status(200).json(tenantDetails);
    } catch (error) {
        console.error("Database Error:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}
