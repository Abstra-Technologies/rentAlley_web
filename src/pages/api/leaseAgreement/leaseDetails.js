import { db } from "../../../lib/db";

export default async function handler(req, res) {
  const { unit_id } = req.query;
  let connection;

  try {
    //Initialize DB Connection
    connection = await db.getConnection();
    if (req.method === "GET") {
      await handleGetRequest(req, res, connection, unit_id);
    } else if (req.method === "PUT") {
      await handlePutRequest(req, res, connection, unit_id);
    } else if (req.method === "DELETE") {
      await handleDeleteRequest(req, res, connection, unit_id);
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

// Retrieve prospective_tenant_id using unit_id
async function getProspectiveTenantId(connection, unit_id) {
  const [rows] = await connection.execute(
    "SELECT id FROM ProspectiveTenant WHERE unit_id = ?",
    [unit_id]
  );
  return rows.length > 0 ? rows[0].id : null;
}

//Get Lease by ID or All
async function handleGetRequest(req, res, connection, unit_id) {
  try {
    const prospectiveTenantId = await getProspectiveTenantId(
      connection,
      unit_id
    );

    if (!prospectiveTenantId) {
      return res
        .status(404)
        .json({ error: "No prospective tenant found for this unit" });
    }

    const [rows] = await connection.execute(
      "SELECT * FROM LeaseAgreement WHERE prospective_tenant_id = ?",
      [prospectiveTenantId]
    );

    res.status(200).json(rows);
  } catch (error) {
    // Log the error message
    console.error("Error fetching property/unit listings:", error);

    // Respond with an error message
    res.status(500).json({ error: "Failed to fetch property/unit listings" });
  }
}

// Update Lease by  unit_id
async function handlePutRequest(req, res, connection, unit_id) {
  try {
    const { start_date, end_date } = req.body;

    if (!start_date || !end_date) {
      return res
        .status(400)
        .json({ error: "Start date and end date are required" });
    }

    const prospectiveTenantId = await getProspectiveTenantId(
      connection,
      unit_id
    );

    if (!prospectiveTenantId) {
      return res
        .status(404)
        .json({ error: "No prospective tenant found for this unit" });
    }

    await connection.beginTransaction();

    const [result] = await connection.execute(
      `UPDATE LeaseAgreement SET start_date = ?, end_date = ?, status = 'active' WHERE prospective_tenant_id = ?`,
      [start_date, end_date, prospectiveTenantId]
    );
    await connection.commit();

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ error: "No lease agreement found to update" });
    }

    res
      .status(200)
      .json({ message: "Lease updated successfully", start_date, end_date });
  } catch (error) {
    await connection.rollback();
    console.error("Error updating lease:", error);
    res.status(500).json({ error: "Failed to update lease" });
  }
}

//Delete Lease by ID
async function handleDeleteRequest(req, res, connection, unit_id) {
  try {
    const prospectiveTenantId = await getProspectiveTenantId(
      connection,
      unit_id
    );

    if (!prospectiveTenantId) {
      return res
        .status(404)
        .json({ error: "No prospective tenant found for this unit" });
    }

    await connection.beginTransaction();

    const [deleteResult] = await connection.execute(
      `DELETE FROM LeaseAgreement WHERE prospective_tenant_id = ?`,
      [prospectiveTenantId]
    );

    await connection.commit();

    if (deleteResult.affectedRows === 0) {
      return res.status(404).json({ error: "Lease agreement not found" });
    }

    res.status(200).json({ message: "Lease Agreement deleted successfully" });
  } catch (error) {
    await connection.rollback();
    // Log the error message
    console.error("Error deleting lease agreement:", error);

    // Respond with an error message
    res.status(500).json({ error: "Failed to delete lease agreement" });
  }
}
