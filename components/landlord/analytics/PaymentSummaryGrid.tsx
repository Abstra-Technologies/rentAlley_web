import { formatCurrency } from "@/utils/formatter/formatters";
import {usePaymentSummary} from "@/hooks/landlord/analytics/usePaymentSummary";

export function PaymentSummaryGrid({ landlord_id }: { landlord_id: string }) {
    const { summary, isLoading } = usePaymentSummary(landlord_id);

    if (isLoading) {
        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-24 bg-gray-200 rounded-xl animate-pulse" />
                ))}
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <SummaryCard
                title="Total Collected (YTD)"
                value={formatCurrency(summary.totalCollected)}
            />
            <SummaryCard
                title="Total Disbursed"
                value={formatCurrency(summary.totalDisbursed)}
            />
            <SummaryCard
                title="Pending Payouts"
                value={formatCurrency(summary.pendingPayouts)}
            />
        </div>
    );
}

function SummaryCard({
                         title,
                         value,
                         note,
                     }: {
    title: string;
    value: string;
    note?: string;
}) {
    return (
        <div className="bg-white border rounded-xl p-4">
            <p className="text-sm text-gray-500">{title}</p>
            <p className="text-xl font-bold text-gray-900 mt-1">{value}</p>
            {note && <p className="text-xs text-gray-400 mt-1">{note}</p>}
        </div>
    );
}
