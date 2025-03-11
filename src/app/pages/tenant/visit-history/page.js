"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import useAuth from "../../../../../hooks/useSession";
import Swal from "sweetalert2";
import SideNavProfile from "../../../../components/navigation/sidebar-profile";

const PropertyVisits = () => {
  const { user } = useAuth();
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.tenant_id) return;

    const fetchVisits = async () => {
      try {
        const response = await axios.get(
          `/api/tenant/visits/getVisit?tenant_id=${user.tenant_id}`
        );
        setVisits(response.data);
      } catch (error) {
        console.error("Error fetching visits:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchVisits();
  }, [user]);

  const handleCancelVisit = async (visitId) => {
    const confirmResult = await Swal.fire({
      title: "Are you sure?",
      text: "Do you really want to cancel this visit?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, cancel it!",
    });
    if (confirmResult.isConfirmed) {
      try {
        await axios.put("/api/tenant/visits/cancel-visit", {
          visit_id: visitId,
        });

        
        setVisits((prevVisits) =>
          prevVisits.map((visit) =>
            visit.visit_id === visitId
              ? { ...visit, status: "cancelled" }
              : visit
          )
        );

        Swal.fire({
          title: "Cancelled!",
          text: "Your visit has been cancelled.",
          icon: "success",
          confirmButtonColor: "#3085d6",
        });
      } catch (error) {
        console.error("Error cancelling visit:", error);
        Swal.fire(
          "Error",
          "Failed to cancel the visit. Try again later.",
          "error"
        );
      }
    }
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen">
      <SideNavProfile />
      <div className="flex-grow p-6 md:pl-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-blue-600 mb-2">
            Scheduled Property Visits
          </h2>
          <p className="text-gray-600">
            View and manage your scheduled property visits.
          </p>
        </div>
  
        {loading ? (
          <p className="text-gray-500">Loading scheduled visits...</p>
        ) : visits.length === 0 ? (
          <p className="text-gray-500 text-center font-semibold">
            You have no scheduled property visits.
          </p>
        ) : (
          <div className="space-y-4">
            {visits.map((visit) => (
              <div
                key={visit?.visit_id}
                className="bg-white shadow-md rounded-lg overflow-hidden flex items-center justify-between p-4"
              >
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">
                    {visit?.property_name} - {visit?.unit_name}
                  </h3>
                  <p className="text-gray-600">
                    Date: {visit?.visit_date}, Time: {visit?.visit_time}
                  </p>
                  {visit?.disapproval_reason && (
                    <p className="text-gray-500">
                      Reason: {visit?.disapproval_reason}
                    </p>
                  )}
                  <p className="text-gray-500">Status: {visit?.status}</p>
                </div>
  
                {visit?.status === "pending" && (
                  <button
                    onClick={() => handleCancelVisit(visit?.visit_id)}
                    className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition"
                  >
                    Cancel
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PropertyVisits;
