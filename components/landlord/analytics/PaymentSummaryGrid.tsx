import Link from "next/link";
import { formatCurrency } from "@/utils/formatter/formatters";
import { usePaymentSummary } from "@/hooks/landlord/analytics/usePaymentSummary";
import { TrendingUp, ArrowDownRight, Clock } from "lucide-react";

export function PaymentSummaryGrid({ landlord_id }: { landlord_id: string }) {
    const { summary, isLoading } = usePaymentSummary(landlord_id);

    if (isLoading) {
        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                    <div
                        key={i}
                        className="bg-gray-50 rounded-xl border border-gray-200 p-4"
                    >
                        <div className="flex items-center justify-between mb-2">
                            <div className="w-10 h-10 bg-gray-200 rounded-xl animate-pulse" />
                            <div className="h-8 w-24 bg-gray-200 rounded-lg animate-pulse" />
                        </div>
                        <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
                    </div>
                ))}
            </div>
        );
    }

    const cards = [
        {
            title: "Total Collected (YTD)",
            value: formatCurrency(summary.totalCollected),
            icon: TrendingUp,
            bgColor: "bg-blue-50",
            borderColor: "border-blue-200",
            iconColor: "text-blue-600",
            valueColor: "text-blue-700",
            link: null,
        },
        {
            title: "Total Disbursed",
            value: formatCurrency(summary.totalDisbursed),
            icon: ArrowDownRight,
            bgColor: "bg-emerald-50",
            borderColor: "border-emerald-200",
            iconColor: "text-emerald-600",
            valueColor: "text-emerald-700",
            link: null,
        },
        {
            title: "Pending Disbursements",
            value: formatCurrency(summary.pendingPayouts),
            icon: Clock,
            bgColor: "bg-amber-50",
            borderColor: "border-amber-200",
            iconColor: "text-amber-600",
            valueColor: "text-amber-700",
            link: "/pages/landlord/payouts",
            hoverText: "View payout schedule",
        },
    ];

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {cards.map((card) => {
                const CardContent = (
                    <div
                        className={`relative ${card.bgColor} rounded-xl border ${card.borderColor} p-4
                        ${card.link ? "cursor-pointer group hover:shadow-md transition-all" : ""}`}
                    >
                        <div className="flex items-center justify-between mb-1">
                            <card.icon className={`w-5 h-5 ${card.iconColor}`} />
                            <span className={`text-2xl font-bold ${card.valueColor}`}>
                {card.value}
              </span>
                        </div>

                        <p className={`text-sm ${card.iconColor}`}>{card.title}</p>

                        {/* Hover helper text */}
                        {card.link && (
                            <span
                                className="absolute bottom-3 right-4 text-xs font-medium text-amber-700
                           opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                {card.hoverText}
              </span>
                        )}
                    </div>
                );

                return card.link ? (
                    <Link key={card.title} href={card.link}>
                        {CardContent}
                    </Link>
                ) : (
                    <div key={card.title}>{CardContent}</div>
                );
            })}
        </div>
    );
}
