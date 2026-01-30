"use client";

import useSWR from "swr";
import axios from "axios";
import { useEffect, useState } from "react";
import { BackButton } from "@/components/navigation/backButton";
import useAuthStore from "@/zustand/authStore";

const fetcher = (url: string) => axios.get(url).then(res => res.data);

type Tab = "id" | "history";

export default function TenantKypIdPage() {
    const { user, admin, fetchSession } = useAuthStore();

    const [ready, setReady] = useState(false);
    const [activeTab, setActiveTab] = useState<Tab>("id");
    const [activeIndex, setActiveIndex] = useState(0);

    /* ================= AUTH ================= */
    useEffect(() => {
        fetchSession().then(() => setReady(true));
    }, [fetchSession]);

    /* ================= DATA ================= */
    const { data, isLoading, error } = useSWR(
        ready && user?.tenant_id
            ? `/api/tenant/activeRent/kypId?tenant_id=${user.tenant_id}`
            : null,
        fetcher
    );

    /* ================= GUARDS ================= */
    if (!ready || isLoading) return <Centered>Loading Tenant ID…</Centered>;

    if (!user || admin || !user.tenant_id)
        return <Centered>Tenant access only</Centered>;

    if (error || !data)
        return <Centered error>Failed to load Tenant ID</Centered>;

    const { tenant, units } = data;
    const activeUnit = units[activeIndex];

    const next = () =>
        setActiveIndex((i) => (i + 1) % units.length);

    const prev = () =>
        setActiveIndex((i) => (i - 1 + units.length) % units.length);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
            <BackButton label="Back" />

            <div className="max-w-md mx-auto bg-white rounded-3xl shadow-xl p-5 mt-6">

                {/* HEADER */}
                <div className="text-center mb-5">
                    <h1 className="text-xl font-bold text-gray-800">
                        Tenant Electronic ID
                    </h1>
                    <p className="text-xs text-gray-500">
                        Know Your Person (KYP)
                    </p>
                </div>

                {/* TABS */}
                <div className="flex bg-gray-100 rounded-lg p-1 mb-6">
                    <TabButton active={activeTab === "id"} onClick={() => setActiveTab("id")}>
                        KYP ID
                    </TabButton>
                    <TabButton active={activeTab === "history"} onClick={() => setActiveTab("history")}>
                        Scan History
                    </TabButton>
                </div>

                {/* ================= ID TAB ================= */}
                {activeTab === "id" && (
                    <>
                        {/* CARD STACK */}
                        <div className="relative h-[440px]">
                            {units.map((unit: any, index: number) => (
                                <div
                                    key={unit.unit_id}
                                    className="absolute inset-0 transition-all duration-500"
                                    style={{
                                        transform: `
                                            translateX(${(index - activeIndex) * 14}px)
                                            scale(${index === activeIndex ? 1 : 0.94})
                                        `,
                                        opacity: index === activeIndex ? 1 : 0.5,
                                        zIndex: units.length - index,
                                    }}
                                >
                                    <KypCard unit={unit} active={index === activeIndex} />
                                </div>
                            ))}
                        </div>

                        {/* CONTROLS */}
                        <div className="flex justify-between mt-4">
                            <NavButton onClick={prev}>←</NavButton>
                            <NavButton onClick={next}>→</NavButton>
                        </div>

                        {/* INFO */}
                        {activeUnit && (
                            <div className="mt-6 space-y-2 text-sm">
                                <InfoRow label="Tenant" value={tenant.name} />
                                <InfoRow label="Email" value={tenant.email} />
                                <InfoRow label="Unit" value={activeUnit.unit_name} />
                                <InfoRow
                                    label="Property"
                                    value={`${activeUnit.property_name} · ${activeUnit.city}`}
                                />
                                <InfoRow label="Tenant ID" value={`T-${user.tenant_id}`} />
                            </div>
                        )}
                    </>
                )}

                {/* ================= HISTORY TAB ================= */}
                {activeTab === "history" && (
                    <div className="py-12 text-center text-sm text-gray-500">
                        <p className="font-medium text-gray-600">
                            No scan history yet
                        </p>
                        <p className="text-xs mt-1">
                            Scan logs will appear here once your ID is used.
                        </p>
                    </div>
                )}

                {/* FOOTER */}
                <div className="mt-6 text-xs text-center text-gray-400">
                    This QR verifies active tenancy only
                </div>
            </div>
        </div>
    );
}

/* ================= CARD ================= */

function KypCard({ unit, active }: { unit: any; active: boolean }) {
    const isActive = unit.ekyp_status === "active";

    return (
        <div
            className={`
                h-full rounded-3xl p-5 transition-all duration-500
                ${isActive
                ? "bg-gradient-to-br from-indigo-500 via-blue-500 to-emerald-500"
                : "bg-gradient-to-br from-slate-900 via-black to-black"}
                ${active ? "shadow-2xl" : ""}
            `}
        >
            {/* QR */}
            <div className="flex justify-center mt-8">
                {isActive && unit.qr_url ? (
                    <img
                        src={unit.qr_url}
                        alt="KYP QR"
                        className="w-44 h-44 bg-white p-2 rounded-2xl shadow-xl"
                    />
                ) : (
                    <div
                        className="w-44 h-44 rounded-2xl
                            bg-slate-800 border border-slate-700
                            flex items-center justify-center
                            text-xs text-gray-300 text-center px-4"
                    >
                        ID NOT YET ACTIVATED
                    </div>
                )}
            </div>

            {/* DETAILS */}
            <div className="mt-8 text-center text-white">
                <p className="text-lg font-bold">{unit.unit_name}</p>
                <p className="text-xs text-gray-300">
                    {unit.property_name} · {unit.city}
                </p>
            </div>

            {/* STATUS */}
            <div className="mt-4 flex justify-center">
                <span
                    className={`px-4 py-1 text-xs rounded-full font-semibold
                        ${isActive
                        ? "bg-white text-gray-900"
                        : "bg-slate-800 text-gray-300"}
                    `}
                >
                    {unit.ekyp_status.toUpperCase()}
                </span>
            </div>
        </div>
    );
}

/* ================= UI PARTS ================= */

function TabButton({
                       active,
                       children,
                       onClick,
                   }: {
    active: boolean;
    children: React.ReactNode;
    onClick: () => void;
}) {
    return (
        <button
            onClick={onClick}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition
                ${active ? "bg-white shadow text-gray-800" : "text-gray-500"}
            `}
        >
            {children}
        </button>
    );
}

function InfoRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex justify-between gap-3">
            <span className="text-gray-500">{label}</span>
            <span className="font-medium text-gray-800 text-right">
                {value}
            </span>
        </div>
    );
}

function NavButton({
                       children,
                       onClick,
                   }: {
    children: React.ReactNode;
    onClick: () => void;
}) {
    return (
        <button
            onClick={onClick}
            className="px-5 py-2 rounded-full bg-gray-100
                hover:bg-gray-200 transition font-semibold"
        >
            {children}
        </button>
    );
}

function Centered({
                      children,
                      error,
                  }: {
    children: React.ReactNode;
    error?: boolean;
}) {
    return (
        <div
            className={`min-h-screen flex items-center justify-center text-sm
                ${error ? "text-red-600" : "text-gray-500"}
            `}
        >
            {children}
        </div>
    );
}
