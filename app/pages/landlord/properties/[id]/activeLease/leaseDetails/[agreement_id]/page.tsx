"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  FileText,
  Info,
  CreditCard,
  Receipt,
  CheckSquare,
  ArrowLeft,
  AlertCircle,
} from "lucide-react";
import LoadingScreen from "@/components/loadingScreen";
import LeaseInfo from "@/components/landlord/activeLease/leaseInfo";
import LeasePayments from "@/components/landlord/activeLease/leasePayments";
import LeasePDCs from "@/components/landlord/activeLease/LeasePDCs";
import LeaseBilling from "@/components/landlord/activeLease/LeaseBilling";

interface BillingDetail {
  billing_id: number;
  billing_period: string;
  total_amount_due: number;
  status: string;
  due_date: string;
}

interface LeaseDetails {
  lease_id: number;
  property_id?: number;
  property_name: string;
  unit_name: string;
  tenant_name: string;
  start_date: string;
  end_date: string;
  lease_status: "pending" | "active" | "expired" | "cancelled";
  agreement_url?: string;
  security_deposit_amount?: number;
  advance_payment_amount?: number;
  grace_period_days?: number;
  late_penalty_amount?: number;
  billing_due_day?: number;
  rent_amount?: number;
  email?: string;
  phoneNumber?: string;
  pdcs?: {
    pdc_id: number;
    check_number: string;
    bank_name: string;
    amount: number;
    due_date: string;
    uploaded_image_url: string;
    status: "pending" | "cleared" | "bounced" | "replaced";
  }[];
  payments?: {
    payment_id: number;
    amount: number;
    method: string;
    paid_on: string;
    status: string;
  }[];
  billing?: BillingDetail[];
}

export default function LeaseDetailsPage() {
  const { agreement_id } = useParams();
  const router = useRouter();
  const [lease, setLease] = useState<LeaseDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>("info");

  useEffect(() => {
    if (!agreement_id) return;

    const fetchLeaseDetails = async () => {
      try {
        const res = await fetch(
          `/api/leaseAgreement/getDetailedLeaseInfo/${agreement_id}`
        );
        const data = await res.json();
        setLease(data);
      } catch (err) {
        console.error("Error fetching lease details:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaseDetails();
  }, [agreement_id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading lease details...</p>
        </div>
      </div>
    );
  }

  if (!lease) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-lg shadow-sm border border-red-200 p-6 max-w-md w-full">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-red-100 to-rose-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900 mb-1">
                Lease Not Found
              </h3>
              <p className="text-sm text-gray-600">
                The lease agreement you're looking for could not be found.
                Please check the agreement ID or try again later.
              </p>
            </div>
          </div>
          <button
            onClick={() => router.back()}
            className="w-full px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors text-sm"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Proper spacing for navbar and sidebar */}
      <div className="px-4 pt-20 pb-24 md:pt-6 md:pb-8 md:px-8 lg:px-12 xl:px-16">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 px-3 py-2 hover:bg-white rounded-lg transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="text-sm font-medium">Back to Leases</span>
        </button>

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {lease.property_name} - {lease.unit_name}
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Manage and review this lease agreement. All details displayed
                are based on the current document.
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="border-b border-gray-200">
            <div className="flex overflow-x-auto">
              <button
                onClick={() => setActiveTab("info")}
                className={`flex items-center gap-2 px-6 py-3 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === "info"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300"
                }`}
              >
                <Info className="h-4 w-4" />
                <span>Info</span>
              </button>

              <button
                onClick={() => setActiveTab("billing")}
                className={`flex items-center gap-2 px-6 py-3 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === "billing"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300"
                }`}
              >
                <Receipt className="h-4 w-4" />
                <span>Billing Statements</span>
              </button>

              <button
                onClick={() => setActiveTab("payments")}
                className={`flex items-center gap-2 px-6 py-3 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === "payments"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300"
                }`}
              >
                <CreditCard className="h-4 w-4" />
                <span>Payments</span>
              </button>

              <button
                onClick={() => setActiveTab("pdcs")}
                className={`flex items-center gap-2 px-6 py-3 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === "pdcs"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300"
                }`}
              >
                <CheckSquare className="h-4 w-4" />
                <span>PDCs</span>
              </button>
            </div>
          </div>


          {/* Tab Content */}
          <div className="p-4 md:p-6">
            {activeTab === "info" && <LeaseInfo lease={lease} />}

              {activeTab === "billing" && <LeaseBilling lease_id={lease.lease_id} />}

              {activeTab === "payments" && <LeasePayments lease={lease} />}

            {activeTab === "pdcs" && <LeasePDCs lease={lease} />}
          </div>
        </div>
      </div>
    </div>
  );
}
