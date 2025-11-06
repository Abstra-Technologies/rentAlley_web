"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import useAuthStore from "@/zustand/authStore";
import TenantOutsidePortalNav from "@/components/navigation/TenantOutsidePortalNav";
import LoadingScreen from "@/components/loadingScreen";
import {
  EnvelopeIcon,
  HomeIcon,
  MapPinIcon,
  CalendarIcon,
  ArrowRightIcon,
  SparklesIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";
import Swal from "sweetalert2";

type Invite = {
  code: string;
  propertyName: string;
  unitName: string;
  createdAt: string;
};

export default function TenantInvites() {
  const router = useRouter();
  // @ts-ignore
  const { user } = useAuthStore();
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [acceptingCode, setAcceptingCode] = useState<string | null>(null);

  useEffect(() => {
    const fetchInvites = async () => {
      if (!user?.email) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const res = await fetch(
          `/api/invite/getAllInvitation?email=${user?.email}`
        );
        if (!res.ok) throw new Error("Failed to fetch invites");
        const data = await res.json();
        setInvites(data.invites || []);
      } catch (err) {
        console.error(err);
        setError("Unable to load invitations. Please try again later.");
        setInvites([]);
      } finally {
        setLoading(false);
      }
    };

    fetchInvites();
  }, [user?.email]);

  const handleAcceptInvite = async (code: string) => {
    if (!user?.user_id) {
      Swal.fire({
        icon: "error",
        title: "Authentication Error",
        text: "You must be logged in to accept an invitation.",
      });
      return;
    }

    setAcceptingCode(code);

    try {
      Swal.fire({
        title: "Accepting Invitation...",
        text: "Please wait while we process your invitation.",
        allowOutsideClick: false,
        allowEscapeKey: false,
        didOpen: () => Swal.showLoading(),
      });

      const res = await fetch(`/api/invite/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inviteCode: code,
          userId: user.user_id,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        Swal.fire({
          icon: "success",
          title: "Invitation Accepted!",
          text:
              data.message ||
              "You’ve successfully joined this property. Your lease is now active.",
          confirmButtonText: "OK",
        });

        // remove accepted invite from list
        setInvites((prev) => prev.filter((i) => i.code !== code));
      } else {
        Swal.fire({
          icon: "error",
          title: "Failed to Accept",
          text: data.error || "Unable to accept this invitation.",
        });
      }
    } catch (error) {
      console.error("Error accepting invite:", error);
      Swal.fire({
        icon: "error",
        title: "Server Error",
        text: "An unexpected error occurred. Please try again later.",
      });
    } finally {
      setAcceptingCode(null);
    }
  };


  if (loading) {
    return <LoadingScreen message="Loading your invitations..." />;
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50">
      <TenantOutsidePortalNav />

      <div className="flex-1 md:ml-64">
        {/* Top Navigation Bar */}
        <div className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-md">
                  <EnvelopeIcon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-lg sm:text-xl font-bold text-gray-900">
                    Property Invitations
                  </h1>
                  <p className="text-xs text-gray-500 font-medium hidden sm:block">
                    Review and accept invitations
                  </p>
                </div>
              </div>

              {/* Quick Stats - Desktop Only */}
              {invites.length > 0 && (
                <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-emerald-50 rounded-lg border border-emerald-200">
                  <SparklesIcon className="w-4 h-4 text-emerald-600" />
                  <span className="text-sm font-bold text-emerald-700">
                    {invites.length}{" "}
                    {invites.length === 1 ? "Invitation" : "Invitations"}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {/* Back Button */}
          <button
            onClick={() => router.back()}
            className="mb-6 flex items-center gap-2 px-4 py-2.5 text-gray-700 hover:text-gray-900 font-medium text-sm bg-white hover:bg-gray-50 rounded-xl transition-all border border-gray-200 hover:border-gray-300"
          >
            <ArrowRightIcon className="w-4 h-4 transform rotate-180" />
            Back
          </button>

          {/* Error State */}
          {error && (
            <div className="mb-6 p-4 sm:p-6 bg-gradient-to-br from-rose-50 to-red-50 rounded-2xl border border-red-200">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-red-100 rounded-lg flex-shrink-0">
                  <EnvelopeIcon className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-red-900 text-sm">
                    Failed to Load
                  </h3>
                  <p className="text-red-700 text-sm mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Empty State */}
          {!error && invites.length === 0 && (
            <div className="rounded-2xl border border-gray-100 bg-white overflow-hidden shadow-sm">
              <div className="flex flex-col items-center justify-center py-16 px-4 sm:px-6">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-blue-100 to-emerald-100 rounded-full flex items-center justify-center mb-4">
                  <EnvelopeIcon className="w-8 h-8 sm:w-10 sm:h-10 text-emerald-600" />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2 text-center">
                  No Pending Invitations
                </h3>
                <p className="text-gray-600 text-sm sm:text-base text-center max-w-md mb-6">
                  You don't have any pending property invitations at the moment.
                  Check back later or contact your landlord for an invite.
                </p>
                <button
                  onClick={() => router.push("/pages/tenant/my-unit")}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-emerald-500 hover:shadow-lg text-white rounded-xl font-semibold transition-all transform hover:scale-105"
                >
                  <HomeIcon className="w-5 h-5" />
                  Go to My Units
                </button>
              </div>
            </div>
          )}

          {/* Invitations List */}
          {!error && invites.length > 0 && (
            <div className="space-y-4 sm:space-y-6">
              {/* Mobile Stats Summary */}
              <div className="md:hidden flex items-center justify-center gap-2 p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                <SparklesIcon className="w-5 h-5 text-emerald-600" />
                <span className="text-sm font-bold text-emerald-700">
                  {invites.length}{" "}
                  {invites.length === 1 ? "Invitation" : "Invitations"} Pending
                </span>
              </div>

              {/* Invitation Cards */}
              {invites.map((invite, index) => (
                <article
                  key={invite.code}
                  className="bg-white rounded-2xl shadow-sm hover:shadow-lg border-2 border-gray-100 hover:border-emerald-300 overflow-hidden transition-all duration-300 group"
                >
                  {/* Top Accent Bar */}
                  <div className="h-1.5 bg-gradient-to-r from-blue-500 to-emerald-500" />

                  <div className="p-5 sm:p-6">
                    {/* Invitation Number Badge */}
                    <div className="flex items-center justify-between mb-5">
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-full">
                        <span className="text-xs font-bold text-gray-600">
                          Invitation #{index + 1}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 rounded-full border border-emerald-200">
                        <CheckCircleIcon className="w-4 h-4 text-emerald-600" />
                        <span className="text-xs font-bold text-emerald-700">
                          Ready to Accept
                        </span>
                      </div>
                    </div>

                    {/* Property Details Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                      {/* Property Name */}
                      <div className="bg-gradient-to-br from-blue-50 to-blue-50/50 rounded-xl p-4 border border-blue-100">
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-white rounded-lg shadow-sm">
                            <HomeIcon className="w-5 h-5 text-blue-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-blue-600 font-bold uppercase tracking-wide mb-1">
                              Property
                            </p>
                            <p className="text-base sm:text-lg font-bold text-gray-900 truncate">
                              {invite.propertyName}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Unit Name */}
                      <div className="bg-gradient-to-br from-emerald-50 to-emerald-50/50 rounded-xl p-4 border border-emerald-100">
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-white rounded-lg shadow-sm">
                            <MapPinIcon className="w-5 h-5 text-emerald-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-emerald-600 font-bold uppercase tracking-wide mb-1">
                              Unit
                            </p>
                            <p className="text-base sm:text-lg font-bold text-gray-900 truncate">
                              {invite.unitName}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Date Sent */}
                      <div className="bg-gradient-to-br from-amber-50 to-amber-50/50 rounded-xl p-4 border border-amber-100">
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-white rounded-lg shadow-sm">
                            <CalendarIcon className="w-5 h-5 text-amber-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-amber-600 font-bold uppercase tracking-wide mb-1">
                              Sent On
                            </p>
                            <p className="text-base font-bold text-gray-900">
                              {new Date(invite.createdAt).toLocaleDateString(
                                "en-US",
                                {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                }
                              )}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Invitation Code */}
                      <div className="bg-gradient-to-br from-purple-50 to-purple-50/50 rounded-xl p-4 border border-purple-100">
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-white rounded-lg shadow-sm">
                            <EnvelopeIcon className="w-5 h-5 text-purple-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-purple-600 font-bold uppercase tracking-wide mb-1">
                              Code
                            </p>
                            <p className="text-sm font-mono font-bold text-gray-900 break-all">
                              {invite.code}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Accept Button */}
                    <button
                      onClick={() => handleAcceptInvite(invite.code)}
                      disabled={acceptingCode === invite.code}
                      className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-xl font-bold text-sm shadow-md hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none group-hover:shadow-lg"
                    >
                      {acceptingCode === invite.code ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Processing...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircleIcon className="w-5 h-5" />
                          <span>Accept Invitation</span>
                          <ArrowRightIcon className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </>
                      )}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
