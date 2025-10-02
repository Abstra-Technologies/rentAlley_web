"use client";

import { useEffect, useState } from "react";
import {
  FaFile,
  FaEye,
  FaCheck,
  FaTimes,
  FaClock,
  FaCheckCircle,
  FaTimesCircle,
} from "react-icons/fa";
import Link from "next/link";
import { useRouter } from "next/navigation";
import axios from "axios";
import LoadingScreen from "@/components/loadingScreen";
import Pagination from "@mui/material/Pagination";
import Stack from "@mui/material/Stack";

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
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        const res = await fetch(
          `/api/tenant/applications/listofApplications?tenantId=${tenantId}`
        );
        const result = await res.json();

        if (!res.ok) {
          new Error(result.message || "Failed to fetch applications.");
        }

        if (Array.isArray(result)) {
          setApplications(result);
        } else if (Array.isArray(result.applications)) {
          setApplications(result.applications);
        } else {
          new Error("Unexpected response format.");
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

  const handlePageChange = (_: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };
  const paginatedApps = applications.slice((page - 1) * pageSize, page * pageSize);

  const handleTenantDecision = async (
    applicationId: number,
    decision: "yes" | "no"
  ) => {
    try {
      await axios.patch(
        `/api/tenant/applications/applicationDecision/${applicationId}/proceed`,
        {
          decision,
        }
      );
      // Refresh the list after decision
      setApplications((prev) =>
        prev.map((a) =>
          a.id === applicationId ? { ...a, proceeded: decision } : a
        )
      );
    } catch (error) {
      console.error("Failed to update tenant decision", error);
      alert("Something went wrong.");
    }
  };

  if (loading) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/0 w-full">
           <LoadingScreen message='Just a moment, getting your applications data ready...' />;
        </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <div className="text-red-600 text-xl mb-2">⚠️</div>
            <h3 className="text-red-800 font-semibold mb-2">
              Error Loading Applications
            </h3>
            <p className="text-red-600">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
      <div className="flex min-h-screen bg-gray-50">

        <div className='flex-1 md:ml-5' >
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <FaFile className="text-indigo-600 text-xl" />
            </div>
            <div>
              <h1 className="gradient-header">
                My Rental Applications
              </h1>
              <p className="text-gray-600 mt-1">
                Track and manage your rental applications
              </p>
            </div>
          </div>
        </div>

        {applications.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
            <div className="text-gray-400 text-6xl mb-4">📄</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No Applications Yet
            </h3>
            <p className="text-gray-600">
              You haven't submitted any rental applications.
            </p>
          </div>
        ) : (
          <div className="space-y-4">

            {applications.map((app) => (
              <div
                key={app.id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-200"
              >
                {/* Status Banner */}
                <div
                  className={`px-6 py-3 text-sm font-medium ${getStatusBanner(
                    app.status
                  )}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(app.status)}
                      <span className="capitalize">{app.status}</span>
                    </div>
                    <span className="text-xs opacity-75">ID: #{app.id}</span>
                  </div>
                </div>

                {/* Main Content */}
                <div className="p-6">
                  {/* Property Info */}
                  <div className="mb-4">
                    <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
                      {app.property_name || "Property"}
                      <span className="text-gray-500 font-normal">
                        {app.unit_id ? ` - Unit ${app.unit_id}` : ""}
                      </span>
                    </h3>
                    <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                      <span>
                        📅 Submitted:{" "}
                        {new Date(app.created_at).toLocaleDateString()}
                      </span>
                      <span>
                        🕒 {new Date(app.created_at).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>

                  {/* Message */}
                  {app.message && (
                    <div className="bg-gray-50 rounded-lg p-4 mb-4">
                      <h4 className="font-medium text-gray-900 mb-2">
                        Message from Landlord:
                      </h4>
                      <p className="text-gray-700 text-sm leading-relaxed">
                        {app.message}
                      </p>
                    </div>
                  )}

                  {/* Documents */}
                  <div className="mb-4">
                    <h4 className="font-medium text-gray-900 mb-3">
                      Submitted Documents
                    </h4>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <a
                        href={app.valid_id}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg border border-blue-200 transition-colors duration-200 text-sm font-medium"
                      >
                        <FaEye className="text-xs" />
                        View Valid ID
                      </a>
                      {app.proof_of_income && (
                        <a
                          href={app.proof_of_income}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg border border-green-200 transition-colors duration-200 text-sm font-medium"
                        >
                          <FaEye className="text-xs" />
                          View Proof of Income
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Decision Buttons */}
                  {app.status === "approved" && !app.proceeded && (
                    <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                      <h4 className="font-medium text-green-900 mb-3 flex items-center gap-2">
                        <FaCheckCircle />
                        Application Approved! What would you like to do?
                      </h4>
                      <div className="flex flex-col sm:flex-row gap-3">
                        <button
                          onClick={() => handleTenantDecision(app.id, "yes")}
                          className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200 shadow-sm"
                        >
                          <FaCheck className="text-sm" />
                          Proceed with Lease
                        </button>
                        <button
                          onClick={() => handleTenantDecision(app.id, "no")}
                          className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200 shadow-sm"
                        >
                          <FaTimes className="text-sm" />
                          Decline
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Decision Result */}
                  {app.status === "approved" && app.proceeded && (
                    <div
                      className={`rounded-lg p-4 border ${
                        app.proceeded === "yes"
                          ? "bg-emerald-50 border-emerald-200"
                          : "bg-gray-50 border-gray-200"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {app.proceeded === "yes" ? (
                          <>
                            <FaCheckCircle className="text-emerald-600" />
                            <span className="font-medium text-emerald-900">
                              You chose to proceed with the lease
                            </span>
                          </>
                        ) : (
                          <>
                            <FaTimesCircle className="text-gray-600" />
                            <span className="font-medium text-gray-900">
                              You declined this lease
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>

              </div>
            ))}

          </div>
        )}
      </div>
      <Stack spacing={2} alignItems="center" className="pt-6">
        <Pagination
            count={Math.ceil(applications.length / pageSize)}
            page={page}
            onChange={handlePageChange}
            color="primary"
            shape="rounded"
        />
      </Stack>
    </div>
  );
}

function getStatusBanner(status: string) {
  switch (status) {
    case "approved":
      return "bg-green-100 text-green-800 border-b border-green-200";
    case "disapproved":
      return "bg-red-100 text-red-800 border-b border-red-200";
    default:
      return "bg-yellow-100 text-yellow-800 border-b border-yellow-200";
  }
}

function getStatusIcon(status: string) {
  switch (status) {
    case "approved":
      return <FaCheckCircle className="text-green-600" />;
    case "disapproved":
      return <FaTimesCircle className="text-red-600" />;
    default:
      return <FaClock className="text-yellow-600" />;
  }
}
