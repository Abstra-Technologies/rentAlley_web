"use client";

import React, { useEffect, useState } from "react";
import { BarChart } from "@mui/x-charts/BarChart";
import { Briefcase } from "lucide-react";

interface TenantOccupation {
  label: string;
  value: number;
}

interface Props {
  landlordId: number | string;
}

const TenantOccupationChart: React.FC<Props> = ({ landlordId }) => {
  const [occupationData, setOccupationData] = useState<TenantOccupation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!landlordId) return;

    setLoading(true);
    fetch(`/api/analytics/landlord/overview?landlord_id=${landlordId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          console.error("Analytics API Error:", data.error);
          setLoading(false);
          return;
        }

        if (Array.isArray(data.tenantOccupation)) {
          setOccupationData(data.tenantOccupation);
        } else {
          setOccupationData([]);
        }

        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching analytics overview:", error);
        setLoading(false);
      });
  }, [landlordId]);

  const labels = occupationData.map((item) => item.label || "Unknown");
  const values = occupationData.map((item) => item.value || 0);

  const totalTenants = occupationData.reduce((a, b) => a + (b.value || 0), 0);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-full">
      {/* Card Header */}
      <div className="p-4 sm:p-5 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-100 to-emerald-100 rounded-lg flex items-center justify-center">
              <Briefcase className="w-4 h-4 text-blue-600" />
            </div>
            <h3 className="text-sm sm:text-base font-bold text-gray-900">
              Occupation Distribution
            </h3>
          </div>
          {occupationData.length > 0 && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-700 text-xs font-semibold border border-emerald-200">
              <svg
                className="w-3 h-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              {totalTenants}
            </span>
          )}
        </div>
      </div>

      {/* Card Content */}
      <div className="p-4 sm:p-5">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-[300px]">
            <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mb-3"></div>
            <p className="text-sm text-gray-600">Loading data...</p>
          </div>
        ) : occupationData.length > 0 ? (
          <div className="overflow-x-auto">
            <BarChart
              xAxis={[
                {
                  scaleType: "band",
                  data: labels,
                  label: "Occupation",
                },
              ]}
              series={[
                {
                  data: values,
                  color: "#3B82F6",
                  label: "Tenants",
                },
              ]}
              height={300}
              margin={{ top: 10, bottom: 30, left: 40, right: 10 }}
            />
          </div>
        ) : (
          <div className="flex flex-col justify-center items-center h-[300px] text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Briefcase className="w-8 h-8 text-blue-600" />
            </div>
            <h4 className="text-sm font-semibold text-gray-900 mb-1">
              No Data Available
            </h4>
            <p className="text-xs text-gray-600 max-w-xs">
              Occupation data will appear here once tenants are onboarded.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TenantOccupationChart;
