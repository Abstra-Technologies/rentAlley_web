//
// import mysql from 'mysql2/promise';
// import { decryptData } from '../../crypto/encrypt';
//
// export default async function handler(req, res) {
//     try {
//         const { property_id } = req.query;
//
//         console.log("Fetching property details for ID:", property_id);
//
//         if (!property_id) {
//             return res.status(400).json({ message: "Missing property ID" });
//         }
//
//         const connection = await mysql.createConnection({
//             host: process.env.DB_HOST,
//             user: process.env.DB_USER,
//             password: process.env.DB_PASSWORD,
//             database: process.env.DB_NAME,
//             timezone: '+08:00',
//         });
//
//         const [propertyRows] = await connection.execute(`
//             SELECT p.*,
//                    pv.occ_permit, pv.mayor_permit, pv.outdoor_photo, pv.indoor_photo, pv.status AS verification_status, pv.verified,
//                    GROUP_CONCAT(DISTINCT pp.photo_url ORDER BY pp.photo_id ASC) AS photos
//             FROM Property p
//             LEFT JOIN PropertyVerification pv ON p.property_id = pv.property_id
//             LEFT JOIN PropertyPhoto pp ON p.property_id = pp.property_id
//             WHERE p.property_id = ?
//             GROUP BY p.property_id, pv.occ_permit, pv.mayor_permit, pv.outdoor_photo, pv.indoor_photo, pv.status, pv.verified
//         `, [property_id]);
//
//         if (propertyRows.length === 0) {
//             console.error("Property not found:", property_id);
//             return res.status(404).json({ message: "Property not found" });
//         }
//
//         const secretKey = process.env.ENCRYPTION_SECRET;
//
//         if (!secretKey) {
//             console.error("Missing encryption secret key. Check ENCRYPTION_SECRET in .env.");
//             return res.status(500).json({ message: "Internal Server Error: Encryption Key Missing" });
//         }
//
//         const decryptIfValid = (data) => {
//             if (!data || typeof data !== "string") return null;
//             try {
//                 // Only parse if it's a valid JSON string
//                 const parsedData = data.trim().startsWith("{") ? JSON.parse(data) : null;
//                 return parsedData ? decryptData(parsedData, secretKey) : null;
//             } catch (error) {
//                 console.error("JSON Parsing Error:", error.message, "Data:", data);
//                 return null;
//             }
//         };
//
//         const property = {
//             ...propertyRows[0],
//             occ_permit: decryptIfValid(propertyRows[0].occ_permit),
//             mayor_permit: decryptIfValid(propertyRows[0].mayor_permit),
//             outdoor_photo: decryptIfValid(propertyRows[0].outdoor_photo),
//             indoor_photo: decryptIfValid(propertyRows[0].indoor_photo),
//             photos: propertyRows[0].photos
//                 ? propertyRows[0].photos.split(',').map(photo => decryptIfValid(photo))
//                 : [],
//         };
//         res.status(200).json(property);
//
//     } catch (error) {
//         console.error("Error fetching property:", error);
//         return res.status(500).json({ success: false, message: "Internal Server Error" });
//     }
// }


import mysql from 'mysql2/promise';
import { decryptData } from '../../crypto/encrypt';

export default async function handler(req, res) {
    try {
        const { property_id } = req.query;

        console.log("Fetching property details for ID:", property_id);

        if (!property_id) {
            return res.status(400).json({ message: "Missing property ID" });
        }

        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            timezone: '+08:00',
        });

        // ✅ Fix: Use GROUP_CONCAT with DISTINCT
        const [propertyRows] = await connection.execute(
            `SELECT p.*,
                    pv.occ_permit, pv.mayor_permit, pv.outdoor_photo, pv.indoor_photo, pv.status AS verification_status, pv.verified
             FROM Property p
                      LEFT JOIN PropertyVerification pv ON p.property_id = pv.property_id
             WHERE p.property_id = ?`,
            [property_id]
        );


        if (propertyRows.length === 0) {
            console.error("Property not found:", property_id);
            return res.status(404).json({ message: "Property not found" });
        }

        const secretKey = process.env.ENCRYPTION_SECRET;

        if (!secretKey) {
            console.error("Missing encryption secret key. Check ENCRYPTION_SECRET in .env.");
            return res.status(500).json({ message: "Internal Server Error: Encryption Key Missing" });
        }

        const decryptIfValid = (data) => {
            if (!data || typeof data !== "string") return null;
            try {
                const parsedData = data.trim().startsWith("{") ? JSON.parse(data) : null;
                return parsedData ? decryptData(parsedData, secretKey) : null;
            } catch (error) {
                console.error("JSON Parsing Error:", error.message, "Data:", data);
                return null;
            }
        };

        const photosArray = propertyRows[0].photos
            ? [...new Set(propertyRows[0].photos.split(','))]
            : [];

        const property = {
            ...propertyRows[0],
            occ_permit: decryptIfValid(propertyRows[0].occ_permit),
            mayor_permit: decryptIfValid(propertyRows[0].mayor_permit),
            outdoor_photo: decryptIfValid(propertyRows[0].outdoor_photo),
            indoor_photo: decryptIfValid(propertyRows[0].indoor_photo),
            photos: photosArray
        };

        res.status(200).json(property);

    } catch (error) {
        console.error("Error fetching property:", error);
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
}
