"use client";
import React, { useEffect, useState } from "react";
import { EyeIcon } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import LandlordLayout from "../../../../components/navigation/sidebar-landlord";
import useAuth from "../../../../../hooks/useSession";
import axios from "axios";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";

const MaintenanceRequestPage = () => {
  const router = useRouter();
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const initialTab = searchParams?.get("tab") || "pending";
  const [activeTab, setActiveTab] = useState(initialTab);
  const [requests, setRequests] = useState([]);
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentRequestId, setCurrentRequestId] = useState(null);

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const response = await axios.get(
          `/api/maintenance/getAllMaintenance?landlord_id=${user?.landlord_id}`
        );

        console.log(response.data);
        if (response.data.success) {
          setRequests(response.data.data);
        }
      } catch (error) {
        console.error("Error fetching maintenance requests:", error);
      }
    };

    fetchRequests();
  }, [user]);

  const updateStatus = async (request_id, newStatus, additionalData = {}) => {
    try {
      await axios.put("/api/maintenance/updateStatus", {
        request_id,
        status: newStatus,
        ...additionalData,
      });
      setRequests((prevRequests) =>
        prevRequests.map((req) =>
          req.request_id === request_id
            ? { ...req, status: newStatus, ...additionalData }
            : req
        )
      );
    } catch (error) {
      console.error("Error updating request status:", error);
    }
  };

  const handleStartClick = (request_id) => {
    setCurrentRequestId(request_id);

    setShowCalendar(true);
  };

  const handleScheduleConfirm = () => {
    if (currentRequestId) {
      updateStatus(currentRequestId, "in progress", {
        schedule_date: selectedDate.toISOString().split("T")[0],
      });

      setShowCalendar(false);

      setCurrentRequestId(null);
    }
  };

  const getActiveRequests = () =>
    requests.filter((req) => req.status.toLowerCase() === activeTab);

  return (
    <div className="p-6 w-full bg-gray-50">
      <h1 className="text-2xl font-bold text-blue-900">Maintenance Requests</h1>
      <div className="mb-6 border-b border-gray-200 bg-white rounded-t-lg flex">
        {["pending", "scheduled", "in progress", "completed"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`py-3 px-6 font-medium text-sm ${
              activeTab === tab
                ? "border-b-2 border-blue-500 text-blue-600"
                : "text-gray-500"
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)} Requests
          </button>
        ))}
      </div>

      <table className="min-w-full divide-y divide-gray-200 bg-white rounded-lg shadow">
        <thead className="bg-gray-50">
          <tr>
            {[
              "Name",
              "Property / Unit",
              "Category",
              "Date",
              "Photo",
              "Status",
              "Action",
            ].map((header) => (
              <th
                key={header}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {getActiveRequests().map((request) => (
            <tr key={request.request_id} className="hover:bg-gray-50">
              <td className="px-6 py-4 text-sm font-medium text-gray-900">
                {request.tenant_first_name} {request.tenant_last_name}
              </td>
              <td className="px-6 py-4 text-sm text-gray-500">
                {request.property_name} / {request.unit_name}
              </td>
              <td className="px-6 py-4 text-sm text-gray-500">
                {request.category}
              </td>
              <td className="px-6 py-4 text-sm text-gray-500">
                {new Date(request.created_at).toISOString().split("T")[0]}
              </td>
              <td className="px-6 py-4">
                {request.photo_url ? (
                  <a
                    href={request.photo_url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <img
                      src={request.photo_url}
                      alt="Maintenance"
                      className="h-10 w-10 rounded"
                    />
                  </a>
                ) : (
                  "No Photo"
                )}
              </td>
              <td className="px-6 py-4">
                <span className={`px-2 py-1 text-xs rounded-full bg-gray-200`}>
                  {request.status.toUpperCase()}
                </span>
              </td>
              <td className="px-6 py-4">
                {activeTab === "pending" && (
                  <button
                    onClick={() =>
                      updateStatus(request.request_id, "scheduled")
                    }
                    className="px-2 py-1 bg-green-500 text-white rounded-md"
                  >
                    Approve
                  </button>
                )}
                {activeTab === "scheduled" && (
                  <button
                    onClick={() => handleStartClick(request.request_id)}
                    className="px-2 py-1 bg-yellow-500 text-white rounded-md"
                  >
                    Start
                  </button>
                )}
                {activeTab === "in progress" && (
                  <button
                    onClick={() =>
                      updateStatus(request.request_id, "completed", {
                        completion_date: new Date().toISOString().split("T")[0],
                      })
                    }
                    className="px-2 py-1 bg-blue-500 text-white rounded-md"
                  >
                    Complete
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {showCalendar && (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-lg font-bold mb-4">Select Scheduled Date</h2>

            <Calendar onChange={setSelectedDate} value={selectedDate} />

            <div className="mt-4 flex justify-end">
              <button
                onClick={handleScheduleConfirm}
                className="px-4 py-2 bg-blue-500 text-white rounded-md mr-2"
              >
                Confirm
              </button>

              <button
                onClick={() => setShowCalendar(false)}
                className="px-4 py-2 bg-gray-500 text-white rounded-md"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const MaintenanceRequest = () => {
  return (
    <LandlordLayout>
      <MaintenanceRequestPage />
    </LandlordLayout>
  );
};

export default MaintenanceRequest;
