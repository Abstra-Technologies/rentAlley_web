"use client";

import { ChevronDown } from "lucide-react";

export default function PlanCard({
                                     plan,
                                     isSelected,
                                     onSelect,
                                 }: {
    plan: any;
    isSelected: boolean;
    onSelect: (plan: any) => void;
}) {
    const hasTrial = plan.trialDays && plan.trialDays > 0;
    const isFreePlan = plan.price === 0 && !hasTrial;

    /**
     * Badge rules:
     * - Free Plan → Lower transaction fee for 60 days
     * - Paid Plans with trial → 60-day free trial + discounted transaction fee
     */
    const badgeText = isFreePlan
        ? `LOWER TRANSACTION FEE: ${plan.discountedFeeRate}% FOR 60 DAYS`
        : hasTrial
            ? `${plan.trialDays}-DAY FREE TRIAL • ${plan.discountedFeeRate}% TRANSACTION FEE`
            : null;

    return (
        <div
            className={`relative rounded-xl border transition-all duration-300 bg-white
                ${isSelected ? "border-blue-600 ring-1 ring-blue-500" : "border-gray-200"}
            `}
        >
            {/* 🔴 PROMO TAG */}
            {badgeText && (
                <div className="absolute -top-3 right-4 z-10">
                    <span
                        className="inline-flex items-center px-4 py-1.5 rounded-full
                        bg-red-600 text-white text-xs font-extrabold tracking-wide shadow-lg"
                    >
                        {badgeText}
                    </span>
                </div>
            )}

            {/* HEADER */}
            <button
                onClick={() => onSelect(plan)}
                className="w-full flex items-center justify-between p-5 text-left"
            >
                <div>
                    <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                            {plan.name}
                        </h3>

                        {plan.popular && (
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                                Most Popular
                            </span>
                        )}
                    </div>

                    <p className="mt-2 text-gray-600 text-sm">
                        <span className="text-2xl font-bold text-gray-900">
                            ₱{plan.price}
                        </span>{" "}
                        / month
                    </p>
                </div>

                <ChevronDown
                    className={`w-5 h-5 transition-transform ${
                        isSelected ? "rotate-180" : ""
                    }`}
                />
            </button>

            {/* EXPANDABLE BODY */}
            <div
                className={`grid transition-all duration-300 ease-in-out
                    ${isSelected ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}
                `}
            >
                <div className="overflow-hidden px-5 pb-5">
                    <h4 className="text-xs uppercase font-semibold text-gray-500 mb-3">
                        What’s included
                    </h4>

                    <ul className="space-y-3">
                        {plan.features.map((feature: string, i: number) => (
                            <li key={i} className="flex gap-3 text-sm text-gray-700">
                                <span className="w-5 h-5 rounded-full bg-green-500 text-white flex items-center justify-center text-xs">
                                    ✓
                                </span>
                                {feature}
                            </li>
                        ))}
                    </ul>

                    {/* CTA */}
                    <button
                        className={`mt-6 w-full py-3 rounded-lg text-sm font-semibold transition
                            ${
                            isSelected
                                ? "bg-blue-600 text-white"
                                : "bg-blue-100 text-blue-700 hover:bg-blue-200"
                        }
                        `}
                    >
                        {isSelected ? "Selected" : "Select Plan"}
                    </button>
                </div>
            </div>
        </div>
    );
}
