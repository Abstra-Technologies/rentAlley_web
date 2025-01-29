import { db } from "../../lib/db";

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
    landlord_id,
    propertyName,
    propertyDesc,
    floorArea,
    propertyType,
    amenities,
    bedSpacing,
    availBeds,
    petFriendly,
    street,
    brgyDistrict,
    city,
    zipCode,
    province,
    minStay,
    secDeposit,
    advancedPayment,
    furnish,
    landlordVerificationStatus,
    propertyVerificationStatus,
    adminNotes,
  } = req.body;

  try {
    // Start a new transaction
    await connection.beginTransaction();

    // Execute the SQL query to insert a new property listing
    const [result] = await connection.execute(
      `INSERT INTO Property (
          landlord_id, propertyName, propertyDesc, floorArea, propertyType, amenities,
          bedSpacing, availBeds, petFriendly, street, brgyDistrict, city, zipCode,
          province, minStay, secDeposit, advancedPayment, furnish, landlordVerificationStatus,
          propertyVerificationStatus, adminNotes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        landlord_id,
        propertyName,
        propertyDesc,
        floorArea,
        propertyType,
        amenities,
        bedSpacing,
        availBeds,
        petFriendly,
        street,
        brgyDistrict,
        city,
        zipCode,
        province,
        minStay,
        secDeposit,
        advancedPayment,
        furnish,
        landlordVerificationStatus,
        propertyVerificationStatus,
        adminNotes,
      ]
    );

    // Commit the transaction
    await connection.commit();

    // Respond with the newly created property ID and the request body
    res.status(201).json({ propertyID: result.propertyID, ...req.body });
  } catch (error) {
    // Rollback the transaction in case of an error
    await connection.rollback();

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
      query += ` WHERE propertyID = ?`;
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
    propertyDesc,
    floorArea,
    propertyType,
    amenities,
    bedSpacing,
    availBeds,
    petFriendly,
    street,
    brgyDistrict,
    city,
    zipCode,
    province,
    minStay,
    secDeposit,
    advancedPayment,
    furnish,
    landlordVerificationStatus,
    propertyVerificationStatus,
    adminNotes,
  } = req.body;

  try {
    // Check if the property exists
    const [rows] = await connection.execute(
      `SELECT * FROM Property WHERE propertyID = ?`,
      [id]
    );
    if (rows.length === 0) {
      throw new Error("Property not found");
    }

    await connection.beginTransaction();

    await connection.execute(
      `UPDATE Property SET
          landlord_id = ?, propertyName = ?, propertyDesc = ?, floorArea = ?, propertyType = ?, amenities = ?,
          bedSpacing = ?, availBeds = ?, petFriendly = ?, street = ?, brgyDistrict = ?, city = ?, zipCode = ?,
          province = ?, minStay = ?, secDeposit = ?, advancedPayment = ?, furnish = ?, landlordVerificationStatus = ?,
          propertyVerificationStatus = ?, adminNotes = ?
        WHERE propertyID = ?`,
      [
        landlord_id,
        propertyName,
        propertyDesc,
        floorArea,
        propertyType,
        amenities,
        bedSpacing,
        availBeds,
        petFriendly,
        street,
        brgyDistrict,
        city,
        zipCode,
        province,
        minStay,
        secDeposit,
        advancedPayment,
        furnish,
        landlordVerificationStatus,
        propertyVerificationStatus,
        adminNotes,
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
      `SELECT * FROM Property WHERE propertyID = ?`,
      [id]
    );
    if (rows.length === 0) {
      throw new Error("Property not found");
    }

    await connection.beginTransaction();

    await connection.execute(`DELETE FROM Property WHERE propertyID = ?`, [id]);

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
