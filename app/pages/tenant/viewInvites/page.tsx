"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import useAuthStore from "@/zustand/authStore";
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
            "You've successfully joined this property. Your lease is now active.",
          confirmButtonText: "OK",
        });

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
    <div className="px-4 sm:px-6 lg:px-8 py-6 min-h-screen bg-gray-50">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-emerald-600 rounded-lg flex items-center justify-center shadow-sm">
              <EnvelopeIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                Property Invitations
              </h1>
              <p className="text-xs sm:text-sm text-gray-600">
                Review and accept invitations
              </p>
            </div>
          </div>

          {/* Quick Stats - Desktop Only */}
          {invites.length > 0 && (
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-blue-50 to-emerald-50 rounded-lg border border-blue-200">
              <SparklesIcon className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-semibold text-gray-900">
                {invites.length}{" "}
                {invites.length === 1 ? "Invitation" : "Invitations"}
              </span>
            </div>
          )}
        </div>

        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:text-gray-900 font-medium bg-white hover:bg-gray-50 rounded-lg transition-colors border border-gray-200 hover:border-gray-300"
        >
          <ArrowRightIcon className="w-4 h-4 transform rotate-180" />
          Back
        </button>
      </div>

      {/* Error State */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 rounded-lg border border-red-200">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <EnvelopeIcon className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h3 className="font-semibold text-red-900 text-sm mb-1">
                Failed to Load
              </h3>
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!error && invites.length === 0 && (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="flex flex-col items-center justify-center py-16 px-6">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-emerald-100 rounded-full flex items-center justify-center mb-4">
              <EnvelopeIcon className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2 text-center">
              No Pending Invitations
            </h3>
            <p className="text-sm text-gray-600 text-center max-w-md mb-6">
              You don't have any pending property invitations at the moment.
              Check back later or contact your landlord for an invite.
            </p>
            <button
              onClick={() => router.push("/pages/tenant/my-unit")}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-emerald-600 hover:shadow-md text-white rounded-lg font-semibold transition-all text-sm"
            >
              <HomeIcon className="w-5 h-5" />
              Go to My Units
            </button>
          </div>
        </div>
      )}

      {/* Invitations List */}
      {!error && invites.length > 0 && (
        <div className="space-y-4 mb-20 sm:mb-4">
          {/* Mobile Stats Summary */}
          <div className="md:hidden flex items-center justify-center gap-2 p-3 bg-gradient-to-r from-blue-50 to-emerald-50 rounded-lg border border-blue-200">
            <SparklesIcon className="w-5 h-5 text-blue-600" />
            <span className="text-sm font-semibold text-gray-900">
              {invites.length}{" "}
              {invites.length === 1 ? "Invitation" : "Invitations"} Pending
            </span>
          </div>

          {/* Invitation Cards */}
          {invites.map((invite, index) => (
            <article
              key={invite.code}
              className="bg-white rounded-lg shadow-sm hover:shadow-md border border-gray-200 hover:border-gray-300 overflow-hidden transition-all"
            >
              {/* Top Accent Bar */}
              <div className="h-1 bg-gradient-to-r from-blue-600 to-emerald-600" />

              <div className="p-4 sm:p-5">
                {/* Invitation Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-md">
                    <span className="text-xs font-semibold text-gray-700">
                      Invitation #{index + 1}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-blue-50 to-emerald-50 rounded-md border border-blue-200">
                    <CheckCircleIcon className="w-4 h-4 text-blue-600" />
                    <span className="text-xs font-semibold text-gray-900">
                      Ready to Accept
                    </span>
                  </div>
                </div>

                {/* Property Details Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                  {/* Property Name */}
                  <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center flex-shrink-0">
                        <HomeIcon className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-blue-600 font-semibold uppercase mb-0.5">
                          Property
                        </p>
                        <p className="text-sm font-bold text-gray-900 truncate">
                          {invite.propertyName}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Unit Name */}
                  <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-100">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center flex-shrink-0">
                        <MapPinIcon className="w-4 h-4 text-emerald-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-emerald-600 font-semibold uppercase mb-0.5">
                          Unit
                        </p>
                        <p className="text-sm font-bold text-gray-900 truncate">
                          {invite.unitName}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Date Sent */}
                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center flex-shrink-0">
                        <CalendarIcon className="w-4 h-4 text-gray-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-600 font-semibold uppercase mb-0.5">
                          Sent On
                        </p>
                        <p className="text-sm font-bold text-gray-900">
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
                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center flex-shrink-0">
                        <EnvelopeIcon className="w-4 h-4 text-gray-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-600 font-semibold uppercase mb-0.5">
                          Code
                        </p>
                        <p className="text-xs font-mono font-bold text-gray-900 break-all">
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
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-blue-600 to-emerald-600 hover:shadow-md text-white rounded-lg font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
                      <ArrowRightIcon className="w-5 h-5" />
                    </>
                  )}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
