"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import useAuthStore from "../../../../zustand/authStore";
import Swal from "sweetalert2";
import LoadingScreen from "../../../../components/loadingScreen";

interface Announcement {
  id: string | number;
  subject: string;
  description: string;
  property: string;
  created_at?: string;
}

export default function AnnouncementsList() {
  const router = useRouter();
  const { fetchSession, user, admin } = useAuthStore();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedProperty, setSelectedProperty] = useState<string>("all");

  useEffect(() => {
    if (!user && !admin) {
      fetchSession();
    }
  }, [user, admin, fetchSession]);

  useEffect(() => {
    async function fetchAnnouncements() {
      try {
        const response = await fetch(
          `/api/landlord/announcement/getAllAnnouncements?landlord_id=${user?.landlord_id}`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch announcements");
        }

        const data = await response.json();
        setAnnouncements(data);
      } catch (error) {
        console.error("Error fetching announcements:", error);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "Unable to load announcements.",
          confirmButtonColor: "#3b82f6",
        });
      } finally {
        setLoading(false);
      }
    }

    if (user?.landlord_id) {
      fetchAnnouncements();
    }
  }, [user]);

  const handleCreate = () => {
    router.push(`/pages/landlord/announcement/create-announcement`);
  };

  const uniqueProperties: string[] = [
    ...new Set(announcements.map((ann) => ann.property)),
  ];

  const filteredAnnouncements = announcements.filter((announcement) => {
    const matchesSearch =
      announcement.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      announcement.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesProperty =
      selectedProperty === "all" || announcement.property === selectedProperty;
    return matchesSearch && matchesProperty;
  });

  const formatDate = (dateString?: string): string => {
    if (!dateString) return "No date";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-50">
        <LoadingScreen message="Loading announcements..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile: pt-20 for top navbar + pb-24 for bottom nav | Desktop: normal padding */}
      <div className="px-4 pt-20 pb-24 sm:px-6 lg:px-8 md:pt-8 md:pb-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                Announcements
              </h1>
              <p className="text-gray-600 mt-1 text-sm sm:text-base">
                Manage and share updates with your tenants
              </p>
            </div>
            <button
              onClick={handleCreate}
              className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-emerald-600 text-white px-6 py-2.5 rounded-lg hover:shadow-lg transition-shadow flex items-center justify-center gap-2 font-medium"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              <span>Create Announcement</span>
            </button>
          </div>

          {/* Stats */}
          <div className="flex flex-wrap items-center gap-4 sm:gap-6 mt-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-500"></div>
              <span className="text-gray-600">
                <span className="font-semibold text-gray-900">
                  {announcements.length}
                </span>{" "}
                Total
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
              <span className="text-gray-600">
                <span className="font-semibold text-gray-900">
                  {uniqueProperties.length}
                </span>{" "}
                Properties
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-cyan-500"></div>
              <span className="text-gray-600">
                <span className="font-semibold text-gray-900">
                  {filteredAnnouncements.length}
                </span>{" "}
                Showing
              </span>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg
                  className="w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search announcements..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm sm:text-base"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  <svg
                    className="w-5 h-5"
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
              )}
            </div>

            {/* Property Filter */}
            <div className="sm:w-64">
              <select
                value={selectedProperty}
                onChange={(e) => setSelectedProperty(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm sm:text-base"
              >
                <option value="all">All Properties</option>
                {uniqueProperties.map((property) => (
                  <option key={property} value={property}>
                    {property}
                  </option>
                ))}
              </select>
            </div>

            {/* Clear Filters */}
            {(searchTerm || selectedProperty !== "all") && (
              <button
                onClick={() => {
                  setSearchTerm("");
                  setSelectedProperty("all");
                }}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        {filteredAnnouncements.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-8 sm:p-12 text-center">
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-blue-100 to-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 sm:w-10 sm:h-10 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">
                {searchTerm || selectedProperty !== "all"
                  ? "No matching announcements"
                  : "No announcements yet"}
              </h3>
              <p className="text-gray-600 mb-6 text-sm sm:text-base">
                {searchTerm || selectedProperty !== "all"
                  ? "Try adjusting your filters."
                  : "Get started by creating your first announcement."}
              </p>
              {!searchTerm && selectedProperty === "all" && (
                <button
                  onClick={handleCreate}
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-emerald-600 text-white rounded-lg hover:shadow-lg transition-shadow font-medium"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  Create Your First Announcement
                </button>
              )}
            </div>
          </div>
        ) : (
          /* Grid View */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {filteredAnnouncements.map((announcement) => (
              <Link
                key={announcement.id}
                href={`/pages/landlord/announcement/${announcement.id}`}
                className="group bg-white border border-gray-200 rounded-lg shadow-sm p-5 hover:border-blue-300 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <span className="inline-flex items-center px-2.5 py-1 bg-gradient-to-r from-blue-50 to-emerald-50 text-blue-700 rounded-md text-xs font-medium border border-blue-100">
                    {announcement.property}
                  </span>
                  {announcement.created_at && (
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <svg
                        className="w-3.5 h-3.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      {formatDate(announcement.created_at)}
                    </span>
                  )}
                </div>
                <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
                  {announcement.subject}
                </h3>
                <p className="text-sm text-gray-600 line-clamp-2 sm:line-clamp-3 mb-3">
                  {announcement.description}
                </p>
                <div className="flex items-center text-sm font-medium text-blue-600 group-hover:gap-2 gap-1 transition-all">
                  View details
                  <svg
                    className="w-4 h-4 group-hover:translate-x-1 transition-transform"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
