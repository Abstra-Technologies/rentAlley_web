"use client";

import { Suspense, useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import axios from "axios";
import html2canvas from "html2canvas";

export default function SecSucceedPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SecSuccess />
    </Suspense>
  );
}


function SecSuccess() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const amount = searchParams.get("amount");
  const requestReferenceNumber = searchParams.get("requestReferenceNumber");
  const tenant_id = searchParams.get("tenant_id");
  const billing_id = searchParams.get("billing_id");
  const agreement_id = searchParams.get("agreement_id");

  const [message, setMessage] = useState("Processing your payment...");
  const [loading, setLoading] = useState(true);
  const receiptRef = useRef(null);

  // ✅ Update payment status to confirmed
  useEffect(() => {
    async function updateBillStatus() {
      try {
        await axios.post("/api/payment/updateBillingPaymentStatus", {
          tenant_id,
          billing_id,
          amount,
          requestReferenceNumber,
          payment_status: "confirmed",
        });
        setMessage("Your payment was successful! Billing status updated.");
      } catch (error) {
        setMessage(`Failed to update payment status. ${error}`);
      } finally {
        setLoading(false);
      }
    }

    if (amount && requestReferenceNumber && tenant_id && billing_id) {
      updateBillStatus();
    }
  }, [amount, requestReferenceNumber, tenant_id, billing_id]);

  // ✅ Download receipt as image
  const handleDownloadImage = async () => {
    if (!receiptRef.current) return;
    const canvas = await html2canvas(receiptRef.current, {
      scale: 3,
      backgroundColor: "#ffffff",
      useCORS: true,
    });

    const image = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = image;
    link.download = `UpKyp_Receipt_${requestReferenceNumber}.png`;
    link.click();
  };

  return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-6">
        <div className="max-w-md w-full bg-white shadow-xl rounded-2xl p-8 text-center border border-gray-100">
          {/* ✅ Animated success icon */}
          <div className="mx-auto mb-6 w-20 h-20 flex items-center justify-center rounded-full bg-green-50 text-green-600 shadow-inner">
            {loading ? (
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="animate-spin w-10 h-10 text-yellow-500"
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
                      d="M4 12a8 8 0 018-8v8z"
                  ></path>
                </svg>
            ) : (
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                    className="w-10 h-10 text-green-600"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
            )}
          </div>

          {/* ✅ Title */}
          <h2
              className={`text-2xl font-extrabold mb-2 ${
                  loading ? "text-yellow-600" : "text-green-600"
              }`}
          >
            {loading ? "Processing..." : "Payment Successful"}
          </h2>

          {/* ✅ Message */}
          <p className="text-gray-600 text-sm mb-6">{message}</p>

          {/* ✅ Receipt */}
          {!loading && (
              <div
                  ref={receiptRef}
                  className="mt-4 text-left bg-gray-50 border border-gray-200 rounded-xl p-5 shadow-sm"
              >
                <h2 className='text-center'>UpKyp Rent Systems</h2>
                <h3 className="text-lg text-center font-bold text-gray-800 mb-3 flex justify-center items-center gap-2">
                  <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                      className="w-5 h-5 text-blue-600"
                  >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h7l5 5v14a2 2 0 01-2 2z"
                    />
                  </svg>
                  Payment Receipt Invoice
                </h3>

                <div className="space-y-2 text-sm text-gray-700">
                  <p>
                    <strong className="font-semibold">Reference No:</strong>{" "}
                    <span className="text-gray-800">{requestReferenceNumber}</span>
                  </p>
                  <p>
                    <strong className="font-semibold">Bill ID:</strong>{" "}
                    <span className="text-gray-800">{billing_id}</span>
                  </p>
                  <p>
                    <strong className="font-semibold">Date:</strong>{" "}
                    <span className="text-gray-800">
                  {new Date().toLocaleString()}
                </span>
                  </p>
                  <p>
                    <strong className="font-semibold">Amount Paid:</strong>{" "}
                    <span className="text-green-600 font-bold">
                  ₱{parseFloat(amount).toLocaleString()}
                </span>
                  </p>
                  <p>
                    <strong className="font-semibold">Status:</strong>{" "}
                    <span className="text-green-600 font-semibold">Confirmed</span>
                  </p>
                </div>
              </div>
          )}

          {/* ✅ Divider */}
          <div className="my-6 border-t border-gray-200" />

          {/* ✅ Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
                onClick={handleDownloadImage}
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-medium rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 transition-all duration-200"
            >
              <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="w-4 h-4"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Download Receipt (Image)
            </button>

            <button
                onClick={() =>
                    router.replace(`/pages/tenant/billing?agreement_id=${agreement_id}`)
                }
                className="inline-flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-medium rounded-lg bg-gradient-to-r from-blue-600 to-emerald-600 text-white shadow hover:from-blue-700 hover:to-emerald-700 transition-all duration-200"
            >
              <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="w-4 h-4"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" />
              </svg>
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
  );
}
