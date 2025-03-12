"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import axios from "axios";
import useAuth from "../../../../../hooks/useSession";
import {
  HomeIcon,
  ClockIcon,
  BuildingOfficeIcon,
  CurrencyDollarIcon,
  CheckCircleIcon,
  XCircleIcon,
  InformationCircleIcon,
  ChatBubbleLeftRightIcon,
  ArrowRightIcon,
  MapPinIcon,
  KeyIcon,
  CreditCardIcon,
} from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import Link from "next/link";

export default function MyUnit() {
  const { user } = useAuth();
  const router = useRouter();
  const [unit, setUnit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [loadingPayment, setLoadingPayment] = useState(false);
  const [isSecurityPaid, setIsSecurityPaid] = useState(0);
  const [isAdvancedPaid, setIsAdvancedPaid] = useState(0);

  useEffect(() => {
    const fetchUnitData = async () => {
      try {
        const { data } = await axios.get(
          `/api/tenant/approved-tenant-property?tenantId=${user.tenant_id}`
        );

        console.log("Fetched unit data:", data);

        if (data) {
          setUnit(data);
          setIsSecurityPaid(data.is_security_deposit_paid || 0);
          setIsAdvancedPaid(data.is_advance_payment_paid || 0);
        }
      } catch (err) {
        setError(err.response?.data?.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUnitData();
  }, [user]);

  const handlePayment = async (type) => {
    const isSecurity = type === "security_deposit";
    const title = isSecurity ? "Pay Security Deposit?" : "Pay Advance Rent?";
    const amount = isSecurity ? unit.sec_deposit : unit.advanced_payment;

    if (!amount || amount <= 0) {
      Swal.fire(
        "Invalid Payment",
        "Payment amount is not set or is zero.",
        "error"
      );
      return;
    }

    const result = await Swal.fire({
      title,
      text: `Are you sure you want to pay ₱${amount.toLocaleString()} for ${
        isSecurity ? "Security Deposit" : "Advance Rent"
      }?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, Pay Now",
      cancelButtonText: "Cancel",
    });

    const user_id = user?.user_id;

    if (result.isConfirmed) {
      setLoadingPayment(true);

      try {
        const response = await axios.post("/api/tenant/RegPayment", {
          agreement_id: unit.agreement_id,
          amount,
          payment_method_id: 1,
          payment_type: type,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          redirectUrl: {
            success: "http://localhost:3000/pages/payment/secSuccess",
            failure: "http://localhost:3000/pages/payment/secFailed",
            cancel: "http://localhost:3000/pages/payment/secCancelled",
          },
        });

        if (response.status === 200) {
          window.location.href = response.data.checkoutUrl;
        }
      } catch (error) {
        Swal.fire(
          "Payment Failed",
          "An error occurred while processing your payment.",
          "error"
        );
      } finally {
        setLoadingPayment(false);
      }
    }
  };

  const handleAccessRentPortal = () => {
    router.push("/pages/tenant/dashboard");
  };

  const handleContactLandlord = () => {
    if (!unit?.landlord_id) {
      console.error("Missing landlord_id!");
      return;
    }
    const chatRoom = `chat_${[user?.user_id, unit.landlord_id]
      .sort()
      .join("_")}`;

    router.push(
      `/pages/commons/chat?chat_room=${chatRoom}&landlord_id=${unit.landlord_id}`
    );
  };

  if (loading) return <LoadingScreen />;
  if (error) return <ErrorScreen error={error} />;

  const requiresSecurity = unit?.sec_deposit > 0;
  const requiresAdvanced = unit?.advanced_payment > 0;
  const allPaymentsMade =
    (!requiresSecurity || isSecurityPaid) &&
    (!requiresAdvanced || isAdvancedPaid);

  // Status badge color logic
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "active":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Payment status indicators
  const PaymentStatus = ({ isPaid, label }) => (
    <div className="flex items-center gap-2 text-sm">
      {isPaid ? (
        <CheckCircleIcon className="h-5 w-5 text-green-500" />
      ) : (
        <InformationCircleIcon className="h-5 w-5 text-amber-500" />
      )}
      <span>
        {label}: {isPaid ? "Paid" : "Pending"}
      </span>
    </div>
  );

  // Format complete address
  const formatAddress = () => {
    if (!unit) return "";

    const addressParts = [unit.street, unit.brgy_district, unit.city].filter(
      Boolean
    );

    return addressParts.join(", ");
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <div className="hidden w-64 border-r border-gray-200 bg-white py-6 px-4 md:block">
        <div className="mb-8">
          <h2 className="text-xl font-bold text-indigo-900">My Rental</h2>
          <p className="text-sm text-gray-500">Manage your rental property</p>
        </div>

        <nav>
          <ul className="space-y-2">
            <li className="rounded-md bg-indigo-50">
              <a
                href="#"
                className="flex items-center space-x-3 rounded-md p-3 font-medium text-indigo-900"
              >
                <HomeIcon className="h-5 w-5" />
                <span>Current Unit</span>
              </a>
            </li>
            <li>
              <a
                href="#"
                className="flex items-center space-x-3 rounded-md p-3 text-gray-700 hover:bg-gray-100"
              >
                <ClockIcon className="h-5 w-5" />
                <span>Unit History</span>
              </a>
            </li>
            <li>
              <Link
                href="/pages/tenant/paymentHistory"
                className="flex items-center space-x-3 rounded-md p-3 text-gray-700 hover:bg-gray-100"
              >
                <CreditCardIcon className="h-5 w-5" />
                <span>Payment History</span>
              </Link>
            </li>
          </ul>
        </nav>
      </div>

      <div className="flex-1 px-4 py-6 md:px-8 md:py-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-indigo-900">My Unit</h1>

          <button
            onClick={handleContactLandlord}
            className="mt-3 sm:mt-0 flex items-center gap-2 text-indigo-600 hover:text-indigo-800 transition-colors"
          >
            <ChatBubbleLeftRightIcon className="h-5 w-5" />
            <span>Contact Landlord</span>
          </button>
        </div>

        {unit && (
          <div className="overflow-hidden rounded-xl bg-white shadow-md">
            <div className="relative h-56 sm:h-72 w-full">
              {unit.unit_photos && unit.unit_photos.length > 0 ? (
                <Image
                  src={unit.unit_photos[0]}
                  alt={`${unit.property_name} - Unit ${unit.unit_name}`}
                  layout="fill"
                  objectFit="cover"
                  className="brightness-90"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-r from-indigo-600 to-indigo-800"></div>
              )}

              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent">
                <div className="absolute bottom-0 left-0 p-6 text-white">
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${getStatusColor(
                        unit.status
                      )}`}
                    >
                      {unit?.status || "Status"}
                    </span>
                    <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-medium text-white">
                      {unit?.property_type
                        ? unit.property_type.charAt(0).toUpperCase() +
                          unit.property_type.slice(1).toLowerCase()
                        : "Property Type"}
                    </span>
                  </div>
                  <h2 className="text-2xl font-bold">
                    {unit?.property_name} - Unit {unit.unit_name}
                  </h2>
                  <div className="flex items-center mt-2 text-white/90">
                    <MapPinIcon className="h-4 w-4 mr-1" />
                    <p className="text-sm">{formatAddress()}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6">
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Unit Details
                </h3>
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Size</p>
                      <p className="font-medium">{unit.unit_size || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Furnishing</p>
                      <p className="font-medium">
                        {unit.furnish
                          ?.split("_")
                          .map(
                            (word) =>
                              word.charAt(0).toUpperCase() + word.slice(1)
                          )
                          .join(" ") || "Not furnished"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Minimum Stay</p>
                      <p className="font-medium">
                        {unit.min_stay || "N/A"} month(s)
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Payment Details
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-100 transition-all hover:shadow-md">
                    <div className="flex items-center mb-2">
                      <CurrencyDollarIcon className="h-5 w-5 text-indigo-500 mr-2" />
                      <p className="text-sm text-gray-500">Monthly Rent</p>
                    </div>
                    <p className="text-xl font-bold text-indigo-600">
                      ₱{unit.rent_amount?.toLocaleString() || 0}
                    </p>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-100 transition-all hover:shadow-md">
                    <div className="flex items-center mb-2">
                      <KeyIcon className="h-5 w-5 text-indigo-500 mr-2" />
                      <p className="text-sm text-gray-500">Security Deposit</p>
                    </div>
                    <p className="text-xl font-bold text-indigo-600">
                      ₱{unit.sec_deposit?.toLocaleString() || 0}
                    </p>
                    {requiresSecurity && (
                      <PaymentStatus
                        isPaid={isSecurityPaid}
                        label="Security Deposit"
                      />
                    )}
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-100 transition-all hover:shadow-md">
                    <div className="flex items-center mb-2">
                      <CreditCardIcon className="h-5 w-5 text-indigo-500 mr-2" />
                      <p className="text-sm text-gray-500">Advance Payment</p>
                    </div>
                    <p className="text-xl font-bold text-indigo-600">
                      ₱{unit.advanced_payment?.toLocaleString() || 0}
                    </p>
                    {requiresAdvanced && (
                      <PaymentStatus
                        isPaid={isAdvancedPaid}
                        label="Advance Payment"
                      />
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Pay through Maya
                </h3>

                {requiresSecurity && !isSecurityPaid && (
                  <button
                    onClick={() => handlePayment("security_deposit")}
                    disabled={loadingPayment}
                    className="w-full flex items-center justify-between px-6 py-4 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-lg shadow-md hover:from-indigo-700 hover:to-indigo-800 transition-all transform hover:scale-[1.01]"
                  >
                    <div className="flex items-center">
                      <KeyIcon className="h-6 w-6 mr-3" />
                      <div>
                        <p className="font-medium">Pay Security Deposit</p>
                        <p className="text-xs text-indigo-200">
                          Required to secure your unit
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <span className="font-bold mr-2">
                        ₱{unit.sec_deposit?.toLocaleString()}
                      </span>
                      <ArrowRightIcon className="h-4 w-4" />
                    </div>
                  </button>
                )}

                {requiresAdvanced && !isAdvancedPaid && (
                  <button
                    onClick={() => handlePayment("advance_rent")}
                    disabled={loadingPayment}
                    className="w-full flex items-center justify-between px-6 py-4 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-lg shadow-md hover:from-indigo-700 hover:to-indigo-800 transition-all transform hover:scale-[1.01]"
                  >
                    <div className="flex items-center">
                      <CurrencyDollarIcon className="h-6 w-6 mr-3" />
                      <div>
                        <p className="font-medium">Pay Advance Rent</p>
                        <p className="text-xs text-indigo-200">
                          Required before move-in
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <span className="font-bold mr-2">
                        ₱{unit.advanced_payment?.toLocaleString()}
                      </span>
                      <ArrowRightIcon className="h-4 w-4" />
                    </div>
                  </button>
                )}

                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Other Payment Option
                </h3>
                {(requiresAdvanced && !isAdvancedPaid) || (requiresSecurity && !isSecurityPaid) ? (
                  <button
                    onClick={() =>
                      router.push(
                        `/pages/payment/proofOfPayment?agreement_id=${unit.agreement_id}`
                      )
                    }
                    className="w-full flex items-center justify-between px-6 py-4 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-lg shadow-md hover:from-indigo-700 hover:to-indigo-800 transition-all transform hover:scale-[1.01]"
                  >
                    <div className="flex items-center">
                      <CreditCardIcon className="h-6 w-6 mr-3" />
                      <div>
                        <p className="font-medium">Proof of Payment</p>
                        <p className="text-xs text-indigo-200">
                          Gcash, PDC, Bank Transfer
                        </p>
                      </div>
                    </div>
                  </button>
                ) : null}
                {allPaymentsMade && (
                  <button
                    onClick={handleAccessRentPortal}
                    className="w-full flex items-center justify-between px-6 py-4 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg shadow-md hover:from-green-700 hover:to-green-800 transition-all transform hover:scale-[1.01]"
                  >
                    <div className="flex items-center">
                      <BuildingOfficeIcon className="h-6 w-6 mr-3" />
                      <div>
                        <p className="font-medium">Access Rent Portal</p>
                        <p className="text-xs text-green-200">
                          Manage your monthly payments
                        </p>
                      </div>
                    </div>
                    <ArrowRightIcon className="h-5 w-5" />
                  </button>
                )}
              </div>

              <div className="mt-8 md:hidden">
                <button
                  onClick={handleContactLandlord}
                  className="w-full flex items-center justify-center gap-2 py-3 border border-indigo-200 rounded-lg text-indigo-600 hover:bg-indigo-50 transition-colors"
                >
                  <ChatBubbleLeftRightIcon className="h-5 w-5" />
                  <span>Contact Landlord</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const LoadingScreen = () => (
  <div className="flex items-center justify-center h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
    <span className="ml-3 text-lg text-indigo-600">
      Loading your unit details...
    </span>
  </div>
);

const ErrorScreen = ({ error }) => (
  <div className="flex flex-col items-center justify-center h-screen px-6 bg-gray-50">
    <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-lg">
      <div className="flex flex-col items-center">
        <div className="bg-red-50 p-4 rounded-full mb-6">
          <XCircleIcon className="h-16 w-16 text-red-500" />
        </div>
        
        <h2 className="text-2xl font-bold text-gray-800 mb-3">
          No Active Lease Agreement
        </h2>
        
        <p className="text-gray-600 mb-2 text-center">
          You don't currently have an active lease agreement with any unit.
        </p>
        
        <div className="bg-red-50 p-3 rounded-lg w-full mb-6 mt-2">
          <p className="text-red-600 text-sm font-medium">
            {error || "Please complete the application process to establish a lease"}
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full">
          <button
            onClick={() => window.history.back()}
            className="px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium flex-1 flex items-center justify-center"
          >
            Go Back
          </button>
          
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex-1 flex items-center justify-center"
          >
            Try Again
          </button>
        </div>
      </div>
    </div>
  </div>
);
