import { db } from "../../../lib/db";

export default async function handler(req, res) {
  const { id } = req.query;
  let connection;

  try {
    connection = await db.getConnection();
    if (req.method === "POST") {
      await handlePostRequest(req, res, connection);
    } else if (req.method === "GET") {
      const { property_id, unit_id } = req.query;
      await handleGetRequest(req, res, connection, property_id, unit_id);
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

//Create Units
async function handlePostRequest(req, res, connection) {
  // Destructure the request body to get the unit details
  const {
    property_id,
    unitName,
    unitSize,
    bedSpacing,
    availBeds,
    rentAmt,
    furnish,
    secDeposit,
    advancedPayment,
    status,
  } = req.body;

  if (!property_id) {
    return res.status(400).json({ error: "property id is required" });
  }

  try {
    const values = [
      property_id,
      unitName,
      unitSize,
      bedSpacing,
      availBeds,
      rentAmt,
      furnish,
      secDeposit,
      advancedPayment,
      status || "unoccupied",
    ];

    console.log("Values array:", values);

    await connection.beginTransaction();

    const [result] = await connection.execute(
      `INSERT INTO Unit 
      (property_id, unit_name, unit_size, bed_spacing, avail_beds, rent_amount, furnish, sec_deposit, advanced_payment, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      values
    );

    await connection.commit();

    // Respond with the newly created property ID and the request body
    res.status(201).json({ unitId: result.insertId, ...req.body });
  } catch (error) {
    // Rollback the transaction in case of an error
    await connection.rollback();

    // Log the error message
    console.error("Error creating unit listings:", error);

    // Respond with an error message
    res.status(500).json({ error: "Failed to create unit listing" });
  }
}

//Get Units by ID or All
async function handleGetRequest(req, res, connection, property_id, unit_id) {
  try {
    let query = `SELECT * FROM Unit WHERE 1=1`; // Ensures base query is always valid
    let params = [];

    // If an ID is provided, add it to the query
    if (unit_id) {
      query += ` AND unit_id = ?`;
      params.push(unit_id);
    }

    if (property_id) {
      query += ` AND property_id = ?`;
      params.push(property_id);
    }

    const [rows] = await connection.execute(query, params);

    if (unit_id && rows.length === 0) {
      return res
        .status(404)
        .json({ error: "No Units found for this Property" });
    }

    res.status(200).json(rows);
  } catch (error) {
    // Log the error message
    console.error("Error fetching unit listings:", error);

    // Respond with an error message
    res.status(500).json({ error: "Failed to fetch unit listings" });
  }
}

//Update Units by ID
async function handlePutRequest(req, res, connection, id) {
  try {
    // Check if the property exists
    const [rows] = await connection.execute(
      `SELECT * FROM Unit WHERE unit_id = ?`,
      [id]
    );
    if (rows.length === 0) {
      throw new Error("Unit not found");
    }

    await connection.beginTransaction();

    // Replace undefined values with null
    Object.keys(req.body).forEach((key) => {
      if (req.body[key] === undefined) {
        req.body[key] = null;
      }
    });

    const {
      unitName,
      unitSize,
      bedSpacing,
      availBeds,
      rentAmt,
      furnish,
      secDeposit,
      advancedPayment,
      status,
    } = req.body;

    console.log("Updating unit with values:", req.body);

    const [result] = await connection.execute(
      `UPDATE Unit SET
          unit_name = ?, unit_size = ?, bed_spacing = ?,
          avail_beds = ?, rent_amount = ?, furnish = ?,  status = ?, sec_deposit = ?, advanced_payment = ?, updated_at = CURRENT_TIMESTAMP
        WHERE unit_id = ?`,
      [
        unitName,
        unitSize,
        bedSpacing,
        availBeds,
        rentAmt,
        furnish,
        status ?? "unoccupied",
        secDeposit,
        advancedPayment,
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

//Delete Units by ID
async function handleDeleteRequest(req, res, connection, id) {
  try {
    console.log("Deleting unit with ID:", id);

    if (!id) {
      return res.status(400).json({ error: "Unit ID is required" });
    }

    const [rows] = await connection.execute(
      `SELECT * FROM Unit WHERE unit_id = ?`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Unit not found" });
    }

    const [activeLeases] = await connection.execute(
      `SELECT agreement_id FROM LeaseAgreement WHERE unit_id = ? AND status = 'active'`,
      [id]
    );

    if (activeLeases.length > 0) {
      return res.status(400).json({
        error: "Cannot delete unit with active lease agreement",
      });
    }

    await connection.beginTransaction();
    await connection.execute(`DELETE FROM Unit WHERE unit_id = ?`, [id]);
    await connection.commit();
    res.status(200).json({ message: "Unit listing deleted successfully" });
  } catch (error) {
    await connection.rollback();
    console.error("Error deleting unit listing:", error);
    res.status(500).json({ error: "Failed to delete unit listing" });
  }
}
