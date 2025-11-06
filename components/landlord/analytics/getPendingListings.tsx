"use client";

import { useEffect, useState } from "react";
import { Clock } from "lucide-react";

interface PendingListingsCardProps {
  landlordId: string;
}

export default function PendingListingsCard({
  landlordId,
}: PendingListingsCardProps) {
  const [pendingListings, setPendingListings] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPendingListings = async () => {
      try {
        const res = await fetch(
          `/api/analytics/landlord/getPendingListings?landlord_id=${landlordId}`
        );
        if (!res.ok) throw new Error("Failed to fetch pending listings");
        const data = await res.json();
        setPendingListings(data.pendingCount);
      } catch (error) {
        console.error("Error fetching pending listings:", error);
        setPendingListings(0);
      } finally {
        setLoading(false);
      }
    };

    fetchPendingListings();
  }, [landlordId]);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-5 hover:shadow-md transition-all">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">
            Pending Listings
          </p>
          {loading ? (
            <div className="flex items-center gap-2 mt-2">
              <div className="w-5 h-5 border-2 border-amber-600 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-sm text-gray-600">Loading...</span>
            </div>
          ) : (
            <p className="text-2xl sm:text-3xl font-bold text-gray-900">
              {pendingListings ?? 0}
            </p>
          )}
        </div>
        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-amber-100 to-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
          <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-amber-600" />
        </div>
      </div>

      {/* Progress Bar */}
      {!loading && pendingListings !== null && (
        <div className="mt-4">
          <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-600 to-orange-600 rounded-full transition-all duration-500"
              style={{
                width: pendingListings > 0 ? "100%" : "0%",
              }}
            ></div>
          </div>
          <p className="text-xs text-gray-600 mt-2">
            {pendingListings > 0 ? "Awaiting approval" : "No pending listings"}
          </p>
        </div>
      )}
    </div>
  );
}
