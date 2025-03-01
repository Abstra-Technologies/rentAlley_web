import mysql from "mysql2/promise";


export default async function VerificationStatusLandlord(req, res) {

    const { user_id } = req.query;

    const db = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
    });

    try {
        const [landlordRows] = await db.execute(
            `SELECT landlord_id FROM Landlord WHERE user_id = ?`,
            [user_id]
        );

        if (landlordRows.length === 0) {
            await db.end();
            return res.status(404).json({ message: "Landlord not found" });
        }

        const landlord_id = landlordRows[0].landlord_id;

        //  check the verification status in LandlordVerification table using landlord_id
        const [verificationRows] = await db.execute(
            `SELECT status FROM LandlordVerification WHERE landlord_id = ?`,
            [landlord_id]
        );

        // If no verification record exists for this landlord_id, return 'not verified'
        if (verificationRows.length === 0) {
            await db.end();
            return res.status(200).json({
                verification_status: 'not verified',
            });
        }

        // Return the verification status from the LandlordVerification table
        const verificationStatus = verificationRows[0].status;

        const validStatuses = ['pending', 'verified', 'rejected', 'not verified'];

        if (validStatuses.includes(verificationStatus)) {
            return res.status(200).json({
                verification_status: verificationStatus,
            });
        } else {
            return res.status(200).json({
                verification_status: 'not verified',
            });
        }

    } catch (error) {
        console.error("Database Error:", error);
        await db.end();
        return res.status(500).json({ message: "Internal Server Error" });
    }
}
