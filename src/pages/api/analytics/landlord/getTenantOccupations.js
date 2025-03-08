import  {db} from "../../../../lib/db";
import occupations from "../../../../constant/occupations"

export default async function handler(req, res) {
    if (req.method !== "GET") {
        return res.status(405).json({ message: "Method Not Allowed" });
    }

    const { landlord_id } = req.query;

    if (!landlord_id) {
        return res.status(400).json({ message: "Missing landlord_id parameter" });
    }

    try {
        const [occupations] = await db.execute(
            `SELECT t.occupation, 
                    COUNT(t.tenant_id) AS tenant_count, 
                    (COUNT(t.tenant_id) * 100 / (SELECT COUNT(*) 
                                    FROM Tenant t 
                                    JOIN LeaseAgreement la ON t.tenant_id = la.tenant_id
                                    JOIN Unit u ON la.unit_id = u.unit_id
                                    JOIN Property pr ON u.property_id = pr.property_id
                                    WHERE pr.landlord_id = ? 
                                    AND la.status = 'active')) AS percentage
             FROM Tenant t
             JOIN LeaseAgreement la ON t.tenant_id = la.tenant_id
             JOIN Unit u ON la.unit_id = u.unit_id
             JOIN Property pr ON u.property_id = pr.property_id
             WHERE pr.landlord_id = ?
             AND la.status = 'active'
             GROUP BY t.occupation
             ORDER BY tenant_count DESC;`,
            [landlord_id, landlord_id]
        );

        const formattedOccupations = occupations.map((item) => {
            const occupationLabel = occupations.find((occ) => occ.value === item.occupation)?.label || item.occupation;
            return {
                occupation: occupationLabel,
                tenant_count: item.tenant_count,
                percentage: item.percentage,
            };
        });



        res.status(200).json(formattedOccupations);
    } catch (error) {
        console.error("Error fetching tenant occupation analytics:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
}