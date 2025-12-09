"use client";

import { useParams, useRouter } from "next/navigation";
import useSWR from "swr";
import axios from "axios";
import {
  FileText,
  Building2,
  User2,
  AlertCircle,
  FileSignature,
  Eye,
  ShieldCheck,
  MailCheck,
  Clock,
  HelpCircle,
} from "lucide-react";

import { useState } from "react";
import LeaseDetailsPanel from "@/components/landlord/activeLease/LeaseDetailsPanel";
import ChecklistSetupModal from "@/components/landlord/activeLease/ChecklistModal";
import { useOnboarding } from "@/hooks/useOnboarding";
import { activeLeasesSteps } from "@/lib/onboarding/activeLeasesPage";

const fetcher = (url: string) => axios.get(url).then((res) => res.data);

export default function PropertyLeasesPage() {
  const { id } = useParams();
  const router = useRouter();

  const { data, error, isLoading } = useSWR(
    `/api/landlord/activeLease/getByProperty?property_id=${id}`,
    fetcher
  );

  const [selectedLease, setSelectedLease] = useState(null);
  const [setupModalLease, setSetupModalLease] = useState(null);

  // Initialize onboarding
  const { startTour } = useOnboarding({
    tourId: "active-leases-page",
    steps: activeLeasesSteps,
    autoStart: true,
  });

  const handleAuthenticate = (lease) => {
    router.push(
      `/pages/landlord/properties/${id}/activeLease/authenticate/${lease.lease_id}`
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading leases...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-lg shadow-sm border border-red-200 p-6 max-w-md w-full">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-red-100 to-rose-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900 mb-1">
                Failed to Load Leases
              </h3>
              <p className="text-sm text-gray-600">
                Unable to fetch lease information. Please try again later.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const leases = data?.leases || [];

  /** Determine signature pending label **/
  const getSignaturePendingLabel = (lease) => {
    if (lease.lease_status !== "pending_signature") return null;

    const landlordSigned = lease.landlord_signed;
    const tenantSigned = lease.tenant_signed;

    if (landlordSigned && !tenantSigned) return "Tenant Pending Signature";

    if (!landlordSigned && tenantSigned) return "Landlord Pending Signature";

    return "Waiting for Signatures";
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="px-4 pt-20 pb-24 md:pt-6 md:pb-8 md:px-8 lg:px-12 xl:px-16">
        {/* HEADER */}
        <div id="leases-header" className="mb-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-emerald-100 rounded-lg flex items-center justify-center">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Current Leases
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  {leases.length} records found
                </p>
              </div>
            </div>

            <button
              onClick={startTour}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-blue-200"
            >
              <HelpCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Show Guide</span>
            </button>
          </div>
        </div>

        {/* TABLE */}
        <div
          id="leases-table"
          className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
        >
          {leases.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Unit
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Tenant
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Start
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      End
                    </th>
                    <th
                      id="status-column"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase"
                    >
                      Status
                    </th>
                    <th
                      id="action-buttons"
                      className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase"
                    >
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody className="bg-white divide-y divide-gray-200">
                  {leases.map((lease, index) => {
                    const sigLabel = getSignaturePendingLabel(lease);

                    const showViewDetails =
                      lease.lease_status === "active" ||
                      lease.landlord_signed === true;

                    const showAuthenticate =
                      lease.lease_status === "pending_signature" &&
                      lease.tenant_signed === true &&
                      lease.landlord_signed === false;

                    const showSetup = lease.lease_status !== "active";

                    // Add ID to first row for tour targeting
                    const isFirstRow = index === 0;

                    return (
                      <tr
                        key={lease.lease_id || `invite-${lease.invite_id}`}
                        onClick={() =>
                          lease.type === "lease" && setSelectedLease(lease)
                        }
                        className={`transition-colors ${
                          lease.type === "lease"
                            ? "hover:bg-gray-50 cursor-pointer"
                            : "bg-amber-50/30"
                        }`}
                      >
                        {/* UNIT */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-blue-600" />
                            <span className="text-sm font-medium text-gray-900">
                              {lease.unit_name}
                            </span>
                          </div>
                        </td>

                        {/* TENANT */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <User2 className="h-4 w-4 text-gray-400" />
                            <span className="text-sm text-gray-900">
                              {lease.type === "invite"
                                ? lease.invite_email
                                : lease.tenant_name || "—"}
                            </span>
                          </div>
                        </td>

                        {/* START DATE */}
                        <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">
                          {lease.start_date
                            ? new Date(lease.start_date).toLocaleDateString()
                            : "—"}
                        </td>

                        {/* END DATE */}
                        <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">
                          {lease.end_date
                            ? new Date(lease.end_date).toLocaleDateString()
                            : "—"}
                        </td>

                        {/* STATUS */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          {lease.type === "invite" ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border">
                              <Clock className="h-3 w-3" />
                              Invite Pending
                            </span>
                          ) : sigLabel ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border">
                              <Clock className="h-3 w-3" />
                              {sigLabel}
                            </span>
                          ) : (
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${
                                lease.lease_status === "active"
                                  ? "bg-green-100 text-green-800 border-green-200"
                                  : "bg-gray-100 text-gray-700 border-gray-200"
                              }`}
                            >
                              {lease.lease_status}
                            </span>
                          )}
                        </td>

                        {/* ACTIONS */}
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium flex flex-col gap-2 items-end">
                          {/* INVITE */}
                          {lease.type === "invite" && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/80 text-white shadow-sm">
                              <MailCheck className="w-4 h-4" />
                              Invite Sent
                            </span>
                          )}

                          {/* VIEW DETAILS */}
                          {showViewDetails && (
                            <button
                              id={isFirstRow ? "view-details-btn" : undefined}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedLease(lease);
                              }}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-700 text-white hover:bg-gray-800 transition"
                            >
                              <Eye className="w-4 h-4" />
                              View Details
                            </button>
                          )}

                          {/* AUTHENTICATE */}
                          {showAuthenticate && (
                            <button
                              id={isFirstRow ? "authenticate-btn" : undefined}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAuthenticate(lease);
                              }}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-sm"
                            >
                              <ShieldCheck className="w-4 h-4" />
                              Authenticate
                            </button>
                          )}

                          {/* SETUP — visible until ACTIVE */}
                          {showSetup && lease.type === "lease" && (
                            <button
                              id={isFirstRow ? "setup-btn" : undefined}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSetupModalLease(lease);
                              }}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-emerald-600 text-white shadow-sm"
                            >
                              <FileSignature className="w-4 h-4" />
                              Setup
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center text-gray-500">
              No leases found.
            </div>
          )}
        </div>

        {/* DETAILS PANEL */}
        {selectedLease && selectedLease.type === "lease" && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
              <LeaseDetailsPanel
                lease={selectedLease}
                onClose={() => setSelectedLease(null)}
              />
            </div>
          </div>
        )}

        {/* SETUP CHECKLIST */}
        {setupModalLease && (
          <ChecklistSetupModal
            lease={setupModalLease}
            agreement_id={setupModalLease.lease_id}
            onClose={() => setSetupModalLease(null)}
            onContinue={() => {
              router.push(
                `/pages/landlord/properties/${id}/activeLease/initialSetup/${setupModalLease.lease_id}`
              );
              setSetupModalLease(null);
            }}
          />
        )}
      </div>
    </div>
  );
}
