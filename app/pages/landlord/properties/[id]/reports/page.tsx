"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FileDown, Wallet, Home, Wrench, ShieldCheck, FileText } from "lucide-react";
import axios from "axios";
import Swal from "sweetalert2";
import LandlordLayout from "@/components/navigation/sidebar-landlord";
import { BackButton } from "@/components/navigation/backButton";

export default function PropertyReportsPage() {
    const { id } = useParams();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [propertyName, setPropertyName] = useState("");

    useEffect(() => {
        fetchProperty();
    }, [id]);

    async function fetchProperty() {
        try {
            const res = await axios.get("/api/propertyListing/getPropDetailsById", {
                params: { property_id: id },
            });
            setPropertyName(res.data.property?.property_name || "Property Reports");
        } catch (err) {
            console.error(err);
        }
    }

    const reports = [
        {
            title: "📊 Financial Reports",
            description: "Monitor rent collection, payments, and wallet transactions.",
            items: [
                {
                    label: "Monthly Rent Collection",
                    file: `rent_collection_${id}.pdf`,
                    endpoint: `/api/reports/landlord/download?type=rent_collection&property_id=${id}`,
                },
                {
                    label: "Outstanding Balances",
                    file: `outstanding_balances_${id}.pdf`,
                    endpoint: `/api/reports/landlord/download?type=balances&property_id=${id}`,
                },
                {
                    label: "Landlord Wallet Transactions",
                    file: `wallet_transactions_${id}.csv`,
                    endpoint: `/api/reports/landlord/download?type=wallet_txn&property_id=${id}`,
                },
            ],
            icon: <Wallet className="w-5 h-5 text-emerald-600" />,
            gradient: "from-emerald-100 to-green-50",
        },
        {
            title: "🏠 Occupancy & Lease Reports",
            description: "Track occupancy, vacancies, and expiring leases.",
            items: [
                {
                    label: "Occupancy Summary",
                    file: `occupancy_${id}.pdf`,
                    endpoint: `/api/reports/landlord/download?type=occupancy&property_id=${id}`,
                },
                {
                    label: "Expiring Leases (Next 90 Days)",
                    file: `lease_expiry_${id}.csv`,
                    endpoint: `/api/reports/landlord/download?type=lease_expiry&property_id=${id}`,
                },
            ],
            icon: <Home className="w-5 h-5 text-blue-600" />,
            gradient: "from-blue-100 to-blue-50",
        },
        {
            title: "🧰 Maintenance Reports",
            description: "View request history and maintenance expenses.",
            items: [
                {
                    label: "Maintenance Request Log",
                    file: `maintenance_log_${id}.pdf`,
                    endpoint: `/api/reports/landlord/download?type=maintenance_log&property_id=${id}`,
                },
                {
                    label: "Maintenance Cost Summary",
                    file: `maintenance_costs_${id}.csv`,
                    endpoint: `/api/reports/landlord/download?type=maintenance_costs&property_id=${id}`,
                },
            ],
            icon: <Wrench className="w-5 h-5 text-orange-600" />,
            gradient: "from-orange-100 to-yellow-50",
        },
        {
            title: "📑 Compliance & Tax Reports",
            description: "Generate compliance, verification, and tax summaries.",
            items: [
                {
                    label: "Tax Summary (Form 2551Q)",
                    file: `tax_summary_${id}.pdf`,
                    endpoint: `/api/reports/landlord/download?type=tax_summary&property_id=${id}`,
                },
                {
                    label: "Property Verification Summary",
                    file: `verification_${id}.pdf`,
                    endpoint: `/api/reports/landlord/download?type=verification&property_id=${id}`,
                },
            ],
            icon: <ShieldCheck className="w-5 h-5 text-purple-600" />,
            gradient: "from-purple-100 to-indigo-50",
        },
    ];

    async function handleDownload(report) {
        try {
            setIsLoading(true);
            const response = await axios.get(report.endpoint, {
                responseType: "blob",
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", report.file);
            document.body.appendChild(link);
            link.click();
            link.remove();
            Swal.fire("Downloaded", `${report.label} has been downloaded.`, "success");
        } catch (error) {
            console.error(error);
            Swal.fire("Error", "Failed to download report.", "error");
        } finally {
            setIsLoading(false);
        }
    }

    return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 sm:p-6">

                <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 mb-6">
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">
                        Property Reports
                    </h1>
                    <p className="text-gray-600 text-sm sm:text-base">
                        Download financial, occupancy, maintenance, and compliance reports.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    {reports.map((section, idx) => (
                        <div
                            key={idx}
                            className={`p-5 rounded-2xl shadow-sm border border-gray-200 bg-gradient-to-br ${section.gradient}`}
                        >
                            <div className="flex items-center gap-2 mb-2">
                                {section.icon}
                                <h2 className="text-lg font-semibold text-gray-800">
                                    {section.title}
                                </h2>
                            </div>
                            <p className="text-sm text-gray-600 mb-3">{section.description}</p>

                            <ul className="space-y-2">
                                {section.items.map((r, i) => (
                                    <li
                                        key={i}
                                        className="flex items-center justify-between bg-white rounded-lg px-4 py-2 border border-gray-100 hover:shadow-sm transition-all"
                                    >
                    <span className="text-sm font-medium text-gray-700">
                      {r.label}
                    </span>
                                        <button
                                            onClick={() => handleDownload(r)}
                                            disabled={isLoading}
                                            className="flex items-center gap-2 text-sm font-semibold text-emerald-600 hover:text-emerald-700 transition-all"
                                        >
                                            <FileDown className="w-4 h-4" />
                                            Download
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            </div>
    );
}
