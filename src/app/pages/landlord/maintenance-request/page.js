"use client";
import React, { useEffect, useState, Suspense } from "react";
import { EyeIcon } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import LandlordLayout from "../../../../components/navigation/sidebar-landlord";
import useAuth from "../../../../../hooks/useSession";
import axios from "axios";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";

// ✅ Wrap useSearchParams() in a Suspense component
const SearchParamsWrapper = ({ setActiveTab }) => {
  const searchParams = useSearchParams();
  const initialTab = searchParams?.get("tab") || "pending";

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab, setActiveTab]);

  return null;
};

const MaintenanceRequestPage = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("pending"); // Default state
  const [requests, setRequests] = useState([]);
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentRequestId, setCurrentRequestId] = useState(null);
  const [fetchingSubscription, setFetchingSubscription] = useState(true);
  const [subscription, setSubscription] = useState(null);

  // ✅ Suspense wrapper ensures hydration works correctly
  return (
      <Suspense fallback={<div>Loading...</div>}>
        <SearchParamsWrapper setActiveTab={setActiveTab} />
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

          {/* ✅ The rest of your page remains unchanged */}
        </div>
      </Suspense>
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
