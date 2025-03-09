import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import useAuthStore from "../../zustand/authStore";
import TenantLayout from "../navigation/sidebar-tenant";
import LandlordPropertyChart from "./landlordAnalytics";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

const TenantPropertyChart = () =>
{
    const { user, fetchSession } = useAuthStore();
    const [billingHistory, setBillingHistory] = useState([]);
    const tenant_id = user?.tenant_id;



    useEffect(() => {

        fetch(`/api/analytics/tenant/getMonthlyBillingHistory?tenant_id=${tenant_id}`)
            .then((res) => res.json())
            .then((data) => {
                setBillingHistory(data.billing_history);
            })
            .catch((error) => console.error("Error fetching billing history:", error));


    },[tenant_id, fetchSession])

    const labelsBillingHistory = billingHistory.map((item) => item.month);
    const seriesBillingHistory = [{ name: "Total Billing", data: billingHistory.map((item) => item.total_billed_amount) }];

    const chartOptionsBilling = {
        chart: { type: "line" },
        xaxis: { categories: labelsBillingHistory },
        title: { text: "Monthly Billing History", align: "center" },
    };

return(
    <div>
        <Chart options={chartOptionsBilling} series={seriesBillingHistory} type="line" height={350} />
    </div>
)
}

export default TenantPropertyChart;
