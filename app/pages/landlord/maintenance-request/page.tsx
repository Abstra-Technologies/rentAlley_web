"use client";
import React, { useEffect, useState, Suspense } from "react";
import {
    EyeIcon,
    Calendar,
    Clock,
    CheckCircle,
    User,
    Home,
    Tag,
    Wrench,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import useAuthStore from "../../../../zustand/authStore";
import axios from "axios";
import useSubscription from "@/hooks/landlord/useSubscription";

// 🧩 Import modularized components
import { getStatusConfig } from "@/components/landlord/maintenance_management/getStatusConfig";
import MaintenanceCard from "@/components/landlord/maintenance_management/MaintenanceCard";
import MaintenanceDetailsModal from "@/components/landlord/maintenance_management/MaintenanceDetailsModal";
import MaintenanceCalendarModal from "@/components/landlord/maintenance_management/MaintenanceCalendarModal";

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
    const { user } = useAuthStore();
    const [activeTab, setActiveTab] = useState("pending");
    const [allRequests, setAllRequests] = useState([]);
    const [visibleRequests, setVisibleRequests] = useState([]);
    const [showCalendar, setShowCalendar] = useState(false);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [currentRequestId, setCurrentRequestId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);

    const landlordId = user?.landlord_id;
    const { subscription } = useSubscription(landlordId);
    const isLocked = !subscription;
    const tooltipMsg = "Upgrade your plan to manage maintenance requests.";

    // Fetch requests
    useEffect(() => {
        const fetchRequests = async () => {
            if (!landlordId) return;
            try {
                const response = await axios.get(
                    `/api/maintenance/getAllMaintenance?landlord_id=${landlordId}`
                );
                if (response.data.success) setAllRequests(response.data.data);
            } catch (error) {
                console.error("Error fetching maintenance requests:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchRequests();
    }, [landlordId]);

    // Limit by plan
    useEffect(() => {
        if (!allRequests.length || !subscription) return;

        const maxMaintenanceRequest =
            subscription?.listingLimits?.maxMaintenanceRequest ?? 5;

        const sorted = [...allRequests].sort(
            (a, b) => new Date(a.created_at) - new Date(b.created_at)
        );

        const visibleWithinLimit = sorted.slice(0, maxMaintenanceRequest);
        const visibleTabRequests = visibleWithinLimit.filter(
            (req) => req.status.toLowerCase() === activeTab
        );

        setVisibleRequests(visibleTabRequests);
    }, [allRequests, subscription, activeTab]);

    // 🔹 Update status
    const updateStatus = async (request_id, newStatus, additionalData = {}) => {
        if (isLocked) {
            alert(tooltipMsg);
            return;
        }
        try {
            await axios.put("/api/maintenance/updateStatus", {
                request_id,
                status: newStatus,
                ...additionalData,
                user_id: user?.user_id,
                landlord_id: landlordId,
            });

            setAllRequests((prev) =>
                prev.map((req) =>
                    req.request_id === request_id
                        ? { ...req, status: newStatus, ...additionalData }
                        : req
                )
            );
        } catch (error) {
            console.error("Error updating request:", error);
        }
    };

    const handleStartClick = (id) => {
        if (isLocked) return alert(tooltipMsg);
        setCurrentRequestId(id);
        setShowCalendar(true);
    };

    const handleScheduleConfirm = () => {
        if (!currentRequestId) return;
        updateStatus(currentRequestId, "in-progress", {
            schedule_date: selectedDate.toISOString().split("T")[0],
        });
        setShowCalendar(false);
        setCurrentRequestId(null);
    };

    const handleViewDetails = (req) => {
        setSelectedRequest(req);
        setShowModal(true);
    };

    // 🔹 Action Button (Pending = Start Work)
    const getActionButton = (request) => {
        if (isLocked) {
            return (
                <button
                    onClick={() => alert(tooltipMsg)}
                    disabled
                    title={tooltipMsg}
                    className="w-full sm:w-auto px-4 py-2 bg-gray-300 text-gray-600 rounded-lg text-sm font-medium cursor-not-allowed opacity-60"
                >
                    Locked
                </button>
            );
        }

        switch (activeTab) {
            case "pending":
            case "scheduled":
                return (
                    <button
                        onClick={() => handleStartClick(request.request_id)}
                        className="w-full sm:w-auto px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:shadow-lg transition-all text-sm font-medium"
                    >
                        Start Work
                    </button>
                );
            case "in-progress":
                return (
                    <button
                        onClick={() =>
                            updateStatus(request.request_id, "completed", {
                                completion_date: new Date().toISOString().split("T")[0],
                            })
                        }
                        className="w-full sm:w-auto px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:shadow-lg transition-all text-sm font-medium"
                    >
                        Complete
                    </button>
                );
            default:
                return null;
        }
    };

    // Tabs config
    const getTabConfig = (tab) => {
        const configs = {
            pending: { icon: Clock, color: "text-amber-600", count: 0 },
            scheduled: { icon: Calendar, color: "text-blue-600", count: 0 },
            "in-progress": { icon: Wrench, color: "text-purple-600", count: 0 },
            completed: { icon: CheckCircle, color: "text-emerald-600", count: 0 },
        };
        const statusCounts = allRequests.reduce((acc, req) => {
            const status = req.status.toLowerCase();
            acc[status] = (acc[status] || 0) + 1;
            return acc;
        }, {});
        const config = configs[tab] || {};
        config.count = statusCounts[tab] || 0;
        return config;
    };

    return (
        <Suspense fallback={<div>Loading...</div>}>
            <SearchParamsWrapper setActiveTab={setActiveTab} />
            <div className="min-h-screen bg-gray-50">
                <div className="px-4 pt-20 pb-24 sm:px-6 lg:px-8 md:pt-8 md:pb-8 max-w-7xl mx-auto">

                    {/* --- HEADER --- */}
                    <div className="mb-6 md:mb-8">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                            <div className="flex-1">
                                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                                    Maintenance Requests
                                </h1>
                                <p className="text-gray-600 mt-1 text-sm sm:text-base">
                                    Manage and track property maintenance
                                </p>
                            </div>

                            {/* Plan Info Card */}
                            <div className="bg-gradient-to-br from-blue-50 to-emerald-50 border border-blue-200 rounded-lg p-3 sm:p-4 max-w-sm">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="w-8 h-8 bg-gradient-to-br from-blue-100 to-emerald-100 rounded-lg flex items-center justify-center">
                                        <CheckCircle className="w-4 h-4 text-blue-600" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs text-gray-600">Current Plan</p>
                                        <p
                                            className={`font-bold text-sm truncate ${
                                                subscription ? "text-blue-700" : "text-red-600"
                                            }`}
                                        >
                                            {subscription?.plan_name || "No Active Plan"}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-gray-600">Request Limit:</span>
                                    <span className="font-semibold text-blue-700">
                    {subscription?.listingLimits?.maxMaintenanceRequest ?? 5}
                  </span>
                                </div>
                                {!subscription && (
                                    <div className="mt-2 pt-2 border-t border-blue-200">
                                        <p className="text-xs text-red-600 font-medium">
                                            ⚠️ Upgrade to manage requests
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* --- Stats Section --- */}
                        <div className="flex flex-wrap items-center gap-4 sm:gap-6 mt-4 text-sm">
                            {["pending", "scheduled", "in-progress", "completed"].map(
                                (tab) => {
                                    const config = getTabConfig(tab);
                                    return (
                                        <div
                                            key={tab}
                                            className="flex items-center gap-2 text-gray-600"
                                        >
                                            <div
                                                className={`w-2 h-2 rounded-full ${
                                                    tab === "pending"
                                                        ? "bg-amber-500"
                                                        : tab === "scheduled"
                                                            ? "bg-blue-500"
                                                            : tab === "in-progress"
                                                                ? "bg-purple-500"
                                                                : "bg-emerald-500"
                                                }`}
                                            ></div>
                                            <span>
                        <span className="font-semibold text-gray-900">
                          {config.count}
                        </span>{" "}
                                                {tab.replace("-", " ")}
                      </span>
                                        </div>
                                    );
                                }
                            )}
                        </div>
                    </div>

                    {/* --- TABS SECTION (UNCHANGED UI) --- */}
                    <div className="mb-6 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                        <div className="overflow-x-auto">
                            <div className="flex min-w-max">
                                {["pending", "scheduled", "in-progress", "completed"].map(
                                    (tab) => {
                                        const config = getTabConfig(tab);
                                        const IconComponent = config.icon;
                                        return (
                                            <button
                                                key={tab}
                                                onClick={() => setActiveTab(tab)}
                                                className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 sm:px-6 font-medium text-xs sm:text-sm whitespace-nowrap transition-all ${
                                                    activeTab === tab
                                                        ? "bg-gradient-to-br from-blue-50 to-emerald-50 border-b-2 border-blue-500 text-blue-700"
                                                        : "text-gray-600 hover:bg-gray-50"
                                                }`}
                                            >
                                                <IconComponent
                                                    className={`w-4 h-4 ${
                                                        activeTab === tab ? config.color : ""
                                                    }`}
                                                />
                                                <span className="capitalize">
                          {tab.replace("-", " ")}
                        </span>
                                                {config.count > 0 && (
                                                    <span
                                                        className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                                                            activeTab === tab
                                                                ? "bg-blue-600 text-white"
                                                                : "bg-gray-200 text-gray-700"
                                                        }`}
                                                    >
                            {config.count}
                          </span>
                                                )}
                                            </button>
                                        );
                                    }
                                )}
                            </div>
                        </div>
                    </div>

                    {/* --- MAIN CONTENT --- */}
                    {loading ? (
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                            <div className="w-12 h-12 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                            <p className="text-gray-600 text-sm">Loading requests...</p>
                        </div>
                    ) : visibleRequests.length === 0 ? (
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                            <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                {React.createElement(getTabConfig(activeTab).icon, {
                                    className: `w-8 h-8 ${getTabConfig(activeTab).color}`,
                                })}
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 mb-2">
                                No {activeTab.replace("-", " ")} requests
                            </h3>
                            <p className="text-sm text-gray-600">
                                There are no {activeTab} maintenance requests at this time.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {visibleRequests.map((request) => (
                                <MaintenanceCard
                                    key={request.request_id}
                                    request={request}
                                    getActionButton={getActionButton}
                                    setSelectedImage={setSelectedImage}
                                    handleViewDetails={handleViewDetails}
                                />
                            ))}
                        </div>
                    )}
                </div>

                {/* --- Calendar Modal --- */}
                {showCalendar && (
                    <MaintenanceCalendarModal
                        selectedDate={selectedDate}
                        setSelectedDate={setSelectedDate}
                        handleScheduleConfirm={handleScheduleConfirm}
                        onClose={() => setShowCalendar(false)}
                    />
                )}

                {/* --- Details Modal --- */}
                {showModal && selectedRequest && (
                    <MaintenanceDetailsModal
                        selectedRequest={selectedRequest}
                        onClose={() => setShowModal(false)}
                        onStart={() => {
                            setShowModal(false);
                            handleStartClick(selectedRequest.request_id);
                        }}
                        onComplete={() => {
                            setShowModal(false);
                            updateStatus(selectedRequest.request_id, "completed", {
                                completion_date: new Date().toISOString().split("T")[0],
                            });
                        }}
                        updateStatus={updateStatus}
                        isLocked={isLocked}
                    />
                )}

                {/* --- Image Lightbox (unchanged) --- */}
                {selectedImage && (
                    <div
                        className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
                        onClick={() => setSelectedImage(null)}
                    >
                        <button
                            className="absolute top-4 right-4 text-white bg-black bg-opacity-50 hover:bg-opacity-75 rounded-lg p-2 transition-colors"
                            onClick={() => setSelectedImage(null)}
                        >
                            <svg
                                className="w-6 h-6"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M6 18L18 6M6 6l12 12"
                                />
                            </svg>
                        </button>
                        <img
                            src={selectedImage}
                            alt="Enlarged maintenance photo"
                            className="max-h-[90vh] max-w-[90vw] object-contain rounded-lg"
                            onClick={(e) => e.stopPropagation()}
                        />
                    </div>
                )}
            </div>
        </Suspense>
    );
};

const MaintenanceRequest = () => <MaintenanceRequestPage />;

export default MaintenanceRequest;
