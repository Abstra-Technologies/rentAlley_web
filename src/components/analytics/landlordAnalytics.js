import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import useAuthStore from "../../zustand/authStore"; // Zustand auth store

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

const LandlordPropertyChart = () => {
    const [totalProperties, setTotalProperties] = useState(0);
    const { user, fetchSession, loading } = useAuthStore();
    const [monthlyVisits, setMonthlyVisits] = useState([]);

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



    }, [user]); // Runs when user data is available


    const months = [
        "Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];

    // Ensure `monthlyVisits` is always an array before mapping
    const visitData = (monthlyVisits || []).map((item) => ({
        month: months[item.month - 1], // Convert 1-12 to month names
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


        </div>
    );
};

export default LandlordPropertyChart;

