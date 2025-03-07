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

    const chartDataOccupancy = {
        series: totalUnits > 0 ? [occupancyRate] : [0],
        options: {
            chart: {
                type: "radialBar",
                height: 350
            },
            plotOptions: {
                radialBar: {
                    hollow: {
                        size: "70%",
                    },
                    dataLabels: {
                        name: {
                            show: false
                        },
                        value: {
                            fontSize: "24px",
                            formatter: (val) => (totalUnits > 0 ? `${val.toFixed(2)}%` : "0%")
                        }
                    }
                }
            },
            labels: ["Occupancy Rate"],
            title: {
                text: totalUnits > 0 ? `Total Units: ${totalUnits}` : "No Data Available",
                align: "center",
                margin: 20,
                style: {
                    fontSize: "16px",
                    fontWeight: "bold"
                }
            }
        }
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
                    <h3>Overall Occupancy Rate</h3>
                    <Chart options={chartDataOccupancy.options} series={chartDataOccupancy.series} type="radialBar" height={350} />

            </div>

        </div>
    );
};

export default LandlordPropertyChart;

