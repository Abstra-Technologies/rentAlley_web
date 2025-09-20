import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import useAuthStore from "../../zustand/authStore";
import LoadingScreen from "../loadingScreen";
const PropertyTypeChart = dynamic(() => import("../landlord/analytics/typesOfProperties"), { ssr: false });
const PropertyUtilitiesChart = dynamic(() => import("../landlord/analytics/propertyUtilityRates"), { ssr: false });
const UtilityTrendsChart = dynamic(() => import("../landlord/analytics/utilityTrend"), { ssr: false });
const RevenuePerformanceChart = dynamic(() => import("../landlord/analytics/revenuePerformance"), { ssr: false });
const UpcomingVisitsWidget = dynamic(() => import("../landlord/properties/propertyVisit"), { ssr: false });
const TaskWidget = dynamic(() => import("../landlord/widgets/taskToDo"), { ssr: false });
import PaymentSummaryCard from "../landlord/analytics/PaymentSummaryCard";
import TenantActivity  from "../landlord/widgets/TenantActivity";
import ProspectiveTenantsWidget  from "../landlord/widgets/leads";
import { useRouter } from "next/navigation";

const Chart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
  loading: () => <p>Loading Chart...</p>,
});

const LandlordPropertyChart = () => {
  const { user, fetchSession } = useAuthStore();
  const router = useRouter();
  const [monthlyVisits, setMonthlyVisits] = useState([]);
  const [occupancyRate, setOccupancyRate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [totalUnits, setTotalUnits] = useState(0);
  const [data, setData] = useState([]);
  const [totalTenants, setTotalTenants] = useState(0);
  const [totalRequests, setTotalRequests] = useState(0);
  const [totalReceivables, setTotalReceivables] = useState(0);

  useEffect(() => {
    if (!user?.landlord_id) {
      fetchSession();
    }
  }, [user, fetchSession]);

  const landlord_id = user?.landlord_id;

  useEffect(() => {
    if (!user?.landlord_id) return;

    fetch(
      `/api/analytics/landlord/propertyVisitsPerMonth?landlord_id=${landlord_id}`
    )
      .then((res) => res.json())
      .then((data) => {
        console.log("API Response:", data);
        setMonthlyVisits(data.visitsPerMonth || []);
      })
      .catch((error) => console.error("Error fetching visit data:", error));

    fetch(
      `/api/analytics/landlord/occupancyRateProperty?landlord_id=${landlord_id}`
    )
      .then((res) => res.json())
      .then((data) => {
        console.log("API Response:", data);
        const total = data.occupancyRate?.total_units || 0;
        const rate = total > 0 ? data.occupancyRate?.occupancy_rate || 0 : 0;

        setTotalUnits(total);
        setOccupancyRate(rate);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching occupancy rate data:", error);
        setLoading(false);
      });


    fetch(
      `/api/analytics/landlord/getTotalTenants?landlord_id=${landlord_id}`
    )
      .then((res) => res.json())
      .then((data) => {
        console.log("Total Tenants:", data?.total_tenants);
        setTotalTenants(data.total_tenants);
      })
      .catch((error) => console.error("Error fetching total tenants:", error));


  }, [fetchSession, user]);

  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  // if (!user?.landlord_id) {
  //   return <LoadingScreen />; // Or return null while waiting
  // }
  // Ensure `monthlyVisits` is always an array before mapping
  const visitData = (monthlyVisits || []).map((item) => ({
    month: months[item.month - 1],
    visitCount: item.visitCount,
  }));

  const chartOptionsVisits = {
    chart: { type: "bar" },
    xaxis: { categories: visitData.map((item) => item.month) },
    title: { text: "Property Visits Request Per Month" },
    colors: ["#6A0DAD"],
  };

  const chartSeries = [occupancyRate];

  return (
      <div className="p-6 bg-gray-50 min-h-screen">
        {loading ? (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/0 w-full">
              <LoadingScreen />
            </div>
        ) : (
            <>
              {/* 1. Financial Summary at top */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                <div className="lg:col-span-2">
                  <PaymentSummaryCard landlord_id={user?.landlord_id} />
                </div>
                <div className="lg:col-span-1">
                  <TaskWidget landlordId={user?.landlord_id} />
                </div>
              </div>

              {/* 2. Charts (Revenue + Occupancy side by side) */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <div
                    onClick={() =>
                        router.push(
                            `/pages/landlord/analytics/detailed/revenue`
                        )
                    }
                    className="bg-white rounded-xl shadow-sm p-5 cursor-pointer hover:shadow-md hover:bg-gray-50 transition"
                >
                  <RevenuePerformanceChart landlordId={user?.landlord_id} />
                </div>

                <div className="bg-white rounded-xl shadow-sm p-5">
                  {/* occupancy/units widget */}
                  <TenantActivity landlord_id={user?.landlord_id} />
                </div>
              </div>

              {/* 3. Upcoming / Prospects */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <UpcomingVisitsWidget landlordId={user?.landlord_id} />
                <ProspectiveTenantsWidget landlordId={user?.landlord_id} />
              </div>

              {/* 4. Optional Extras */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Example extra widgets */}
                <div className="bg-white rounded-xl shadow-sm p-5">
                  <h3 className="text-lg font-semibold text-gray-700 mb-3">
                    Occupancy Overview
                  </h3>
                  {/* Insert your occupancy chart */}
                </div>
                <div className="bg-white rounded-xl shadow-sm p-5">
                  <h3 className="text-lg font-semibold text-gray-700 mb-3">
                    Recent Maintenance Requests
                  </h3>
                  {/* Insert list or small chart */}
                </div>
              </div>
            </>
        )}
      </div>
  );


};

export default LandlordPropertyChart;
