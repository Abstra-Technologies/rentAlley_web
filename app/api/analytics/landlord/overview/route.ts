import { NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * @route   GET /api/analytics/landlord/overview?landlord_id=<id>
 * @desc    Returns all landlord analytics (active listings, pending listings, tenants, maintenance, etc.)
 */
export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const landlord_id = searchParams.get("landlord_id");

        if (!landlord_id) {
            return NextResponse.json({ error: "Missing landlord_id" }, { status: 400 });
        }

        // 🏠 1. Active Listings
        const [activeRows] = await db.query(
            `SELECT COUNT(*) AS activeListings 
       FROM Property 
       WHERE landlord_id = ? AND status = 'active'`,
            [landlord_id]
        );

        // ⏳ 2. Pending Listings
        const [pendingRows] = await db.query(
            `SELECT COUNT(*) AS pendingListings 
       FROM Property 
       WHERE landlord_id = ? AND status = 'inactive'`,
            [landlord_id]
        );

        // 👥 3. Total Tenants
        const [tenantRows] = await db.query(
            `SELECT COUNT(DISTINCT la.tenant_id) AS totalTenants
       FROM LeaseAgreement la
       JOIN Unit u ON la.unit_id = u.unit_id
       JOIN Property p ON u.property_id = p.property_id
       WHERE p.landlord_id = ? AND la.status IN ('active','completed')`,
            [landlord_id]
        );

        // 🏢 4. Number of Properties
        const [propertyCount] = await db.query(
            `SELECT COUNT(property_id) AS numberOfProperties
       FROM Property 
       WHERE landlord_id = ?`,
            [landlord_id]
        );

        // 🧰 5. Maintenance Categories Breakdown
        const [maintenanceRows] = await db.query(
            `SELECT 
          category AS name,
          COUNT(*) AS count
       FROM MaintenanceRequest mr
       JOIN Unit u ON mr.unit_id = u.unit_id
       JOIN Property p ON u.property_id = p.property_id
       WHERE p.landlord_id = ?
       GROUP BY category`,
            [landlord_id]
        );

        // 🧩 6. Tenant Occupation Distribution (from User table)
        const [occupationRows] = await db.query(
            `SELECT
                 u.occupation AS label,
                 COUNT(*) AS value
             FROM User u
                      JOIN Tenant t ON u.user_id = t.user_id
                      JOIN LeaseAgreement la ON la.tenant_id = t.tenant_id
                      JOIN Unit un ON la.unit_id = un.unit_id
                      JOIN Property p ON un.property_id = p.property_id
             WHERE p.landlord_id = ?
               AND u.occupation IS NOT NULL
               AND u.occupation != ''
             GROUP BY u.occupation
             ORDER BY COUNT(*) DESC`,
            [landlord_id]
        );


        // 🎂 7. Tenant Age Group Distribution
        const [ageRows] = await db.query(
            `SELECT 
        CASE
          WHEN TIMESTAMPDIFF(YEAR, u.birthDate, CURDATE()) < 25 THEN '18-24'
          WHEN TIMESTAMPDIFF(YEAR, u.birthDate, CURDATE()) BETWEEN 25 AND 34 THEN '25-34'
          WHEN TIMESTAMPDIFF(YEAR, u.birthDate, CURDATE()) BETWEEN 35 AND 44 THEN '35-44'
          WHEN TIMESTAMPDIFF(YEAR, u.birthDate, CURDATE()) BETWEEN 45 AND 54 THEN '45-54'
          ELSE '55+' 
        END AS ageGroup,
        COUNT(*) AS count
       FROM User u
       JOIN Tenant t ON u.user_id = t.user_id
       JOIN LeaseAgreement la ON la.tenant_id = t.tenant_id
       JOIN Unit un ON la.unit_id = un.unit_id
       JOIN Property p ON un.property_id = p.property_id
       WHERE p.landlord_id = ?
       GROUP BY ageGroup`,
            [landlord_id]
        );

        // 🧠 Combine everything
        const response = {
            activeListings: activeRows[0]?.activeListings || 0,
            pendingListings: pendingRows[0]?.pendingListings || 0,
            totalTenants: tenantRows[0]?.totalTenants || 0,
            numberOfProperties: propertyCount[0]?.numberOfProperties || 0,
            maintenanceCategories: maintenanceRows || [],
            tenantOccupation: occupationRows || [],
            tenantAgeGroups: ageRows || []
        };

        return NextResponse.json(response, { status: 200 });
    } catch (error: any) {
        console.error("Error fetching landlord overview analytics:", error);
        return NextResponse.json(
            { error: "Internal server error", details: error.message },
            { status: 500 }
        );
    }
}
