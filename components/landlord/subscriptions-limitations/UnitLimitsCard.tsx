"use client";

import { AlertTriangle, CheckCircle } from "lucide-react";

interface UnitLimitsCardProps {
    subscription: any;
    currentUnitsCount: number;
}

export default function UnitLimitsCard({
                                           subscription,
                                           currentUnitsCount,
                                       }: UnitLimitsCardProps) {

    if (!subscription) return null;

    const planName =
        subscription.plan_name || subscription.planName;

    if (planName !== "Free Plan") return null;

    const maxUnits = subscription?.listingLimits?.maxUnits ?? 0;
    const remaining = maxUnits - currentUnitsCount;
    const reachedLimit = remaining <= 0;

    return (
        <div
            className={`p-4 rounded-lg border flex items-start gap-3
        ${
                reachedLimit
                    ? "border-red-300 bg-red-50"
                    : "border-emerald-300 bg-emerald-50"
            }
      `}
        >
            {reachedLimit ? (
                <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
            ) : (
                <CheckCircle className="w-5 h-5 text-emerald-600 mt-0.5" />
            )}

            <div className="flex-1">
                <p className="font-semibold text-sm">
                    {reachedLimit
                        ? "Unit limit reached"
                        : "Unit capacity available"}
                </p>

                <p className="text-xs mt-1 text-gray-700">
                    {currentUnitsCount} / {maxUnits} units used
                </p>

                {!reachedLimit && (
                    <p className="text-xs text-emerald-700 mt-1">
                        You can still add {remaining} more unit
                        {remaining !== 1 && "s"}.
                    </p>
                )}

                {reachedLimit && (
                    <p className="text-xs text-red-700 mt-1">
                        Upgrade your subscription to add more units.
                    </p>
                )}
            </div>
        </div>
    );
}
