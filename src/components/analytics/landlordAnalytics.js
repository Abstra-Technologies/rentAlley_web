import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import useAuthStore from "../../zustand/authStore"; // Zustand auth store

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

const LandlordPropertyChart = () => {
    const [totalProperties, setTotalProperties] = useState(0);
    const { user, fetchSession } = useAuthStore();
    const [monthlyVisits, setMonthlyVisits] = useState([]);
    const [occupancyRate, setOccupancyRate] = useState(null);
    const [loading, setLoading] = useState(true);
    const [totalUnits, setTotalUnits] = useState(0);
    const [data, setData] = useState([]);

    useEffect(() => {
        if (!user) {
            fetchSession();
            return;
        }

        fetch(`/api/analytics/landlord/getNumberofProperties?landlord_id=${user.landlord_id}`)
            .then((res) => res.json())
            .then((data) => setTotalProperties(data.totalProperties))
            .catch((error) => console.error("Error fetching property data:", error));

        fetch(`/api/analytics/landlord/getPropertyVisitsPerMonth?landlord_id=${user.landlord_id}`)
            .then((res) => res.json())
            .then((data) => {
                console.log("API Response:", data);
                setMonthlyVisits(data.visitsPerMonth || []);
            })
            .catch((error) => console.error("Error fetching visit data:", error));

        fetch(`/api/analytics/landlord/getOccupancyRate?landlord_id=${user.landlord_id}`)
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

        fetch(`/api/analytics/landlord/getMaintenanceCategories?landlord_id=${user.landlord_id}`)
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

    }, [fetchSession, user]);


    const months = [
        "Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];

    // Ensure `monthlyVisits` is always an array before mapping
    const visitData = (monthlyVisits || []).map((item) => ({
        month: months[item.month - 1],
        visitCount: item.visitCount
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

    return (
        <div>
        <div>
            {totalProperties > 0 ? (
                <Chart options={chartOptions} series={[{ name: "Properties", data: [totalProperties] }]} type="bar" height={350} />
            ) : (
                <p>Loading chart...</p>
            )}
        </div>

            <div>
                {visitData.length > 0 ? (
                    <Chart
                        options={chartOptionsVisits}
                        series={[{ name: "Visits", data: visitData.map((item) => item.visitCount) }]}
                        type="bar"
                        height={350}
                    />
                ) : (
                    <p>Loading chart...</p>
                )}
            </div>
            <div>
                <div className="p-4 bg-white shadow rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-700 mb-3">Occupancy Rate Overall Property</h3>
                    {loading ? (
                        <p>Loading...</p>
                    ) : totalUnits > 0 ? (
                        <Chart options={chartOptionsOccupancy} series={chartSeries} type="radialBar" height={250} />
                    ) : (
                        <p>No data available</p>
                    )}
                </div>


                <div className="p-4 bg-white shadow rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-700 mb-3">Maintenance Requests</h3>
                    {loading ? (
                        <p>Loading...</p>
                    ) : data.length > 0 ? (
                        <Chart options={chartOptionsMaintenanceCategories} series={chartSeries} type="pie" height={300} />
                    ) : (
                        <p>No data available</p>
                    )}
                </div>

            </div>

        </div>
    );
};

export default LandlordPropertyChart;

