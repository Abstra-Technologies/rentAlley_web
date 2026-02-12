"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import Swal from "sweetalert2";
import { ArrowLeft } from "lucide-react";

export default function EditPlanPage() {
    const params = useParams();
    const router = useRouter();

    const id = params?.plan_id as number | undefined;

    console.log('plan id: ', id);

    const [loading, setLoading] = useState(true);

    const [plan, setPlan] = useState({
        plan_code: "",
        name: "",
        price: "",
        billing_cycle: "monthly",
        is_active: 1,
    });

    const [limits, setLimits] = useState<any>({});
    const [features, setFeatures] = useState<any>({});

    // 🔹 Fetch full plan details
    const fetchPlan = async () => {
        try {
            const res = await axios.get(`/api/systemadmin/subscription_programs/gerPlanDetails/${id}`);
            const data = res.data;

            setPlan({
                plan_code: data.plan.plan_code,
                name: data.plan.name,
                price: String(data.plan.price),
                billing_cycle: data.plan.billing_cycle,
                is_active: data.plan.is_active,
            });

            setLimits(data.limits || {});
            setFeatures(data.features || {});
        } catch {
            Swal.fire("Error", "Failed to load plan", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (id) fetchPlan();
    }, [id]);

    const handleUpdate = async () => {
        try {
            await axios.put(`/api/systemadmin/subscription_programs/gerPlanDetails/${id}`, {
                plan,
                limits,
                features,
            });

            Swal.fire("Success", "Plan updated successfully", "success");
            // router.push("/admin/plans");
        } catch (err: any) {
            Swal.fire("Error", err.response?.data?.message || "Failed", "error");
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                Loading...
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-4xl mx-auto bg-white p-8 rounded-2xl shadow-lg">

                {/* Back */}
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-gray-600 mb-6"
                >
                    <ArrowLeft size={16} />
                    Back
                </button>

                <h1 className="text-2xl font-bold mb-8">Edit Plan</h1>

                {/* ================= PLAN INFO ================= */}
                <div className="mb-10">
                    <h2 className="text-lg font-semibold mb-4">Basic Information</h2>

                    <div className="grid md:grid-cols-2 gap-4">
                        <input
                            type="text"
                            value={plan.plan_code}
                            onChange={(e) =>
                                setPlan({ ...plan, plan_code: e.target.value.toUpperCase() })
                            }
                            className="border p-2 rounded-lg"
                            placeholder="Plan Code"
                        />

                        <input
                            type="text"
                            value={plan.name}
                            onChange={(e) =>
                                setPlan({ ...plan, name: e.target.value })
                            }
                            className="border p-2 rounded-lg"
                            placeholder="Plan Name"
                        />

                        <input
                            type="number"
                            value={plan.price}
                            onChange={(e) =>
                                setPlan({ ...plan, price: e.target.value })
                            }
                            className="border p-2 rounded-lg"
                            placeholder="Price"
                        />

                        <select
                            value={plan.billing_cycle}
                            onChange={(e) =>
                                setPlan({ ...plan, billing_cycle: e.target.value })
                            }
                            className="border p-2 rounded-lg"
                        >
                            <option value="monthly">Monthly</option>
                            <option value="yearly">Yearly</option>
                            <option value="lifetime">Lifetime</option>
                        </select>

                        <div className="flex items-center gap-2 col-span-2">
                            <input
                                type="checkbox"
                                checked={plan.is_active === 1}
                                onChange={(e) =>
                                    setPlan({ ...plan, is_active: e.target.checked ? 1 : 0 })
                                }
                            />
                            <label>Active</label>
                        </div>
                    </div>
                </div>

                {/* ================= LIMITS ================= */}
                <div className="mb-10">
                    <h2 className="text-lg font-semibold mb-4">Plan Limits</h2>

                    <div className="grid md:grid-cols-2 gap-4">
                        {[
                            "max_properties",
                            "max_units",
                            "max_maintenance_request",
                            "max_billing",
                            "max_prospect",
                            "max_storage",
                            "max_assets_per_property",
                            "financial_history_years",
                        ].map((field) => (
                            <input
                                key={field}
                                type="number"
                                value={limits[field] ?? ""}
                                onChange={(e) =>
                                    setLimits({
                                        ...limits,
                                        [field]:
                                            e.target.value === ""
                                                ? null
                                                : Number(e.target.value),
                                    })
                                }
                                className="border p-2 rounded-lg"
                                placeholder={field.replace(/_/g, " ").toUpperCase()}
                            />
                        ))}
                    </div>

                    <p className="text-sm text-gray-500 mt-2">
                        Leave empty for unlimited (NULL).
                    </p>
                </div>

                {/* ================= FEATURES ================= */}
                <div className="mb-10">
                    <h2 className="text-lg font-semibold mb-4">Plan Features</h2>

                    <div className="grid md:grid-cols-2 gap-4">
                        {Object.keys(features).map((feature) => (
                            <label
                                key={feature}
                                className="flex items-center gap-3 border p-3 rounded-lg"
                            >
                                <input
                                    type="checkbox"
                                    checked={features[feature] === 1}
                                    onChange={(e) =>
                                        setFeatures({
                                            ...features,
                                            [feature]: e.target.checked ? 1 : 0,
                                        })
                                    }
                                />
                                <span className="capitalize">
                  {feature.replace(/_/g, " ")}
                </span>
                            </label>
                        ))}
                    </div>
                </div>

                {/* UPDATE BUTTON */}
                <button
                    onClick={handleUpdate}
                    className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold"
                >
                    Update Plan
                </button>

            </div>
        </div>
    );
}
