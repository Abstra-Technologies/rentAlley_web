import { useEffect, useState } from "react";
import { Building2 } from "lucide-react";

interface ActiveListingsCardProps {
  landlordId: string;
}

const ActiveListingsCard: React.FC<ActiveListingsCardProps> = ({
  landlordId,
}) => {
  const [count, setCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActiveListings = async () => {
      try {
        const res = await fetch(
          `/api/analytics/landlord/getActiveListings?landlord_id=${landlordId}`
        );
        if (!res.ok) throw new Error("Failed to fetch active listings");

        const data = await res.json();
        setCount(data.totalActiveListings);
      } catch (err) {
        console.error(err);
        setCount(0);
      } finally {
        setLoading(false);
      }
    };

    fetchActiveListings();
  }, [landlordId]);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-5 hover:shadow-md transition-all">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">
            Active Listings
          </p>
          {loading ? (
            <div className="flex items-center gap-2 mt-2">
              <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-sm text-gray-600">Loading...</span>
            </div>
          ) : (
            <p className="text-2xl sm:text-3xl font-bold text-gray-900">
              {count ?? 0}
            </p>
          )}
        </div>
        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-100 to-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
          <Building2 className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
        </div>
      </div>

      {/* Progress Bar */}
      {!loading && count !== null && (
        <div className="mt-4">
          <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-600 to-emerald-600 rounded-full transition-all duration-500"
              style={{ width: "100%" }}
            ></div>
          </div>
          <p className="text-xs text-gray-600 mt-2">
            Total properties currently listed
          </p>
        </div>
      )}
    </div>
  );
};

export default ActiveListingsCard;
