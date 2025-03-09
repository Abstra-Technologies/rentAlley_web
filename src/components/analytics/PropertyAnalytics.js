import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

const PropertyAnalytics = () => {
    const [propertyData, setPropertyData] = useState([]);
    const [verificationData, setVerificationData] = useState([]);
    const [leaseStatus, setLeaseStatus] = useState([]);
    const [subscriptionData, setSubscriptionData] = useState([]);
    const [userData, setUserData] = useState([]);


    useEffect(() => {
        fetch("/api/analytics/getPropertyTypes")
            .then(res => res.json())
            .then(data => setPropertyData(data.propertyTypes))
            .catch(error => console.error("Error fetching property data:", error));

        fetch("/api/analytics/getVerificationStatus")
            .then(res => res.json())
            .then(data => setVerificationData(data.verificationStatus))
            .catch(error => console.error("Error fetching verification data:", error));

        fetch("/api/analytics/adminAnalytics/getLeaseActvive")
            .then((res) => res.json())
            .then((data) => {
                setLeaseStatus(data.lease_status);
            })
            .catch((error) => console.error("Error fetching lease status:", error));

        fetch("/api/analytics/adminAnalytics/getSubscriptionDistribution")
            .then((res) => res.json())
            .then((data) => {
                setSubscriptionData(data);
            })
            .catch((error) => console.error("Error fetching subscription data:", error));

        fetch("/api/analytics/adminAnalytics/getUserDistribution")
            .then((res) => res.json())
            .then((data) => {
                setUserData(data);
            })
            .catch((error) => console.error("Error fetching user data:", error));

    }, []);



    const labelsUsers = userData.map((item) => item.userType);
    const seriesUsers = userData.map((item) => item.user_count);

    const chartOptionsUsers = {
        chart: { type: "pie" },
        labelsUsers,
        title: { text: "User Distribution by Role", align: "center" },
        legend: { position: "bottom" },
        tooltip: {
            y: {
                formatter: (val, { seriesIndex }) => `${labelsUsers[seriesIndex]}: ${val} Users`,
            },
        },
    };

    const labelsSubscriptions = subscriptionData.map((item) => item.plan_name);
    const seriesSubscriptions = subscriptionData.map((item) => item.subscriber_count);

    const chartOptionsSubscriptions = {
        chart: { type: "pie" },
        labelsSubscriptions,
        title: { text: "Subscription Plan Distribution", align: "center" },
        legend: { position: "bottom" },
        tooltip: {
            y: {
                formatter: (val, { seriesIndex }) => `${labelsSubscriptions[seriesIndex]}: ${val} Subscribers`,
            },
        },
    };

    const labelsLeaase = leaseStatus.map((item) => item.status);
    const seriesLeaase = leaseStatus.map((item) => item.lease_count);



    const chartOptionsLease = {
        chart: { type: "pie" },
        labelsLeaase,
        title: { text: "Lease Status Distribution", align: "center" },
        legend: { position: "bottom" },
        tooltip: {
            y: {
                formatter: (val, { seriesIndex }) => `${labelsLeaase[seriesIndex]}: ${val} Leases`,
            },
        },
    };

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
            <Chart options={chartOptionsLease} series={seriesLeaase} type="pie" height={350} />
            <Chart options={chartOptionsSubscriptions} series={seriesSubscriptions} type="pie" height={350} />
            <Chart options={chartOptionsUsers} series={seriesUsers} type="pie" height={350} />
        </div>
    );
};

export default PropertyAnalytics;
