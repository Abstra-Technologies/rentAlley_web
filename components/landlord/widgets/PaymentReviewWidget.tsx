"use client";

import { useEffect, useState } from "react";
import useAuthStore from "@/zustand/authStore";
import { useRouter } from "next/navigation";
import { formatCurrency, formatDate } from "@/utils/formatter/formatters";
import {
  Clock,
  CheckCircle,
  XCircle,
  Image as ImageIcon,
  X,
  ArrowRight,
} from "lucide-react";

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
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
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

  // ============================================
  // SKELETON LOADING STATE
  // ============================================
  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-lg p-4"
          >
            {/* Header Skeleton */}
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-32 animate-pulse" />
                <div className="h-3 bg-gray-200 rounded w-40 animate-pulse" />
              </div>
              <div className="h-6 w-20 bg-gray-200 rounded-md animate-pulse" />
            </div>

            {/* Amount & Image Skeleton */}
            <div className="flex items-center justify-between mb-3">
              <div className="space-y-2">
                <div className="h-6 bg-gray-200 rounded w-24 animate-pulse" />
                <div className="h-3 bg-gray-200 rounded w-20 animate-pulse" />
              </div>
              <div className="w-16 h-16 bg-gray-200 rounded-lg animate-pulse" />
            </div>

            {/* Buttons Skeleton */}
            <div className="flex gap-2">
              <div className="flex-1 h-10 bg-gray-200 rounded-lg animate-pulse" />
              <div className="flex-1 h-10 bg-gray-200 rounded-lg animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // ============================================
  // EMPTY STATE
  // ============================================
  if (payments.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <CheckCircle className="w-8 h-8 text-emerald-600" />
        </div>
        <h3 className="text-base font-bold text-gray-900 mb-1">
          All Caught Up!
        </h3>
        <p className="text-sm text-gray-600">No pending payments to review.</p>
      </div>
    );
  }

  // ============================================
  // MAIN RENDER
  // ============================================
  return (
    <>
      <div className="flex flex-col h-full">
        <div className="space-y-3 overflow-y-auto max-h-[500px] pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
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

                  {/* Status Badge */}
                  {isPending ? (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-700 rounded-md text-xs font-semibold border border-amber-200 flex-shrink-0">
                      <Clock className="w-3 h-3" />
                      Pending
                    </span>
                  ) : payment.payment_status === "confirmed" ? (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-100 text-emerald-700 rounded-md text-xs font-semibold border border-emerald-200 flex-shrink-0">
                      <CheckCircle className="w-3 h-3" />
                      Confirmed
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded-md text-xs font-semibold border border-red-200 flex-shrink-0">
                      <XCircle className="w-3 h-3" />
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
                      aria-label="View proof of payment"
                    >
                      <img
                        src={payment.proof_of_payment}
                        alt="Proof"
                        className="w-16 h-16 rounded-lg object-cover border-2 border-gray-200 group-hover:border-blue-400 transition-colors"
                      />
                      <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-10 rounded-lg transition-opacity flex items-center justify-center">
                        <ImageIcon className="w-5 h-5 text-white opacity-0 group-hover:opacity-100" />
                      </div>
                    </button>
                  ) : (
                    <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-gray-200">
                      <ImageIcon className="w-6 h-6 text-gray-400" />
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                {isPending && (
                  <div className="flex gap-2">
                    <button
                      onClick={() =>
                        handleAction(payment.payment_id, "approve")
                      }
                      disabled={isProcessing}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-lg hover:shadow-lg hover:from-emerald-700 hover:to-green-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm"
                    >
                      {isProcessing ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4" />
                          Approve
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => handleAction(payment.payment_id, "reject")}
                      disabled={isProcessing}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm"
                    >
                      <XCircle className="w-4 h-4" />
                      Reject
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ✅ View All Button - MOVED INSIDE flex container */}
        {payments.length > 5 && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <button
              onClick={() => router.push("/pages/landlord/payments/review")}
              className="w-full flex items-center justify-center gap-2 py-2 text-sm font-medium text-blue-600 hover:text-white hover:bg-gradient-to-r hover:from-blue-600 hover:to-emerald-600 rounded-lg transition-all group"
            >
              <span>View All {payments.length} Pending Reviews</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        )}
      </div>

      {/* ✅ Image Lightbox Modal - MOVED OUTSIDE and ADDED closing div */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] w-full">
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute -top-12 right-0 text-white hover:text-gray-300 bg-black/50 hover:bg-black/70 rounded-lg p-2 transition-colors"
              aria-label="Close image"
            >
              <X className="w-6 h-6 sm:w-8 sm:h-8" />
            </button>
            <img
              src={selectedImage}
              alt="Payment proof full size"
              className="max-w-full max-h-[90vh] object-contain rounded-lg mx-auto shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </>
  );
}
