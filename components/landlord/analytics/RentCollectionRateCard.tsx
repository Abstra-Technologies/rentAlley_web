"use client";
import { useEffect, useState } from "react";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";

interface RentCollectionRateData {
    total_billed: number;
    total_paid: number;
    collection_rate: number;
}

export default function RentCollectionRateCard({
                                                   landlordId,
                                               }: {
    landlordId: number;
}) {
    const [data, setData] = useState<RentCollectionRateData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!landlordId) return;
        fetch(
            `/api/analytics/landlord/getRentCollectionRate?landlord_id=${landlordId}`
        )
            .then((res) => res.json())
            .then((data) => {
                setData(data);
                setLoading(false);
            })
            .catch((err) => {
                console.error("Error fetching rent collection rate:", err);
                setLoading(false);
            });
    }, [landlordId]);

    if (loading)
        return (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <p className="text-gray-500 text-sm">Loading rent collection rate...</p>
            </div>
        );

    if (!data)
        return (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <p className="text-gray-500 text-sm">No data available</p>
            </div>
        );

    return (
        <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-md border border-gray-200 p-6 flex flex-col items-center justify-center hover:shadow-lg transition-all">
            <h3 className="text-lg font-bold text-gray-800 mb-2">
                Rent Collection Rate
            </h3>

            <div className="w-28 h-28 mb-4">
                <CircularProgressbar
                    value={data.collection_rate}
                    text={`${data.collection_rate}%`}
                    styles={buildStyles({
                        textSize: "16px",
                        pathColor: data.collection_rate >= 80 ? "#10B981" : "#F59E0B",
                        textColor: "#1F2937",
                        trailColor: "#E5E7EB",
                    })}
                />
            </div>

            <div className="text-sm text-gray-700 text-center">
                <p>
          <span className="font-semibold text-emerald-600">
            ₱{data.total_paid.toLocaleString("en-PH", {
              minimumFractionDigits: 2,
          })}
          </span>{" "}
                    collected
                </p>
                <p className="text-xs text-gray-500">
                    out of ₱
                    {data.total_billed.toLocaleString("en-PH", {
                        minimumFractionDigits: 2,
                    })}{" "}
                    billed this month
                </p>
            </div>
        </div>
    );
}
