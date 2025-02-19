import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import useAuthStore from "../../pages/zustand/authStore"; // Zustand auth store

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

const LandlordPropertyChart = () => {
    const [totalProperties, setTotalProperties] = useState(0);
    const { user, fetchSession, loading } = useAuthStore();

    useEffect(() => {
        if (!user) {
            fetchSession();
            return;
        }

        fetch(`/api/analytics/landlord/getNumberofProperties?landlord_id=${user.landlord_id}`)
            .then((res) => res.json())
            .then((data) => setTotalProperties(data.totalProperties))
            .catch((error) => console.error("Error fetching property data:", error));
    }, [user]); // Runs when user data is available

    const chartOptions = {
        chart: { type: "bar" },
        xaxis: { categories: ["Your Properties"] },
        title: { text: "Total Number of Properties Listed" },
        colors: ["#6A0DAD"],
    };

    return (
        <div>
            {totalProperties > 0 ? (
                <Chart options={chartOptions} series={[{ name: "Properties", data: [totalProperties] }]} type="bar" height={350} />
            ) : (
                <p>Loading chart...</p>
            )}
        </div>
    );
};

export default LandlordPropertyChart;

