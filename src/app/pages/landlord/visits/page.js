"use client";
import { useState, useEffect } from "react";
import useAuth from "../../../../../hooks/useSession";
import axios from "axios";

export default function PropertyVisits() {
  const { user } = useAuth();
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedVisitId, setSelectedVisitId] = useState(null);
  const [disapprovalReason, setDisapprovalReason] = useState("");

  useEffect(() => {
    if (user?.landlord_id) {
      fetchVisits();
    }
  }, [user]);

  const fetchVisits = async () => {
    try {
      const response = await axios.get(
        `/api/landlord/visits/visit-all?landlord_id=${user.landlord_id}`
      );
      setVisits(response.data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching visits:", error);
      setLoading(false);
    }
  };

  const updateVisitStatus = async (visit_id, status, reason = "") => {
    try {
      await axios.put("/api/landlord/visits/respond", {
        visit_id,
        status,
        reason,
      });
      setVisits(
        visits.map((visit) =>
          visit.visit_id === visit_id
            ? { ...visit, status, disapproval_reason: reason }
            : visit
        )
      );
      setShowModal(false);
      setDisapprovalReason("");
    } catch (error) {
      console.error("Error updating visit status:", error);
    }
  };

  const handleDisapprove = (visit_id) => {
    setSelectedVisitId(visit_id);
    setShowModal(true);
  };

  if (loading) return <p>Loading visits...</p>;

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Property Visit Requests</h1>
      {visits.length === 0 ? (
        <p>No visit requests found.</p>
      ) : (
        <table className="min-w-full bg-white border border-gray-200">
          <thead>
            <tr className="bg-gray-100 border-b">
              <th className="p-2">Tenant</th>
              <th className="p-2">Property</th>
              <th className="p-2">Unit</th>
              <th className="p-2">Visit Date</th>
              <th className="p-2">Visit Time</th>
              <th className="p-2">Status</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {visits.map((visit) => (
              <tr key={visit.visit_id} className="border-b">
                <td className="p-2">
                  {visit.tenant_first_name} {visit.tenant_last_name}
                </td>
                <td className="p-2">{visit.property_name}</td>
                <td className="p-2">{visit.unit_name}</td>
                <td className="p-2">{visit.visit_date.split("T")[0]}</td>
                <td className="p-2">{visit.visit_time}</td>
                <td
                  className={`p-2 font-semibold ${
                    visit.status === "approved"
                      ? "text-green-600"
                      : visit.status === "disapproved"
                      ? "text-red-600"
                      : "text-gray-600"
                  }`}
                >
                  {visit.status}
                </td>
                <td className="p-2">
                  <button
                    onClick={() =>
                      updateVisitStatus(visit.visit_id, "approved")
                    }
                    className={`px-3 py-1 rounded mr-2 ${
                      visit.status !== "pending"
                        ? "bg-green-300 text-gray-700 cursor-not-allowed"
                        : "bg-green-500 text-white"
                    }`}
                    disabled={visit.status !== "pending"}
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleDisapprove(visit.visit_id)}
                    className={`px-3 py-1 rounded ${
                      visit.status !== "pending"
                        ? "bg-red-300 text-gray-700 cursor-not-allowed"
                        : "bg-red-500 text-white"
                    }`}
                    disabled={visit.status !== "pending"}
                  >
                    Disapprove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Disapproval Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
          <div className="bg-white p-6 rounded shadow-lg w-96">
            <h2 className="text-lg font-bold mb-4">
              Provide Disapproval Reason
            </h2>
            <textarea
              className="w-full p-2 border rounded"
              rows="4"
              value={disapprovalReason}
              onChange={(e) => setDisapprovalReason(e.target.value)}
              placeholder="Enter reason for disapproval..."
            ></textarea>
            <div className="flex justify-end mt-4">
              <button
                onClick={() => setShowModal(false)}
                className="bg-gray-300 text-black px-4 py-2 rounded mr-2"
              >
                Cancel
              </button>
              <button
                onClick={() =>
                  updateVisitStatus(
                    selectedVisitId,
                    "disapproved",
                    disapprovalReason
                  )
                }
                className="bg-red-500 text-white px-4 py-2 rounded"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
