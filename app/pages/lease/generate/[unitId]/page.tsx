
// "use client";
// import { useSearchParams } from "next/navigation";
// import dynamic from "next/dynamic";
// import { useState, useEffect } from "react";
// const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false });
// import "react-quill-new/dist/quill.snow.css";
// import useAuthStore from "@/zustand/authStore";
// import { EXTRA_EXPENSES } from "@/constant/extraExpenses";
// import { PAYMENT_METHODS } from "@/constant/paymentMethods";
// import { PENALTY_TYPES } from "@/constant/penaltyTypes";
// import { RENT_INCLUSIONS } from "@/constant/rentInclusions";
// import { MAINTENANCE_CHARGES } from "@/constant/maintenanceCharges";
//
// export default function LeaseEditor() {
//     const searchParams = useSearchParams();
//     const { user, admin, fetchSession } = useAuthStore();
//
//     const formatDateForInput = (dateString: string | null) => {
//         if (!dateString) return "";
//         try {
//             return new Date(dateString).toISOString().split("T")[0];
//         } catch {
//             return "";
//         }
//     };
//
//     // dates
//     const [startDate, setStartDate] = useState("");
//     const [endDate, setEndDate] = useState("");
//     const [expenses, setExpenses] = useState<{ type: string; amount: string }[]>([]);
//
//     // search params
//     const tenantName = searchParams.get("tenantName");
//     const propertyName = searchParams.get("propertyName");
//     const unitName = searchParams.get("unitName");
//     const monthlyRent = searchParams.get("monthlyRent");
//
//     // states
//     const [step, setStep] = useState(1);
//     const [depositAmount, setDepositAmount] = useState("");
//     const [advanceAmount, setAdvanceAmount] = useState("");
//     const [gracePeriod, setGracePeriod] = useState("3");
//     const [latePenalty, setLatePenalty] = useState("1000");
//     const [billingDueDay, setBillingDueDay] = useState("1");
//     const [rentAmount, setRentAmount] = useState<string>("");
//
//     const [content, setContent] = useState("");
//     const [generatedFileUrl, setGeneratedFileUrl] = useState<string | null>(null);
//     const [signUrl, setSignUrl] = useState<string | null>(null);
//     const [loading, setLoading] = useState(false);
//     const [fileBase64, setFileBase64] = useState<string | null>(null);
//
//     useEffect(() => {
//         const start = searchParams.get("startDate");
//         const end = searchParams.get("endDate");
//         if (start) setStartDate(formatDateForInput(start));
//         if (end) setEndDate(formatDateForInput(end));
//     }, [searchParams]);
//
//     // Fetch rent amount from Unit table
//     useEffect(() => {
//         const fetchRentAmount = async () => {
//             const unitId = searchParams.get("unitId");
//             if (!unitId) return;
//             try {
//                 const res = await fetch(`/api/properties/findRent/viewPropUnitDetails?rentId=${unitId}`);
//                 if (!res.ok) throw new Error("Failed to fetch rent amount");
//                 const data = await res.json();
//                 setRentAmount(data?.unit?.rent_amount || "");
//             } catch (err) {
//                 console.error("Error fetching rent amount:", err);
//             }
//         };
//         fetchRentAmount();
//     }, [searchParams]);
//
//     useEffect(() => {
//         if (!user && !admin) fetchSession();
//     }, [user, admin]);
//
//     // Auto-generate contract content
//     useEffect(() => {
//         // Build expense items first
//         const expenseItemsHtml =
//             expenses.length > 0
//                 ? expenses
//                     .filter((row) => row.type && Number(row.amount) > 0)
//                     .map((row) => {
//                         const label =
//                             EXTRA_EXPENSES.find((e) => e.value === row.type)?.label ||
//                             row.type;
//                         return `<li>${label}: ₱${row.amount}</li>`;
//                     })
//                     .join("")
//                 : "<li>None</li>";
//
//         // Now inject into the contract template
//         setContent(`
//     <h2 style="text-align:center; margin-bottom:20px; font-weight: bolder">CONTRACT OF LEASE</h2>
//     <p>This CONTRACT OF LEASE made and executed by and between:</p>
//     <p><strong>${user?.lastName} ${user?.firstName}</strong> (LESSOR)</p>
//     <p>-and-</p>
//     <p><strong>${tenantName || "LESSEE NAME"}</strong> (LESSEE)</p>
//     <ol>
//       <li>Lease period: from <strong>${startDate || "____"}</strong> to <strong>${endDate || "____"}</strong>.</li>
//       <li>Monthly rent: <strong>₱${rentAmount || "____"}</strong>.</li>
//       <li>Security deposit: <strong>₱${depositAmount || "____"}</strong>.</li>
//       <li>Advance payment: <strong>₱${advanceAmount || "____"}</strong>.</li>
//       <li>Billing Due Date: <strong>Every ${billingDueDay} of the month.</strong></li>
//       <li>Grace period: <strong>${gracePeriod}</strong> days. Late penalty: <strong>₱${latePenalty}</strong> per day.</li>
//       <li>Additional Expenses:
//         <ul>
//           ${expenseItemsHtml}
//         </ul>
//       </li>
//     </ol>
//   `);
//     }, [
//         tenantName,
//         propertyName,
//         unitName,
//         startDate,
//         endDate,
//         monthlyRent,
//         depositAmount,
//         advanceAmount,
//         gracePeriod,
//         latePenalty,
//         billingDueDay,
//         user,
//         expenses, // make sure expenses triggers rebuild
//     ]);
//
//     const handleAddExpense = () => {
//         setExpenses([...expenses, { type: "", amount: "" }]);
//     };
//
// // Update an expense row
//     const handleExpenseChange = (index: number, field: string, value: string) => {
//         const updated = [...expenses];
//         // @ts-ignore
//         updated[index][field] = value;
//         setExpenses(updated);
//     };
//
// // Remove expense row
//     const handleRemoveExpense = (index: number) => {
//         setExpenses(expenses.filter((_, i) => i !== index));
//     };
//
//     // Save lease + generate
//     const handleSave = async () => {
//         setLoading(true);
//         try {
//             const res = await fetch("/api/leaseAgreement/generate", {
//                 method: "POST",
//                 headers: { "Content-Type": "application/json" },
//                 body: JSON.stringify({
//                     unitId: searchParams.get("unitId"),
//                     startDate,
//                     endDate,
//                     securityDepositAmount: Number(depositAmount) || 0,
//                     advancePaymentAmount: Number(advanceAmount) || 0,
//                     gracePeriod: Number(gracePeriod) || 3,
//                     latePenalty: Number(latePenalty) || 1000,
//                     billingDueDay: Number(billingDueDay) || 1,
//                     expenses, // 🔹 dynamic additional expenses array
//                     content,
//                 }),
//             });
//
//             const data = await res.json();
//             if (res.ok) {
//                 setGeneratedFileUrl(data.signedUrl);
//                 setFileBase64(data.fileBase64);
//
//                 // fetch tenant email
//                 const tenantRes = await fetch(`/api/tenant/getByUnit?unitId=${searchParams.get("unitId")}`);
//                 const tenantData = await tenantRes.json();
//                 await handleSendForSigning(
//                     data.fileBase64,
//                     tenantData?.email || "tenant@upkyp.local"
//                 );
//
//                 setStep(4);
//             } else {
//                 alert(data.error || "Error saving lease.");
//             }
//         } catch (err) {
//             console.error(err);
//             alert("Unexpected error generating lease.");
//         } finally {
//             setLoading(false);
//         }
//     };
//
//     const handleSendForSigning = async (fileBase64: string, tenantEmail: string) => {
//         try {
//             const res = await fetch("/api/leaseAgreement/generate/sendToDocuSign", {
//                 method: "POST",
//                 headers: { "Content-Type": "application/json" },
//                 body: JSON.stringify({
//                     unitId: searchParams.get("unitId"),
//                     landlordEmail: user?.email,
//                     tenantEmail,
//                     fileBase64,
//                 }),
//             });
//
//             const data = await res.json();
//             if (res.ok) setSignUrl(data.signUrl);
//         } catch (err) {
//             console.error(err);
//         }
//     };
//
//     return (
//         <div className="max-w-3xl mx-auto mt-10 bg-white shadow-lg rounded-xl p-6">
//             <h1 className="text-2xl font-bold mb-4">Lease Agreement Wizard</h1>
//
//             {/* Step indicator */}
//             <div className="flex items-center mb-6 space-x-4">
//                 {["Step 1. Tenant & Property","Step . Financial Terms", "Step . Lease Dates", "Step . Review & Generate", "Step . Sign"].map(
//                     (label, index) => (
//                         <div
//                             key={index}
//                             className={`px-3 py-1 rounded-full text-sm font-medium ${
//                                 step === index + 1 ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700"
//                             }`}
//                         >
//                             {label}
//                         </div>
//                     )
//                 )}
//             </div>
//
//             {/* Step 1: Financial Terms */}
//             {step === 1 && (
//                 <div className="space-y-6">
//                     <h2 className="text-lg font-semibold text-gray-800">Financial Terms</h2>
//                     <p className="text-sm text-gray-500 mb-4">
//                         Set the payment requirements and penalties that apply to this lease.
//                     </p>
//
//                     {/* Monthly Rent */}
//                     <label className="block">
//                         Monthly Rent (₱) (Read-only)
//                         <input type="number" className="w-full border rounded p-2 bg-gray-100 cursor-not-allowed" value={rentAmount} readOnly />
//                     </label>
//
//                     {/* Deposit / Advance */}
//                     <label className="block">
//                         Security Deposit (₱)
//                         <input type="number" className="w-full border rounded p-2" value={depositAmount} onChange={(e) => setDepositAmount(e.target.value)} />
//                     </label>
//                     <label className="block">
//                         Advance Payment (₱)
//                         <input type="number" className="w-full border rounded p-2" value={advanceAmount} onChange={(e) => setAdvanceAmount(e.target.value)} />
//                     </label>
//
//                     {/* Billing Due Date */}
//                     <label className="block">
//                         Billing Due Date
//                         <select className="w-full border rounded p-2" value={billingDueDay} onChange={(e) => setBillingDueDay(e.target.value)}>
//                             {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
//                                 <option key={day} value={day}>
//                                     {day}
//                                 </option>
//                             ))}
//                         </select>
//                         <p className="text-xs text-gray-500 mt-1">Select which day of the month rent is due (default: 1st).</p>
//                     </label>
//
//                     {/* Penalty Terms */}
//                     <div className="mt-6">
//                         <h3 className="text-md font-semibold text-gray-800">Penalty Terms</h3>
//                         <p className="text-sm text-gray-500 mb-3">Grace period and daily late penalty fees.</p>
//                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                             <label className="block">
//                                 Grace Period (days)
//                                 <input type="number" className="w-full border rounded p-2" value={gracePeriod} onChange={(e) => setGracePeriod(e.target.value)} />
//                             </label>
//                             <label className="block">
//                                 Late Penalty (₱/day)
//                                 <input type="number" className="w-full border rounded p-2" value={latePenalty} onChange={(e) => setLatePenalty(e.target.value)} />
//                             </label>
//                         </div>
//                     </div>
//
//                     {/* 🔹 Additional Expenses */}
//                     {/* 🔹 Additional Expenses (Dynamic) */}
//                     <div className="mt-6">
//                         <h3 className="text-md font-semibold text-gray-800">Additional Expenses</h3>
//                         <p className="text-sm text-gray-500 mb-3">
//                             Add optional recurring fees charged together with rent.
//                         </p>
//
//                         {expenses.map((exp, index) => (
//                             <div key={index} className="flex items-center space-x-3 mb-3">
//                                 {/* Expense Type Dropdown */}
//                                 <select
//                                     value={exp.type}
//                                     onChange={(e) => handleExpenseChange(index, "type", e.target.value)}
//                                     className="w-1/2 border rounded p-2"
//                                 >
//                                     <option value="">Select Expense</option>
//                                     {EXTRA_EXPENSES.map((opt) => (
//                                         <option key={opt.value} value={opt.value}>
//                                             {opt.label}
//                                         </option>
//                                     ))}
//                                 </select>
//
//                                 {/* Expense Amount */}
//                                 <input
//                                     type="number"
//                                     placeholder="₱ Amount"
//                                     value={exp.amount}
//                                     onChange={(e) => handleExpenseChange(index, "amount", e.target.value)}
//                                     className="w-1/3 border rounded p-2"
//                                 />
//
//                                 {/* Remove Button */}
//                                 <button
//                                     type="button"
//                                     onClick={() => handleRemoveExpense(index)}
//                                     className="text-red-500 hover:text-red-700"
//                                 >
//                                     ✕
//                                 </button>
//                             </div>
//                         ))}
//
//                         <button
//                             type="button"
//                             onClick={handleAddExpense}
//                             className="mt-2 text-sm text-blue-600 hover:underline"
//                         >
//                             + Add Expense
//                         </button>
//                     </div>
//
//                     {/* Next */}
//                     <button onClick={() => setStep(2)} className="bg-blue-600 text-white px-6 py-2 rounded-lg">Next</button>
//                 </div>
//             )}
//
//             {/* Step 2: Lease Dates */}
//             {step === 2 && (
//                 <div className="space-y-4">
//                     <label className="block">
//                         Start Date
//                         <input type="date" className="w-full border rounded p-2" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
//                     </label>
//                     <label className="block">
//                         End Date
//                         <input type="date" className="w-full border rounded p-2" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
//                     </label>
//                     <div className="flex justify-between">
//                         <button onClick={() => setStep(1)} className="bg-gray-300 text-gray-800 px-6 py-2 rounded-lg">Back</button>
//                         <button onClick={() => setStep(3)} className="bg-blue-600 text-white px-6 py-2 rounded-lg">Next</button>
//                     </div>
//                 </div>
//             )}
//
//             {/* Step 3: Review & Generate */}
//             {step === 3 && (
//                 <div>
//                     <ReactQuill value={content} onChange={setContent} className="mb-6" theme="snow" style={{ minHeight: "300px" }} />
//                     <div className="flex justify-between">
//                         <button onClick={() => setStep(2)} className="bg-gray-300 text-gray-800 px-6 py-2 rounded-lg">Back</button>
//                         <button onClick={handleSave} disabled={loading} className="bg-blue-600 text-white px-6 py-2 rounded-lg">
//                             {loading ? "Generating..." : "Generate Lease"}
//                         </button>
//                     </div>
//                 </div>
//             )}
//
//             {/* Step 4: Sign */}
//             {step === 4 && signUrl && (
//                 <div>
//                     <h2 className="text-xl font-semibold mb-4">Sign Lease Agreement</h2>
//                     <iframe src={signUrl} className="w-full h-[85vh] border rounded-xl shadow-lg" style={{ minHeight: "700px" }} />
//                 </div>
//             )}
//
//         </div>
//     );
// }

"use client";
import dynamic from "next/dynamic";
import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import useAuthStore from "@/zustand/authStore";
import { EXTRA_EXPENSES } from "@/constant/extraExpenses";
import { PAYMENT_METHODS } from "@/constant/paymentMethods";
import { PENALTY_TYPES } from "@/constant/penaltyTypes";
import { RENT_INCLUSIONS } from "@/constant/rentInclusions";
import { RENEWAL_OPTIONS } from "@/constant/renewalOptions";
import { MAINTENANCE_CHARGES } from "@/constant/maintenanceCharges";
const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false });
import "react-quill-new/dist/quill.snow.css";
import { USE_OF_PROPERTY } from "@/constant/useOfProperty";
import { MAINTENANCE_RESPONSIBILITY } from "@/constant/maintenanceResponsibility";
import { buildLeaseTemplate } from "@/utils/buildLeaseTemplate";


type TenantInfo = {
    name?: string;
    email?: string;
    phone?: string;
};

type PropertyInfo = {
    id?: string;
    name?: string;
    address?: string;
};

type UnitInfo = {
    id?: string;
    name?: string;
    property_id?: string;
    rent_amount?: number | string;
};

export default function LeaseEditor() {
    const searchParams = useSearchParams();
    const { user, fetchSession } = useAuthStore();

    // ----- Step control -----
    const [step, setStep] = useState(1);

    // ----- Part 1 state -----
    const [tenant, setTenant] = useState<TenantInfo>({});
    const [property, setProperty] = useState<PropertyInfo>({});
    const [unit, setUnit] = useState<UnitInfo>({});
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [renewalOption, setRenewalOption] = useState("fixed");
    const [renewalNoticeDays, setRenewalNoticeDays] = useState("30");

    const [depositAmount, setDepositAmount] = useState("");
    const [advanceAmount, setAdvanceAmount] = useState("");
    const [billingDueDay, setBillingDueDay] = useState("1");
    const [paymentMethods, setPaymentMethods] = useState<string[]>([]);
    const [included, setIncluded] = useState<string[]>([]);
    const [rentAmount, setRentAmount] = useState("");
    const [excludedFees, setExcludedFees] = useState<
        { key: string; amount: string }[]
    >([]);
    const [percentageIncrease, setPercentageIncrease] = useState("");

    const [gracePeriod, setGracePeriod] = useState("3");
    const [latePenalty, setLatePenalty] = useState("1000");
    const [otherPenalties, setOtherPenalties] = useState<
        { key: string; amount: string }[]
    >([]);

    const [maintenanceCharges, setMaintenanceCharges] = useState<
        { key: string; amount: string }[]
    >([]);
    const [entryNoticeDays, setEntryNoticeDays] = useState("24");
    const [useOfProperty, setUseOfProperty] = useState("residential_only");
    const [maintenanceResponsibility, setMaintenanceResponsibility] = useState("landlord_major_tenant_minor");

    const [occupancyLimit, setOccupancyLimit] = useState("2");


    const [content, setContent] = useState("");


    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState<string | null>(null);

    // ----- Utils -----
    const formatDateForInput = (dateString: string | null) => {
        if (!dateString) return "";
        const d = new Date(dateString);
        if (isNaN(d.getTime())) return "";
        return d.toISOString().split("T")[0];
    };

    const handleAddPenalty = () => {
        setOtherPenalties([...otherPenalties, { key: "", amount: "" }]);
    };

    const handlePenaltyChange = (index: number, field: string, value: string) => {
        const updated = [...otherPenalties];
        // @ts-ignore
        updated[index][field] = value;
        setOtherPenalties(updated);
    };

    const handleRemovePenalty = (index: number) => {
        setOtherPenalties(otherPenalties.filter((_, i) => i !== index));
    };

    const handleAddExcludedFee = () => {
        setExcludedFees([...excludedFees, { key: "", amount: "" }]);
    };

    const handleExcludedFeeChange = (
        index: number,
        field: string,
        value: string
    ) => {
        const updated = [...excludedFees];
        // @ts-ignore
        updated[index][field] = value;
        setExcludedFees(updated);
    };

    const handleRemoveExcludedFee = (index: number) => {
        setExcludedFees(excludedFees.filter((_, i) => i !== index));
    };

    const handleAddMaintenance = () => {
        setMaintenanceCharges([...maintenanceCharges, { key: "", amount: "" }]);
    };

    const handleMaintenanceChange = (
        index: number,
        field: string,
        value: string
    ) => {
        const updated = [...maintenanceCharges];
        // @ts-ignore
        updated[index][field] = value;
        setMaintenanceCharges(updated);
    };

    const handleRemoveMaintenance = (index: number) => {
        setMaintenanceCharges(maintenanceCharges.filter((_, i) => i !== index));
    };

    const useOfPropertyLabel =
        USE_OF_PROPERTY.find((u) => u.key === useOfProperty)?.label || useOfProperty;

    const maintenanceRespLabel =
        MAINTENANCE_RESPONSIBILITY.find((m) => m.key === maintenanceResponsibility)?.label ||
        maintenanceResponsibility;


    // ----- Prefill from URL -----
    useEffect(() => {
        // Dates (optional in URL)
        const start = searchParams.get("startDate");
        const end = searchParams.get("endDate");
        if (start) setStartDate(formatDateForInput(start));
        if (end) setEndDate(formatDateForInput(end));

        // Names (optional in URL; will be overridden by fetch if API returns values)
        const urlTenantName = searchParams.get("tenantName");
        const urlPropertyName = searchParams.get("propertyName");
        const urlUnitName = searchParams.get("unitName");

        if (urlTenantName) setTenant((t) => ({ ...t, name: urlTenantName }));
        if (urlPropertyName) setProperty((p) => ({ ...p, name: urlPropertyName }));
        if (urlUnitName) setUnit((u) => ({ ...u, name: urlUnitName }));
    }, [searchParams]);

    // ----- Auth (ensure session) -----
    useEffect(() => {
        if (!user) fetchSession();
    }, [user, fetchSession]);

    // ----- Load Unit -> Property -> Tenant by unitId -----
    useEffect(() => {
        const unitId = searchParams.get("unitId");
        if (!unitId) return;

        (async () => {
            setLoading(true);
            setErr(null);
            try {
                // 1) Get unit details (includes property_id, unit name, rent)
                const uRes = await fetch(`/api/properties/findRent/viewPropUnitDetails?rentId=${unitId}`);
                if (!uRes.ok) throw new Error("Failed to load unit details");
                const uJson = await uRes.json();
                const u = uJson?.unit || {};
                setUnit({
                    id: unitId,
                    name: u?.unit_name || unit?.name,
                    property_id: u?.property_id,
                    rent_amount: u?.rent_amount,
                });

                // 2) Get property by property_id (fallback: keep URL name)
                const propId = u?.property_id || searchParams.get("propertyId");
                if (propId) {
                    const pRes = await fetch(`/api/propertyListing/getPropDetailsById?id=${propId}`);
                    if (pRes.ok) {
                        const pJson = await pRes.json();
                        const p = pJson?.property || {};
                        setProperty({
                            id: propId,
                            name: p?.property_name || property?.name,
                            address: p?.address || "",
                        });
                        setPercentageIncrease(p?.rent_increase_percent || "0"); // 🔹 store % increase

                    }
                }



                // 3) Get tenant by unit (for name/email displayed in lease)
                const tRes = await fetch(`/api/tenant/getByUnit?unitId=${unitId}`);
                if (tRes.ok) {
                    const tJson = await tRes.json();
                    setTenant((prev) => ({
                        ...prev,
                        name: tJson?.fullName || prev.name,
                        email: tJson?.email || prev.email,
                        phone: tJson?.phone || prev.phone,
                    }));
                }
            } catch (e: any) {
                setErr(e?.message || "Error loading details");
            } finally {
                setLoading(false);
            }
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchParams]);

    useEffect(() => {
        const unitId = searchParams.get("unitId");
        if (!unitId) return;
        (async () => {
            try {
                const res = await fetch(`/api/properties/findRent/viewPropUnitDetails?rentId=${unitId}`);
                if (res.ok) {
                    const data = await res.json();
                    setRentAmount(data?.unit?.rent_amount || "");
                }
            } catch (err) {
                console.error("Error fetching rent:", err);
            }
        })();
    }, [searchParams]);

    //  review
    useEffect(() => {
        if (step === 5) {
            setContent(
                buildLeaseTemplate({
                    lessorName: `${user?.lastName} ${user?.firstName}`,
                    tenantName: tenant?.name,
                    startDate,
                    endDate,
                    rentAmount,
                    depositAmount,
                    advanceAmount,
                    billingDueDay,
                    paymentMethods,
                    included,
                    excludedFees,
                    gracePeriod,
                    latePenalty,
                    otherPenalties,
                    maintenanceCharges,
                    occupancyLimit,
                    entryNoticeDays,
                    useOfProperty,
                    maintenanceResponsibility,
                    renewalOption,
                    percentageIncrease,
                })
            );
        }
    }, [step]);

    // ----- Validation -----
    const validateStep1 = () => {
        if (!tenant?.name) return "Tenant name is required.";
        if (!property?.name) return "Property name is required.";
        if (!unit?.name) return "Unit name is required.";
        if (!startDate) return "Start date is required.";
        if (!endDate) return "End date is required.";

        const s = new Date(startDate).getTime();
        const e = new Date(endDate).getTime();
        if (isNaN(s) || isNaN(e)) return "Invalid date(s).";
        if (e <= s) return "End date must be after start date.";

        return null;
    };

    const handleNext = () => {
        const message = validateStep1();
        if (message) {
            setErr(message);
            return;
        }
        setErr(null);
        setStep(2); // 👉 proceed to Step 2 (you’ll wire this next)
    };

    // ----- UI -----
    return (
        <div className="max-w-3xl mx-auto mt-10 bg-white shadow-lg rounded-xl p-6">
            <h1 className="text-2xl font-bold mb-6">Lease Agreement Wizard</h1>

            {/* Step indicator */}
            <div className="flex flex-wrap gap-2 mb-6">
                {["1. Property & Tenant", "2. Financial Terms", "3. Penalties", "4. Maintenance & Rules", "5. Review", "6. Sign"].map(
                    (label, i) => (
                        <span
                            key={label}
                            className={`px-3 py-1 rounded-full text-sm ${
                                step === i + 1 ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-800"
                            }`}
                        >
              {label}
            </span>
                    )
                )}
            </div>

            {/* ====== STEP 1: Property & Tenant Details ====== */}
            {step === 1 && (
                <div className="space-y-6">
                    {loading && (
                        <div className="p-3 text-sm bg-blue-50 border border-blue-200 rounded">
                            Loading property, unit, and tenant details…
                        </div>
                    )}
                    {err && (
                        <div className="p-3 text-sm bg-red-50 border border-red-200 text-red-700 rounded">
                            {err}
                        </div>
                    )}

                    {/* Tenant */}
                    <div className="bg-gray-50 p-4 rounded-lg border">
                        <h2 className="font-semibold text-gray-800 mb-3">Tenant</h2>
                        <label className="block text-sm mb-1">Tenant Name (for contract)</label>
                        <input
                            type="text"
                            className="w-full border rounded p-2"
                            value={tenant.name || ""}
                            onChange={(e) => setTenant({ ...tenant, name: e.target.value })}
                            placeholder="e.g., Juan Dela Cruz"
                        />
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                            <div>
                                <label className="block text-sm mb-1">Email</label>
                                <input
                                    type="email"
                                    className="w-full border rounded p-2 bg-gray-100"
                                    value={tenant.email || ""}
                                    readOnly
                                />
                            </div>
                            <div>
                                <label className="block text-sm mb-1">Phone</label>
                                <input
                                    type="text"
                                    className="w-full border rounded p-2 bg-gray-100"
                                    value={tenant.phone || ""}
                                    readOnly
                                />
                            </div>
                        </div>
                    </div>

                    {/* Property & Unit */}
                    <div className="bg-gray-50 p-4 rounded-lg border">
                        <h2 className="font-semibold text-gray-800 mb-3">Property & Unit</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <label className="block text-sm mb-1">Property</label>
                                <input
                                    type="text"
                                    className="w-full border rounded p-2 bg-gray-100"
                                    value={property.name || ""}
                                    readOnly
                                />
                            </div>
                            <div>
                                <label className="block text-sm mb-1">Unit</label>
                                <input
                                    type="text"
                                    className="w-full border rounded p-2 bg-gray-100"
                                    value={unit.name || ""}
                                    readOnly
                                />
                            </div>
                        </div>
                        {property.address ? (
                            <div className="mt-3">
                                <label className="block text-sm mb-1">Address</label>
                                <input
                                    type="text"
                                    className="w-full border rounded p-2 bg-gray-100"
                                    value={property.address}
                                    readOnly
                                />
                            </div>
                        ) : null}
                    </div>

                    {/* Lease Dates */}
                    <div className="bg-gray-50 p-4 rounded-lg border">
                        <h2 className="font-semibold text-gray-800 mb-3">Lease Dates</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <label className="block text-sm mb-1">Start Date</label>
                                <input
                                    type="date"
                                    className="w-full border rounded p-2"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-sm mb-1">End Date</label>
                                <input
                                    type="date"
                                    className="w-full border rounded p-2"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                />
                            </div>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                            Tip: You can still adjust these before generating the contract.
                        </p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg border">
                        <h2 className="font-semibold text-gray-800 mb-3">Renewal Terms</h2>

                        <label className="block mb-2">
                            Renewal Option
                            <select
                                className="w-full border rounded p-2"
                                value={renewalOption}
                                onChange={(e) => setRenewalOption(e.target.value)}
                            >
                                {RENEWAL_OPTIONS.map((opt) => (
                                    <option key={opt.key} value={opt.key}>
                                        {opt.label}
                                    </option>
                                ))}
                            </select>
                        </label>

                        {renewalOption === "optional_notice" && (
                            <label className="block mt-3">
                                Notice Period (days before end date)
                                <input
                                    type="number"
                                    className="w-full border rounded p-2"
                                    value={renewalNoticeDays}
                                    onChange={(e) => setRenewalNoticeDays(e.target.value)}
                                />
                            </label>
                        )}
                    </div>



                    {/* Actions */}
                    <div className="flex justify-end gap-3">
                        <button
                            type="button"
                            className="px-5 py-2 rounded-lg border border-gray-300 text-gray-700"
                            onClick={() => {
                                // optional: reset fields
                                setStartDate("");
                                setEndDate("");
                            }}
                        >
                            Reset
                        </button>
                        <button
                            type="button"
                            className="px-6 py-2 rounded-lg bg-blue-600 text-white"
                            onClick={handleNext}
                        >
                            Next: Financial Terms
                        </button>
                    </div>
                </div>
            )}

            {/* ====== STEP 2: Financial Terms ====== */}
            {step === 2 && (
                <div className="space-y-6">
                    <h2 className="text-lg font-semibold text-gray-800">Financial Terms</h2>
                    <p className="text-sm text-gray-500 mb-4">
                        Define the rent, deposits, payment method, and what’s included in rent.
                    </p>

                    {/* Monthly Rent */}
                    <label className="block">
                        Monthly Rent (₱)
                        <input
                            type="number"
                            className="w-full border rounded p-2 bg-gray-100 cursor-not-allowed"
                            value={rentAmount}
                            readOnly
                        />
                    </label>

                    {/* Deposit / Advance */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <label className="block">
                            Security Deposit (₱)
                            <input
                                type="number"
                                className="w-full border rounded p-2"
                                value={depositAmount}
                                onChange={(e) => setDepositAmount(e.target.value)}
                            />
                        </label>
                        <label className="block">
                            Advance Payment (₱)
                            <input
                                type="number"
                                className="w-full border rounded p-2"
                                value={advanceAmount}
                                onChange={(e) => setAdvanceAmount(e.target.value)}
                            />
                        </label>
                    </div>

                    {/* Billing Due Date */}
                    <label className="block">
                        Billing Due Day
                        <select
                            className="w-full border rounded p-2"
                            value={billingDueDay}
                            onChange={(e) => setBillingDueDay(e.target.value)}
                        >
                            {Array.from({ length: 31 }, (_, i) => (
                                <option key={i} value={i + 1}>
                                    {i + 1}
                                </option>
                            ))}
                        </select>
                        <p className="text-xs text-gray-500 mt-1">
                            Select the day of the month rent is due.
                        </p>
                    </label>

                    {/* Percentage Increase on Renewal */}
                    <label className="block">
                        Rent Increase on Renewal (%)
                        <input
                            type="number"
                            className="w-full border rounded p-2 bg-gray-100 cursor-not-allowed"
                            value={percentageIncrease}
                            readOnly
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            This percentage increase is automatically applied upon renewal.
                            It is set at the property level during property creation and cannot be changed here.
                        </p>
                    </label>


                    {/* Payment Methods */}
                    <div>
                        <h3 className="text-md font-semibold text-gray-800 mb-2">
                            Accepted Payment Methods
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {PAYMENT_METHODS.map((pm) => (
                                <label key={pm.key} className="flex items-center space-x-2">
                                    <input
                                        type="checkbox"
                                        value={pm.key}
                                        checked={paymentMethods.includes(pm.key)}
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                setPaymentMethods([...paymentMethods, pm.key]); // add
                                            } else {
                                                setPaymentMethods(paymentMethods.filter((x) => x !== pm.key)); // remove
                                            }
                                        }}
                                    />
                                    <span>{pm.label}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Inclusions */}
                    <div>
                        <h3 className="text-md font-semibold text-gray-800 mb-2">Included in Rent</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {RENT_INCLUSIONS.map((inc) => (
                                <label key={inc.value} className="flex items-center space-x-2">
                                    <input
                                        type="checkbox"
                                        checked={included.includes(inc.value)}
                                        onChange={(e) =>
                                            setIncluded(
                                                e.target.checked
                                                    ? [...included, inc.value]
                                                    : included.filter((x) => x !== inc.value)
                                            )
                                        }
                                    />
                                    <span>{inc.label}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Excluded from Rent (Recurring Fees) */}
                    <div>
                        <h3 className="text-md font-semibold text-gray-800 mb-2">
                            Excluded from Rent (Recurring Fees)
                        </h3>
                        {excludedFees.length === 0 && (
                            <p className="text-sm text-gray-500 mb-2">
                                No excluded fees added yet. Click below to add one.
                            </p>
                        )}
                        {excludedFees.map((fee, i) => (
                            <div key={i} className="flex items-center space-x-3 mb-3">
                                {/* Fee Type Dropdown */}
                                <select
                                    value={fee.key}
                                    onChange={(e) =>
                                        handleExcludedFeeChange(i, "key", e.target.value)
                                    }
                                    className="w-1/2 border rounded p-2"
                                >
                                    <option value="">Select Fee</option>
                                    {EXTRA_EXPENSES.map((opt) => (
                                        <option key={opt.key} value={opt.key}>
                                            {opt.label}
                                        </option>
                                    ))}
                                </select>

                                {/* Amount */}
                                <input
                                    type="number"
                                    placeholder="₱ Amount"
                                    value={fee.amount}
                                    onChange={(e) =>
                                        handleExcludedFeeChange(i, "amount", e.target.value)
                                    }
                                    className="w-1/3 border rounded p-2"
                                />

                                {/* Remove Button */}
                                <button
                                    type="button"
                                    onClick={() => handleRemoveExcludedFee(i)}
                                    className="text-red-500 hover:text-red-700"
                                >
                                    ✕
                                </button>
                            </div>
                        ))}

                        <button
                            type="button"
                            onClick={handleAddExcludedFee}
                            className="mt-2 text-sm text-blue-600 hover:underline"
                        >
                            + Add Excluded Fee
                        </button>
                    </div>


                    {/* Actions */}
                    <div className="flex justify-between">
                        <button
                            onClick={() => setStep(1)}
                            className="bg-gray-300 text-gray-800 px-6 py-2 rounded-lg"
                        >
                            Back
                        </button>
                        <button
                            onClick={() => setStep(3)}
                            className="bg-blue-600 text-white px-6 py-2 rounded-lg"
                        >
                            Next: Penalties
                        </button>
                    </div>
                </div>
            )}

            {/* ====== STEP 3: Penalties ====== */}
            {step === 3 && (
                <div className="space-y-6">
                    <h2 className="text-lg font-semibold text-gray-800">Penalty Terms</h2>
                    <p className="text-sm text-gray-500 mb-4">
                        Define grace period, late penalty, and add other penalties if applicable.
                    </p>

                    {/* Grace Period & Late Penalty */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <label className="block">
                            Grace Period (days)
                            <input
                                type="number"
                                className="w-full border rounded p-2"
                                value={gracePeriod}
                                onChange={(e) => setGracePeriod(e.target.value)}
                            />
                        </label>
                        <label className="block">
                            Late Penalty (₱/day)
                            <input
                                type="number"
                                className="w-full border rounded p-2"
                                value={latePenalty}
                                onChange={(e) => setLatePenalty(e.target.value)}
                            />
                        </label>
                    </div>

                    {/* Other Penalties */}
                    <div>
                        <h3 className="text-md font-semibold text-gray-800 mb-2">
                            Other Penalties
                        </h3>
                        {otherPenalties.map((p, i) => (
                            <div key={i} className="flex items-center space-x-3 mb-3">
                                {/* Penalty Type Dropdown */}
                                <select
                                    value={p.key}
                                    onChange={(e) =>
                                        handlePenaltyChange(i, "key", e.target.value)
                                    }
                                    className="w-1/2 border rounded p-2"
                                >
                                    <option value="">Select Penalty</option>
                                    {PENALTY_TYPES.map((opt) => (
                                        <option key={opt.key} value={opt.key}>
                                            {opt.label}
                                        </option>
                                    ))}
                                </select>

                                {/* Penalty Amount */}
                                <input
                                    type="number"
                                    placeholder="₱ Amount"
                                    value={p.amount}
                                    onChange={(e) =>
                                        handlePenaltyChange(i, "amount", e.target.value)
                                    }
                                    className="w-1/3 border rounded p-2"
                                />

                                {/* Remove Button */}
                                <button
                                    type="button"
                                    onClick={() => handleRemovePenalty(i)}
                                    className="text-red-500 hover:text-red-700"
                                >
                                    ✕
                                </button>
                            </div>
                        ))}
                        <button
                            type="button"
                            onClick={handleAddPenalty}
                            className="mt-2 text-sm text-blue-600 hover:underline"
                        >
                            + Add Penalty
                        </button>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-between mt-6">
                        <button
                            onClick={() => setStep(2)}
                            className="bg-gray-300 text-gray-800 px-6 py-2 rounded-lg"
                        >
                            Back
                        </button>
                        <button
                            onClick={() => setStep(4)}
                            className="bg-blue-600 text-white px-6 py-2 rounded-lg"
                        >
                            Next: Maintenance
                        </button>
                    </div>
                </div>
            )}

            {/* ====== STEP 4: Maintenance & Other Charges ====== */}
            {step === 4 && (
                <div className="space-y-6">
                    <h2 className="text-lg font-semibold text-gray-800">Maintenance & Other Charges</h2>
                    <p className="text-sm text-gray-500 mb-4">
                        Add recurring charges that are billed separately from rent (e.g., garbage, security, HOA dues).
                    </p>

                    {maintenanceCharges.length === 0 && (
                        <p className="text-sm text-gray-500 mb-2">
                            No maintenance charges added yet. Click below to add one.
                        </p>
                    )}

                    {maintenanceCharges.map((m, i) => (
                        <div key={i} className="flex items-center space-x-3 mb-3">
                            {/* Charge Type Dropdown */}
                            <select
                                value={m.key}
                                onChange={(e) => handleMaintenanceChange(i, "key", e.target.value)}
                                className="w-1/2 border rounded p-2"
                            >
                                <option value="">Select Charge</option>
                                {MAINTENANCE_CHARGES.map((opt) => (
                                    <option key={opt.key} value={opt.key}>
                                        {opt.label}
                                    </option>
                                ))}
                            </select>

                            {/* Amount */}
                            <input
                                type="number"
                                placeholder="₱ Amount"
                                value={m.amount}
                                onChange={(e) => handleMaintenanceChange(i, "amount", e.target.value)}
                                className="w-1/3 border rounded p-2"
                            />

                            {/* Remove Button */}
                            <button
                                type="button"
                                onClick={() => handleRemoveMaintenance(i)}
                                className="text-red-500 hover:text-red-700"
                            >
                                ✕
                            </button>
                        </div>
                    ))}

                    <button
                        type="button"
                        onClick={handleAddMaintenance}
                        className="mt-2 text-sm text-blue-600 hover:underline"
                    >
                        + Add Maintenance Charge
                    </button>

                    {/* ====== Rules Section ====== */}
                    <div className="bg-gray-50 p-4 rounded-lg border space-y-4">
                        <h2 className="text-lg font-semibold text-gray-800 mb-2">Rules & Conditions</h2>

                        {/* Occupancy Limit */}
                        <label className="block">
                            Occupancy Limit
                            <input
                                type="number"
                                className="w-full border rounded p-2 mt-1"
                                value={occupancyLimit}
                                onChange={(e) => setOccupancyLimit(e.target.value)}
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Maximum number of people allowed to occupy the property.
                            </p>
                        </label>

                        {/* Entry Rights */}
                        <label className="block">
                            Entry Rights (Notice Period in Hours)
                            <input
                                type="number"
                                className="w-full border rounded p-2 mt-1"
                                value={entryNoticeDays}
                                onChange={(e) => setEntryNoticeDays(e.target.value)}
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Number of hours’ notice required before landlord entry.
                            </p>
                        </label>

                        {/* Use of Property */}
                        <label className="block">
                            Use of Property
                            <select
                                className="w-full border rounded p-2 mt-1"
                                value={useOfProperty}
                                onChange={(e) => setUseOfProperty(e.target.value)}
                            >
                                {USE_OF_PROPERTY.map((opt) => (
                                    <option key={opt.key} value={opt.key}>
                                        {opt.label}
                                    </option>
                                ))}
                            </select>
                        </label>

                        {/* Maintenance & Repairs */}
                        <label className="block">
                            Maintenance & Repairs
                            <select
                                className="w-full border rounded p-2 mt-1"
                                value={maintenanceResponsibility}
                                onChange={(e) => setMaintenanceResponsibility(e.target.value)}
                            >
                                {MAINTENANCE_RESPONSIBILITY.map((opt) => (
                                    <option key={opt.key} value={opt.key}>
                                        {opt.label}
                                    </option>
                                ))}
                            </select>
                        </label>
                    </div>


                    {/* Actions */}
                    <div className="flex justify-between mt-6">
                        <button
                            onClick={() => setStep(3)}
                            className="bg-gray-300 text-gray-800 px-6 py-2 rounded-lg"
                        >
                            Back
                        </button>
                        <button
                            onClick={() => setStep(5)}
                            className="bg-blue-600 text-white px-6 py-2 rounded-lg"
                        >
                            Next: Review
                        </button>
                    </div>
                </div>
            )}

            {/* ====== STEP 5: Review & Generate ====== */}
            {step === 5 && (
                <div>
                    <ReactQuill
                        value={content}
                        onChange={setContent}
                        theme="snow"
                        style={{ minHeight: "400px" }}
                    />

                    <div className="flex justify-between mt-6">
                        {/* Reset Button */}
                        <button
                            type="button"
                            className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300"
                            onClick={() =>
                                setContent(
                                    buildLeaseTemplate({
                                        lessorName: `${user?.lastName} ${user?.firstName}`,
                                        tenantName: tenant?.name,
                                        startDate,
                                        endDate,
                                        rentAmount,
                                        depositAmount,
                                        advanceAmount,
                                        billingDueDay,
                                        paymentMethods,
                                        included,
                                        excludedFees,
                                        gracePeriod,
                                        latePenalty,
                                        otherPenalties,
                                        maintenanceCharges,
                                        occupancyLimit,
                                        entryNoticeDays,
                                        useOfProperty,
                                        maintenanceResponsibility,
                                        renewalOption,
                                    })
                                )
                            }
                        >
                            Reset to Default Contract
                        </button>

                        {/* Generate Lease Button */}
                        <button
                            type="button"
                            className="px-6 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                            onClick={async () => {
                                try {
                                    const formattedPenalties = otherPenalties.map(p => ({
                                        type: p.key,   // rename key -> type
                                        amount: p.amount,
                                    }));

                                    const res = await fetch("/api/leaseAgreement/generate", {
                                        method: "POST",
                                        headers: { "Content-Type": "application/json" },
                                        body: JSON.stringify({
                                            unitId: searchParams.get("unitId"),
                                            tenantId: searchParams.get("tenantId"),
                                            content, // full contract HTML from Quill
                                            startDate,
                                            endDate,
                                            rentAmount,
                                            depositAmount,
                                            advanceAmount,
                                            billingDueDay,
                                            paymentMethods,
                                            included,
                                            excludedFees,
                                            gracePeriod,
                                            latePenalty,
                                            otherPenalties: formattedPenalties,
                                            maintenanceCharges,
                                            occupancyLimit,
                                            entryNoticeDays,
                                            useOfProperty,
                                            maintenanceResponsibility,
                                            renewalOption,
                                        }),
                                    });

                                    const data = await res.json();
                                    if (!res.ok) throw new Error(data.error || "Failed to generate lease");

                                    alert("Lease generated successfully!");
                                    // optional: navigate to next step
                                    setStep(6);
                                } catch (err) {
                                    console.error(err);
                                    alert("Error generating lease.");
                                }
                            }}
                        >
                            Generate Lease
                        </button>
                    </div>
                </div>
            )}



        </div>
    );
}
