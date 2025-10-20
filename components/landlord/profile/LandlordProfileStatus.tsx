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

  const baseCard =
      "rounded-lg sm:rounded-xl shadow-sm border transition-all duration-200 p-2.5 sm:p-4";

  const iconBox =
      "p-1.5 sm:p-2 rounded-md sm:rounded-lg shadow-inner flex items-center justify-center";

  const titleText =
      "text-[13px] sm:text-sm font-semibold leading-tight tracking-wide";

  const descText =
      "text-[11px] sm:text-xs text-gray-600 mt-0.5 sm:mt-1 leading-snug";

  const buttonText =
      "mt-1.5 sm:mt-2 text-[11px] sm:text-xs font-medium underline hover:opacity-80 transition-colors";

  const renderBanner = () => {
    switch (status) {
      case "pending":
        return (
            <div
                className={`${baseCard} bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-200`}
            >
              <div className="flex items-start space-x-2 sm:space-x-3">
                <div className={`${iconBox} bg-yellow-100`}>
                  <Clock className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-yellow-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`${titleText} text-yellow-800`}>
                    Documents Under Review
                  </p>
                  <p className={`${descText} text-yellow-600`}>
                    We're reviewing your submitted documents (1–2 days).
                  </p>
                </div>
              </div>
            </div>
        );

      case "rejected":
        return (
            <div
                className={`${baseCard} bg-gradient-to-r from-red-50 to-rose-50 border-red-200`}
            >
              <div className="flex items-start space-x-2 sm:space-x-3">
                <div className={`${iconBox} bg-red-100`}>
                  <XCircle className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-red-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`${titleText} text-red-800`}>
                    Verification Rejected
                  </p>
                  <p className={`${descText} text-red-600`}>
                    Please review feedback and resubmit your documents.
                  </p>
                  <button
                      onClick={() => router.push("/pages/landlord/verification")}
                      className={`${buttonText} text-red-700 hover:text-red-800`}
                  >
                    View Details →
                  </button>
                </div>
              </div>
            </div>
        );

      case "incomplete":
        return (
            <div
                className={`${baseCard} bg-gradient-to-r from-gray-50 to-slate-50 border-gray-200`}
            >
              <div className="flex items-start space-x-2 sm:space-x-3">
                <div className={`${iconBox} bg-gray-100`}>
                  <AlertCircle className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-gray-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`${titleText} text-gray-800`}>
                    Complete Your Profile
                  </p>
                  <p className={`${descText}`}>
                    Add missing info to unlock all features.
                  </p>

                  {/* Progress bar */}
                  <div className="mt-2 sm:mt-3 w-full bg-gray-200 rounded-full h-1.5 sm:h-2">
                    <div
                        className="bg-blue-600 h-1.5 sm:h-2 rounded-full transition-all"
                        style={{ width: `${completion}%` }}
                    ></div>
                  </div>
                  <p className="text-[10px] sm:text-xs text-gray-600 mt-0.5">
                    {completion}% completed
                  </p>

                  <button
                      onClick={() => router.push("/pages/landlord/verification")}
                      className={`${buttonText} text-blue-600 hover:text-blue-700`}
                  >
                    Complete Now →
                  </button>
                </div>
              </div>
            </div>
        );

      case "verified":
        return (
            <div
                className={`${baseCard} bg-gradient-to-r from-green-50 to-emerald-50 border-green-200`}
            >
              <div className="flex items-start space-x-2 sm:space-x-3">
                <div className={`${iconBox} bg-green-100`}>
                  <CheckCircle className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-green-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`${titleText} text-green-800`}>
                    Profile Verified
                  </p>
                  <p className={`${descText} text-green-600`}>
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
