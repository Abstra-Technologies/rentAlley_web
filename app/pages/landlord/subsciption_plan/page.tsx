"use client";
import { useState, useEffect } from "react";
import { Sparkles, ScrollText, ShieldCheck, CreditCard } from "lucide-react";
import LandlordSubscriptionPlanComponent from "@/components/landlord/subscrription";
import LandlordPastSubscriptionsComponent from "@/components/landlord/widgets/LandlordPastSubscriptionsComponent";
import useAuthStore from "@/zustand/authStore";

export default function LandlordSubscriptionPlan() {
  const { fetchSession, user } = useAuthStore();
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState("upgrade");

  useEffect(() => {
    if (!user) fetchSession();
  }, [user]);

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-emerald-50">
      <main className="flex-1 p-4 sm:p-6 lg:p-10">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* HEADER */}
          <div className="bg-white/80 backdrop-blur-md border border-gray-200 rounded-2xl shadow-md p-6 lg:p-8 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-emerald-500"></div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight mb-2">
                  Your Subscription
                </h1>
                <p className="text-gray-600 max-w-md">
                  Manage your plan, review policies, and view your billing
                  history.
                </p>
              </div>

              <div className="mt-4 sm:mt-0 flex gap-3">
                <button
                  onClick={() => setShowModal(true)}
                  className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition"
                >
                  View Policies
                </button>
              </div>
            </div>
          </div>

          {/* CURRENT PLAN CARD */}
          <section className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <header className="flex items-center gap-3 p-6 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-emerald-50">
              <ShieldCheck className="w-6 h-6 text-blue-600" />
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                Your Current Plan
              </h2>
            </header>

            <div className="p-6">
              <LandlordSubscriptionPlanComponent
                landlord_id={user?.landlord_id}
              />
            </div>
          </section>

          {/* PAST SUBSCRIPTIONS */}
          <section className="bg-white rounded-2xl shadow-sm border border-gray-200">
            <header className="flex items-center gap-3 p-6 border-b border-gray-100 bg-gradient-to-r from-emerald-50 to-blue-50">
              <CreditCard className="w-6 h-6 text-emerald-600" />
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                Past Subscriptions
              </h2>
            </header>
            <div className="p-6">
              <LandlordPastSubscriptionsComponent
                landlord_id={user?.landlord_id}
              />
            </div>
          </section>
        </div>
      </main>

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 relative animate-fadeIn">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>

            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <ScrollText className="w-6 h-6 text-blue-600" /> Subscription
              Policies
            </h2>

            {/* Tab Buttons */}
            <div className="flex gap-2 border-b border-gray-200 mb-6">
              {[
                { id: "upgrade", label: "Upgrade Policy" },
                { id: "trial", label: "Free Trial" },
                { id: "refund", label: "Refund Policy" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 text-sm font-medium rounded-t-md transition-all ${
                    activeTab === tab.id
                      ? "bg-gradient-to-r from-blue-600 to-emerald-600 text-white"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="text-gray-700 space-y-4 text-sm leading-relaxed">
              {activeTab === "upgrade" && (
                <>
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Sparkles className="text-green-600 w-5 h-5" /> Upgrade
                    Policy
                  </h3>
                  <p>
                    UpKyp offers a flexible upgrade policy for subscription
                    plans. If you choose to upgrade before your billing cycle
                    ends, the additional cost will be pro-rated based on
                    remaining days, so you only pay for what you use.
                  </p>
                </>
              )}

              {activeTab === "trial" && (
                <>
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <ShieldCheck className="text-blue-600 w-5 h-5" /> Free Trial
                    Policy
                  </h3>
                  <p>
                    Each landlord is eligible for one free trial. If you’ve
                    already used a trial, you’ll need to subscribe to continue.
                    No payment details are required during your first trial
                    period.
                  </p>
                </>
              )}

              {activeTab === "refund" && (
                <>
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <CreditCard className="text-red-600 w-5 h-5" /> Refund
                    Policy
                  </h3>
                  <p>
                    UpKyp does not offer refunds after payment has been
                    processed. Please review your selected plan before
                    confirming your purchase.
                  </p>
                </>
              )}
            </div>

            {/* Footer */}
            <div className="mt-8 flex justify-end">
              <button
                onClick={() => setShowModal(false)}
                className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-emerald-600 text-white rounded-lg hover:opacity-90 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
