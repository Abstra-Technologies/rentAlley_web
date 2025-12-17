"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Page_footer from "@/components/navigation/page_footer";
import { Rocket, Mail, User, MapPin } from "lucide-react";
import useAuthStore from "@/zustand/authStore";
import axios from "axios";
import Swal from "sweetalert2";

export default function JoinBetaPage() {
    const router = useRouter();
    const { user, fetchSession } = useAuthStore();

    const [loading, setLoading] = useState(false);

    /** PH DATA */
    const [regions, setRegions] = useState<any[]>([]);
    const [provinces, setProvinces] = useState<any[]>([]);
    const [cities, setCities] = useState<any[]>([]);

    /** FORM */
    const [form, setForm] = useState({
        fullName: "",
        email: "",
        propertiesCount: "",
        avgUnitsPerProperty: "",
        region: "",
        province: "",
        city: "",
    });

    /** Fetch session */
    useEffect(() => {
        if (!user) fetchSession();
    }, [user, fetchSession]);

    /** Redirect non-landlords */
    useEffect(() => {
        if (user && user.userType !== "landlord") {
            router.replace("/unauthorized");
        }
    }, [user, router]);

    /** Load PH data */
    useEffect(() => {
        async function loadPH() {
            const regionsData = await import("philippines/regions");
            const provincesData = await import("philippines/provinces");
            const citiesData = await import("philippines/cities");

            setRegions(regionsData.default || regionsData);
            setProvinces(provincesData.default || provincesData);
            setCities(citiesData.default || citiesData);
        }
        loadPH();
    }, []);

    /** Prefill from authStore */
    useEffect(() => {
        if (user) {
            setForm((prev) => ({
                ...prev,
                fullName: `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim(),
                email: user.email ?? "",
            }));
        }
    }, [user]);

    const filteredProvinces = provinces.filter(
        (p) => p.region === form.region
    );

    const filteredCities = cities.filter(
        (c) => c.province === form.province
    );

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target;

        setForm((prev) => ({
            ...prev,
            [name]: value,
            ...(name === "region" && { province: "", city: "" }),
            ...(name === "province" && { city: "" }),
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            await axios.post("/api/landlord/beta", {
                user_id: user.user_id,
                ...form,
            });

            await Swal.fire({
                icon: "success",
                title: "Beta Request Submitted 🚀",
                text: "Your request is under review. We’ll notify you once it’s approved.",
                confirmButtonColor: "#2563eb", // blue-600
            });

            router.push("/pages/landlord/dashboard");

        } catch (err: any) {
            if (err.response?.status === 409) {
                await Swal.fire({
                    icon: "info",
                    title: "Beta Request Already Exists",
                    text: `Your beta request is currently "${err.response.data.status}".`,
                    confirmButtonColor: "#2563eb",
                });

                router.push(
                    `/pages/landlord/beta-program?status=${err.response.data.status}`
                );
            } else {
                await Swal.fire({
                    icon: "error",
                    title: "Submission Failed",
                    text: "Something went wrong. Please try again later.",
                    confirmButtonColor: "#dc2626", // red-600
                });
            }
        } finally {
            setLoading(false);
        }
    };


    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50 px-4 py-6">
            <div className="max-w-xl mx-auto bg-white rounded-3xl shadow-xl border border-gray-100 p-6 sm:p-8">

                {/* Header */}
                <div className="text-center mb-6">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full
            bg-gradient-to-r from-blue-600 to-emerald-600 text-white text-xs font-bold shadow">
            🚀 JOIN UPKYP BETA
          </span>

                    <h1 className="mt-3 text-2xl sm:text-3xl font-extrabold text-gray-900">
                        Request Beta Access
                    </h1>

                    <p className="mt-2 text-sm text-gray-600">
                        Landlord-only beta with discounted transaction fees
                    </p>
                </div>

                {/* FORM */}
                <form onSubmit={handleSubmit} className="space-y-4">

                    {/* Full Name */}
                    <Input label="Full Name" icon={<User />} name="fullName" value={form.fullName} disabled />

                    {/* Email */}
                    <Input label="Email Address" icon={<Mail />} name="email" value={form.email} disabled />

                    {/* Properties Count */}
                    <Input
                        label="Number of Properties Managed"
                        name="propertiesCount"
                        value={form.propertiesCount}
                        onChange={handleChange}
                        type="number"
                        required
                    />

                    {/* Avg Units */}
                    <Input
                        label="Average Units per Property"
                        name="avgUnitsPerProperty"
                        value={form.avgUnitsPerProperty}
                        onChange={handleChange}
                        type="number"
                        required
                    />

                    {/* Region */}
                    <Select
                        label="Region"
                        name="region"
                        value={form.region}
                        onChange={handleChange}
                        options={regions.map((r) => ({ value: r.key, label: r.name }))}
                        required
                    />

                    {/* Province */}
                    <Select
                        label="Province"
                        name="province"
                        value={form.province}
                        onChange={handleChange}
                        options={filteredProvinces.map((p) => ({ value: p.key, label: p.name }))}
                        disabled={!form.region}
                        required
                    />

                    {/* City */}
                    <Select
                        label="City / Municipality"
                        name="city"
                        value={form.city}
                        onChange={handleChange}
                        options={filteredCities.map((c) => ({ value: c.key, label: c.name }))}
                        disabled={!form.province}
                        required
                    />

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full mt-4 px-6 py-3 rounded-xl text-white font-semibold
            bg-gradient-to-r from-blue-600 to-emerald-600
            hover:from-blue-700 hover:to-emerald-700
            shadow-lg transition disabled:opacity-60"
                    >
                        {loading ? "Submitting..." : "Join Beta"}
                    </button>
                </form>

                <p className="mt-5 text-center text-[11px] text-gray-500">
                    Discounted transaction fees apply during beta.
                </p>
            </div>

            <div className="mt-10">
                <Page_footer />
            </div>
        </div>
    );
}

/* ===== Reusable Inputs ===== */

function Input({ label, icon, ...props }: any) {
    return (
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
            <div className="relative">
                {icon && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">{icon}</span>}
                <input
                    {...props}
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300
          focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:bg-gray-100"
                />
            </div>
        </div>
    );
}

function Select({ label, options, ...props }: any) {
    return (
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
            <select
                {...props}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300
        focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:bg-gray-100"
            >
                <option value="">Select {label}</option>
                {options.map((o: any) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                ))}
            </select>
        </div>
    );
}
