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
  PencilSquareIcon,
} from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Swal from "sweetalert2";

export default function MyUnit() {
  const { user } = useAuth();
  const router = useRouter();
  const [unit, setUnit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [loadingPayment, setLoadingPayment] = useState(false);
  const [isSecurityPaid, setIsSecurityPaid] = useState(false);
  const [isAdvancedPaid, setIsAdvancedPaid] = useState(false);

  const [selectedItems, setSelectedItems] = useState({
    security_deposit: false,
    advance_rent: false,
  });

  useEffect(() => {
    const fetchUnitData = async () => {
      try {
        const { data } = await axios.get(
          `/api/tenant/approved-tenant-property?tenantId=${user.tenant_id}`
        );

        console.log("Fetched unit data:", data);

        if (data) {
          setUnit(data);
          setIsSecurityPaid(!!data.is_security_deposit_paid);
          setIsAdvancedPaid(!!data.is_advance_payment_paid);

          setSelectedItems({
            security_deposit:
              !data.is_security_deposit_paid && data.sec_deposit > 0,
            advance_rent:
              !data.is_advance_payment_paid && data.advanced_payment > 0,
          });
        }
      } catch (err) {
        setError(err.response?.data?.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUnitData();
  }, [user]);

  const requiresSecurity = unit?.sec_deposit > 0;
  const requiresAdvanced = unit?.advanced_payment > 0;

  const pendingSecurity = requiresSecurity && !isSecurityPaid;
  const pendingAdvanced = requiresAdvanced && !isAdvancedPaid;

  const getSelectedPaymentItems = () => {
    const itemsToPay = [];
    let totalAmount = 0;

    if (pendingSecurity && selectedItems.security_deposit) {
      itemsToPay.push({
        type: "security_deposit",
        name: "Security Deposit",
        amount: parseFloat(unit.sec_deposit),
      });
      totalAmount += parseFloat(unit.sec_deposit);
    }
    if (pendingAdvanced && selectedItems.advance_rent) {
      itemsToPay.push({
        type: "advance_rent",
        name: "Advance Rent",
        amount: parseFloat(unit.advanced_payment),
      });
      totalAmount += parseFloat(unit.advanced_payment);
    }
    return { itemsToPay, totalAmount };
  };

  const { itemsToPay, totalAmount } = getSelectedPaymentItems();
  const canPayViaMaya = itemsToPay.length > 0;

  const handleCheckboxChange = (type) => {
    setSelectedItems((prev) => ({
      ...prev,
      [type]: !prev[type],
    }));
  };

  const handlePayment = async () => {
    const { itemsToPay, totalAmount } = getSelectedPaymentItems();

    if (itemsToPay.length === 0 || totalAmount <= 0) {
      Swal.fire(
        "No Items Selected",
        "Please select at least one item to pay.",
        "warning"
      );
      return;
    }

    const itemDescriptions = itemsToPay.map((item) => item.name).join(" and ");

    const result = await Swal.fire({
      title: `Pay ${itemDescriptions}?`,
      text: `Are you sure you want to pay a total of ₱${totalAmount.toLocaleString()} for ${itemDescriptions}?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, Pay Now",
      cancelButtonText: "Cancel",
    });

    if (result.isConfirmed && user) {
      setLoadingPayment(true);

      try {
        const payload = {
          agreement_id: unit.agreement_id,
          items: itemsToPay.map((item) => ({
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

        console.log("Sending payment request:", payload);

        const response = await axios.post("/api/tenant/RegPayment", payload);

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
    Swal.fire({
      title: "Redirecting...",
      text: "Taking you to your dashboard...",
      allowOutsideClick: false,
      allowEscapeKey: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });
    setTimeout(() => {
      Swal.close();
      router.push("/pages/tenant/dashboard");
    }, 1500);
  };

  const handleContactLandlord = () => {
    if (!unit?.landlord_id) {
      console.error("Missing landlord_id!");
      return;
    }

    const chatRoom = `chat_${[user?.user_id, unit.landlord_id]
      .sort()
      .join("_")}`;
    const chatUrl = `/pages/commons/chat?chat_room=${chatRoom}&landlord_id=${unit.landlord_id}`;

    Swal.fire({
      title: "Redirecting...",
      text: "Taking you to the chat room...",
      icon: "info",
      timer: 1500,
      showConfirmButton: false,
      didClose: () => {
        router.push(chatUrl);
      },
    });
  };

  if (loading) return <LoadingScreen />;
  if (error) return <ErrorScreen error={error} />;

  const allPaymentsMade =
    (!requiresSecurity || isSecurityPaid) &&
    (!requiresAdvanced || isAdvancedPaid);

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
                href="#"
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

          <div className="flex gap-4">
            <button
              onClick={handleContactLandlord}
              className="flex items-center gap-2 text-indigo-600 hover:text-indigo-800 transition-colors"
            >
              <ChatBubbleLeftRightIcon className="h-5 w-5" />
              <span>Contact Landlord</span>
            </button>

            <button
              onClick={() => router.push("/pages/tenant/review")}
              className="flex items-center gap-2 text-indigo-600 hover:text-indigo-800 transition-colors"
            >
              <PencilSquareIcon className="h-5 w-5" />
              <span>Unit Feedback</span>
            </button>
          </div>
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
                      ₱{Number(unit.rent_amount || 0).toLocaleString() || 0}
                    </p>
                  </div>

                  {/* Security Deposit */}
                  {requiresSecurity && (
                    <div
                      className={`rounded-lg p-4 border transition-all ${
                        pendingSecurity
                          ? "bg-yellow-50 border-yellow-200"
                          : "bg-green-50 border-green-200"
                      }`}
                    >
                      <div className="flex items-center mb-2">
                        <KeyIcon className="h-5 w-5 text-indigo-500 mr-2" />
                        <p className="text-sm text-gray-500">
                          Security Deposit
                        </p>
                      </div>
                      <p className="text-xl font-bold text-indigo-600">
                        ₱{Number(unit.sec_deposit || 0).toLocaleString()}
                      </p>
                      <PaymentStatus isPaid={isSecurityPaid} label="Status" />
                      {/* Add Checkbox if pending */}
                      {pendingSecurity && (
                        <div className="mt-3 flex items-center">
                          <input
                            id="select_security_deposit"
                            type="checkbox"
                            checked={selectedItems.security_deposit}
                            onChange={() =>
                              handleCheckboxChange("security_deposit")
                            }
                            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                          />
                          <label
                            htmlFor="select_security_deposit"
                            className="ml-2 block text-sm text-gray-900"
                          >
                            Select to Pay
                          </label>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Advance Payment */}
                  {requiresAdvanced && (
                    <div
                      className={`rounded-lg p-4 border transition-all ${
                        pendingAdvanced
                          ? "bg-yellow-50 border-yellow-200"
                          : "bg-green-50 border-green-200"
                      }`}
                    >
                      <div className="flex items-center mb-2">
                        <CreditCardIcon className="h-5 w-5 text-indigo-500 mr-2" />
                        <p className="text-sm text-gray-500">Advance Payment</p>
                      </div>
                      <p className="text-xl font-bold text-indigo-600">
                        ₱{Number(unit.advanced_payment || 0).toLocaleString()}
                      </p>
                      <PaymentStatus isPaid={isAdvancedPaid} label="Status" />
                      {/* Add Checkbox if pending */}
                      {pendingAdvanced && (
                        <div className="mt-3 flex items-center">
                          <input
                            id="select_advance_rent"
                            type="checkbox"
                            checked={selectedItems.advance_rent}
                            onChange={() =>
                              handleCheckboxChange("advance_rent")
                            }
                            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                          />
                          <label
                            htmlFor="select_advance_rent"
                            className="ml-2 block text-sm text-gray-900"
                          >
                            Select to Pay
                          </label>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                {/* Maya Payment Button */}
                {canPayViaMaya && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">
                      Pay through Maya
                    </h3>
                    <button
                      onClick={handlePayment}
                      disabled={loadingPayment || itemsToPay.length === 0}
                      className={`w-full flex items-center justify-between px-6 py-4 rounded-lg shadow-md transition-all transform hover:scale-[1.01] ${
                        itemsToPay.length === 0 || loadingPayment
                          ? "bg-gray-400 cursor-not-allowed"
                          : "bg-gradient-to-r from-indigo-600 to-indigo-700 text-white hover:from-indigo-700 hover:to-indigo-800"
                      }`}
                    >
                      <div className="flex items-center flex-1">
                        <CreditCardIcon className="h-6 w-6 mr-3 flex-shrink-0" />{" "}
                        <div className="text-left">
                          <p className="font-medium">Pay Selected Items</p>
                          <p className="text-xs text-indigo-200">
                            {itemsToPay.length > 0
                              ? itemsToPay.map((i) => i.name).join(" & ")
                              : "Select items above"}
                          </p>
                        </div>
                      </div>

                      {itemsToPay.length > 0 && (
                        <div className="flex items-center flex-shrink-0 ml-4">
                          {" "}
                          <span className="font-bold mr-2">
                            ₱{totalAmount.toLocaleString()}
                          </span>
                          <ArrowRightIcon className="h-4 w-4" />
                        </div>
                      )}
                    </button>
                  </div>
                )}

                {/* Proof of Payment Option */}
                {(pendingSecurity || pendingAdvanced) && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2 mt-4">
                      Other Payment Option
                    </h3>
                    <button
                      onClick={() =>
                        router.push(
                          `/pages/payment/proofOfPayment?agreement_id=${unit.agreement_id}`
                        )
                      }
                      className="w-full flex items-center justify-between px-6 py-4 bg-gradient-to-r from-teal-500 to-cyan-600 text-white rounded-lg shadow-md hover:from-teal-600 hover:to-cyan-700 transition-all transform hover:scale-[1.01]"
                    >
                      <div className="flex items-center flex-1">
                        <BuildingOfficeIcon className="h-6 w-6 mr-3 flex-shrink-0" />
                        <div className="text-left">
                          <p className="font-medium">Upload Proof of Payment</p>
                          <p className="text-xs text-cyan-100">
                            Gcash, PDC, Bank Transfer
                          </p>
                        </div>
                      </div>
                      <div className="flex-shrink-0 ml-4">
                        <ArrowRightIcon className="h-5 w-5" />
                      </div>
                    </button>
                  </div>
                )}
                {allPaymentsMade && (
                  <button
                    onClick={handleAccessRentPortal}
                    className="w-full flex items-center justify-between px-6 py-4 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg shadow-md hover:from-green-700 hover:to-green-800 transition-all transform hover:scale-[1.01]"
                  >
                    <div className="flex items-center">
                      <BuildingOfficeIcon className="h-6 w-6 mr-3" />
                      <div className="text-left">
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
            {error ||
              "Please complete the application process to establish a lease"}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full">
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
