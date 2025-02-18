import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

const PropertyAnalytics = () => {
    const [propertyData, setPropertyData] = useState([]);
    const [verificationData, setVerificationData] = useState([]);

    useEffect(() => {
        fetch("/api/analytics/getPropertyTypes")
            .then(res => res.json())
            .then(data => setPropertyData(data.propertyTypes))
            .catch(error => console.error("Error fetching property data:", error));

        fetch("/api/analytics/getVerificationStatus")
            .then(res => res.json())
            .then(data => setVerificationData(data.verificationStatus))
            .catch(error => console.error("Error fetching verification data:", error));
    }, []);

    const barChartOptions = {
        chart: { type: "bar" },
        xaxis: { categories: propertyData.map(d => d.type) },
        title: { text: "Property Listings by Type" }
    };

    const barChartSeries = [{
        name: "Listings",
        data: propertyData.map(d => d.count)
    }];

    const pieChartOptions = {
        chart: { type: "pie" },
        labels: verificationData.map(d => d.status),
        title: { text: "Property Verification Status" }
    };

    const pieChartSeries = verificationData.map(d => d.count);

    return (
        <div>
            <h2>Property Analytics</h2>
            <Chart options={barChartOptions} series={barChartSeries} type="bar" height={300} width={700} />
            <Chart options={pieChartOptions} series={pieChartSeries} type="pie" height={300} width={700} />
        </div>
    );
};

export default PropertyAnalytics;
