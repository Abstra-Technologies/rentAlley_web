"use client";
//  to remove locking mechanism just a centralized payment list
//  no more handling pyaments here

import { useState, useEffect, useCallback, useMemo } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import useAuthStore from "../../../../zustand/authStore";
import TenantOutsidePortalNav from "../../../../components/navigation/TenantOutsidePortalNav";
import {
  ChatBubbleLeftRightIcon,
  PencilSquareIcon,
  XCircleIcon,
  MagnifyingGlassIcon,
  DocumentArrowUpIcon,
  CreditCardIcon,
  HomeIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  MapPinIcon,
  PhotoIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";
import Image from "next/image";
import { IoChatboxEllipsesSharp } from "react-icons/io5";
import {
  FaSearch,
  FaTimes,
  FaChevronLeft,
  FaChevronRight,
  FaFilter,
  FaCalendarAlt,
  FaMoneyBillWave,
  FaShieldAlt,
  FaHome,
  FaCreditCard,
  FaUpload,
  FaComments,
  FaSpinner,
} from "react-icons/fa";
import { useChatStore } from "@/zustand/chatStore";
import LoadingScreen from "@/components/loadingScreen";
import LeaseCounter from "@/components/tenant/analytics-insights/LeaseCounter";
import ApplicationsCounter from "@/components/tenant/analytics-insights/applicationsCounter";

// Types
interface Unit {
  unit_id: string;
  unit_name: string;
  unit_size: string;
  bed_spacing: number;
  avail_beds: number;
  rent_amount: number;
  furnish: string;
  status: string;
  sec_deposit: number;
  advanced_payment: number;
  unit_photos: string[];
  property_name: string;
  property_type: string;
  city: string;
  province: string;
  street: string;
  zip_code: string;
  brgy_district: string;
  agreement_id: string;
  start_date: string;
  end_date: string;
  is_advance_payment_paid: number;
  is_security_deposit_paid: number;
  has_pending_proof?: boolean;
  landlord_id?: string;
  landlord_name?: string;
}

// Utility functions
const sanitizeInput = (str: string): string => {
  if (!str) return "";
  return str.replace(/[<>]/g, "");
};

const formatCurrency = (amount: number | string | null | undefined): string => {
  const numAmount =
    typeof amount === "number" ? amount : parseFloat(String(amount || 0));
  if (isNaN(numAmount)) return "₱0.00";
  return `₱${numAmount.toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const toNumber = (val: any): number => {
  if (val === null || val === undefined || val === "") return 0;
  const num = Number(val);
  return isNaN(num) ? 0 : num;
};

// Custom hooks
const useUnits = (tenantId: string | undefined) => {
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUnits = useCallback(async () => {
    if (!tenantId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await axios.get(
        `/api/tenant/activeRent?tenantId=${tenantId}`
      );
      setUnits(res.data || []); // Ensure array even if response is null
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || "Failed to load units";
      setError(errorMessage);
      console.error("Error fetching units:", err);
      setUnits([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    fetchUnits();
  }, [fetchUnits]);

  return { units, loading, error, refetch: fetchUnits };
};

// Components
const ErrorBoundary = ({
  error,
  onRetry,
}: {
  error: string;
  onRetry: () => void;
}) => (
  <div className="flex flex-col items-center justify-center py-12 px-4">
    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
      <ExclamationTriangleIcon className="w-8 h-8 text-red-500" />
    </div>
    <h3 className="text-lg font-semibold text-gray-800 mb-2">
      Something went wrong
    </h3>
    <p className="text-gray-600 text-center mb-4 max-w-md">{error}</p>
    <button
      onClick={onRetry}
      className="px-6 py-3 bg-gradient-to-r from-blue-500 to-emerald-500 text-white rounded-xl hover:shadow-lg transition-all transform hover:scale-105"
    >
      Try Again
    </button>
  </div>
);

const SearchAndFilter = ({
  searchQuery,
  setSearchQuery,
  totalUnits,
  filteredCount,
}: {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  totalUnits: number;
  filteredCount: number;
}) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6 mb-6">
      <div className="flex flex-col sm:flex-row gap-4 items-center">
        <div className="flex-1 relative w-full">
          <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm" />
          <input
            type="text"
            placeholder="Search your units, properties, or locations..."
            className="w-full pl-12 pr-12 py-3 border-2 border-gray-200 rounded-xl focus:ring-0 focus:border-emerald-500 focus:outline-none text-sm bg-gray-50 focus:bg-white transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(sanitizeInput(e.target.value))}
            aria-label="Search units"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Clear search"
            >
              <FaTimes className="text-sm" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-4 text-sm">
          <div className="bg-gradient-to-r from-blue-50 to-emerald-50 px-4 py-2 rounded-full">
            <span className="font-semibold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-emerald-600">
              {filteredCount}
            </span>
            <span className="text-gray-600 ml-1">of {totalUnits} units</span>
          </div>
        </div>
      </div>

      {searchQuery && (
        <div className="mt-4 flex flex-wrap gap-2">
          <div className="inline-flex items-center bg-gradient-to-r from-blue-100 to-emerald-100 text-emerald-800 px-3 py-1 rounded-full text-sm">
            <FaSearch className="mr-1 text-xs" />"{searchQuery}"
            <button
              onClick={() => setSearchQuery("")}
              className="ml-2 text-emerald-600 hover:text-emerald-800 transition-colors"
              aria-label="Remove search filter"
            >
              <FaTimes className="text-xs" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const Pagination = ({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  itemsPerPage,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems: number;
  itemsPerPage: number;
}) => {
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = window.innerWidth < 640 ? 3 : 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 2) {
        pages.push(1, 2, 3, "...", totalPages);
      } else if (currentPage >= totalPages - 1) {
        pages.push(1, "...", totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, "...", currentPage, "...", totalPages);
      }
    }

    return pages;
  };

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  if (totalPages <= 1) return null;

  return (
    <div className="flex flex-col sm:flex-row justify-between items-center gap-4 p-4 border-t border-gray-200 bg-gradient-to-r from-blue-50 to-emerald-50 rounded-b-xl">
      <div className="text-sm text-gray-600 order-2 sm:order-1">
        Showing <span className="font-semibold text-blue-700">{startItem}</span>
        -<span className="font-semibold text-blue-700">{endItem}</span> of{" "}
        <span className="font-semibold text-emerald-700">{totalItems}</span>{" "}
        units
      </div>

      <nav className="flex items-center gap-1 order-1 sm:order-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-3 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-l-md hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          aria-label="Previous page"
        >
          <FaChevronLeft className="w-3 h-3" />
        </button>

        {getPageNumbers().map((page, index) =>
          page === "..." ? (
            <span key={index} className="px-3 py-2 text-sm text-gray-500">
              ...
            </span>
          ) : (
            <button
              key={index}
              onClick={() => onPageChange(page as number)}
              className={`px-3 py-2 text-sm font-medium border transition-all ${
                currentPage === page
                  ? "bg-gradient-to-r from-blue-500 to-emerald-500 text-white border-transparent shadow-md"
                  : "bg-white border-gray-300 text-gray-600 hover:bg-blue-50"
              }`}
              aria-label={`Go to page ${page}`}
            >
              {page}
            </button>
          )
        )}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-3 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-r-md hover:bg-emerald-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          aria-label="Next page"
        >
          <FaChevronRight className="w-3 h-3" />
        </button>
      </nav>
    </div>
  );
};

const PaymentStatusBadge = ({ unit }: { unit: Unit }) => {
  const isSecurityPaid = unit.is_security_deposit_paid;
  const isAdvancePaid = unit.is_advance_payment_paid;
  const hasPendingProof = unit.has_pending_proof;

  if (isSecurityPaid && isAdvancePaid) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-green-100 to-emerald-100 text-emerald-700 rounded-full text-sm">
        <CheckCircleIcon className="w-4 h-4" />
        <span className="font-medium">Payments Complete</span>
      </div>
    );
  }

  if (hasPendingProof) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-yellow-100 to-amber-100 text-amber-700 rounded-full text-sm">
        <ClockIcon className="w-4 h-4" />
        <span className="font-medium">Awaiting Confirmation</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-red-100 to-rose-100 text-red-700 rounded-full text-sm">
      <ExclamationTriangleIcon className="w-4 h-4" />
      <span className="font-medium">Payment Required</span>
    </div>
  );
};

const UnitCard = ({
  unit,
  onPayment,
  onUploadProof,
  onContactLandlord,
  onAccessPortal,
  loadingPayment,
}: {
  unit: Unit;
  onPayment: (unitId: string) => void;
  onUploadProof: (unitId: string, agreementId: string, amount: number) => void;
  onContactLandlord: () => void;
  onAccessPortal: (agreementId: string) => void;
  loadingPayment: boolean;
}) => {
  const isPaymentsComplete =
    unit.is_advance_payment_paid && unit.is_security_deposit_paid;
  const showPayButton = !isPaymentsComplete && !unit.has_pending_proof;
  const totalPaymentDue =
    toNumber(!unit.is_security_deposit_paid ? unit.sec_deposit : 0) +
    toNumber(!unit.is_advance_payment_paid ? unit.advanced_payment : 0);

  return (
    <article className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden group">
      {/* Image Section */}
      <div className="relative h-48 sm:h-56">
        {unit.unit_photos?.[0] ? (
          <Image
            src={unit.unit_photos[0]}
            alt={`Unit ${unit.unit_name}`}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            priority={false}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-blue-50 to-emerald-50 flex items-center justify-center">
            <PhotoIcon className="w-12 h-12 text-gray-400" />
          </div>
        )}

        {/* Payment Status Overlay */}
        <div className="absolute top-3 left-3">
          <PaymentStatusBadge unit={unit} />
        </div>
      </div>

      {/* Content Section */}
      <div className="p-4 sm:p-6">
        {/* Header */}
        <div className="mb-4">
          <div className="flex items-start justify-between mb-2">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <HomeIcon className="w-5 h-5 text-emerald-600" />
              Unit {unit.unit_name}
            </h2>
          </div>

          <div className="flex items-center text-gray-600 mb-2">
            <MapPinIcon className="w-4 h-4 mr-1.5 text-emerald-500" />
            <p className="text-sm truncate">
              {unit.property_name} · {unit.city}, {unit.province}
            </p>
          </div>

          <div className="flex items-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <CurrencyDollarIcon className="w-4 h-4 text-blue-500" />
              <span className="font-semibold">
                {formatCurrency(unit.rent_amount)}/month
              </span>
            </div>
            <div className="flex items-center gap-1">
              <FaHome className="w-3 h-3 text-emerald-500" />
              <span>{unit.unit_size} sqm</span>
            </div>
          </div>
        </div>

        {/* Lease Period */}
        <div className="mb-4 p-3 bg-gradient-to-r from-blue-50 to-emerald-50 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <CalendarIcon className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-gray-700">
              Lease Period
            </span>
          </div>
          <p className="text-sm text-gray-600">
            {formatDate(unit.start_date)} - {formatDate(unit.end_date)}
          </p>
        </div>

        {/* Payment Details */}
        {!isPaymentsComplete && (
          <div className="mb-4 p-3 bg-gradient-to-r from-red-50 to-rose-50 rounded-lg border border-red-200">
            <h4 className="text-sm font-medium text-red-800 mb-2 flex items-center gap-1">
              <ExclamationTriangleIcon className="w-4 h-4" />
              Outstanding Payments
            </h4>
            <div className="space-y-1 text-sm">
              {!unit.is_security_deposit_paid && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Security Deposit:</span>
                  <span className="font-medium text-red-700">
                    {formatCurrency(unit.sec_deposit)}
                  </span>
                </div>
              )}
              {!unit.is_advance_payment_paid && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Advance Payment:</span>
                  <span className="font-medium text-red-700">
                    {formatCurrency(unit.advanced_payment)}
                  </span>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t border-red-200">
                <span className="font-medium text-gray-700">Total Due:</span>
                <span className="font-bold text-red-800">
                  {formatCurrency(totalPaymentDue)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          {unit.has_pending_proof ? (
            <div className="p-3 bg-gradient-to-r from-yellow-50 to-amber-50 rounded-lg border border-yellow-200">
              <div className="flex items-center gap-2 text-yellow-800">
                <ClockIcon className="w-4 h-4" />
                <span className="text-sm font-medium">
                  Proof of payment submitted. Awaiting landlord confirmation.
                </span>
              </div>
            </div>
          ) : showPayButton ? (
            <div className="grid grid-cols-1 gap-2">
              <button
                onClick={() => onPayment(unit.unit_id)}
                disabled={loadingPayment}
                className="flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-semibold text-sm hover:shadow-lg transform hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loadingPayment ? (
                  <FaSpinner className="w-4 h-4 animate-spin" />
                ) : (
                  <FaCreditCard className="w-4 h-4" />
                )}
                Pay through Maya
              </button>

              <button
                onClick={() =>
                  onUploadProof(
                    unit.unit_id,
                    unit.agreement_id,
                    totalPaymentDue
                  )
                }
                className="flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-yellow-500 to-amber-500 text-white rounded-xl font-semibold text-sm hover:shadow-lg transform hover:scale-[1.02] transition-all"
              >
                <FaUpload className="w-4 h-4" />
                Upload Proof of Payment
              </button>
            </div>
          ) : isPaymentsComplete ? (
            <button
              onClick={() => onAccessPortal(unit.agreement_id)}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-blue-500 to-emerald-500 text-white rounded-xl font-semibold text-sm hover:shadow-lg transform hover:scale-[1.02] transition-all"
            >
              <HomeIcon className="w-4 h-4" />
              Access Portal
            </button>
          ) : null}

          {/* Contact Landlord Button */}
          <button
            onClick={onContactLandlord}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl font-semibold text-sm hover:shadow-lg transform hover:scale-[1.02] transition-all"
          >
            <FaComments className="w-4 h-4" />
            Message Landlord
          </button>
        </div>
      </div>
    </article>
  );
};

const EmptyState = ({
  searchQuery,
  onClearSearch,
}: {
  searchQuery: string;
  onClearSearch: () => void;
}) => (
  <div className="flex flex-col items-center justify-center py-12 px-4">
    <div className="w-16 h-16 bg-gradient-to-r from-blue-100 to-emerald-100 rounded-full flex items-center justify-center mb-4">
      {searchQuery ? (
        <FaSearch className="w-8 h-8 text-emerald-600" />
      ) : (
        <HomeIcon className="w-8 h-8 text-emerald-600" />
      )}
    </div>
    <h3 className="text-xl font-semibold text-gray-800 mb-2">
      {searchQuery ? "No units found" : "No active leases"}
    </h3>
    <p className="text-gray-600 text-center mb-6 max-w-md">
      {searchQuery
        ? "Try adjusting your search terms or clear the search to see all units."
        : "You currently have no active leases. Check your invitations or browse available properties."}
    </p>
    {searchQuery && (
      <button
        onClick={onClearSearch}
        className="px-6 py-3 bg-gradient-to-r from-blue-500 to-emerald-500 text-white rounded-xl hover:shadow-lg transition-all"
      >
        Clear Search
      </button>
    )}
  </div>
);

// Main Component
export default function MyUnit() {
  const { user, admin, fetchSession } = useAuthStore();
  const router = useRouter();
  const [loadingPayment, setLoadingPayment] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const itemsPerPage = 9; // 3x3 grid on desktop

  // Authentication check
  useEffect(() => {
    if (!user && !admin) {
      fetchSession();
    }
  }, [user, admin, fetchSession]);

  // Fetch units
  const { units, loading, error, refetch } = useUnits(user?.tenant_id);

  // Memoized filtering and pagination
  const { filteredUnits, paginatedUnits, totalPages } = useMemo(() => {
    const filtered = units.filter((unit) => {
      const query = searchQuery.toLowerCase();
      return (
        unit.unit_name.toLowerCase().includes(query) ||
        unit.property_name.toLowerCase().includes(query) ||
        unit.city.toLowerCase().includes(query) ||
        unit.province.toLowerCase().includes(query)
      );
    });

    const totalPages = Math.ceil(filtered.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginated = filtered.slice(startIndex, startIndex + itemsPerPage);

    return { filteredUnits: filtered, paginatedUnits: paginated, totalPages };
  }, [units, searchQuery, currentPage, itemsPerPage]);

  // Reset page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  // Event handlers
  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const handleUploadProof = useCallback(
    async (unitId: string, agreementId: string, amountPaid: number) => {
      const { value: file } = await Swal.fire({
        title: "Upload Proof of Payment",
        input: "file",
        inputAttributes: {
          accept: "image/*,application/pdf",
          "aria-label": "Upload your payment proof",
        },
        showCancelButton: true,
        confirmButtonText: "Upload",
        customClass: {
          popup: "rounded-xl",
          confirmButton: "bg-gradient-to-r from-blue-500 to-emerald-500",
        },
      });

      if (!file) return;

      const formData = new FormData();
      formData.append("file", file);
      formData.append("unit_id", unitId);
      formData.append("tenant_id", user?.tenant_id || "");
      formData.append("agreement_id", agreementId);
      formData.append("amount_paid", String(amountPaid));

      try {
        const res = await axios.post(
          "/api/tenant/payment/uploadProofPayment",
          formData,
          {
            headers: { "Content-Type": "multipart/form-data" },
          }
        );

        if (res.status === 200) {
          await Swal.fire({
            icon: "success",
            title: "Success!",
            text: "Your proof of payment has been submitted!",
            customClass: { popup: "rounded-xl" },
          });
          refetch();
        } else {
          throw new Error("Upload failed");
        }
      } catch (err) {
        console.error(err);
        await Swal.fire({
          icon: "error",
          title: "Upload Failed",
          text: "Failed to upload proof of payment. Please try again.",
          customClass: { popup: "rounded-xl" },
        });
      }
    },
    [user?.tenant_id, refetch]
  );

  const handleUnitPayment = useCallback(
    async (unitId: string) => {
      const unit = units.find((u) => u.unit_id === unitId);
      if (!unit) {
        Swal.fire("Error", "Unit not found.", "error");
        return;
      }

      const items = [];
      if (!unit.is_security_deposit_paid) {
        items.push({
          name: "Security Deposit",
          type: "SECURITY_DEPOSIT",
          amount: Number(unit.sec_deposit),
        });
      }
      if (!unit.is_advance_payment_paid) {
        items.push({
          name: "Advance Payment",
          type: "ADVANCE_PAYMENT",
          amount: Number(unit.advanced_payment),
        });
      }

      const totalAmount = items.reduce((sum, item) => sum + item.amount, 0);

      if (items.length === 0 || totalAmount <= 0) {
        Swal.fire(
          "No Payment Needed",
          "Both payments are already settled.",
          "info"
        );
        return;
      }

      const itemDescriptions = items.map((item) => item.name).join(" and ");
      const result = await Swal.fire({
        title: `Pay ${itemDescriptions}?`,
        text: `Pay ${formatCurrency(totalAmount)} for ${itemDescriptions}?`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Yes, Pay Now",
        cancelButtonText: "Cancel",
        customClass: {
          popup: "rounded-xl",
          confirmButton: "bg-gradient-to-r from-green-500 to-emerald-500",
        },
      });

      if (!result.isConfirmed || !user) return;

      setLoadingPayment(true);

      try {
        const payload = {
          agreement_id: unit.agreement_id,
          items: items.map((item) => ({
            type: item.type,
            amount: item.amount,
          })),
          payment_method_id: 1,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          redirectUrl: {
            success: `${process.env.NEXT_PUBLIC_BASE_URL}/pages/payment/secSuccess`,
            failure: `${process.env.NEXT_PUBLIC_BASE_URL}/pages/payment/secFailed`,
            cancel: `${process.env.NEXT_PUBLIC_BASE_URL}/pages/payment/secCancelled`,
          },
        };

        const response = await axios.post(
          "/api/tenant/initialPayment",
          payload
        );
        if (response.status === 200) {
          window.location.href = response.data.checkoutUrl;
        }
      } catch (error) {
        await Swal.fire({
          icon: "error",
          title: "Payment Failed",
          text: "An error occurred during payment. Please try again.",
          customClass: { popup: "rounded-xl" },
        });
      } finally {
        setLoadingPayment(false);
      }
    },
    [units, user]
  );

  const handleContactLandlord = useCallback(() => {
    if (!units?.[0]?.landlord_id || !user?.user_id) {
      Swal.fire({
        icon: "error",
        title: "Unable to Contact",
        text: "Landlord information is not available.",
        customClass: { popup: "rounded-xl" },
      });
      return;
    }

    const chatRoom = `chat_${[user.user_id, units[0].landlord_id]
      .sort()
      .join("_")}`;

    // Set the chat data
    const setChatData = useChatStore.getState().setPreselectedChat;
    setChatData({
      chat_room: chatRoom,
      landlord_id: units[0].landlord_id,
      name: units[0].landlord_name || "Landlord",
      tenant_id: user.tenant_id || null,
    });

    Swal.fire({
      title: "Redirecting...",
      text: "Taking you to the chat room...",
      icon: "info",
      timer: 1500,
      showConfirmButton: false,
      customClass: { popup: "rounded-xl" },
      didClose: () => router.push("/pages/tenant/chat"),
    });
  }, [units, user?.user_id, user?.tenant_id, router]);

  const handleAccessPortal = useCallback(
    (agreementId: string) => {
      router.push(`/pages/tenant/rentalPortal/${agreementId}`);
    },
    [router]
  );

  const handleViewInvitations = useCallback(() => {
    router.push("/pages/tenant/viewInvites");
  }, [router]);

  // Loading state
  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/90">
        <LoadingScreen message="Just a moment, getting things ready..." />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50">
      <TenantOutsidePortalNav />

      <div className="flex-1 md:ml-64">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          {/* Header Section */}
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-emerald-600 mb-4">
              My Units
            </h1>

            <div className="flex flex-col sm:flex-row gap-4 items-start">
              <button
                onClick={handleViewInvitations}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-emerald-500 hover:from-blue-600 hover:to-emerald-600 text-white rounded-xl transition-all duration-200 font-medium shadow-md hover:shadow-lg transform hover:scale-105"
              >
                <ChatBubbleLeftRightIcon className="w-5 h-5" />
                View Invitations
              </button>

            </div>
          </div>

          {/* Analytics Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <LeaseCounter tenantId={user?.tenant_id} />
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <ApplicationsCounter tenantId={user?.tenant_id} />
            </div>
          </div>

          {/* Divider */}
          <hr className="my-8 border-gray-300" />

          {/* Error State */}
          {error && <ErrorBoundary error={error} onRetry={refetch} />}

          {/* Content */}
          {!error && (
            <>
              {/* Search and Filter */}
              <SearchAndFilter
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                totalUnits={units.length}
                filteredCount={filteredUnits.length}
              />

              {/* Units Grid */}
              {filteredUnits.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                  <EmptyState
                    searchQuery={searchQuery}
                    onClearSearch={() => setSearchQuery("")}
                  />
                </div>
              ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="p-4 sm:p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
                      {paginatedUnits.map((unit) => (
                        <UnitCard
                          key={unit.unit_id}
                          unit={unit}
                          onPayment={handleUnitPayment}
                          onUploadProof={handleUploadProof}
                          onContactLandlord={handleContactLandlord}
                          onAccessPortal={handleAccessPortal}
                          loadingPayment={loadingPayment}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Pagination */}
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                    totalItems={filteredUnits.length}
                    itemsPerPage={itemsPerPage}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
