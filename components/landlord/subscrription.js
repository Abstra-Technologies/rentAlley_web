"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Crown,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import useAuthStore from "../../zustand/authStore";
import { logEvent } from "@/utils/gtag";

export default function LandlordSubscriptionPlanComponent({ landlord_id }) {
  const { fetchSession, user } = useAuthStore();
  const [subscription, setSubscription] = useState(null);
  const [fetchError, setFetchError] = useState(null);
  const [isFetching, setIsFetching] = useState(true);

  useEffect(() => {
    if (landlord_id) {
      fetch(`/api/landlord/subscription/active/${landlord_id}`)
        .then((response) => response.json())
        .then((data) => {
          setSubscription(data);
          setIsFetching(false);
        })
        .catch((error) => {
          setFetchError(error.message);
          setIsFetching(false);
        });
    }
  }, [landlord_id]);

  if (isFetching) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        <p className="mt-3 text-sm text-gray-600">
          Loading your subscription...
        </p>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4">
        <div className="flex items-start gap-2">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">Failed to fetch subscription</p>
            <p className="text-sm mt-1">Please try again later.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      {subscription && subscription.plan_name ? (
        <div className="p-4 sm:p-6 space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-emerald-600 rounded-lg flex items-center justify-center">
                <Crown className="w-4 h-4 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">
                {subscription.plan_name}
              </h3>
            </div>

            <span
              className={`px-3 py-1 text-xs font-semibold rounded-full ${
                subscription.is_active
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {subscription.is_active ? "Active" : "Expired"}
            </span>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex items-start gap-2 p-3 bg-gray-50 rounded-lg">
              <Calendar className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-gray-600 uppercase">
                  Start Date
                </p>
                <p className="text-sm text-gray-900 mt-0.5">
                  {subscription.start_date
                    ? new Date(subscription.start_date).toLocaleDateString(
                        "en-US",
                        {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        }
                      )
                    : "N/A"}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2 p-3 bg-gray-50 rounded-lg">
              <Clock className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-gray-600 uppercase">
                  End Date
                </p>
                <p className="text-sm text-gray-900 mt-0.5">
                  {subscription.end_date
                    ? `${new Date(subscription.end_date).toLocaleDateString(
                        "en-US",
                        {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        }
                      )} at 11:59 PM`
                    : "N/A"}
                </p>
              </div>
            </div>
          </div>

          {/* Payment Status */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-sm font-medium text-gray-700">
              Payment Status
            </span>
            <span
              className={`px-2 py-1 text-xs font-semibold rounded-full ${
                subscription.payment_status === "paid"
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-amber-100 text-amber-700"
              }`}
            >
              {subscription.payment_status}
            </span>
          </div>

          {/* Alerts and Actions */}
          {!subscription.is_active ? (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-red-900">
                    Your subscription has expired. Your account has been
                    downgraded to the free plan.
                  </p>
                  <Link
                    href="/pages/landlord/sub_two/subscription"
                    onClick={() =>
                      logEvent(
                        "Subscription Expired",
                        "Subscription",
                        "User clicked renew",
                        1
                      )
                    }
                    className="mt-3 inline-block bg-gradient-to-r from-red-600 to-pink-600 hover:shadow-md text-white text-sm font-semibold py-2 px-4 rounded-lg transition-shadow"
                  >
                    Renew Subscription
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <>
              {subscription.is_trial === 1 && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm text-emerald-900">
                        You're currently on a free trial until{" "}
                        <strong>
                          {new Date(subscription.end_date).toLocaleDateString(
                            "en-US",
                            {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            }
                          )}
                        </strong>
                        .
                      </p>
                      <Link
                        href="/pages/landlord/sub_two/upgrade"
                        onClick={() =>
                          logEvent(
                            "Trial User Subscription",
                            "Subscription",
                            "Trial user clicked subscribe",
                            1
                          )
                        }
                        className="mt-3 inline-block bg-gradient-to-r from-amber-500 to-orange-500 hover:shadow-md text-white text-sm font-semibold py-2 px-4 rounded-lg transition-shadow"
                      >
                        Subscribe to a Plan
                      </Link>
                    </div>
                  </div>
                </div>
              )}

              {subscription.is_trial === 0 && (
                <Link
                  href="/pages/landlord/subsciption_plan/pricing"
                  onClick={() =>
                    logEvent(
                      "Upgrade Clicked",
                      "Subscription",
                      "User clicked upgrade",
                      1
                    )
                  }
                  className="mt-4 block bg-gradient-to-r from-blue-600 to-emerald-600 hover:shadow-md text-white text-sm font-semibold py-3 px-4 rounded-lg text-center transition-shadow"
                >
                  Upgrade Plan
                </Link>
              )}
            </>
          )}
        </div>
      ) : (
        <div className="p-6 text-center">
          <p className="text-sm text-gray-600 mb-4">
            No active subscription found.
          </p>
          <Link
            href="/pages/landlord/sub_two/subscription"
            onClick={() =>
              logEvent(
                "No Subscription",
                "Subscription",
                "User clicked subscribe",
                1
              )
            }
            className="inline-block bg-gradient-to-r from-blue-600 to-emerald-600 hover:shadow-md text-white text-sm font-semibold py-2.5 px-5 rounded-lg transition-shadow"
          >
            Subscribe Now
          </Link>
        </div>
      )}
    </div>
  );
}
