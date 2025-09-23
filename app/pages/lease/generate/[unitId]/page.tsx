
"use client";

import { useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import { useState, useEffect } from "react";
const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false });
import "react-quill-new/dist/quill.snow.css";
import useAuthStore from "@/zustand/authStore";
import { EXTRA_EXPENSES } from "@/constant/extraExpenses";

export default function LeaseEditor() {
    const searchParams = useSearchParams();
    const { user, admin, fetchSession } = useAuthStore();

    const formatDateForInput = (dateString: string | null) => {
        if (!dateString) return "";
        try {
            return new Date(dateString).toISOString().split("T")[0];
        } catch {
            return "";
        }
    };

    // dates
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [expenses, setExpenses] = useState<{ type: string; amount: string }[]>([]);

    // search params
    const tenantName = searchParams.get("tenantName");
    const propertyName = searchParams.get("propertyName");
    const unitName = searchParams.get("unitName");
    const monthlyRent = searchParams.get("monthlyRent");

    // states
    const [step, setStep] = useState(1);
    const [depositAmount, setDepositAmount] = useState("");
    const [advanceAmount, setAdvanceAmount] = useState("");
    const [gracePeriod, setGracePeriod] = useState("3");
    const [latePenalty, setLatePenalty] = useState("1000");
    const [billingDueDay, setBillingDueDay] = useState("1");
    const [rentAmount, setRentAmount] = useState<string>("");

    const [content, setContent] = useState("");
    const [generatedFileUrl, setGeneratedFileUrl] = useState<string | null>(null);
    const [signUrl, setSignUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [fileBase64, setFileBase64] = useState<string | null>(null);

    useEffect(() => {
        const start = searchParams.get("startDate");
        const end = searchParams.get("endDate");
        if (start) setStartDate(formatDateForInput(start));
        if (end) setEndDate(formatDateForInput(end));
    }, [searchParams]);

    // Fetch rent amount from Unit table
    useEffect(() => {
        const fetchRentAmount = async () => {
            const unitId = searchParams.get("unitId");
            if (!unitId) return;
            try {
                const res = await fetch(`/api/properties/findRent/viewPropUnitDetails?rentId=${unitId}`);
                if (!res.ok) throw new Error("Failed to fetch rent amount");
                const data = await res.json();
                setRentAmount(data?.unit?.rent_amount || "");
            } catch (err) {
                console.error("Error fetching rent amount:", err);
            }
        };
        fetchRentAmount();
    }, [searchParams]);

    useEffect(() => {
        if (!user && !admin) fetchSession();
    }, [user, admin]);

    // Auto-generate contract content
    useEffect(() => {
        // Build expense items first
        const expenseItemsHtml =
            expenses.length > 0
                ? expenses
                    .filter((row) => row.type && Number(row.amount) > 0)
                    .map((row) => {
                        const label =
                            EXTRA_EXPENSES.find((e) => e.value === row.type)?.label ||
                            row.type;
                        return `<li>${label}: ₱${row.amount}</li>`;
                    })
                    .join("")
                : "<li>None</li>";

        // Now inject into the contract template
        setContent(`
    <h2 style="text-align:center; margin-bottom:20px; font-weight: bolder">CONTRACT OF LEASE</h2>
    <p>This CONTRACT OF LEASE made and executed by and between:</p>
    <p><strong>${user?.lastName} ${user?.firstName}</strong> (LESSOR)</p>
    <p>-and-</p>
    <p><strong>${tenantName || "LESSEE NAME"}</strong> (LESSEE)</p>
    <ol>
      <li>Lease period: from <strong>${startDate || "____"}</strong> to <strong>${endDate || "____"}</strong>.</li>
      <li>Monthly rent: <strong>₱${rentAmount || "____"}</strong>.</li>
      <li>Security deposit: <strong>₱${depositAmount || "____"}</strong>.</li>
      <li>Advance payment: <strong>₱${advanceAmount || "____"}</strong>.</li>
      <li>Billing Due Date: <strong>Every ${billingDueDay} of the month.</strong></li>
      <li>Grace period: <strong>${gracePeriod}</strong> days. Late penalty: <strong>₱${latePenalty}</strong> per day.</li>
      <li>Additional Expenses:
        <ul>
          ${expenseItemsHtml}
        </ul>
      </li>
    </ol>
  `);
    }, [
        tenantName,
        propertyName,
        unitName,
        startDate,
        endDate,
        monthlyRent,
        depositAmount,
        advanceAmount,
        gracePeriod,
        latePenalty,
        billingDueDay,
        user,
        expenses, // make sure expenses triggers rebuild
    ]);



    const handleAddExpense = () => {
        setExpenses([...expenses, { type: "", amount: "" }]);
    };

// Update an expense row
    const handleExpenseChange = (index: number, field: string, value: string) => {
        const updated = [...expenses];
        // @ts-ignore
        updated[index][field] = value;
        setExpenses(updated);
    };

// Remove expense row
    const handleRemoveExpense = (index: number) => {
        setExpenses(expenses.filter((_, i) => i !== index));
    };

    // Save lease + generate
    const handleSave = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/leaseAgreement/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    unitId: searchParams.get("unitId"),
                    startDate,
                    endDate,
                    securityDepositAmount: Number(depositAmount) || 0,
                    advancePaymentAmount: Number(advanceAmount) || 0,
                    gracePeriod: Number(gracePeriod) || 3,
                    latePenalty: Number(latePenalty) || 1000,
                    billingDueDay: Number(billingDueDay) || 1,
                    expenses, // 🔹 dynamic additional expenses array
                    content,
                }),
            });

            const data = await res.json();
            if (res.ok) {
                setGeneratedFileUrl(data.signedUrl);
                setFileBase64(data.fileBase64);

                // fetch tenant email
                const tenantRes = await fetch(`/api/tenant/getByUnit?unitId=${searchParams.get("unitId")}`);
                const tenantData = await tenantRes.json();
                await handleSendForSigning(
                    data.fileBase64,
                    tenantData?.email || "tenant@upkyp.local"
                );

                setStep(4);
            } else {
                alert(data.error || "Error saving lease.");
            }
        } catch (err) {
            console.error(err);
            alert("Unexpected error generating lease.");
        } finally {
            setLoading(false);
        }
    };

    const handleSendForSigning = async (fileBase64: string, tenantEmail: string) => {
        try {
            const res = await fetch("/api/leaseAgreement/generate/sendToDocuSign", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    unitId: searchParams.get("unitId"),
                    landlordEmail: user?.email,
                    tenantEmail,
                    fileBase64,
                }),
            });

            const data = await res.json();
            if (res.ok) setSignUrl(data.signUrl);
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="max-w-3xl mx-auto mt-10 bg-white shadow-lg rounded-xl p-6">
            <h1 className="text-2xl font-bold mb-4">Lease Agreement Wizard</h1>

            {/* Step indicator */}
            <div className="flex items-center mb-6 space-x-4">
                {["Step 1. Financial Terms", "Step 2. Lease Dates", "Step 3. Review & Generate", "Step 4. Sign"].map(
                    (label, index) => (
                        <div
                            key={index}
                            className={`px-3 py-1 rounded-full text-sm font-medium ${
                                step === index + 1 ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700"
                            }`}
                        >
                            {label}
                        </div>
                    )
                )}
            </div>

            {/* Step 1: Financial Terms */}
            {step === 1 && (
                <div className="space-y-6">
                    <h2 className="text-lg font-semibold text-gray-800">Financial Terms</h2>
                    <p className="text-sm text-gray-500 mb-4">
                        Set the payment requirements and penalties that apply to this lease.
                    </p>

                    {/* Monthly Rent */}
                    <label className="block">
                        Monthly Rent (₱) (Read-only)
                        <input type="number" className="w-full border rounded p-2 bg-gray-100 cursor-not-allowed" value={rentAmount} readOnly />
                    </label>

                    {/* Deposit / Advance */}
                    <label className="block">
                        Security Deposit (₱)
                        <input type="number" className="w-full border rounded p-2" value={depositAmount} onChange={(e) => setDepositAmount(e.target.value)} />
                    </label>
                    <label className="block">
                        Advance Payment (₱)
                        <input type="number" className="w-full border rounded p-2" value={advanceAmount} onChange={(e) => setAdvanceAmount(e.target.value)} />
                    </label>

                    {/* Billing Due Date */}
                    <label className="block">
                        Billing Due Date
                        <select className="w-full border rounded p-2" value={billingDueDay} onChange={(e) => setBillingDueDay(e.target.value)}>
                            {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                                <option key={day} value={day}>
                                    {day}
                                </option>
                            ))}
                        </select>
                        <p className="text-xs text-gray-500 mt-1">Select which day of the month rent is due (default: 1st).</p>
                    </label>

                    {/* Penalty Terms */}
                    <div className="mt-6">
                        <h3 className="text-md font-semibold text-gray-800">Penalty Terms</h3>
                        <p className="text-sm text-gray-500 mb-3">Grace period and daily late penalty fees.</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <label className="block">
                                Grace Period (days)
                                <input type="number" className="w-full border rounded p-2" value={gracePeriod} onChange={(e) => setGracePeriod(e.target.value)} />
                            </label>
                            <label className="block">
                                Late Penalty (₱/day)
                                <input type="number" className="w-full border rounded p-2" value={latePenalty} onChange={(e) => setLatePenalty(e.target.value)} />
                            </label>
                        </div>
                    </div>

                    {/* 🔹 Additional Expenses */}
                    {/* 🔹 Additional Expenses (Dynamic) */}
                    <div className="mt-6">
                        <h3 className="text-md font-semibold text-gray-800">Additional Expenses</h3>
                        <p className="text-sm text-gray-500 mb-3">
                            Add optional recurring fees charged together with rent.
                        </p>

                        {expenses.map((exp, index) => (
                            <div key={index} className="flex items-center space-x-3 mb-3">
                                {/* Expense Type Dropdown */}
                                <select
                                    value={exp.type}
                                    onChange={(e) => handleExpenseChange(index, "type", e.target.value)}
                                    className="w-1/2 border rounded p-2"
                                >
                                    <option value="">Select Expense</option>
                                    {EXTRA_EXPENSES.map((opt) => (
                                        <option key={opt.value} value={opt.value}>
                                            {opt.label}
                                        </option>
                                    ))}
                                </select>

                                {/* Expense Amount */}
                                <input
                                    type="number"
                                    placeholder="₱ Amount"
                                    value={exp.amount}
                                    onChange={(e) => handleExpenseChange(index, "amount", e.target.value)}
                                    className="w-1/3 border rounded p-2"
                                />

                                {/* Remove Button */}
                                <button
                                    type="button"
                                    onClick={() => handleRemoveExpense(index)}
                                    className="text-red-500 hover:text-red-700"
                                >
                                    ✕
                                </button>
                            </div>
                        ))}

                        <button
                            type="button"
                            onClick={handleAddExpense}
                            className="mt-2 text-sm text-blue-600 hover:underline"
                        >
                            + Add Expense
                        </button>
                    </div>

                    {/* Next */}
                    <button onClick={() => setStep(2)} className="bg-blue-600 text-white px-6 py-2 rounded-lg">Next</button>
                </div>
            )}

            {/* Step 2: Lease Dates */}
            {step === 2 && (
                <div className="space-y-4">
                    <label className="block">
                        Start Date
                        <input type="date" className="w-full border rounded p-2" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                    </label>
                    <label className="block">
                        End Date
                        <input type="date" className="w-full border rounded p-2" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                    </label>
                    <div className="flex justify-between">
                        <button onClick={() => setStep(1)} className="bg-gray-300 text-gray-800 px-6 py-2 rounded-lg">Back</button>
                        <button onClick={() => setStep(3)} className="bg-blue-600 text-white px-6 py-2 rounded-lg">Next</button>
                    </div>
                </div>
            )}

            {/* Step 3: Review & Generate */}
            {step === 3 && (
                <div>
                    <ReactQuill value={content} onChange={setContent} className="mb-6" theme="snow" style={{ minHeight: "300px" }} />
                    <div className="flex justify-between">
                        <button onClick={() => setStep(2)} className="bg-gray-300 text-gray-800 px-6 py-2 rounded-lg">Back</button>
                        <button onClick={handleSave} disabled={loading} className="bg-blue-600 text-white px-6 py-2 rounded-lg">
                            {loading ? "Generating..." : "Generate Lease"}
                        </button>
                    </div>
                </div>
            )}

            {/* Step 4: Sign */}
            {step === 4 && signUrl && (
                <div>
                    <h2 className="text-xl font-semibold mb-4">Sign Lease Agreement</h2>
                    <iframe src={signUrl} className="w-full h-[85vh] border rounded-xl shadow-lg" style={{ minHeight: "700px" }} />
                </div>
            )}
        </div>
    );
}
