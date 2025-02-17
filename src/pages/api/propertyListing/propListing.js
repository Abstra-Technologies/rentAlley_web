import { db } from "../../lib/db";

async function getLandlordIdFromUserID(user_id, connection) {
  try {
    if (!user_id) {
      throw new Error("Invalid user ID provided");
    }

    // Query the Landlord table to get the landlord_id based on email
    const [rows] = await connection.execute(
      `SELECT landlord_id FROM Landlord WHERE user_id = ?`,
      [user_id]
    );

    // If no landlord is found with the given email
    if (rows.length === 0) {
      throw new Error("Landlord not found");
    }

    console.log("Landlord ID: ", rows[0].landlord_id);
    // Return the landlord_id (assuming it's the first result in the rows array)
    return rows.length > 0 ? rows[0].landlord_id : null;
  } catch (error) {
    console.error("Error retrieving landlord ID:", error);
    throw error; // Re-throw the error to handle it at a higher level
  }
}

export default async function handler(req, res) {
  const { id } = req.query;
  let connection;

  try {
    //Initialize DB Connection
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

//Create Properties
async function handlePostRequest(req, res, connection) {
  // Destructure request body to get property details
  const {
    user_id,
    propertyName,
    propertyType,
    amenities,
    street,
    brgyDistrict,
    city,
    zipCode,
    province,
    numberOfUnit,
    propDesc,
    floorArea,
    petFriendly,
    bedSpacing,
    availBeds,
    rentPayment,
    minStay,
    lateFee,
    secDeposit,
    advancedPayment,
    hasElectricity,
    hasWater,
    hasAssocDues,
    propertyStatus,
  } = req.body;

  // Ensure user_id is not undefined
  if (!user_id) {
    return res.status(400).json({ error: "user_id is required" });
  }

  try {
    // Retrieve landlord_id using user_id
    const landlord_id = await getLandlordIdFromUserID(user_id, connection);

    if (!landlord_id) {
      return res.status(400).json({ error: "User does not exist" });
    }

    const values = [
      landlord_id,
      propertyName || null,
      propertyType || null,
      amenities ? amenities.join(",") : null,
      street || null,
      parseInt(brgyDistrict) || null,
      city || null,
      zipCode || null,
      province || null,
      numberOfUnit || null,
      propDesc || null,
      floorArea,
      petFriendly ? 1 : 0,
      bedSpacing ? 1 : 0,
      availBeds || null,
      rentPayment || 0.0,
      minStay || null,
      lateFee || 0.0,
      secDeposit || null,
      advancedPayment || null,
      hasElectricity ? 1 : 0,
      hasWater ? 1 : 0,
      hasAssocDues ? 1 : 0,
      propertyStatus || "unoccupied",
    ];

    console.log("Values array:", values);

    // Start a new transaction
    await connection.beginTransaction();

    // Execute the SQL query to insert a new property listing
    const [result] = await connection.execute(
      `
      INSERT INTO Property (
        landlord_id,
        property_name,
        property_type,
        amenities,
        street,
        brgy_district,
        city,
        zip_code,
        province,
        number_of_units,
        description,
        floor_area,
        pet_friendly,
        bed_spacing,
        avail_beds,
        rent_payment,
        min_stay,
        late_fee,
        sec_deposit,
        advanced_payment,
        has_electricity,
        has_water,
        has_assocdues,
        status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      values
    );

    // Commit the transaction
    await connection.commit();

    // Respond with the newly created property ID and the request body
    res.status(201).json({ propertyID: result.insertId, ...req.body });
  } catch (error) {
    // Rollback the transaction in case of an error
    await connection.rollback();

    // Log the error message
    console.error("Error creating property listings:", error);

    // Respond with an error message
    res.status(500).json({ error: "Failed to create property listing" });
  }
}

//Get Properties by ID or All
async function handleGetRequest(
  req,
  res,
  connection,
  landlord_id,
  property_id
) {
  try {
    let query = `SELECT * FROM Property WHERE 1=1`; // Ensures base query is always valid
    let params = [];

    // If an ID is provided, add it to the query
    if (landlord_id) {
      query += ` AND landlord_id = ?`;
      params.push(landlord_id);
    }

    if (property_id) {
      query += ` AND property_id = ?`;
      params.push(property_id);
    }

    const [rows] = await connection.execute(query, params);

    if (property_id && rows.length === 0) {
      return res
        .status(404)
        .json({ error: "No Properties found for this Landlord" });
    }

    res.status(200).json(rows);
  } catch (error) {
    // Log the error message
    console.error("Error fetching property listings:", error);

    // Respond with an error message
    res.status(500).json({ error: "Failed to fetch property listings" });
  }
}

//Update Properties by ID
async function handlePutRequest(req, res, connection, id) {
  try {
    // Check if the property exists
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
      floorArea,
      bedSpacing,
      availBeds,
      petFriendly,
      numberOfUnit,
      minStay,
      secDeposit,
      advancedPayment,
      hasElectricity,
      hasWater,
      hasAssocDues,
      rentPayment,
      lateFee,
    } = req.body;

    console.log("Updating property with values:", req.body);

    const [result] = await connection.execute(
      `UPDATE Property SET
        property_name = ?, property_type = ?, amenities = ?, street = ?, brgy_district = ?,
        city = ?, zip_code = ?, province = ?, description = ?, floor_area = ?, bed_spacing = ?, avail_beds = ?, pet_friendly = ?, number_of_units = ?, min_stay = ?, sec_deposit = ?, advanced_payment = ?, has_electricity = ?, has_water = ?, has_assocdues = ?, rent_payment = ?, late_fee = ?, updated_at = CURRENT_TIMESTAMP
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
        propDesc,
        floorArea,
        bedSpacing,
        availBeds,
        petFriendly,
        numberOfUnit,
        minStay,
        secDeposit,
        advancedPayment,
        hasElectricity,
        hasWater,
        hasAssocDues,
        rentPayment,
        lateFee,
        id,
      ]
    );

    await connection.commit();
    console.log("Result: ", result);
    res.status(200).json({ propertyID: id, ...req.body });
  } catch (error) {
    await connection.rollback();
    // Log the error message
    console.error("Error updating property listing:", error);

    // Respond with an error message
    res.status(500).json({ error: "Failed to update property listing" });
  }
}

//Delete Properties by ID
async function handleDeleteRequest(req, res, connection, id) {
  try {
    // Check if the property exists
    const [rows] = await connection.execute(
      `SELECT * FROM Property WHERE property_id = ?`,
      [id]
    );
    if (rows.length === 0) {
      throw new Error("Property not found");
    }

    await connection.beginTransaction();

    await connection.execute(`DELETE FROM Property WHERE property_id = ?`, [
      id,
    ]);

    await connection.commit();
    res.status(200).json({ message: "Property listing deleted successfully" });
  } catch (error) {
    await connection.rollback();
    // Log the error message
    console.error("Error deleting property listings:", error);

    // Respond with an error message
    res.status(500).json({ error: "Failed to delete property listing" });
  }
}
