// import { db } from "../../../lib/db";
// import { decryptData } from "../../../crypto/encrypt";

// export default async function handler(req, res) {
//   if (req.method !== "GET")
//     return res.status(405).json({ message: "Method Not Allowed" });

//   const { landlord_id } = req.query;
//   console.log("landlord_id:", landlord_id);
//   if (!landlord_id) {
//     return res.status(400).json({ message: "Missing landlord_id" });
//   }

//   try {
//     const [requests] = await db.query(
//       `SELECT 
//           pv.visit_id,
//                 u.user_id,
//                 u.firstName AS encrypted_first_name,
//                 u.lastName AS encrypted_last_name,
//                 p.property_name,
//                 COALESCE(un.unit_name, 'N/A') AS unit_name,
//                 pv.visit_date,
//                 pv.visit_time
//       FROM PropertyVisit pv
//       JOIN Tenant t ON pv.tenant_id = t.tenant_id
//       JOIN User u ON t.user_id = u.user_id
//       JOIN Property p ON pv.property_id = p.property_id
//       LEFT JOIN Unit un ON pv.unit_id = un.unit_id
//       WHERE p.landlord_id = ?;`,
//       [landlord_id]
      
//     );

//     // Decrypt first and last names
//     const decryptedRequests = requests.map((request) => {
//       let tenantFirstName = "N/A";
//       let tenantLastName = "N/A";

//       try {
//         tenantFirstName = decryptData(
//           JSON.parse(request.tenant_first_name),
//           process.env.ENCRYPTION_SECRET
//         );
//       } catch (err) {
//         console.error("Error decrypting first name:", err);
//       }

//       try {
//         tenantLastName = decryptData(
//           JSON.parse(request.tenant_last_name),
//           process.env.ENCRYPTION_SECRET
//         );
//       } catch (err) {
//         console.error("Error decrypting last name:", err);
//       }

//       return {
//         ...request,
//         tenant_first_name: tenantFirstName,
//         tenant_last_name: tenantLastName,
//       };
//     });

//     // Return decrypted data
//     res.status(200).json(decryptedRequests);
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: "Server error." });
//   }
// }



// import { db } from "../../../lib/db";
// import { decryptData } from "../../../crypto/encrypt";

// export default async function handler(req, res) {
//   if (req.method !== "GET")
//     return res.status(405).json({ message: "Method Not Allowed" });

//   const { landlord_id } = req.query;
//   console.log("landlord_id:", landlord_id);
//   if (!landlord_id) {
//     return res.status(400).json({ message: "Missing landlord_id" });
//   }

//   try {
//     const [requests] = await db.query(
//       `SELECT
//           pv.visit_id,
//           u.user_id,
//           u.firstName AS encrypted_first_name,
//           u.lastName AS encrypted_last_name,
//           p.property_name,
//           COALESCE(un.unit_name, 'N/A') AS unit_name,
//           pv.visit_date,
//           pv.visit_time,
//           pv.status
//       FROM PropertyVisit pv
//       JOIN Tenant t ON pv.tenant_id = t.tenant_id
//       JOIN User u ON t.user_id = u.user_id
//       JOIN Property p ON pv.property_id = p.property_id
//       LEFT JOIN Unit un ON pv.unit_id = un.unit_id
//       WHERE p.landlord_id = ?;`,
//       [landlord_id]
//     );

//     // Decrypt first and last names
//     const decryptedRequests = requests.map((request) => {
//       let tenantFirstName = "N/A";
//       let tenantLastName = "N/A";

//       try {
//         tenantFirstName = decryptData(
//           JSON.parse(request.encrypted_first_name),
//           process.env.ENCRYPTION_SECRET
//         );
//       } catch (err) {
//         console.error("Error decrypting first name:", err);
//       }

//       try {
//         tenantLastName = decryptData(
//           JSON.parse(request.encrypted_last_name),
//           process.env.ENCRYPTION_SECRET
//         );
//       } catch (err) {
//         console.error("Error decrypting last name:", err);
//       }

//       return {
//         ...request,
//         tenant_first_name: tenantFirstName,
//         tenant_last_name: tenantLastName,
//       };
//     });

//     // Return array directly to match frontend expectations
//     res.status(200).json(decryptedRequests);
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: "Server error." });
//   }
// }


// file: /pages/api/landlord/visits/visit-all.js

import { db } from "../../../../lib/db";
import { decryptData } from "../../../../crypto/encrypt";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const { landlord_id } = req.query;
  let queryString;
  let queryParams = [];

  try {
    // Dynamic query based on whether landlord_id is provided
    if (landlord_id) {
      queryString = `
        SELECT
            pv.visit_id,
            u.user_id,
            u.firstName AS encrypted_first_name,
            u.lastName AS encrypted_last_name,
            COALESCE(p.property_name, p2.property_name, 'N/A') AS property_name,
            COALESCE(un.unit_name, 'N/A') AS unit_name,
            pv.visit_date,
            pv.visit_time,
            pv.status,
            pv.disapproval_reason
        FROM PropertyVisit pv
        JOIN Tenant t ON pv.tenant_id = t.tenant_id
        JOIN User u ON t.user_id = u.user_id
        LEFT JOIN Property p ON pv.property_id = p.property_id
        LEFT JOIN Unit un ON pv.unit_id = un.unit_id
        LEFT JOIN Property p2 ON un.property_id = p2.property_id
        WHERE (p.landlord_id = ? OR p2.landlord_id = ?)
        ORDER BY pv.visit_date ASC, pv.visit_time ASC;`;
            
      queryParams = [landlord_id, landlord_id];
    } else {
        queryString = `
        SELECT
            pv.visit_id,
            u.user_id,
            u.firstName AS encrypted_first_name,
            u.lastName AS encrypted_last_name,
            COALESCE(p.property_name, p2.property_name, 'N/A') AS property_name,
            COALESCE(un.unit_name, 'N/A') AS unit_name,
            pv.visit_date,
            pv.visit_time,
            pv.status,
            pv.disapproval_reason
        FROM PropertyVisit pv
        JOIN Tenant t ON pv.tenant_id = t.tenant_id
        JOIN User u ON t.user_id = u.user_id
        LEFT JOIN Property p ON pv.property_id = p.property_id
        LEFT JOIN Unit un ON pv.unit_id = un.unit_id
        LEFT JOIN Property p2 ON un.property_id = p2.property_id
        ORDER BY pv.visit_date ASC, pv.visit_time ASC;`;
    }
        
    const [requests] = await db.query(queryString, queryParams);

    // Decrypt first and last names
    const decryptedRequests = requests.map((request) => {
      let tenantFirstName = "N/A";
      let tenantLastName = "N/A";
      
      try {
        tenantFirstName = decryptData(
          JSON.parse(request.encrypted_first_name),
          process.env.ENCRYPTION_SECRET
        );
      } catch (err) {
        console.error("Error decrypting first name:", err);
      }
      
      try {
        tenantLastName = decryptData(
          JSON.parse(request.encrypted_last_name),
          process.env.ENCRYPTION_SECRET
        );
      } catch (err) {
        console.error("Error decrypting last name:", err);
      }
      
      return {
        ...request,
        tenant_first_name: tenantFirstName,
        tenant_last_name: tenantLastName,
        status: request.status,
        disapproval_reason: request.disapproval_reason
      };
    });

    res.status(200).json(decryptedRequests);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error." });
  }
}
