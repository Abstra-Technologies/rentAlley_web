"use client";

import useSWR from "swr";
import axios from "axios";
import QRCode from "react-qr-code";
import { BackButton } from "@/components/navigation/backButton";

const fetcher = (url: string) => axios.get(url).then(res => res.data);

export default function TenantKypIdPage() {

    const { data, isLoading } = useSWR(
        "/api/tenant/kyp-id",
        fetcher
    );

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                Loading Tenant ID...
            </div>
        );
    }

    const { tenant, units, qrPayload } = data;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
            <BackButton label="Back" />

            <div className="max-w-md mx-auto bg-white rounded-2xl shadow-xl p-6 mt-6 border">

                {/* Header */}
                <div className="text-center mb-5">
                    <h1 className="text-xl font-bold text-gray-800">
                        Tenant Electronic ID
                    </h1>
                    <p className="text-sm text-gray-500">
                        Know Your Person (KYP)
                    </p>
                </div>

                {/* QR Code */}
                <div className="flex justify-center bg-gray-50 p-4 rounded-xl mb-4">
                    {/*<QRCode*/}
                    {/*    value={JSON.stringify(qrPayload)}*/}
                    {/*    size={180}*/}
                    {/*/>*/}
                </div>

                {/* Tenant Info */}
                <div className="space-y-2 text-sm">
                    <InfoRow label="Name" value={tenant.name} />
                    <InfoRow label="Email" value={tenant.email} />
                    <InfoRow label="Tenant ID" value={`T-${tenant.tenant_id}`} />
                </div>

                {/* Units */}
                <div className="mt-5">
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">
                        Active Units
                    </h3>

                    <div className="space-y-2">
                        {units.map((unit: any) => (
                            <div
                                key={unit.unit_id}
                                className="p-3 rounded-lg bg-gradient-to-r from-blue-50 to-emerald-50 border"
                            >
                                <p className="text-sm font-semibold text-gray-800">
                                    {unit.unit_name}
                                </p>
                                <p className="text-xs text-gray-600">
                                    {unit.property_name} · {unit.city}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-6 text-xs text-center text-gray-400">
                    This QR verifies active tenancy only
                </div>
            </div>
        </div>
    );
}

function InfoRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex justify-between">
            <span className="text-gray-500">{label}</span>
            <span className="font-medium text-gray-800">{value}</span>
        </div>
    );
}
