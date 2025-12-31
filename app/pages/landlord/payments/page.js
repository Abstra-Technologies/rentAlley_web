"use client";

import useAuthStore from "@/zustand/authStore";
import PaymentList from "@/components/landlord/tenantPayments";
import PaymentReviewWidget from "@/components/landlord/widgets/PaymentReviewWidget";
import { PaidDepositsWidget } from "@/components/landlord/widgets/secAdvanceWidgets";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import PaymentProcessAccordion from "../../../../components/landlord/PaymentProcessAccordion";
import { CreditCard, ChevronRight, Shield, FileText } from "lucide-react";

// Animation variants
const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

// Skeleton Component
const PageSkeleton = () => (
  <div className="min-h-screen bg-gray-50">
    <div className="bg-white border-b border-gray-200 pt-20 pb-5 md:pt-6 md:pb-5 px-4 md:px-8 lg:px-12 xl:px-16">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-gray-200 rounded-xl animate-pulse" />
        <div>
          <div className="h-7 bg-gray-200 rounded w-32 animate-pulse mb-2" />
          <div className="h-4 bg-gray-200 rounded w-56 animate-pulse" />
        </div>
      </div>
    </div>
    <div className="px-4 pb-24 md:pb-8 md:px-8 lg:px-12 xl:px-16 pt-5">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2 h-96 bg-gray-200 rounded-2xl animate-pulse" />
        <div className="lg:col-span-1 h-96 bg-gray-200 rounded-2xl animate-pulse" />
      </div>
      <div className="h-64 bg-gray-200 rounded-2xl animate-pulse mb-6" />
      <div className="h-48 bg-gray-200 rounded-2xl animate-pulse" />
    </div>
  </div>
);

export default function PaymentsPage() {
  const { user, admin, loading, fetchSession } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!user && !admin) {
      fetchSession();
    }
  }, [user]);

  const landlord_id = user?.landlord_id;

  if (loading) {
    return <PageSkeleton />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white border-b border-gray-200 pt-20 pb-5 md:pt-6 md:pb-5 px-4 md:px-8 lg:px-12 xl:px-16"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-500/20">
            <CreditCard className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
            <p className="text-gray-600 text-sm">
              View and oversee your tenant payment records
            </p>
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="px-4 pb-24 md:pb-8 md:px-8 lg:px-12 xl:px-16 pt-5"
      >
        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Tenant Payments Ledger */}
          <motion.div variants={fadeInUp} className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 transition-all duration-300 hover:shadow-lg overflow-hidden">
              <div className="p-5 sm:p-6 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                      <FileText className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h2 className="text-base sm:text-lg font-bold text-gray-900">
                        Tenant Payments Ledger
                      </h2>
                      <p className="text-xs sm:text-sm text-gray-500">
                        Recent payment transactions
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() =>
                      router.push(
                        "/pages/landlord/analytics/detailed/paymentLogs"
                      )
                    }
                    className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-emerald-600 transition-colors"
                  >
                    View All
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="p-4 sm:p-6">
                <PaymentList landlord_id={landlord_id} />
              </div>
            </div>
          </motion.div>

          {/* Payment Review Widget */}
          <motion.div variants={fadeInUp} className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 transition-all duration-300 hover:shadow-lg overflow-hidden h-full">
              <div className="p-5 sm:p-6 border-b border-gray-100 bg-gradient-to-r from-amber-50 to-white">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                    <svg
                      className="w-5 h-5 text-amber-600"
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
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-gray-900">
                      Pending Reviews
                    </h2>
                    <p className="text-xs sm:text-sm text-gray-500">
                      Awaiting approval
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-4 sm:p-6">
                <PaymentReviewWidget />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Security Deposits Section */}
        <motion.div variants={fadeInUp}>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 mb-6 overflow-hidden">
            <div className="p-5 sm:p-6 border-b border-gray-100 bg-gradient-to-r from-emerald-50 to-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                  <Shield className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-gray-900">
                    Security Deposits & Advance Payments
                  </h2>
                  <p className="text-xs sm:text-sm text-gray-500">
                    Track tenant deposits and advance rent
                  </p>
                </div>
              </div>
            </div>
            <div className="p-4 sm:p-6">
              <PaidDepositsWidget landlord_id={landlord_id} />
            </div>
          </div>
        </motion.div>

        {/* Payment Process FAQ */}
        <motion.div variants={fadeInUp}>
          <PaymentProcessAccordion />
        </motion.div>
      </motion.div>
    </div>
  );
}
