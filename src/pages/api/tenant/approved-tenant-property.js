import { db } from "../../../lib/db";
import { decryptData } from "../../../crypto/encrypt";

export default async function getProperty(req, res) {
    if (req.method !== "GET") {
        return res.status(405).json({ message: "Method Not Allowed" });
    }

    try {
        const { tenantId } = req.query;

        if (!tenantId) {
            return res.status(400).json({ message: "Tenant ID is required" });
        }

        const [leaseDetails] = await db.query(
            `SELECT
                 agreement_id, start_date, end_date,
                 is_advance_payment_paid, is_security_deposit_paid,
                 unit_id, tenant_id
             FROM LeaseAgreement
             WHERE tenant_id = ?
               AND status = 'active'
             ORDER BY updated_at DESC
             LIMIT 1`,
            [tenantId]
        );

        if (!leaseDetails || leaseDetails.length === 0) {
            return res.status(404).json({ message: "No active lease found" });
        }

        const unitId = leaseDetails[0].unit_id;

        const [unitDetails] = await db.query(
            `SELECT
                 u.unit_id, u.unit_name, u.unit_size, u.bed_spacing, u.avail_beds,
                 u.rent_amount, u.furnish, u.status,
                 p.property_id, p.property_name, p.property_type, p.min_stay, p.landlord_id,
                 p.sec_deposit, p.advanced_payment, p.city, p.zip_code, p.province, p.street, p.brgy_district
             FROM Unit u
             INNER JOIN Property p ON u.property_id = p.property_id
             WHERE u.unit_id = ?`,
            [unitId]
        );

        if (!unitDetails || unitDetails.length === 0) {
            return res.status(404).json({ message: "No unit details found" });
        }

        let unitData = {
            ...unitDetails[0],
            agreement_id: leaseDetails[0]?.agreement_id || null,
            start_date: leaseDetails[0]?.start_date || null,
            end_date: leaseDetails[0]?.end_date || null,
            is_advance_payment_paid: leaseDetails[0]?.is_advance_payment_paid || 0,
            is_security_deposit_paid: leaseDetails[0]?.is_security_deposit_paid || 0,
        
            street: unitDetails[0]?.street || "",
            brgy_district: unitDetails[0]?.brgy_district || "",
            city: unitDetails[0]?.city || "",
            province: unitDetails[0]?.province || "",
            zip_code: unitDetails[0]?.zip_code || ""
        };

        const [unitPhotos] = await db.query(
            `SELECT photo_url FROM UnitPhoto WHERE unit_id = ? ORDER BY id ASC`,
            [unitId]
        );

        if (unitPhotos.length > 0) {
            try {
                unitData.unit_photos = unitPhotos.map((photo) =>
                    decryptData(JSON.parse(photo.photo_url), process.env.ENCRYPTION_SECRET)
                );
            } catch (e) {
                console.error("Failed to decrypt unit photos:", e);
                unitData.unit_photos = [];
            }
        } else {
            unitData.unit_photos = [];
        }

        return res.status(200).json(unitData);
    } catch (error) {
        console.error("Error fetching property/unit info:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
}
