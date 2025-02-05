import { db } from "../../lib/db";

async function getLandlordIdFromUserID(userID, connection) {
  try {
    if (!userID) {
      throw new Error("Invalid user ID provided");
    }

    // Query the landlords table to get the landlord_id based on email
    const [rows] = await connection.execute(
      `SELECT landlord_id FROM landlords WHERE userID = ?`,
      [userID]
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
      await handleGetRequest(req, res, connection, id);
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
  // Destructure the request body to get the property details
  const {
    userID,
    propertyName,
    propDesc,
    floorArea,
    propertyType,
    amenities,
    bedSpacing,
    availBeds,
    petFriendly,
    unit,
    street,
    brgyDistrict,
    city,
    zipCode,
    province,
    minStay,
    secDeposit,
    advancedPayment,
    furnish,
    propertyStatus,
  } = req.body;

  // Ensure userID is not undefined
  if (!userID) {
    return res.status(400).json({ error: "userID is required" });
  }

  try {
    // Retrieve landlord_id using userID
    const landlord_id = await getLandlordIdFromUserID(userID, connection);

    if (!landlord_id) {
      return res.status(400).json({ error: "User does not exist" });
    }

    const values = [
      landlord_id, // landlord_id
      propertyName || null, // propertyName
      propDesc || null, // propDesc
      floorArea || null, // floorArea
      propertyType || null, // propertyType
      amenities || null, // amenities
      bedSpacing || null, // bedSpacing
      availBeds || null, // availBeds
      petFriendly || null, // petFriendly
      unit || null, // unit
      street || null, // street
      parseInt(brgyDistrict) || null, // brgyDistrict (as integer)
      city || null, // city
      zipCode || null, // zipCode
      province || null, // province
      minStay || null, // minStay
      secDeposit || null, // secDeposit
      advancedPayment || null, // advancedPayment
      furnish || null, // furnish (should be a valid enum string)
      propertyStatus || "unoccupied", // propertyStatus (default to 'unoccupied')
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
        prop_desc,
        floor_area,
        property_type,
        amenities,
        bed_spacing,
        avail_beds,
        pet_friendly,
        unit,
        street,
        brgy_district,
        city,
        zip_code,
        province,
        min_stay,
        sec_deposit,
        advanced_payment,
        furnish,
        property_status
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
async function handleGetRequest(req, res, connection, id) {
  try {
    let query = `SELECT * FROM Property`;
    let params = [];

    // If an ID is provided, add it to the query
    if (id) {
      query += ` WHERE property_id = ?`;
      params.push(id);
    }

    const [rows] = await connection.execute(query, params);

    if (id && rows.length === 0) {
      throw new Error("Property not found");
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
  const {
    landlord_id,
    propertyName,
    propDesc,
    floorArea,
    propertyType,
    amenities,
    bedSpacing,
    availBeds,
    petFriendly,
    unit,
    street,
    brgyDistrict,
    city,
    zipCode,
    province,
    minStay,
    secDeposit,
    advancedPayment,
    furnish,
    propertyVerificationStatus,
  } = req.body;

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

    const [result] = await connection.execute(
      `UPDATE Property SET
          landlord_id = ?, propertyName = ?, propDesc = ?, floorArea = ?, propertyType = ?, amenities = ?,
          bedSpacing = ?, availBeds = ?, petFriendly = ?, unit = ?, street = ?, brgyDistrict = ?, city = ?, zipCode = ?,
          province = ?, minStay = ?, secDeposit = ?, advancedPayment = ?, furnish = ?, propertyVerificationStatus = ?, updatedAt = CURRENT_TIMESTAMP
        WHERE propertyID = ?`,
      [
        landlord_id,
        propertyName,
        propDesc,
        floorArea,
        propertyType,
        amenities,
        bedSpacing,
        availBeds,
        petFriendly,
        unit,
        street,
        brgyDistrict,
        city,
        zipCode,
        province,
        minStay,
        secDeposit,
        advancedPayment,
        furnish,
        propertyVerificationStatus,
        id,
      ]
    );

    await connection.commit();
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
