import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import useAuthStore from "../../zustand/authStore";
import LoadingScreen from "../loadingScreen";

const Chart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
  loading: () => <p>Loading Chart...</p>,
});

const LandlordPropertyChart = () => {
  const { user, fetchSession } = useAuthStore();

  const [totalProperties, setTotalProperties] = useState(0);
  const [monthlyVisits, setMonthlyVisits] = useState([]);
  const [occupancyRate, setOccupancyRate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [totalUnits, setTotalUnits] = useState(0);
  const [data, setData] = useState([]);
  const [paymentData, setPaymentData] = useState([]);
  const [totalTenants, setTotalTenants] = useState(0);
  const [totalRequests, setTotalRequests] = useState(0);
  const [totalReceivables, setTotalReceivables] = useState(0);
  const [utilityTrend, setUtilityTrend] = useState([]);
  const [utilityRates, setUtilityRates] = useState([]);
  const [occupationData, setOccupationData] = useState([]);

  useEffect(() => {
    if (!user) {
      fetchSession();
      return;
    }

    fetch(
      `/api/analytics/landlord/getNumberofProperties?landlord_id=${user.landlord_id}`
    )
      .then((res) => res.json())
      .then((data) => setTotalProperties(data.totalProperties))
      .catch((error) => console.error("Error fetching property data:", error));

    fetch(
      `/api/analytics/landlord/getPropertyVisitsPerMonth?landlord_id=${user.landlord_id}`
    )
      .then((res) => res.json())
      .then((data) => {
        console.log("API Response:", data);
        setMonthlyVisits(data.visitsPerMonth || []);
      })
      .catch((error) => console.error("Error fetching visit data:", error));

    fetch(
      `/api/analytics/landlord/getOccupancyRate?landlord_id=${user.landlord_id}`
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
      `/api/analytics/landlord/getMaintenanceCategories?landlord_id=${user.landlord_id}`
    )
      .then((res) => res.json())
      .then((result) => {
        if (result.categories) {
          setData(result.categories);
        }
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching maintenance categories:", error);
        setLoading(false);
      });

    fetch(
      `/api/analytics/landlord/getPaymentsPerMonth?landlord_id=${user.landlord_id}`
    )
      .then((res) => res.json())
      .then((data) => {
        console.log("Payment Data:", data);
        setPaymentData(data);
      })
      .catch((error) => console.error("Error fetching payment data:", error));

    fetch(
      `/api/analytics/landlord/getTotalTenants?landlord_id=${user.landlord_id}`
    )
      .then((res) => res.json())
      .then((data) => {
        console.log("Total Tenants:", data?.total_tenants);
        setTotalTenants(data.total_tenants);
      })
      .catch((error) => console.error("Error fetching total tenants:", error));

    fetch(
      `/api/analytics/landlord/getNumberMaintenanceRequestsperMonth?landlord_id=${user.landlord_id}`
    )
      .then((res) => res.json())
      .then((data) => {
        console.log("Total Maintenance Requests:", data?.total_requests);
        setTotalRequests(data?.total_requests);
      })
      .catch((error) =>
        console.error("Error fetching maintenance request count:", error)
      );

    fetch(
      `/api/analytics/landlord/getTotalReceivables?landlord_id=${user.landlord_id}`
    )
      .then((res) => res.json())
      .then((data) => {
        console.log("Total Receivables:", data?.total_receivables);
        setTotalReceivables(data?.total_receivables);
      })
      .catch((error) =>
        console.error("Error fetching total receivables:", error)
      );

    fetch(
      `/api/analytics/landlord/getMonthlyUtilityTrend?landlord_id=${user.landlord_id}`
    )
      .then((res) => res.json())
      .then((data) => {
        console.log("Utility Trend Data:", data);
        setUtilityTrend(data);
      })
      .catch((error) => console.error("Error fetching utility trend:", error));

    fetch(
      `/api/analytics/landlord/getAverageUtilityRate?landlord_id=${user.landlord_id}`
    )
      .then((res) => res.json())
      .then((data) => {
        console.log("Average Utility Rate Data:", data);
        setUtilityRates(data);
      })
      .catch((error) =>
        console.error("Error fetching utility rate data:", error)
      );

    fetch(
      `/api/analytics/landlord/getTenantOccupations?landlord_id=${user.landlord_id}`
    )
      .then((res) => res.json())
      .then((data) => {
        console.log("Tenant Occupation Data:", data);
        setOccupationData(data);
      })
      .catch((error) =>
        console.error("Error fetching tenant occupation data:", error)
      );
  }, [fetchSession, user]);

  // tenant occupcations

  const labelsOccupation =
    occupationData.length > 0
      ? occupationData.map((item) => item.occupation)
      : ["No Data"];

  const seriesOccupation =
    occupationData.length > 0
      ? occupationData.map((item) => item.tenant_count)
      : [0];

  const chartOptionsOccupation = {
    chart: { type: "pie" },
    labelsOccupation,
    title: { text: "Tenant Occupation Distribution", align: "center" },
    legend: { position: "bottom" },
    tooltip: {
      y: {
        formatter: (val, opts) => {
          const occupationName = labelsOccupation[opts.seriesIndex];
          return `${occupationName}: ${val} Tenants`;
        },
      },
    },
  };

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

  const chartOptions = {
    chart: { type: "bar" },
    xaxis: { categories: ["Your Properties"] },
    title: { text: "Total Number of Properties Listed" },
    colors: ["#6A0DAD"],
  };

  const chartOptionsOccupancy = {
    chart: {
      type: "radialBar",
    },
    plotOptions: {
      radialBar: {
        hollow: { size: "60%" },
        dataLabels: {
          show: true,
          name: { show: false },
          value: {
            fontSize: "22px",
            fontWeight: "bold",
            formatter: (val) => `${val}%`,
          },
        },
      },
    },
    labels: ["Occupancy Rate of All Properties"],
  };
  const chartSeries = [occupancyRate];

  const chartOptionsMaintenanceCategories = {
    chart: { type: "pie" },
    labels: data.map((item) => item.category),
    title: { text: "Maintenance Request Categories", align: "center" },
  };
  const chartSeriesMaintenance = data.map((item) => item.category);

  const monthsUtility = [...new Set(utilityTrend.map((item) => item.month))];
  const waterData = monthsUtility.map(
    (month) =>
      utilityTrend.find(
        (item) => item.month === month && item.utility_type === "water"
      )?.total_expense || 0
  );
  const electricityData = monthsUtility.map(
    (month) =>
      utilityTrend.find(
        (item) => item.month === month && item.utility_type === "electricity"
      )?.total_expense || 0
  );

  const chartOptionsUtilityTrends = {
    chart: { type: "line" },
    xaxis: { categories: monthsUtility },
    title: { text: "Monthly Utility Expenses Trend", align: "center" },
  };
  const seriesUtilityTrends = [
    { name: "Water", data: waterData },
    { name: "Electricity", data: electricityData },
  ];

  const chartOptionsPayment = {
    chart: {
      type: "bar",
    },
    xaxis: {
      categories: paymentData.map((item) => item.month),
    },
    title: {
      text: "Monthly Payments Received",
      align: "center",
    },
  };
  const seriesPayment = [
    {
      name: "Total Payments Received",
      data: paymentData.map((item) => item.total_received),
    },
  ];

  const propertyIds = [
    ...new Set(utilityRates.map((item) => item.property_id)),
  ];

  const waterRates = propertyIds.map(
    (id) =>
      utilityRates.find(
        (item) => item.property_id === id && item.utility_type === "water"
      )?.avg_rate_consumed || 0
  );
  const electricityRates = propertyIds.map(
    (id) =>
      utilityRates.find(
        (item) => item.property_id === id && item.utility_type === "electricity"
      )?.avg_rate_consumed || 0
  );

  const chartOptionsPropertyUtilities = {
    chart: { type: "bar" },
    xaxis: { categories: propertyIds.map((id) => `Property ${id}`) },
    title: { text: "Average Utility Rate per Property", align: "center" },
  };

  const seriesPropertyUtilities = [
    { name: "Water (cu.m)", data: waterRates },
    { name: "Electricity (kWh)", data: electricityRates },
  ];

  return (
    <div className="p-6 bg-gray-50 rounded-lg">
      {loading ? (
        <LoadingScreen />
      ) : (
        <>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            Property Management Dashboard
          </h1>
          <p className="text-gray-600 mb-6">
            Overview of your property portfolio
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
            <div className="p-5 bg-white rounded-xl shadow-sm border-l-4 border-blue-500 transition-all hover:shadow-md">
              <h3 className="text-sm font-medium text-gray-500">
                Total Receivables
              </h3>
              <p className="text-2xl font-bold text-gray-800 mt-2">
                ₱{totalReceivables?.toLocaleString() || 0}
              </p>
            </div>

            <div className="p-5 bg-white rounded-xl shadow-sm border-l-4 border-red-500 transition-all hover:shadow-md">
              <h3 className="text-sm font-medium text-gray-500">
                Total Maintenance Requests
              </h3>
              <p className="text-2xl font-bold text-gray-800 mt-2">
                {totalRequests || 0}
              </p>
            </div>

            <div className="p-5 bg-white rounded-xl shadow-sm border-l-4 border-green-500 transition-all hover:shadow-md">
              <h3 className="text-sm font-medium text-gray-500">
                Total Current Tenants
              </h3>
              <p className="text-2xl font-bold text-gray-800 mt-2">
                {totalTenants || 0}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div className="bg-white rounded-xl shadow-sm p-5 hover:shadow-md transition-shadow">
              <h3 className="text-lg font-semibold text-gray-700 mb-3">
                Tenant Occupation
              </h3>
              <Chart
                options={chartOptionsOccupation}
                series={seriesOccupation}
                type="pie"
                height={350}
              />
            </div>

            <div className="bg-white rounded-xl shadow-sm p-5 hover:shadow-md transition-shadow">
              <h3 className="text-lg font-semibold text-gray-700 mb-3">
                Property Utilities
              </h3>
              <Chart
                options={chartOptionsPropertyUtilities}
                series={seriesPropertyUtilities}
                type="bar"
                height={350}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div className="bg-white rounded-xl shadow-sm p-5 hover:shadow-md transition-shadow">
              <h3 className="text-lg font-semibold text-gray-700 mb-3">
                Utility Trends
              </h3>
              <Chart
                options={chartOptionsUtilityTrends}
                series={seriesUtilityTrends}
                type="line"
                height={350}
              />
            </div>

            <div className="bg-white rounded-xl shadow-sm p-5 hover:shadow-md transition-shadow">
              <h3 className="text-lg font-semibold text-gray-700 mb-3">
                Properties Overview
              </h3>
              {totalProperties > 0 ? (
                <Chart
                  options={chartOptions}
                  series={[{ name: "Properties", data: [totalProperties] }]}
                  type="bar"
                  height={350}
                />
              ) : (
                <div className="flex justify-center items-center h-64">
                  <p className="text-gray-500">No properties data available</p>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div className="bg-white rounded-xl shadow-sm p-5 hover:shadow-md transition-shadow">
              <h3 className="text-lg font-semibold text-gray-700 mb-3">
                Property Visits
              </h3>
              {visitData.length > 0 ? (
                <Chart
                  options={chartOptionsVisits}
                  series={[
                    {
                      name: "Visits",
                      data: visitData.map((item) => item.visitCount),
                    },
                  ]}
                  type="bar"
                  height={350}
                />
              ) : (
                <div className="flex justify-center items-center h-64">
                  <p className="text-gray-500">No visit data available</p>
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl shadow-sm p-5 hover:shadow-md transition-shadow">
              <h3 className="text-lg font-semibold text-gray-700 mb-3">
                Occupancy Rate Overall Property
              </h3>
              {loading ? (
                <div className="flex justify-center items-center h-64">
                  <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
                </div>
              ) : totalUnits > 0 ? (
                <Chart
                  options={chartOptionsOccupancy}
                  series={chartSeries}
                  type="radialBar"
                  height={250}
                />
              ) : (
                <div className="flex justify-center items-center h-64">
                  <p className="text-gray-500">No occupancy data available</p>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-sm p-5 hover:shadow-md transition-shadow">
              <h3 className="text-lg font-semibold text-gray-700 mb-3">
                Maintenance Requests
              </h3>
              {loading ? (
                <div className="flex justify-center items-center h-64">
                  <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
                </div>
              ) : data.length > 0 ? (
                <Chart
                  options={chartOptionsMaintenanceCategories}
                  series={chartSeries}
                  type="pie"
                  height={300}
                />
              ) : (
                <div className="flex justify-center items-center h-64">
                  <p className="text-gray-500">No maintenance data available</p>
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl shadow-sm p-5 hover:shadow-md transition-shadow">
              <h3 className="text-lg font-semibold text-gray-700 mb-3">
                Payment Analysis
              </h3>
              <Chart
                options={chartOptionsPayment}
                series={seriesPayment}
                type="bar"
                height={350}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default LandlordPropertyChart;
