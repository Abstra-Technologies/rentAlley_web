"use client";

import { useEffect, useState } from "react";
import useAuthStore from "@/zustand/authStore";
import { useRouter } from "next/navigation";
import { formatCurrency, formatDate } from "@/utils/formatter/formatters";

type Payment = {
  payment_id: number;
  tenant_name: string;
  property_name: string;
  amount_paid: number;
  payment_date: string;
  proof_of_payment: string;
  payment_status: "pending" | "confirmed" | "failed";
};

export default function PaymentReviewWidget() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const { user } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!user?.landlord_id) return;

    fetch(
      `/api/landlord/payments/getListofPaymentforReview?landlord_id=${user.landlord_id}`
    )
      .then((res) => res.json())
      .then((data) => {
        setPayments(data || []);
      })
      .catch((err) => console.error("Failed to fetch payments", err))
      .finally(() => setLoading(false));
  }, [user?.landlord_id]);

  const handleAction = async (id: number, action: "approve" | "reject") => {
    setProcessingId(id);
    try {
      await fetch(`/api/landlord/payments/${id}/${action}`, { method: "POST" });

      setPayments((prev) =>
        prev.map((p) =>
          p.payment_id === id
            ? {
                ...p,
                payment_status: action === "approve" ? "confirmed" : "failed",
              }
            : p
        )
      );
    } catch (err) {
      console.error("Action failed:", err);
    } finally {
      setProcessingId(null);
    }
  };

  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-center">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-gray-600 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (payments.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <svg
            className="w-8 h-8 text-blue-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h3 className="text-base font-bold text-gray-900 mb-1">
          All Caught Up!
        </h3>
        <p className="text-sm text-gray-600">No pending payments to review.</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {payments.slice(0, 5).map((payment) => {
          const isPending = payment.payment_status === "pending";
          const isProcessing = processingId === payment.payment_id;

          return (
            <div
              key={payment.payment_id}
              className="bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-lg p-4 hover:shadow-md hover:border-blue-300 transition-all"
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-gray-900 text-sm truncate">
                    {payment.tenant_name || "Unknown Tenant"}
                  </h4>
                  <p className="text-xs text-gray-600 mt-0.5 truncate">
                    {payment.property_name}
                  </p>
                </div>
                {isPending ? (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-700 rounded-md text-xs font-semibold border border-amber-200 flex-shrink-0">
                    <svg
                      className="w-3 h-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    Pending
                  </span>
                ) : payment.payment_status === "confirmed" ? (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-100 text-emerald-700 rounded-md text-xs font-semibold border border-emerald-200 flex-shrink-0">
                    <svg
                      className="w-3 h-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    Confirmed
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded-md text-xs font-semibold border border-red-200 flex-shrink-0">
                    <svg
                      className="w-3 h-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                    Rejected
                  </span>
                )}
              </div>

              {/* Amount & Date */}
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-lg font-bold text-gray-900">
                    {formatCurrency(payment.amount_paid)}
                  </p>
                  <p className="text-xs text-gray-600 mt-0.5">
                    {formatDate(payment.payment_date)}
                  </p>
                </div>

                {/* Proof of Payment */}
                {payment.proof_of_payment ? (
                  <button
                    onClick={() => setSelectedImage(payment.proof_of_payment)}
                    className="group relative"
                  >
                    <img
                      src={payment.proof_of_payment}
                      alt="Proof"
                      className="w-16 h-16 rounded-lg object-cover border-2 border-gray-200 group-hover:border-blue-400 transition-colors"
                    />
                    <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-10 rounded-lg transition-opacity"></div>
                  </button>
                ) : (
                  <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-gray-200">
                    <svg
                      className="w-6 h-6 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              {isPending && (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleAction(payment.payment_id, "approve")}
                    disabled={isProcessing}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm"
                  >
                    {isProcessing ? (
                      <>
                        <svg
                          className="w-4 h-4 animate-spin"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        Processing...
                      </>
                    ) : (
                      <>
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        Approve
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => handleAction(payment.payment_id, "reject")}
                    disabled={isProcessing}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                    Reject
                  </button>
                </div>
              )}
            </div>
          );
        })}

        {/* View All Link */}
        {payments.length > 5 && (
          <button
            onClick={() => router.push("/pages/landlord/payments/review")}
            className="w-full py-3 text-sm font-medium text-blue-600 hover:text-emerald-600 hover:bg-blue-50 rounded-lg transition-all"
          >
            View All {payments.length} Payments →
          </button>
        )}
      </div>

      {/* Image Lightbox Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] w-full">
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute -top-12 right-0 text-white hover:text-gray-300 bg-black bg-opacity-50 rounded-lg p-2"
            >
              <svg
                className="w-6 h-6 sm:w-8 sm:h-8"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
            <img
              src={selectedImage}
              alt="Payment proof full size"
              className="max-w-full max-h-[90vh] object-contain rounded-lg mx-auto"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </>
  );
}
