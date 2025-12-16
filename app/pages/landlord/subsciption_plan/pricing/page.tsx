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
    const [selectedAddOns, setSelectedAddOns] = useState<any[]>([]);

    if (loading) return <div className="text-center py-20">Loading…</div>;

    const handleSelectPlan = (plan: any) => {
        setSelectedPlan(plan);
        setProratedAmount(prorate(plan));
        setSelectedAddOns([]);
    };

    const addOnTotal = selectedAddOns.reduce((s, a) => s + a.price, 0);
    const finalTotal = proratedAmount + addOnTotal;

    const handleProceed = () => {
        if (!selectedPlan) {
            Swal.fire("Plan Required", "Select a plan to continue.", "warning");
            return;
        }

        router.push(
            `/pages/landlord/subsciption_plan/payment/review?planId=${selectedPlan.id}` +
            `&planName=${encodeURIComponent(selectedPlan.name)}` +
            `&amount=${finalTotal}` +
            `&prorated=${proratedAmount}` +
            `&addons=${encodeURIComponent(JSON.stringify(selectedAddOns))}`
        );
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            {/* Header */}
            <div className="text-center mb-10">
                <h1 className="text-3xl sm:text-4xl font-bold">
                    Choose Your Perfect Plan
                </h1>
                <p className="mt-2 text-gray-600 text-sm sm:text-base">
                    Upgrade anytime. Transparent pricing. No hidden fees.
                </p>
            </div>

            <CurrentSubscriptionBanner currentSubscription={currentSubscription} />
            <TrialBanner trialUsed={trialUsed} />

            {/* Main Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-10">
                {/* LEFT CONTENT */}
                <div className="lg:col-span-2 space-y-10">
                    {/* Plans */}
                    <section>
                        <h2 className="text-xl font-semibold mb-4">Plans</h2>

                        <div className="flex flex-col gap-4 max-w-3xl">
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


                    </section>

                    {/* Proration */}
                    {selectedPlan && currentSubscription && (
                        <ProrateNotice proratedAmount={proratedAmount} />
                    )}

                    {/* Add-ons */}
                    <section>
                        <h2 className="text-xl font-semibold mb-4">Add-on Services</h2>
                        <AddOnServices
                            selectedAddOns={selectedAddOns}
                            onChange={setSelectedAddOns}
                            hasSelectedPlan={!!selectedPlan}
                        />
                    </section>
                </div>

                {/* SUMMARY (Sticky Desktop) */}
                <aside className="lg:sticky lg:top-24 h-fit">
                    <div className="bg-white border rounded-2xl shadow-md p-6">
                        <h3 className="text-lg font-bold mb-4">Summary</h3>

                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between">
                                <span>Plan</span>
                                <span className="font-semibold">
                  {selectedPlan
                      ? formatCurrency(proratedAmount || selectedPlan.price)
                      : "—"}
                </span>
                            </div>

                            <div className="flex justify-between">
                                <span>Add-ons</span>
                                <span className="font-semibold">
                  {formatCurrency(addOnTotal)}
                </span>
                            </div>

                            <hr />

                            <div className="flex justify-between text-base font-bold">
                                <span>Total</span>
                                <span>{formatCurrency(finalTotal)}</span>
                            </div>
                        </div>

                        {!selectedPlan && (
                            <p className="mt-4 text-xs text-red-500">
                                Select a plan to continue
                            </p>
                        )}

                        <button
                            onClick={handleProceed}
                            disabled={!selectedPlan}
                            className={`w-full mt-6 py-3 rounded-lg text-white font-semibold transition ${
                                selectedPlan
                                    ? "bg-blue-600 hover:bg-blue-700"
                                    : "bg-gray-400 cursor-not-allowed"
                            }`}
                        >
                            Proceed to Checkout
                        </button>
                    </div>
                </aside>
            </div>

            {/* MOBILE FIXED CTA */}
            <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg p-4">
                <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold">Total</span>
                    <span className="font-bold">
            {formatCurrency(finalTotal)}
          </span>
                </div>

                <button
                    onClick={handleProceed}
                    disabled={!selectedPlan}
                    className={`w-full py-3 rounded-lg text-white font-semibold ${
                        selectedPlan
                            ? "bg-blue-600"
                            : "bg-gray-400 cursor-not-allowed"
                    }`}
                >
                    Proceed to Checkout
                </button>
            </div>

            <div className="mt-20">
                <FAQ />
            </div>
        </div>
    );
}
