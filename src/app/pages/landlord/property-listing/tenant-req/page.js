"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import { useSearchParams } from "next/navigation";

export default function InterestedTenants() {
  const searchParams = useSearchParams();
  const propertyId = searchParams.get("property_id"); // Correctly extract the parameter
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reason, setReason] = useState(""); // State for disapproval reason
  const [selectedTenantId, setSelectedTenantId] = useState(null); // Track selected tenant for disapproval

  // Fetch tenants from the API
  useEffect(() => {
    const fetchTenants = async () => {
      try {
        const response = await axios.get(
          `/api/landlord/prospective/interested-tenants?property_id=${propertyId}`
        );
        setTenants(response.data);
      } catch (err) {
        setError("Failed to load tenants.");
      } finally {
        setLoading(false);
      }
    };

    fetchTenants();
  }, [propertyId]);

  // Function to update tenant status (Approve/Disapprove)
  const updateTenantStatus = async (tenantId, status) => {
    try {
      const payload = {
        propertyId: propertyId,
        unitId: null,
        status,
        reason: status === "disapproved" ? reason : null,
      };

      await axios.put("/api/landlord/prospective/update-status", payload);

      // Update UI after success
      setTenants((prev) =>
        prev.map((tenant) =>
          tenant.id === tenantId ? { ...tenant, status } : tenant
        )
      );

      alert(`Tenant ${status} successfully!`);
      setReason("");
      setSelectedTenantId(null);
    } catch (error) {
      alert("Error updating status.");
    }
  };

  if (loading) return <p>Loading tenants...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div className="container mt-5">
      <h2>Interested Tenants</h2>
      <table className="table table-bordered">
        <thead>
          <tr>
            <th>Profile</th>
            <th>Name</th>
            <th>Email</th>
            <th>Phone</th>
            <th>Address</th>
            <th>Gov. ID</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {tenants.map((tenant) => (
            <tr key={tenant.id}>
              <td>
                <img
                  src={tenant.profilePicture}
                  alt="Profile"
                  width="50"
                  height="50"
                  className="rounded-circle"
                />
              </td>
              <td>
                {tenant.firstName} {tenant.lastName}
              </td>
              <td>{tenant.email}</td>
              <td>{tenant.phoneNumber}</td>
              <td>{tenant.current_home_address}</td>
              <td>
                <span
                  className={`badge ${
                    tenant.status === "approved"
                      ? "bg-success"
                      : tenant.status === "disapproved"
                      ? "bg-danger"
                      : "bg-warning"
                  }`}
                >
                  {tenant.status}
                </span>
              </td>
              <td>
                <a
                  href={tenant.government_id}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View ID
                </a>
              </td>
              <td>
                <button
                  className="btn btn-success btn-sm me-2"
                  onClick={() => updateTenantStatus(tenant.id, "approved")}
                >
                  Approve
                </button>

                <button
                  className="btn btn-danger btn-sm"
                  onClick={() => setSelectedTenantId(tenant.id)}
                >
                  Disapprove
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Disapproval Modal */}
      {selectedTenantId && (
        <div className="modal d-block" tabIndex="-1">
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Disapprove Tenant</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setSelectedTenantId(null)}
                ></button>
              </div>
              <div className="modal-body">
                <label>Reason for disapproval:</label>
                <textarea
                  className="form-control"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </div>
              <div className="modal-footer">
                <button
                  className="btn btn-secondary"
                  onClick={() => setSelectedTenantId(null)}
                >
                  Cancel
                </button>
                <button
                  className="btn btn-danger"
                  onClick={() =>
                    updateTenantStatus(selectedTenantId, "disapproved")
                  }
                  disabled={!reason.trim()}
                >
                  Disapprove
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
