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
        const [landlordResults] = await db.execute(`
            SELECT 
                u.user_id,
                u.firstName,
                u.lastName,
                u.email,
                u.phoneNumber,
                u.birthDate,
                u.userType,
                u.emailVerified,
                l.landlord_id,
                u.profilePicture,
                l.createdAt AS landlordCreatedAt
            FROM User u
            INNER JOIN Landlord l ON u.user_id = l.user_id
            WHERE u.user_id = ?
        `, [user_id]);

        if (landlordResults.length === 0) {
            return res.status(404).json({ error: "Landlord not found" });
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
        const landlordDetails = {
            user_id: landlordResults[0].user_id,
            landlord_id: landlordResults[0].landlord_id,
            firstName: landlordResults[0].firstName,
            lastName: landlordResults[0].lastName,
            email: landlordResults[0].email,
            phoneNumber: landlordResults[0].phoneNumber,
            birthDate: landlordResults[0].birthDate,
            userType: landlordResults[0].userType,
            emailVerified: landlordResults[0].emailVerified ? true : false,
            profilePicture: landlordResults[0].profilePicture,
            landlordCreatedAt: landlordResults[0].landlordCreatedAt,
            activityLogs: activityLogs.map(log => ({
                action: log.action,
                timestamp: log.timestamp
            }))
        };

        return res.status(200).json(landlordDetails);
    } catch (error) {
        console.error("Database Error:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}
