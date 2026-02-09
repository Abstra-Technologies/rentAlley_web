"use client";

import { BackButton } from "@/components/navigation/backButton";
import {
    ArrowRight,
    CreditCard,
    CheckCircle,
    CalendarClock,
    Wallet,
    Info,
} from "lucide-react";

export default function PaymentPayoutGuidePage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-blue-50 to-purple-50 p-4 sm:p-6">
            {/* Back */}
            <div className="mb-4">
                <BackButton label="Back to Guide" />
            </div>

            {/* Header */}
            <div className="relative bg-white rounded-2xl shadow-xl p-6 mb-8 border border-gray-100 overflow-hidden">
                <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-emerald-500 via-blue-500 to-purple-500" />
                <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-800">
                    Payment & Payout Process
                </h1>
                <p className="text-gray-600 mt-2 max-w-3xl">
                    This guide explains how tenant payments are processed through Xendit
                    and how payouts are disbursed to landlords via UPKYP.
                </p>
            </div>

            {/* Flow Section */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-10">
                <h2 className="text-xl font-bold text-gray-800 mb-6">
                    Payment to Payout Flow
                </h2>

                <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
                    {/* Step 1 */}
                    <FlowCard
                        icon={<CreditCard className="h-7 w-7 text-blue-600" />}
                        title="Tenant Makes Payment"
                        description="Tenant pays rent or billing through Xendit-supported payment methods."
                        color="bg-blue-100"
                    />

                    <Arrow />

                    {/* Step 2 */}
                    <FlowCard
                        icon={<CheckCircle className="h-7 w-7 text-emerald-600" />}
                        title="Xendit Processes Payment"
                        description="Xendit securely processes and confirms the payment transaction."
                        color="bg-emerald-100"
                    />

                    <Arrow />

                    {/* Step 3 */}
                    <FlowCard
                        icon={<CalendarClock className="h-7 w-7 text-purple-600" />}
                        title="UPKYP Disbursement Processing"
                        description="UPKYP consolidates payments and prepares disbursement every 15th of the following month."
                        color="bg-purple-100"
                    />

                    <Arrow />

                    {/* Step 4 */}
                    <FlowCard
                        icon={<Wallet className="h-7 w-7 text-amber-600" />}
                        title="Payout to Landlord"
                        description="Funds are disbursed to the landlord’s registered payout account."
                        color="bg-amber-100"
                    />
                </div>
            </div>

            {/* Additional Information */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-gray-100">
                        <Info className="h-5 w-5 text-gray-600" />
                    </div>
                    <h2 className="text-lg font-bold text-gray-800">
                        Important Information
                    </h2>
                </div>

                <ul className="space-y-3 text-gray-700">
                    <li>
                        • All tenant payments are processed securely through <strong>Xendit</strong>.
                    </li>
                    <li>
                        • UPKYP does not release payouts immediately after payment confirmation.
                    </li>
                    <li>
                        • Disbursement is processed <strong>every 15th day of the following month</strong>.
                    </li>
                    <li>
                        • Only <strong>successful and confirmed payments</strong> are included in the payout.
                    </li>
                    <li>
                        • Failed, reversed, or disputed payments are automatically excluded.
                    </li>
                    <li>
                        • Landlords can track payment status and payout history inside their dashboard.
                    </li>
                </ul>
            </div>
        </div>
    );
}

/* Flow Card Component */
function FlowCard({
                      icon,
                      title,
                      description,
                      color,
                  }: {
    icon: React.ReactNode;
    title: string;
    description: string;
    color: string;
}) {
    return (
        <div className="flex flex-col items-center text-center max-w-xs">
            <div className={`p-4 rounded-2xl shadow-md ${color} mb-4`}>
                {icon}
            </div>
            <h3 className="font-bold text-gray-800 mb-2">{title}</h3>
            <p className="text-sm text-gray-600">{description}</p>
        </div>
    );
}

/* Arrow Component */
function Arrow() {
    return (
        <ArrowRight className="hidden lg:block h-6 w-6 text-gray-400 flex-shrink-0" />
    );
}
