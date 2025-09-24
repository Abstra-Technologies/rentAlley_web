
"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Clock, XCircle, CheckCircle } from "lucide-react";

export default function LandlordProfileStatus({
                                                landlord_id,
                                              }: {
  landlord_id: number;
}) {
  const [status, setStatus] = useState("loading");
  const [completion, setCompletion] = useState<number>(0);
  const router = useRouter();

  useEffect(() => {
    if (!landlord_id) return;
    const fetchStatus = async () => {
      try {
        const res = await fetch(`/api/landlord/${landlord_id}/profileStatus`);
        const data = await res.json();
        setStatus(data.status);
        setCompletion(data.completion || 0);
      } catch {
        setStatus("error");
      }
    };
    fetchStatus();
  }, [landlord_id]);

  const renderBanner = () => {
    switch (status) {
      case "pending":
        return (
            <div className="bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200 rounded-xl p-3 sm:p-4 shadow-sm">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm sm:text-base font-medium text-yellow-800">
                    Documents Under Review
                  </p>
                  <p className="text-xs sm:text-sm text-yellow-600 mt-1">
                    We're reviewing your submitted documents. This usually takes
                    1–2 business days.
                  </p>
                </div>
              </div>
            </div>
        );

      case "rejected":
        return (
            <div className="bg-gradient-to-r from-red-50 to-rose-50 border border-red-200 rounded-xl p-3 sm:p-4 shadow-sm">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <XCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm sm:text-base font-medium text-red-800">
                    Verification Rejected
                  </p>
                  <p className="text-xs sm:text-sm text-red-600 mt-1">
                    Please review the feedback and resubmit your documents.
                  </p>
                  <button
                      onClick={() => router.push("/pages/landlord/verification")}
                      className="mt-2 text-xs sm:text-sm font-medium text-red-700 underline hover:text-red-800"
                  >
                    View Details →
                  </button>
                </div>
              </div>
            </div>
        );

      case "incomplete":
        return (
            <div className="bg-gradient-to-r from-gray-50 to-slate-50 border border-gray-200 rounded-xl p-3 sm:p-4 shadow-sm">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm sm:text-base font-medium text-gray-800">
                    Complete Your Profile
                  </p>
                  <p className="text-xs sm:text-sm text-gray-600 mt-1">
                    Add missing information to unlock all features.
                  </p>

                  {/* Progress bar */}
                  <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
                    <div
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{ width: `${completion}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">
                    {completion}% completed
                  </p>

                  <button
                      onClick={() => router.push("/pages/landlord/verification")}
                      className="mt-2 text-xs sm:text-sm font-medium text-blue-600 underline hover:text-blue-700"
                  >
                    Complete Now →
                  </button>
                </div>
              </div>
            </div>
        );

      case "verified":
        return (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-3 sm:p-4 shadow-sm">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm sm:text-base font-medium text-green-800">
                    Profile Verified
                  </p>
                  <p className="text-xs sm:text-sm text-green-600 mt-1">
                    Your account is fully verified and active.
                  </p>
                </div>
              </div>
            </div>
        );

      default:
        return null;
    }
  };

  return <>{renderBanner()}</>;
}
