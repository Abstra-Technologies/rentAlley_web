
"use client";
import { useEffect, useState } from "react";

export default function LandlordProfileStatus({ landlord_id }: { landlord_id: number }) {
    const [status, setStatus] = useState("loading");

    useEffect(() => {
        if (!landlord_id) return;
        const fetchStatus = async () => {
            try {
                const res = await fetch(`/api/landlord/${landlord_id}/profileStatus`);
                const data = await res.json();
                setStatus(data.status);
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
                    <div className="bg-yellow-100 border border-yellow-300 text-yellow-800 rounded-lg p-4">
                        ⏳ Your documents are under review
                    </div>
                );
            case "rejected":
                return (
                    <div className="bg-red-100 border border-red-300 text-red-800 rounded-lg p-4">
                        ❌ Verification rejected – please resubmit your details
                    </div>
                );
            case "incomplete":
                return (
                    <div className="bg-gray-100 border border-gray-300 text-gray-800 rounded-lg p-4">
                        ⚠️ Your profile is incomplete – please fill in all required details
                    </div>
                );
            default:
                return;
        }
    };

    return <div className="mb-4">{renderBanner()}</div>;
}
