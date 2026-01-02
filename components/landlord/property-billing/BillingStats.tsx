"use client";

export default function BillingStats({ bills }: any) {
    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6 mt-4">
            <Stat label="Total Units" value={bills.length} />
            <Stat
                label="Units With Bills"
                value={bills.filter((b: any) => b.billing_status !== "no_bill").length}
                color="text-blue-700"
            />
            <Stat
                label="Units Without Bills"
                value={bills.filter((b: any) => b.billing_status === "no_bill").length}
                color="text-red-600"
            />
            <Stat
                label="Paid"
                value={
                    bills.filter(
                        (b: any) => b.billing_status?.toLowerCase() === "paid"
                    ).length
                }
                color="text-emerald-600"
            />
            <Stat
                label="Total Amount Due"
                value={`₱${bills
                    .reduce((sum: number, b: any) => sum + +b.total_amount_due || 0, 0)
                    .toLocaleString("en-PH", { minimumFractionDigits: 2 })}`}
            />
            <Stat
                label="Billing Completion"
                value={
                    bills.length === 0
                        ? "0%"
                        : Math.round(
                        (bills.filter((b: any) => b.billing_status !== "no_bill")
                                .length /
                            bills.length) *
                        100
                    ) + "%"
                }
                color="text-purple-600"
            />
        </div>
    );
}

function Stat({ label, value, color = "text-gray-900" }: any) {
    return (
        <div className="p-4 bg-white rounded-xl shadow border border-gray-200">
            <p className="text-xs text-gray-500">{label}</p>
            <p className={`text-xl font-bold ${color}`}>{value}</p>
        </div>
    );
}
