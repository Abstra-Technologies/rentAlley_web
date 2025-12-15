"use client";
import { useEffect, useState } from "react";
import { PieChart, Pie, Cell } from "recharts";
import { TrendingUp, AlertCircle, CheckCircle, Users } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import axios from "axios";

export default function PaymentSummaryCard({
  landlord_id,
  onClick,
}: {
  landlord_id: number | undefined;
  onClick?: () => void;
}) {
  const [pending, setPending] = useState(0);
  const [overdue, setOverdue] = useState(0);
  const [collected, setCollected] = useState(0);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [tenants, setTenants] = useState<
    {
      tenant_id: number;
      profilePicture: string | null;
      firstName: string;
      lastName: string;
    }[]
  >([]);

    useEffect(() => {
        if (!landlord_id) return;

        const fetchData = async () => {
            setLoading(true);
            try {
                const { data } = await axios.get(
                    "/api/analytics/landlord/getTotalReceivablesforTheMonth",
                    {
                        params: { landlord_id },
                    }
                );

                const pendingAmount = Number(data?.total_pending || 0);
                const overdueAmount = Number(data?.total_overdue || 0);
                const collectedAmount = Number(data?.total_collected || 0);

                setPending(pendingAmount);
                setOverdue(overdueAmount);
                setCollected(collectedAmount);
                setTotal(pendingAmount + overdueAmount + collectedAmount);

                /* ---------------- Current Tenants ---------------- */
                const tenantRes = await axios.get(
                    "/api/landlord/properties/getCurrentTenants",
                    {
                        params: { landlord_id },
                    }
                );

                const tenantData = tenantRes.data;

                setTenants(Array.isArray(tenantData) ? tenantData.slice(0, 8) : []);
            } catch (error) {
                console.error("Error fetching landlord analytics:", error);
                setPending(0);
                setOverdue(0);
                setCollected(0);
                setTotal(0);
                setTenants([]);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [landlord_id]);

  const data =
    pending === 0 && overdue === 0 && collected === 0
      ? [{ name: "No Data", value: 1 }]
      : [
          { name: "Collected", value: collected },
          { name: "Pending", value: pending },
          { name: "Overdue", value: overdue },
        ];

  const COLORS =
    pending === 0 && overdue === 0 && collected === 0
      ? ["#e5e7eb"]
      : ["#10b981", "#3b82f6", "#f97316"];

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6 min-h-[480px] animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-6"></div>
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="h-24 bg-gray-100 rounded-lg"></div>
          <div className="h-24 bg-gray-100 rounded-lg"></div>
        </div>
        <div className="h-32 bg-gray-100 rounded-full mx-auto w-32"></div>
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className="
                relative group cursor-pointer
                bg-white rounded-lg shadow-sm border border-gray-200
                p-4 md:p-6
                transition-all duration-200
                hover:shadow-md hover:-translate-y-0.5
                min-h-[480px] flex flex-col
            "
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-gradient-to-r from-blue-600 to-emerald-600 rounded-full"></div>
          <h2 className="text-sm md:text-base font-semibold text-gray-900">
            Payment Summary
          </h2>
        </div>
        <span className="text-xs text-gray-500">
          {new Date().toLocaleString("en-US", { month: "long" })}
        </span>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {/* Upcoming */}
        <div className="flex flex-col items-center p-3 rounded-lg bg-blue-50 border border-blue-100">
          <TrendingUp className="w-5 h-5 text-blue-600 mb-2" />
          <p className="text-[10px] md:text-xs text-gray-600 mb-1">Upcoming</p>
          <p className="text-sm md:text-base font-bold text-blue-600 truncate w-full text-center">
            ₱{pending.toLocaleString()}
          </p>
        </div>

        {/* Overdue */}
        <div className="flex flex-col items-center p-3 rounded-lg bg-orange-50 border border-orange-100">
          <AlertCircle className="w-5 h-5 text-orange-600 mb-2" />
          <p className="text-[10px] md:text-xs text-gray-600 mb-1">Overdue</p>
          <p className="text-sm md:text-base font-bold text-orange-600 truncate w-full text-center">
            ₱{overdue.toLocaleString()}
          </p>
        </div>

        {/* Collected */}
        <div className="flex flex-col items-center p-3 rounded-lg bg-emerald-50 border border-emerald-100">
          <CheckCircle className="w-5 h-5 text-emerald-600 mb-2" />
          <p className="text-[10px] md:text-xs text-gray-600 mb-1">Collected</p>
          <p className="text-sm md:text-base font-bold text-emerald-600 truncate w-full text-center">
            ₱{collected.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Chart & Legend */}
      <div className="flex items-center justify-center gap-6 mb-6">
        {/* Chart */}
        <div className="flex flex-col items-center">
          <PieChart width={120} height={120}>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={40}
              outerRadius={55}
              strokeWidth={0}
              dataKey="value"
            >
              {data.map((entry, i) => (
                <Cell key={i} fill={COLORS[i]} />
              ))}
            </Pie>
          </PieChart>
          <div className="text-center mt-2">
            <p className="text-xs text-gray-500">Total</p>
            <p className="text-sm font-bold text-gray-900">
              ₱{total.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-xs">
            <span className="w-3 h-3 bg-emerald-500 rounded-full flex-shrink-0"></span>
            <span className="text-gray-700">Collected</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="w-3 h-3 bg-blue-500 rounded-full flex-shrink-0"></span>
            <span className="text-gray-700">Upcoming</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="w-3 h-3 bg-orange-500 rounded-full flex-shrink-0"></span>
            <span className="text-gray-700">Overdue</span>
          </div>
        </div>
      </div>

      {/* Current Tenants Section */}
      {tenants.length > 0 && (
        <div className="mt-auto pt-4 border-t border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-semibold text-gray-900">
                Current Tenants
              </h3>
            </div>
            <span className="text-xs text-gray-500">
              {tenants.length} active
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {tenants.map((t) => (
              <Link
                key={t.tenant_id}
                href={`/pages/landlord/list_of_tenants/${t.tenant_id}`}
                className="relative group/avatar"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-gray-200 hover:border-blue-500 transition-all hover:scale-110">
                  <Image
                    src={
                      t.profilePicture ||
                      "https://cdn-icons-png.flaticon.com/512/847/847969.png"
                    }
                    alt={`${t.firstName} ${t.lastName}`}
                    fill
                    className="object-cover"
                  />
                </div>
                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover/avatar:opacity-100 transition-opacity pointer-events-none z-10">
                  {t.firstName} {t.lastName}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Hover overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-600/0 to-emerald-600/0 group-hover:from-blue-600/5 group-hover:to-emerald-600/5 rounded-lg transition-all duration-200 pointer-events-none" />
    </div>
  );
}
