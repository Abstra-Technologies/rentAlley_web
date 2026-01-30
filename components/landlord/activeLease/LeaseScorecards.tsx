"use client";

interface Props {
    total: number;

    // 🔹 from API
    delta: number;        // + / - count vs last month
    deltaPct: number;     // percentage change

    active: number;
    expiringSoon: number;
    pendingSignatures: number;
    pendingLabel?: string;
}

export default function LeaseScorecards({
                                            total,
                                            delta,
                                            deltaPct,
                                            active,
                                            expiringSoon,
                                            pendingSignatures,
                                            pendingLabel = "Awaiting tenant",
                                        }: Props) {
    const Card = ({
                      title,
                      value,
                      subtitle,
                      accent,
                  }: {
        title: string;
        value: number;
        subtitle?: string;
        accent?: "green" | "orange" | "blue" | "red";
    }) => {
        const accentMap = {
            green: "text-green-600",
            orange: "text-orange-600",
            blue: "text-blue-600",
            red: "text-red-600",
        };

        return (
            <div className="bg-white rounded-xl border shadow-sm p-4">
                <p className="text-xs text-gray-500">{title}</p>
                <p className="text-2xl font-bold mt-1">{value}</p>
                {subtitle && (
                    <p
                        className={`text-xs mt-1 ${
                            accent ? accentMap[accent] : "text-gray-400"
                        }`}
                    >
                        {subtitle}
                    </p>
                )}
            </div>
        );
    };

    /* ===============================
       TREND TEXT (API-DRIVEN)
    ================================ */
    const trendText =
        delta === 0
            ? "No change from last month"
            : `${delta > 0 ? "+" : ""}${delta} (${deltaPct}%) from last month`;

    const trendAccent =
        delta > 0 ? "green" : delta < 0 ? "red" : undefined;

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {/* Total leases */}
            <Card
                title="Total Leases"
                value={total}
                subtitle={trendText}
                accent={trendAccent}
            />

            {/* Active */}
            <Card
                title="Active & Healthy"
                value={active}
                subtitle="of total"
                accent="green"
            />

            {/* Expiring */}
            <Card
                title="Expiring Soon"
                value={expiringSoon}
                subtitle="Action required"
                accent="orange"
            />

            {/* Pending signatures */}
            <Card
                title="Pending Signatures"
                value={pendingSignatures}
                subtitle={pendingLabel}
                accent="blue"
            />
        </div>
    );
}
