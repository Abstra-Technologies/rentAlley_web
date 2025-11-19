"use client";

import { useEffect, useState } from "react";
import {
  DocumentIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ExclamationCircleIcon,
  ArrowRightIcon,
} from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";
import axios from "axios";
import LoadingScreen from "@/components/loadingScreen";

type Application = {
  id: number;
  unit_id: number | null;
  unit_name?: string;
  valid_id: string;
  proof_of_income?: string;
  message?: string;
  status: "pending" | "approved" | "disapproved";
  created_at: string;
  updated_at: string;
  property_name?: string;
  proceeded?: "yes" | "no";
};

export default function MyApplications({ tenantId }: { tenantId: number }) {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [processingId, setProcessingId] = useState<number | null>(null);
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        const res = await fetch(
          `/api/tenant/applications/listofApplications?tenantId=${tenantId}`
        );
        const result = await res.json();

        if (!res.ok) {
          throw new Error(result.message || "Failed to fetch applications.");
        }

        if (Array.isArray(result)) {
          setApplications(result);
        } else if (Array.isArray(result.applications)) {
          setApplications(result.applications);
        } else {
          throw new Error("Unexpected response format.");
        }
      } catch (err: any) {
        setError(err.message || "Something went wrong");
      } finally {
        setLoading(false);
      }
    };

    if (tenantId) {
      fetchApplications();
    } else {
      router.push("/tenant/login");
    }
  }, [tenantId, router]);

  const handleTenantDecision = async (
    applicationId: number,
    decision: "yes" | "no"
  ) => {
    try {
      setProcessingId(applicationId);
      await axios.post(
        `/api/tenant/applications/applicationDecision/${applicationId}/proceed`,
        { decision }
      );
      setApplications((prev) =>
        prev.map((a) =>
          a.id === applicationId ? { ...a, proceeded: decision } : a
        )
      );
    } catch (error) {
      console.error("Failed to update tenant decision", error);
      alert("Something went wrong. Please try again.");
    } finally {
      setProcessingId(null);
    }
  };

  const paginatedApps = applications.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );
  const totalPages = Math.ceil(applications.length / pageSize);

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/0 w-full">
        <LoadingScreen message="Just a moment, getting your applications ready..." />
      </div>
    );
  }

  return (
    <div className="px-3 sm:px-4 lg:px-8 py-4 sm:py-6">
      {/* Header */}
      <header className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-md">
          <DocumentIcon className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
            My Applications
          </h1>
          <p className="text-xs sm:text-sm text-gray-600">
            Track and manage your rental applications
          </p>
        </div>
      </header>

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex gap-2 items-center mb-6">
          <ExclamationCircleIcon className="w-5 h-5 text-red-600" />
          {error}
        </div>
      )}

      {/* Empty */}
      {!error && applications.length === 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-8 text-center shadow-sm">
          <DocumentIcon className="w-10 h-10 text-gray-400 mx-auto mb-3" />
          <h3 className="font-semibold text-gray-800">No Applications Yet</h3>
          <p className="text-sm text-gray-600 mt-1 mb-5">
            Browse available properties to start your first application.
          </p>
          <button
            onClick={() => router.push("/pages/tenant/my-unit")}
            className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-emerald-600 text-white rounded-lg font-medium text-sm hover:opacity-90"
          >
            Browse Properties
          </button>
        </div>
      )}

      {/* Applications List */}
      {applications.length > 0 && (
        <div className="divide-y divide-gray-200 bg-white border border-gray-200 rounded-lg shadow-sm mb-6">
          {paginatedApps.map((app) => (
            <div
              key={app.id}
              className="p-3 sm:p-4 hover:bg-gray-50 transition-all"
            >
              {/* Top Section */}
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-2">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 text-sm sm:text-base">
                    {app.property_name || "Property"}
                  </h3>

                  {app.unit_name && (
                    <p className="text-xs sm:text-sm text-gray-600 font-medium">
                      Unit:{" "}
                      <span className="text-gray-900">{app.unit_name}</span>
                    </p>
                  )}

                  <p className="text-xs text-gray-500 mt-1">
                    Applied on{" "}
                    {new Date(app.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {getStatusIcon(app.status)}
                  <span
                    className={`text-xs font-semibold ${
                      app.status === "approved"
                        ? "text-emerald-700"
                        : app.status === "disapproved"
                        ? "text-red-700"
                        : "text-amber-700"
                    }`}
                  >
                    {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                  </span>
                </div>
              </div>

              {/* Message */}
              {app.message && (
                <p className="text-xs sm:text-sm text-gray-700 italic border-l-4 border-blue-500 pl-3 py-1 mb-3 bg-blue-50">
                  "{app.message}"
                </p>
              )}

              {/* Decision Buttons */}
              {app.status === "approved" && !app.proceeded && (
                <div className="flex flex-col sm:flex-row gap-2 mt-3">
                  <button
                    onClick={() => handleTenantDecision(app.id, "yes")}
                    disabled={processingId === app.id}
                    className="flex-1 px-4 py-2 bg-emerald-600 text-white text-sm rounded-lg font-semibold hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                  >
                    {processingId === app.id
                      ? "Processing..."
                      : "Proceed with Lease"}
                  </button>
                  <button
                    onClick={() => handleTenantDecision(app.id, "no")}
                    disabled={processingId === app.id}
                    className="flex-1 px-4 py-2 bg-gray-300 text-gray-800 text-sm rounded-lg font-semibold hover:bg-gray-400 disabled:opacity-50 transition-colors"
                  >
                    {processingId === app.id ? "Processing..." : "Decline"}
                  </button>
                </div>
              )}

              {/* Decision Display */}
              {app.status === "approved" && app.proceeded && (
                <div
                  className={`mt-3 p-3 rounded-lg text-sm font-medium border ${
                    app.proceeded === "yes"
                      ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                      : "bg-gray-100 text-gray-800 border-gray-200"
                  }`}
                >
                  {app.proceeded === "yes"
                    ? "✅ You chose to proceed with this lease"
                    : "❌ You declined this lease"}
                </div>
              )}

              {/* Disapproved */}
              {app.status === "disapproved" && (
                <div className="mt-3 p-3 bg-rose-50 border border-rose-200 text-sm text-rose-700 rounded-lg">
                  ❌ Application not approved — you can apply for other units.
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mb-20 sm:mb-4">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="p-2 rounded-lg border border-gray-200 hover:bg-gray-100 disabled:opacity-50 transition-colors"
          >
            <ArrowRightIcon className="w-4 h-4 rotate-180" />
          </button>
          <div className="flex gap-1">
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i + 1)}
                className={`w-8 h-8 text-sm rounded-lg font-semibold transition-all ${
                  currentPage === i + 1
                    ? "bg-gradient-to-r from-blue-500 to-emerald-500 text-white shadow-sm"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="p-2 rounded-lg border border-gray-200 hover:bg-gray-100 disabled:opacity-50 transition-colors"
          >
            <ArrowRightIcon className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}

/* --- Status Icon --- */
function getStatusIcon(status: string) {
  switch (status) {
    case "approved":
      return <CheckCircleIcon className="w-5 h-5 text-emerald-600" />;
    case "disapproved":
      return <XCircleIcon className="w-5 h-5 text-red-600" />;
    case "pending":
    default:
      return <ClockIcon className="w-5 h-5 text-amber-600" />;
  }
}
