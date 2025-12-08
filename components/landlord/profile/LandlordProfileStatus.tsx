"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Clock, XCircle, CheckCircle } from "lucide-react";

export default function LandlordProfileStatus({ landlord_id }: { landlord_id: number }) {
    const [status, setStatus] = useState("loading");
    const [completion, setCompletion] = useState(0);
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

    /* 🔹 MUCH SLIMMER SIZING */
    const baseCard =
        "rounded-lg shadow-sm border p-2 sm:p-2.5 transition-all duration-200";

    const iconBox =
        "p-1.5 rounded-md bg-opacity-60 flex items-center justify-center";

    const titleText =
        "text-[12px] sm:text-[13px] font-semibold leading-tight";

    const descText =
        "text-[10px] sm:text-[11px] text-gray-600 leading-snug mt-0.5";

    const buttonText =
        "mt-1 text-[10px] sm:text-[11px] font-medium underline hover:opacity-75";

    const renderBanner = () => {
        switch (status) {
            case "pending":
                return (
                    <div className={`${baseCard} bg-yellow-50 border-yellow-200`}>
                        <div className="flex items-start gap-2">
                            <div className={`${iconBox} bg-yellow-100`}>
                                <Clock className="w-4 h-4 text-yellow-600" />
                            </div>
                            <div className="flex-1">
                                <p className={`${titleText} text-yellow-800`}>Documents Under Review</p>
                                <p className={`${descText} text-yellow-700`}>
                                    Processing your submitted documents.
                                </p>
                            </div>
                        </div>
                    </div>
                );

            case "rejected":
                return (
                    <div className={`${baseCard} bg-red-50 border-red-200`}>
                        <div className="flex items-start gap-2">
                            <div className={`${iconBox} bg-red-100`}>
                                <XCircle className="w-4 h-4 text-red-600" />
                            </div>
                            <div className="flex-1">
                                <p className={`${titleText} text-red-800`}>Verification Rejected</p>
                                <p className={`${descText} text-red-700`}>
                                    Please review the notes and resubmit.
                                </p>
                                <button
                                    onClick={() => router.push("/pages/landlord/verification")}
                                    className={`${buttonText} text-red-700`}
                                >
                                    View Details →
                                </button>
                            </div>
                        </div>
                    </div>
                );

            case "incomplete":
                return (
                    <div className={`${baseCard} bg-red-50 border-red-200`}>
                        <div className="flex items-start gap-2">
                            <div className={`${iconBox} bg-red-100`}>
                                <AlertCircle className="w-4 h-4 text-red-600" />
                            </div>
                            <div className="flex-1">
                                <p className={`${titleText} text-red-800`}>Complete Your Profile</p>
                                <p className={descText}>Add missing details to continue.</p>

                                {/* Progress bar – thinner */}
                                <div className="mt-1 w-full bg-red-200 rounded-full h-1.5">
                                    <div
                                        className="bg-red-600 h-1.5 rounded-full"
                                        style={{ width: `${completion}%` }}
                                    ></div>
                                </div>

                                <p className="text-[10px] text-red-600 mt-0.5">{completion}% done</p>

                                <button
                                    onClick={() => router.push("/pages/landlord/verification")}
                                    className={`${buttonText} text-red-700`}
                                >
                                    Complete Now →
                                </button>
                            </div>
                        </div>
                    </div>
                );

            case "verified":
                return (
                    <div className={`${baseCard} bg-green-50 border-green-200`}>
                        <div className="flex items-start gap-2">
                            <div className={`${iconBox} bg-green-100`}>
                                <CheckCircle className="w-4 h-4 text-green-600" />
                            </div>
                            <div className="flex-1">
                                <p className={`${titleText} text-green-800`}>Profile Verified</p>
                                <p className={`${descText} text-green-700`}>
                                    You're fully verified and active.
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
