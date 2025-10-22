"use client";

import { useEffect, useState } from "react";
import {
  DocumentIcon,
  EyeIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ExclamationCircleIcon,
  ArrowRightIcon,
} from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";
import axios from "axios";
import LoadingScreen from "@/components/loadingScreen";
import TenantOutsidePortalNav from "@/components/navigation/TenantOutsidePortalNav";

type Application = {
  id: number;
  unit_id: number | null;
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
      await axios.patch(
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
    <div className="flex min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50">
      <TenantOutsidePortalNav /> 
      <div className="flex-1">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {/* Header */}
          <div className="mb-8 sm:mb-10">
            <div className="flex items-center gap-2 mb-2">
              <DocumentIcon className="w-6 h-6 text-emerald-600" />
              <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">
                My Applications
              </h1>
            </div>
            <p className="text-gray-600 text-sm sm:text-base ml-8">
              Track and manage your rental applications
            </p>
          </div>

          {/* Error State */}
          {error && (
            <div className="mb-6 p-4 sm:p-6 bg-gradient-to-br from-rose-50 to-red-50 rounded-2xl border border-red-200">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-red-100 rounded-lg flex-shrink-0">
                  <ExclamationCircleIcon className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-red-900 text-sm">
                    Failed to Load Applications
                  </h3>
                  <p className="text-red-700 text-sm mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Empty State */}
          {applications.length === 0 && !error && (
            <div className="rounded-2xl border border-gray-100 bg-white overflow-hidden">
              <div className="flex flex-col items-center justify-center py-16 px-4 sm:px-6">
                <div className="p-4 bg-gradient-to-br from-blue-100 to-emerald-100 rounded-full mb-4">
                  <DocumentIcon className="w-8 h-8 text-emerald-600" />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2 text-center">
                  No Applications Yet
                </h3>
                <p className="text-gray-600 text-sm sm:text-base text-center max-w-md">
                  You haven't submitted any rental applications yet. Browse
                  available properties to get started.
                </p>
                <button
                  onClick={() => router.push("/pages/tenant/my-unit")}
                  className="mt-6 flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-emerald-500 hover:shadow-lg text-white rounded-xl font-semibold transition-all transform hover:scale-105"
                >
                  <DocumentIcon className="w-4 h-4" />
                  Browse Properties
                </button>
              </div>
            </div>
          )}

          {/* Applications List */}
          {applications.length > 0 && !error && (
            <div className="space-y-4 sm:space-y-6">
              {/* Summary */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <div className="p-4 sm:p-5 rounded-xl bg-white border border-gray-100 text-center">
                  <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    Total Applications
                  </p>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-2">
                    {applications.length}
                  </p>
                </div>
                <div className="p-4 sm:p-5 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 text-center">
                  <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">
                    Approved
                  </p>
                  <p className="text-2xl sm:text-3xl font-bold text-emerald-700 mt-2">
                    {applications.filter((a) => a.status === "approved").length}
                  </p>
                </div>
                <div className="p-4 sm:p-5 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 text-center">
                  <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide">
                    Pending
                  </p>
                  <p className="text-2xl sm:text-3xl font-bold text-amber-700 mt-2">
                    {applications.filter((a) => a.status === "pending").length}
                  </p>
                </div>
              </div>

              {/* Applications */}
              <div className="space-y-4">
                {paginatedApps.map((app) => (
                  <article
                    key={app.id}
                    className="bg-white rounded-2xl shadow-sm hover:shadow-md border border-gray-100 overflow-hidden transition-all duration-300"
                  >
                    {/* Status Banner */}
                    <div
                      className={`px-4 sm:px-6 py-3 sm:py-4 text-sm font-semibold flex items-center justify-between ${getStatusStyles(
                        app.status
                      )}`}
                    >
                      <div className="flex items-center gap-2">
                        {getStatusIcon(app.status)}
                        <span className="capitalize">{app.status}</span>
                      </div>
                      <span className="text-xs opacity-75">
                        Application #{app.id}
                      </span>
                    </div>

                    {/* Content */}
                    <div className="p-4 sm:p-6 space-y-4">
                      {/* Property Info */}
                      <div>
                        <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">
                          {app.property_name || "Property"}
                          {app.unit_id && (
                            <span className="text-gray-500 font-normal">
                              {" "}
                              - Unit {app.unit_id}
                            </span>
                          )}
                        </h3>
                        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <ClockIcon className="w-4 h-4" />
                            Submitted:{" "}
                            {new Date(app.created_at).toLocaleDateString()}
                          </span>
                          <span className="flex items-center gap-1">
                            <ClockIcon className="w-4 h-4" />
                            {new Date(app.created_at).toLocaleTimeString()}
                          </span>
                        </div>
                      </div>

                      {/* Landlord Message */}
                      {app.message && (
                        <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                          <h4 className="font-bold text-blue-900 mb-2 text-sm">
                            Message from Landlord
                          </h4>
                          <p className="text-blue-800 text-sm leading-relaxed">
                            {app.message}
                          </p>
                        </div>
                      )}

                      {/* Documents */}
                      <div>
                        <h4 className="font-bold text-gray-900 mb-3 text-sm">
                          Submitted Documents
                        </h4>
                        <div className="flex flex-col sm:flex-row gap-3">
                          <a
                            href={app.valid_id}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 sm:px-5 sm:py-3 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-lg font-semibold text-sm shadow-md hover:shadow-lg transform hover:scale-[1.02] active:scale-[0.98] transition-all"
                          >
                            <EyeIcon className="w-4 h-4" />
                            View Valid ID
                          </a>
                          {app.proof_of_income && (
                            <a
                              href={app.proof_of_income}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 sm:px-5 sm:py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-lg font-semibold text-sm shadow-md hover:shadow-lg transform hover:scale-[1.02] active:scale-[0.98] transition-all"
                            >
                              <EyeIcon className="w-4 h-4" />
                              View Proof of Income
                            </a>
                          )}
                        </div>
                      </div>

                      {/* Decision Section */}
                      {app.status === "approved" && !app.proceeded && (
                        <div className="p-4 sm:p-5 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl border border-emerald-200">
                          <h4 className="font-bold text-emerald-900 mb-4 flex items-center gap-2 text-sm">
                            <CheckCircleIcon className="w-5 h-5" />
                            Application Approved! What's next?
                          </h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <button
                              onClick={() =>
                                handleTenantDecision(app.id, "yes")
                              }
                              disabled={processingId === app.id}
                              className="inline-flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-lg font-bold text-sm shadow-md hover:shadow-lg transform hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                            >
                              <CheckCircleIcon className="w-4 h-4" />
                              Proceed with Lease
                            </button>
                            <button
                              onClick={() => handleTenantDecision(app.id, "no")}
                              disabled={processingId === app.id}
                              className="inline-flex items-center justify-center gap-2 px-4 py-3 bg-gray-400 hover:bg-gray-500 text-white rounded-lg font-bold text-sm shadow-md hover:shadow-lg transform hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                            >
                              <XCircleIcon className="w-4 h-4" />
                              Decline
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Decision Result */}
                      {app.status === "approved" && app.proceeded && (
                        <div
                          className={`p-4 rounded-xl border flex items-center gap-3 ${
                            app.proceeded === "yes"
                              ? "bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200"
                              : "bg-gradient-to-br from-gray-100 to-gray-50 border-gray-200"
                          }`}
                        >
                          {app.proceeded === "yes" ? (
                            <>
                              <CheckCircleIcon className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                              <span className="font-semibold text-emerald-900 text-sm">
                                You chose to proceed with the lease
                              </span>
                            </>
                          ) : (
                            <>
                              <XCircleIcon className="w-5 h-5 text-gray-600 flex-shrink-0" />
                              <span className="font-semibold text-gray-900 text-sm">
                                You declined this lease
                              </span>
                            </>
                          )}
                        </div>
                      )}

                      {/* Disapproved */}
                      {app.status === "disapproved" && (
                        <div className="p-4 bg-gradient-to-br from-rose-50 to-red-50 rounded-xl border border-red-200 flex items-center gap-3">
                          <XCircleIcon className="w-5 h-5 text-red-600 flex-shrink-0" />
                          <div>
                            <p className="font-semibold text-red-900 text-sm">
                              Application Not Approved
                            </p>
                            <p className="text-red-700 text-xs mt-1">
                              The landlord did not approve this application. Try
                              applying to other properties.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </article>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-8 pt-6 border-t border-gray-200">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="p-2 rounded-lg border border-gray-200 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    <ArrowRightIcon className="w-4 h-4 transform rotate-180" />
                  </button>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                      (page) => (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`w-8 h-8 rounded-lg font-semibold text-sm transition-all ${
                            currentPage === page
                              ? "bg-gradient-to-r from-blue-500 to-emerald-500 text-white"
                              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                          }`}
                        >
                          {page}
                        </button>
                      )
                    )}
                  </div>

                  <button
                    onClick={() =>
                      setCurrentPage(Math.min(totalPages, currentPage + 1))
                    }
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-lg border border-gray-200 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    <ArrowRightIcon className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function getStatusStyles(status: string): string {
  switch (status) {
    case "approved":
      return "bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-900 border-b border-emerald-300";
    case "disapproved":
      return "bg-gradient-to-r from-rose-100 to-red-100 text-red-900 border-b border-red-300";
    case "pending":
    default:
      return "bg-gradient-to-r from-amber-100 to-orange-100 text-amber-900 border-b border-amber-300";
  }
}

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
