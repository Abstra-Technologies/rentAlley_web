"use client";

import { useEffect, useState } from "react";
import {
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from "@heroicons/react/24/outline";
import axios from "axios";

interface LeaseReminder {
  agreement_id: string;
  property_name: string;
  unit_name: string;
  start_date: string;
  end_date: string;
  docusign_envelope_id: string;
}

interface TenantLeaseReminderBannerProps {
  tenantId: number;
}

export default function TenantLeaseReminderBanner({
  tenantId,
}: TenantLeaseReminderBannerProps) {
  const [leases, setLeases] = useState<LeaseReminder[]>([]);
  const [showAll, setShowAll] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tenantId) {
      setLoading(false);
      return;
    }

    const fetchPendingLeases = async () => {
      try {
        setLoading(true);
        const res = await axios.get(
          `/api/tenant/lease/pending?tenant_id=${tenantId}`
        );
        setLeases(res.data.pendingLeases || []);
      } catch (err) {
        console.error("Error fetching leases:", err);
        setLeases([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPendingLeases();
  }, [tenantId]);

  if (loading || !leases || leases.length === 0) return null;

  return (
    <div className="w-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl shadow-lg overflow-hidden border border-amber-600">
      {/* Header - Always visible */}
      <div className="p-5 sm:p-6">
        <div className="flex items-start gap-4">
          <div className="p-2.5 bg-white/20 backdrop-blur-sm rounded-xl flex-shrink-0">
            <ExclamationTriangleIcon className="h-6 w-6 text-white" />
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-lg sm:text-xl font-bold text-white mb-1">
              {leases.length} Pending Lease{" "}
              {leases.length === 1 ? "Agreement" : "Agreements"}
            </h3>
            <p className="text-sm text-amber-50">
              Action required: Review and sign your lease agreements
            </p>

            {/* First lease always shown */}
            <div className="mt-4 p-4 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white truncate">
                    {leases[0].property_name} – Unit {leases[0].unit_name}
                  </p>
                  <p className="text-xs text-amber-100 mt-1">
                    {leases[0].start_date} → {leases[0].end_date}
                  </p>
                </div>
                <button
                  onClick={() =>
                    (window.location.href = `/pages/tenant/leaseAgreement/signing?envelopeId=${leases[0].docusign_envelope_id}`)
                  }
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-amber-700 bg-white hover:bg-amber-50 shadow-md hover:shadow-lg transform hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  <CheckCircleIcon className="w-4 h-4" />
                  Sign Now
                </button>
              </div>
            </div>

            {/* Additional leases - collapsible */}
            {leases.length > 1 && (
              <>
                {showAll && (
                  <div className="mt-3 space-y-3">
                    {leases.slice(1).map((lease) => (
                      <div
                        key={lease.agreement_id}
                        className="p-4 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-white truncate">
                              {lease.property_name} – Unit {lease.unit_name}
                            </p>
                            <p className="text-xs text-amber-100 mt-1">
                              {lease.start_date} → {lease.end_date}
                            </p>
                          </div>
                          <button
                            onClick={() =>
                              (window.location.href = `/pages/tenant/leaseAgreement/signing?envelopeId=${lease.docusign_envelope_id}`)
                            }
                            className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-amber-700 bg-white hover:bg-amber-50 shadow-md hover:shadow-lg transform hover:scale-[1.02] active:scale-[0.98] transition-all"
                          >
                            <CheckCircleIcon className="w-4 h-4" />
                            Sign Now
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <button
                  onClick={() => setShowAll(!showAll)}
                  className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-bold text-white hover:bg-white/10 rounded-lg transition-all"
                >
                  {showAll ? (
                    <>
                      <ChevronUpIcon className="w-4 h-4" />
                      Show Less
                    </>
                  ) : (
                    <>
                      <ChevronDownIcon className="w-4 h-4" />
                      Show {leases.length - 1} More
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
