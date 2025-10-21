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
} from "@heroicons/react/24/outline";

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
    setAcceptingCode(code);
    router.push(`/tenant/join/${code}`);
  };

  if (loading) {
    return <LoadingScreen message="Loading your invitations..." />;
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50">
      <TenantOutsidePortalNav />

      <div className="flex-1 md:ml-64">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="mb-8 sm:mb-10">
            <div className="flex items-center gap-2 mb-2">
              <EnvelopeIcon className="w-6 h-6 text-emerald-600" />
              <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">
                Pending Invitations
              </h1>
            </div>
            <p className="text-gray-600 text-sm sm:text-base ml-8">
              Review and accept invitations to rental properties
            </p>
          </div>

          <button
            onClick={() => router.back()}
            className="mb-6 flex items-center gap-2 px-4 py-2.5 text-gray-700 hover:text-gray-900 font-medium text-sm bg-gray-100 hover:bg-gray-200 rounded-xl transition-all"
          >
            <ArrowRightIcon className="w-4 h-4 transform rotate-180" />
            Back
          </button>

          {error && (
            <div className="mb-6 p-4 bg-gradient-to-br from-rose-50 to-red-50 rounded-2xl border border-red-200">
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

          {!error && invites.length === 0 && (
            <div className="rounded-2xl border border-gray-100 bg-white overflow-hidden">
              <div className="flex flex-col items-center justify-center py-16 px-4 sm:px-6">
                <div className="p-3 bg-gradient-to-br from-blue-100 to-emerald-100 rounded-full mb-4">
                  <EnvelopeIcon className="w-8 h-8 text-emerald-600" />
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

          {!error && invites.length > 0 && (
            <div className="space-y-4 sm:space-y-6">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <SparklesIcon className="w-4 h-4 text-emerald-500" />
                <span>
                  You have{" "}
                  <strong className="text-gray-900">{invites.length}</strong>{" "}
                  {invites.length === 1 ? "invitation" : "invitations"}
                </span>
              </div>

              {invites.map((invite, index) => (
                <div
                  key={invite.code}
                  className="bg-white rounded-2xl shadow-sm hover:shadow-md border border-gray-100 overflow-hidden transition-all duration-300 hover:border-emerald-300"
                >
                  <div className="p-5 sm:p-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-6">
                      <div className="space-y-3">
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-gradient-to-br from-blue-100 to-blue-50 rounded-lg flex-shrink-0">
                            <HomeIcon className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">
                              Property
                            </p>
                            <p className="text-base sm:text-lg font-bold text-gray-900">
                              {invite.propertyName}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-gradient-to-br from-emerald-100 to-emerald-50 rounded-lg flex-shrink-0">
                            <MapPinIcon className="w-5 h-5 text-emerald-600" />
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">
                              Unit
                            </p>
                            <p className="text-base sm:text-lg font-bold text-gray-900">
                              {invite.unitName}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-gradient-to-br from-amber-100 to-amber-50 rounded-lg flex-shrink-0">
                            <CalendarIcon className="w-5 h-5 text-amber-600" />
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">
                              Sent On
                            </p>
                            <p className="text-base sm:text-lg font-bold text-gray-900">
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

                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-gradient-to-br from-purple-100 to-purple-50 rounded-lg flex-shrink-0">
                            <EnvelopeIcon className="w-5 h-5 text-purple-600" />
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">
                              Code
                            </p>
                            <p className="text-sm font-mono text-gray-900 break-all">
                              {invite.code}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleAcceptInvite(invite.code)}
                      disabled={acceptingCode === invite.code}
                      className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-xl font-bold text-sm shadow-md hover:shadow-lg transform hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                    >
                      <ArrowRightIcon className="w-5 h-5" />
                      <span>
                        {acceptingCode === invite.code
                          ? "Processing..."
                          : "Accept Invitation"}
                      </span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
