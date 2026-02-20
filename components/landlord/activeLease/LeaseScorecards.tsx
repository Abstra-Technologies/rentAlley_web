"use client";

interface Props {
    total: number;
    delta: number;
    deltaPct: number;
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
            <div className="bg-white rounded-lg sm:rounded-xl border shadow-sm
                      p-2 sm:p-4 min-w-0">
                <p className="text-[10px] sm:text-xs text-gray-500 truncate">
                    {title}
                </p>

                <p className="text-sm sm:text-2xl font-bold mt-1 truncate">
                    {value}
                </p>

                {subtitle && (
                    <p
                        className={`text-[9px] sm:text-xs mt-1 truncate ${
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
       TREND TEXT
    ================================ */

    const trendText =
        delta === 0
            ? "No change"
            : `${delta > 0 ? "+" : ""}${delta} (${deltaPct}%)`;

    const trendAccent =
        delta > 0 ? "green" : delta < 0 ? "red" : undefined;

    return (
        <div className="grid grid-cols-4 gap-2 sm:gap-4 mb-6">
            <Card
                title="Total"
                value={total}
                subtitle={trendText}
                accent={trendAccent}
            />

            <Card
                title="Active"
                value={active}
                subtitle="Healthy"
                accent="green"
            />

            <Card
                title="Expiring"
                value={expiringSoon}
                subtitle="Action"
                accent="orange"
            />

            <Card
                title="Pending"
                value={pendingSignatures}
                subtitle={pendingLabel}
                accent="blue"
            />
        </div>
    );
}