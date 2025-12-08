"use client";

import { useState } from "react";
import useSubscriptionData from "@/hooks/landlord/useSubscriptionData";
import { useProrate } from "@/hooks/landlord/useProrate";
import PlanCard from "@/components/subscription_pricing/PlanCard";
import CurrentSubscriptionBanner from "@/components/subscription_pricing/CurrentSubscriptionBanner";
import TrialBanner from "@/components/subscription_pricing/TrialBanner";
import ProrateNotice from "@/components/subscription_pricing/ProrateNotice";
import AddOnServices from "@/components/subscription_pricing/AddOnServices";
import FAQ from "@/components/subscription_pricing/FAQ";
import { SUBSCRIPTION_PLANS } from "@/constant/subscription/subscriptionPlans";
import Swal from "sweetalert2";
import { useRouter } from "next/navigation";
import { formatCurrency } from "@/utils/formatter/formatters";

export default function SubscriptionPlans() {
    const router = useRouter();
    const { trialUsed, currentSubscription, loading } = useSubscriptionData();
    const prorate = useProrate(currentSubscription);

    const [selectedPlan, setSelectedPlan] = useState<any>(null);
    const [proratedAmount, setProratedAmount] = useState<number>(0);

    // Add-on state
    const [selectedAddOns, setSelectedAddOns] = useState<any[]>([]);

    if (loading) return <div>Loading...</div>;

    const handleSelectPlan = (plan: any) => {
        setSelectedPlan(plan);
        setProratedAmount(prorate(plan));
        setSelectedAddOns([]); // Reset add-ons when switching plans
    };

    const handleProceed = () => {
        if (!selectedPlan) {
            Swal.fire("Plan Required", "Select a plan to continue.", "warning");
            return;
        }

        const addOnTotal = selectedAddOns.reduce((sum, a) => sum + a.price, 0);
        const finalAmount = proratedAmount + addOnTotal;

        router.push(
            `/pages/landlord/subsciption_plan/payment/review?planId=${selectedPlan.id}` +
            `&planName=${encodeURIComponent(selectedPlan.name)}` +
            `&amount=${finalAmount}` +
            `&prorated=${proratedAmount}` +
            `&addons=${encodeURIComponent(JSON.stringify(selectedAddOns))}`
        );
    };

    const addOnTotal = selectedAddOns.reduce((s, a) => s + a.price, 0);
    const finalTotal = proratedAmount + addOnTotal;

    return (
        <div className="max-w-6xl mx-auto py-12">

            {/* PAGE TITLE */}
            <h1 className="text-center text-4xl font-bold mb-6">
                Choose Your Perfect Plan
            </h1>

            <CurrentSubscriptionBanner currentSubscription={currentSubscription} />
            <TrialBanner trialUsed={trialUsed} />

            {/* ======================== PLANS ======================== */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {SUBSCRIPTION_PLANS.map((plan) => (
                    <PlanCard
                        key={plan.id}
                        plan={plan}
                        isCurrent={currentSubscription?.plan_name === plan.name}
                        isSelected={selectedPlan?.id === plan.id}
                        trialAvailable={!trialUsed}
                        onSelect={handleSelectPlan}
                    />
                ))}
            </div>

            {/* Prorated amount notice */}
            {selectedPlan && currentSubscription && (
                <ProrateNotice proratedAmount={proratedAmount} />
            )}

            {/* ======================== ADD-ONS ALWAYS VISIBLE ======================== */}
            <AddOnServices
                selectedAddOns={selectedAddOns}
                onChange={setSelectedAddOns}
                hasSelectedPlan={!!selectedPlan}
            />

            {/* ======================== SUBTOTAL CARD ======================== */}
            <div className="mt-10 bg-white shadow-md rounded-xl p-6 border border-gray-200 max-w-lg mx-auto">
                <h2 className="text-2xl font-bold mb-4">Summary</h2>

                <div className="space-y-3 text-gray-700">

                    {/* BASE PLAN */}
                    <div className="flex justify-between">
                        <span>Base Plan:</span>
                        <span className="font-semibold">
                            {selectedPlan ? formatCurrency(proratedAmount || selectedPlan.price) : "—"}
                        </span>
                    </div>

                    {/* ADD-ON TOTAL */}
                    <div className="flex justify-between">
                        <span>Add-Ons:</span>
                        <span className="font-semibold">
                            {formatCurrency(addOnTotal)}
                        </span>
                    </div>

                    <hr className="my-3" />

                    {/* GRAND TOTAL */}
                    <div className="flex justify-between text-lg font-bold">
                        <span>Total:</span>
                        <span>{formatCurrency(finalTotal)}</span>
                    </div>
                </div>

                {/* WARNING IF NO PLAN SELECTED */}
                {!selectedPlan && (
                    <p className="mt-4 text-red-500 text-sm font-medium">
                        Select a plan first to activate checkout.
                    </p>
                )}

                {/* PROCEED BUTTON */}
                <button
                    onClick={handleProceed}
                    disabled={!selectedPlan}
                    className={`w-full mt-6 px-6 py-3 rounded-lg text-white font-semibold transition
                    ${selectedPlan ? "bg-blue-600 hover:bg-blue-700" : "bg-gray-400 cursor-not-allowed"}`}
                >
                    Proceed to Checkout
                </button>
            </div>

            <FAQ />
        </div>
    );
}
