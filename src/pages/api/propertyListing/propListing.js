import { db } from "../../../lib/db";

export default async function PropertyListingCRUD(req, res) {
  const { id } = req.query;
  let connection;

  try {
    connection = await db.getConnection();

    if (req.method === "POST") {
      await handlePostRequest(req, res, connection);
    } else if (req.method === "GET") {
      const { landlord_id, property_id } = req.query;
      await handleGetRequest(req, res, connection, landlord_id, property_id);
    } else if (req.method === "PUT") {
      await handlePutRequest(req, res, connection, id);
    } else if (req.method === "DELETE") {
      await handleDeleteRequest(req, res, connection, id);
    } else {
      res.setHeader("Allow", ["POST", "GET", "PUT", "DELETE"]);
      res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    console.error("Error handling request:", error);
    res.status(500).json({ error: "Internal Server Error" });
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

async function handlePostRequest(req, res, connection) {
  const {
    propertyName,
    propertyType,
    amenities,
    street,
    brgyDistrict,
    city,
    zipCode,
    province,
    totalUnits,
    utilityBillingType,
    propDesc,
    floorArea,
    petFriendly,
    minStay,
    lateFee,
    assocDues,
    secDeposit,
    advancedPayment,
    paymentFrequency,
  } = req.body;

  try {
    const { landlord_id } = req.query;
    console.log("Landlord ID:", landlord_id);

    if (!landlord_id) {
      return res.status(400).json({ error: "User does not exist" });
    }

    const values = [
      landlord_id,
      propertyName,
      propertyType,
      amenities ? amenities.join(",") : null,
      street || null,
      parseInt(brgyDistrict) || null,
      city || null,
      zipCode || null,
      province || null,
      totalUnits || 1,
      utilityBillingType,
      propDesc || null,
      floorArea,
      petFriendly ? 1 : 0,
      minStay || null,
      lateFee || 0.0,
      assocDues || 0.0,
      secDeposit || null,
      advancedPayment || null,
      paymentFrequency || null,
    ];

    console.log("Values array:", values);

    await connection.beginTransaction();

    const [result] = await connection.execute(
      `
      INSERT INTO Property (
          landlord_id, property_name, property_type, amenities, street,
          brgy_district, city, zip_code, province, total_units,
          utility_billing_type, description, floor_area, pet_friendly,
          min_stay, late_fee, assoc_dues, sec_deposit, advanced_payment,
          payment_frequency, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      `,
      values
    );

    await connection.commit();

    res.status(201).json({ propertyID: result.insertId, ...req.body });
  } catch (error) {
    await connection.rollback();

    console.error("Error creating property listings:", error);

    res.status(500).json({ error: "Failed to create property listing" });
  }
}

// Get Properties by ID or All, including verification status
async function handleGetRequest(req, res, connection, landlord_id, property_id) {
  try {
    let query = `
      SELECT
        p.*,
        pv.status AS verification_status,
        pv.admin_message AS verification_message
      FROM Property p
             LEFT JOIN PropertyVerification pv ON p.property_id = pv.property_id
      WHERE 1=1
    `;


    let params = [];

    // If an ID is provided, add it to the query
    if (landlord_id) {
      query += ` AND p.landlord_id = ?`;
      params.push(landlord_id);
    }

    if (property_id) {
      query += ` AND p.property_id = ?`;
      params.push(property_id);
    }

    const [rows] = await connection.execute(query, params);

    if (property_id && rows.length === 0) {
      return res.status(404).json({ error: "No Properties found for this Landlord" });
    }

    res.status(200).json(rows);
  } catch (error) {
    console.error("Error fetching property listings:", error);
    res.status(500).json({ error: "Failed to fetch property listings" });
  }
}

async function handlePutRequest(req, res, connection, id) {
  try {
    const [rows] = await connection.execute(
      `SELECT * FROM Property WHERE property_id = ?`,
      [id]
    );
    if (rows.length === 0) {
      throw new Error("Property not found");
    }

    await connection.beginTransaction();

    // Replace undefined/empty values with null
    Object.keys(req.body).forEach((key) => {
      if (req.body[key] === undefined || req.body[key] === "") {
        req.body[key] = null;
      }
    });

    const {
      propertyName,
      propertyType,
      amenities,
      street,
      brgyDistrict,
      city,
      zipCode,
      province,
      propDesc,
      totalUnits,
      floorArea,
      utilityBillingType,
      petFriendly,
      minStay,
      secDeposit,
      assocDues,
      advancedPayment,
      paymentFrequency,
      lateFee,
    } = req.body;

    console.log("Updating property with values:", req.body);

    const [result] = await connection.execute(
      `UPDATE Property SET
        property_name = ?, property_type = ?, amenities = ?, street = ?, brgy_district = ?,
        city = ?, zip_code = ?, province = ?, total_units = ?, utility_billing_type = ?, description = ?, floor_area = ?, pet_friendly = ?, min_stay = ?, sec_deposit = ?, advanced_payment = ?, assoc_dues = ?, late_fee = ?, payment_frequency = ?, updated_at = CURRENT_TIMESTAMP
      WHERE property_id = ?`,
      [
        propertyName,
        propertyType,
        amenities ? amenities.join(",") : null,
        street,
        Number(brgyDistrict),
        city,
        zipCode,
        province,
        totalUnits,
        utilityBillingType,
        propDesc,
        floorArea,
        petFriendly,
        minStay,
        secDeposit,
        advancedPayment,
        assocDues,
        lateFee,
        paymentFrequency,
        id,
      ]
    );

    await connection.commit();
    console.log("Result: ", result);
    res.status(200).json({ propertyID: id, ...req.body });
  } catch (error) {
    await connection.rollback();
    console.error("Error updating property listing:", error);

    res.status(500).json({ error: "Failed to update property listing" });
  }
}

async function handleDeleteRequest(req, res, connection, id) {
  try {
    const [rows] = await connection.execute(
        `SELECT * FROM Property WHERE property_id = ?`,
        [id]
    );

    if (rows.length === 0) {
      throw new Error("Property not found");
    }

    // Check if any unit within the property has an active lease
    const [activeLeases] = await connection.execute(
        `SELECT la.agreement_id 
     FROM LeaseAgreement la
     JOIN Unit u ON la.unit_id = u.unit_id
     WHERE u.property_id = ? AND la.status = 'active'`,
        [id]
    );

    if (activeLeases.length > 0) {
      return res.status(400).json({ error: "Cannot delete property with active leases" });
    }

    await connection.beginTransaction();

    await connection.execute(`DELETE FROM Property WHERE property_id = ?`, [id]);

    await connection.commit();
    res.status(200).json({ message: "Property listing deleted successfully" });

  } catch (error) {
    await connection.rollback();
    console.error("Error deleting property listing:", error);

    res.status(500).json({ error: "Failed to delete property listing" });
  }

}
