"use client";

import { useEffect, useState } from "react";
import {
  ExclamationTriangleIcon,
  CheckCircleIcon,
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

  const visibleLeases = showAll ? leases : [leases[0]];

  return (
    <div className="space-y-3 sm:space-y-4">
      {visibleLeases.map((lease) => (
        <div
          key={lease.agreement_id}
          className="w-full bg-gradient-to-r from-amber-50 to-orange-50 border-l-4 border-amber-400 rounded-xl shadow-md hover:shadow-lg transition-all overflow-hidden"
        >
          <div className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            {/* Icon & Content */}
            <div className="flex items-start sm:items-center gap-3 sm:gap-4 flex-1">
              <div className="p-2.5 bg-amber-200 rounded-lg flex-shrink-0 mt-0.5 sm:mt-0">
                <ExclamationTriangleIcon className="h-6 w-6 text-amber-700" />
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="text-base sm:text-lg font-bold text-amber-900 mb-1">
                  Pending Lease Agreement
                </h3>
                <p className="text-sm text-amber-800 mb-2">
                  Please review and sign your lease for{" "}
                  <span className="font-bold">
                    {lease.property_name} – Unit {lease.unit_name}
                  </span>
                </p>
                <p className="text-xs text-gray-600 font-medium">
                  Lease Period: {lease.start_date} → {lease.end_date}
                </p>
              </div>
            </div>

            {/* CTA Button */}
            <button
              onClick={() =>
                (window.location.href = `/pages/tenant/leaseAgreement/signing?envelopeId=${lease.docusign_envelope_id}`)
              }
              className="w-full sm:w-auto flex items-center justify-center px-6 py-3 rounded-lg text-sm sm:text-base font-bold text-white bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <CheckCircleIcon className="w-4 h-4 mr-2" />
              Sign Now
            </button>
          </div>
        </div>
      ))}

      {/* Toggle Button */}
      {leases.length > 1 && (
        <div className="flex justify-center pt-2">
          <button
            onClick={() => setShowAll(!showAll)}
            className="px-4 py-2 text-sm font-semibold text-amber-700 hover:text-amber-900 hover:bg-amber-100 rounded-lg transition-all"
          >
            {showAll ? "Show Less" : `Show All (${leases.length})`}
          </button>
        </div>
      )}
    </div>
  );
}
