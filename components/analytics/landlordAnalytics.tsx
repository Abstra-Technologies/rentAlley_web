import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import useAuthStore from "../../zustand/authStore";
import LoadingScreen from "../loadingScreen";
import { useRouter } from "next/navigation";
import {
  ChevronRight,
  TrendingUp,
  Users,
  Home,
  DollarSign,
  Wrench,
  FileText,
} from "lucide-react";

// Dynamic imports for charts
const PropertyTypeChart = dynamic(
  () => import("../landlord/analytics/typesOfProperties"),
  { ssr: false }
);
const PropertyUtilitiesChart = dynamic(
  () => import("../landlord/analytics/propertyUtilityRates"),
  { ssr: false }
);
const UtilityTrendsChart = dynamic(
  () => import("../landlord/analytics/utilityTrend"),
  { ssr: false }
);
const RevenuePerformanceChart = dynamic(
  () => import("../landlord/analytics/revenuePerformance"),
  { ssr: false }
);
const UpcomingVisitsWidget = dynamic(
  () => import("../landlord/properties/propertyVisit"),
  { ssr: false }
);
const TaskWidget = dynamic(() => import("../landlord/widgets/taskToDo"), {
  ssr: false,
});
import PaymentSummaryCard from "../landlord/analytics/PaymentSummaryCard";
import TenantActivity from "../landlord/widgets/TenantActivity";
import ProspectiveTenantsWidget from "../landlord/widgets/leads";

const Chart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
  loading: () => <p>Loading Chart...</p>,
});

const LandlordPropertyChart = () => {
  const { user, fetchSession } = useAuthStore();
  const router = useRouter();
  const [monthlyVisits, setMonthlyVisits] = useState([]);
  const [occupancyRate, setOccupancyRate] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [totalUnits, setTotalUnits] = useState(0);
  const [totalTenants, setTotalTenants] = useState(0);
  const [totalRequests, setTotalRequests] = useState(0);
  const [totalReceivables, setTotalReceivables] = useState(0);
  const [activeTab, setActiveTab] = useState("overview"); // For mobile tabs
  const [totalProperties, setTotalProperties] = useState(0);

  useEffect(() => {
    if (!user?.landlord_id) {
      fetchSession();
    }
  }, [user?.landlord_id, fetchSession]);

  const landlord_id = user?.landlord_id;

  // useEffect(() => {
  //   if (!user?.landlord_id) return; // don’t run until landlord_id is ready
  //
  //   const landlord_id = user.landlord_id;
  //
  //   // Fetch all data concurrently
  //   Promise.all([
  //     fetch(`/api/analytics/landlord/propertyVisitsPerMonth?landlord_id=${landlord_id}`),
  //     fetch(`/api/analytics/landlord/occupancyRateProperty?landlord_id=${landlord_id}`),
  //     fetch(`/api/analytics/landlord/getTotalTenants?landlord_id=${landlord_id}`),
  //     fetch(`/api/analytics/landlord/maintenanceRequestsSummary?landlord_id=${landlord_id}`),
  //     fetch(`/api/analytics/landlord/totalReceivables?landlord_id=${landlord_id}`),
  //     fetch(`/api/analytics/landlord/getActiveListings?landlord_id=${landlord_id}`),
  //   ])
  //       .then(
  //           async ([
  //                    visitsRes,
  //                    occupancyRes,
  //                    tenantsRes,
  //                    requestsRes,
  //                    receivablesRes,
  //                    propertiesRes,
  //                  ]) => {
  //             const visitsData = await visitsRes.json();
  //             const occupancyData = await occupancyRes.json();
  //             const tenantsData = await tenantsRes.json();
  //             const requestsData = await requestsRes.json();
  //             const receivablesData = await receivablesRes.json();
  //             const propertiesData = await propertiesRes.json();
  //             console.log('propertiessdata: ', propertiesData);
  //             // visits
  //             setMonthlyVisits(visitsData.visitsPerMonth || []);
  //
  //             // occupancy
  //             const totalUnits = occupancyData.occupancyRate?.total_units || 0;
  //             const rate =
  //                 totalUnits > 0 ? occupancyData.occupancyRate?.occupancy_rate || 0 : 0;
  //
  //             // properties
  //             setTotalProperties(propertiesData.totalActiveListings || 0);
  //
  //             // others
  //             setTotalUnits(totalUnits);
  //             setOccupancyRate(rate);
  //             setTotalTenants(tenantsData.total_tenants || 0);
  //             setTotalRequests(requestsData.totalRequests || 0);
  //             setTotalReceivables(receivablesData.totalReceivables || 0);
  //
  //             setLoading(false);
  //           }
  //       )
  //       .catch((error) => {
  //         console.error("Error fetching dashboard data:", error);
  //         setLoading(false);
  //       });
  // }, [user?.landlord_id]); // ✅ minimal dependency

  useEffect(() => {
    if (!user?.landlord_id) return;

    const landlord_id = user.landlord_id;

    // 🔹 Fetch total active listings
    fetch(`/api/analytics/landlord/getActiveListings?landlord_id=${landlord_id}`)
        .then((res) => res.json())
        .then((propertiesData) => {
          setTotalProperties(propertiesData.totalActiveListings || 0);
        })
        .catch((error) => console.error("Error fetching properties:", error));

    // 🔹 Fetch occupancy rate
    fetch(`/api/analytics/landlord/occupancyRateProperty?landlord_id=${landlord_id}`)
        .then((res) => res.json())
        .then((data) => {
          // works with { occupancyRate: 50 } or { occupancy_rate: 50 }
          const raw = data?.occupancyRate ?? data?.occupancy_rate ?? 0;

          let num =
              typeof raw === "string"
                  ? parseFloat(raw.replace("%", "")) // handle "85" or "85%"
                  : Number(raw); // ✅ capital N


          // if backend ever sends a fraction (0–1), convert to %
          if (num > 0 && num <= 1) num = num * 100;

          setOccupancyRate(Number.isFinite(num) ? num : 0);
        })
        .catch((err) => {
          console.error("Error fetching occupancy:", err);
          setOccupancyRate(0);
        });

    // total tenants
    fetch(`/api/analytics/landlord/getTotalTenants?landlord_id=${landlord_id}`)
        .then((res) => res.json())
        .then((data) => {
          console.log("API raw response (tenants):", data);
          setTotalTenants(data?.total_tenants || 0);
        })
        .catch((err) => console.error("Error fetching tenants:", err));



  }, [user?.landlord_id]);




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
  // @ts-ignore
  const visitData = (monthlyVisits || []).map((item) => ({
    month: months[item.month - 1],
    visitCount: item.visitCount,
  }));

  // Mobile Tab Navigation
  const mobileTabs = [
    { id: "overview", label: "Overview", icon: Home },
    { id: "finance", label: "Finance", icon: DollarSign },
    { id: "activity", label: "Activity", icon: Users },
    { id: "upcoming", label: "Upcoming", icon: TrendingUp },
  ];

  // if (loading) {
  //   return (
  //     <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/0 w-full">
  //       <LoadingScreen />
  //     </div>
  //   );
  // }

  return (
    <div className="bg-gray-50 min-h-screen -mx-4 sm:mx-0">
      {/* Mobile Tab Navigation */}
      <div className="sm:hidden sticky top-0 z-30 bg-white border-b border-gray-200 px-4 py-2">
        <div className="flex overflow-x-auto scrollbar-none space-x-1">
          {mobileTabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center px-4 py-2 rounded-lg whitespace-nowrap transition-all
                  ${
                    activeTab === tab.id
                      ? "bg-gradient-to-r from-blue-50 to-emerald-50 text-blue-700 font-semibold"
                      : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                  }
                `}
              >
                <Icon className="w-4 h-4 mr-2" />
                <span className="text-sm">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Desktop View - Show All */}
      <div className="hidden sm:block p-6">
        {/* Quick Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Total Properties</p>
                <p className="text-2xl font-bold text-gray-800">{totalProperties}</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <Home className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-emerald-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Occupancy Rate</p>
                <p className="text-2xl font-bold text-gray-800">
                  {occupancyRate?.toFixed(1) || 0}%
                </p>
              </div>
              <div className="p-3 bg-emerald-50 rounded-lg">
                <TrendingUp className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-teal-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Total Tenants</p>
                <p className="text-2xl font-bold text-gray-800">
                  {totalTenants}
                </p>
              </div>
              <div className="p-3 bg-teal-50 rounded-lg">
                <Users className="w-6 h-6 text-teal-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Total Receivables</p>
                <p className="text-2xl font-bold text-gray-800">
                  ${totalReceivables.toFixed(2)}
                </p>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg">
                <DollarSign className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Main Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2">
            <PaymentSummaryCard landlord_id={user?.landlord_id} />
          </div>
          <div className="lg:col-span-1">
            <TaskWidget landlordId={user?.landlord_id} />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div
            onClick={() =>
              router.push(`/pages/landlord/analytics/detailed/revenue`)
            }
            className="bg-white rounded-xl shadow-sm p-5 cursor-pointer hover:shadow-md hover:bg-gray-50 transition"
          >
            <RevenuePerformanceChart landlordId={user?.landlord_id} />
          </div>

          <div className="bg-white rounded-xl shadow-sm p-5">
            <TenantActivity landlord_id={user?.landlord_id} />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <UpcomingVisitsWidget landlordId={user?.landlord_id} />
          <ProspectiveTenantsWidget landlordId={user?.landlord_id} />
        </div>

        {/* Additional Charts and Widgets */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm p-5">
            <PropertyTypeChart landlordId={user?.landlord_id} />
          </div>
          <div className="bg-white rounded-xl shadow-sm p-5">
            <h3 className="text-lg font-semibold text-gray-700 mb-3">
              Recent Maintenance Requests
            </h3>
            {/* You would insert a component for a list of recent requests here */}
            <div className="text-sm text-gray-500">
              Total Requests:{" "}
              <span className="font-bold text-gray-700">{totalRequests}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile View - Tab Content */}
      <div className="sm:hidden p-4">
        {activeTab === "overview" && (
          <div className="space-y-4">
            {/* Mobile Quick Stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-blue-500">
                <p className="text-gray-500 text-xs">Total Properties</p>
                <p className="text-xl font-bold text-gray-800">{totalProperties}</p>
              </div>
              <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-purple-500">
                <p className="text-gray-500 text-xs">Total Tenants</p>
                <p className="text-xl font-bold text-gray-800">
                  {totalTenants}
                </p>
              </div>
              <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-orange-500">
                <p className="text-gray-500 text-xs">Requests</p>
                <p className="text-xl font-bold text-gray-800">
                  {totalRequests}
                </p>
              </div>
              <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-red-500">
                <p className="text-gray-500 text-xs">Receivables</p>
                <p className="text-xl font-bold text-gray-800">
                  ${totalReceivables.toFixed(2)}
                </p>
              </div>
            </div>

            {/* Mobile Tenant Activity Card */}
            <div className="bg-white rounded-xl shadow-sm p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">
                Quick Overview
              </h3>
              <TenantActivity landlord_id={user?.landlord_id} />
            </div>

            {/* Tasks Widget for Mobile */}
            <TaskWidget landlordId={user?.landlord_id} />
          </div>
        )}

        {activeTab === "finance" && (
          <div className="space-y-4">
            <PaymentSummaryCard landlord_id={user?.landlord_id} />
            <div
              onClick={() =>
                router.push(`/pages/landlord/analytics/detailed/revenue`)
              }
              className="bg-white rounded-xl shadow-sm p-4 active:bg-gray-50"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-700">
                  Revenue Trends
                </h3>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </div>
              <RevenuePerformanceChart landlordId={user?.landlord_id} />
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4">
              <PropertyUtilitiesChart landlordId={user?.landlord_id} />
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4">
              <UtilityTrendsChart landlordId={user?.landlord_id} />
            </div>
          </div>
        )}

        {activeTab === "activity" && (
          <div className="space-y-4">
            <ProspectiveTenantsWidget landlordId={user?.landlord_id} />
            <div className="bg-white rounded-xl shadow-sm p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">
                Tenant Activity
              </h3>
              <TenantActivity landlord_id={user?.landlord_id} />
            </div>
          </div>
        )}

        {activeTab === "upcoming" && (
          <div className="space-y-4">
            <UpcomingVisitsWidget landlordId={user?.landlord_id} />
            {/* Mobile-optimized visit summary */}
            <div className="bg-white rounded-xl shadow-sm p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">
                Monthly Visit Trends
              </h3>
              <div className="h-48">
                {visitData.length > 0 ? (
                  <Chart
                    options={{
                      chart: {
                        type: "area",
                        toolbar: { show: false },
                        sparkline: { enabled: true },
                      },
                      stroke: {
                        curve: "smooth",
                        width: 2,
                      },
                      fill: {
                        type: "gradient",
                        gradient: {
                          shadeIntensity: 1,
                          opacityFrom: 0.4,
                          opacityTo: 0.1,
                          stops: [0, 90, 100],
                          colorStops: [
                            {
                              offset: 0,
                              color: "#3B82F6",
                              opacity: 0.4,
                            },
                            {
                              offset: 100,
                              color: "#10B981",
                              opacity: 0.1,
                            },
                          ],
                        },
                      },
                      colors: ["#3B82F6"],
                      xaxis: {
                        categories: visitData.map((item) => item.month),
                      },
                    }}
                    series={[
                      {
                        name: "Visits",
                        data: visitData.map((item) => item.visitCount),
                      },
                    ]}
                    type="area"
                    height="100%"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                    No visit data available
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LandlordPropertyChart;
