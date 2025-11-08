"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { formatCurrency, formatDate } from "@/utils/formatter/formatters";
import { useRouter } from "next/navigation";
import { Receipt, Calendar, CreditCard, FileText, Eye } from "lucide-react";

interface Payment {
  payment_id: number;
  amount_paid: number;
  payment_status: string;
  payment_method_name?: string;
  payment_date: string;
  receipt_reference?: string;
  proof_of_payment?: string;
  payment_type?: string;
}

export default function LeasePayments({ lease }: { lease: any }) {
  const [data, setData] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!lease?.lease_id) return;

    const fetchPayments = async () => {
      try {
        const res = await axios.get(
          `/api/tenant/activeRent/paymentsList?agreement_id=${lease.lease_id}`
        );
        setData(res.data || []);
      } catch (err) {
        console.error("Error fetching lease payments:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPayments();
  }, [lease?.lease_id]);

  const handleRowClick = (payment: Payment) => {
    router.push(`/pages/landlord/payment/details/${payment.payment_id}`);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
          <p className="text-sm text-gray-600">Loading payments...</p>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
        <div className="max-w-md mx-auto">
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-100 to-emerald-100 rounded-full flex items-center justify-center">
            <Receipt className="h-8 w-8 text-blue-600" />
          </div>
          <h3 className="text-base font-bold text-gray-900 mb-2">
            No Payments Yet
          </h3>
          <p className="text-sm text-gray-600">
            Payment records will appear here once transactions are made.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="flex items-center gap-2">
          <Receipt className="w-5 h-5 text-blue-600" />
          <h3 className="text-base font-bold text-gray-900">Payment Records</h3>
        </div>
        <p className="text-sm text-gray-600">Lease ID: #{lease.lease_id}</p>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Method
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reference
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Proof
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.map((payment) => (
                <tr
                  key={payment.payment_id}
                  onClick={() => handleRowClick(payment)}
                  className="hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(payment.payment_date)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-bold text-green-600">
                      {formatCurrency(payment.amount_paid)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {payment.payment_type || "—"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {payment.payment_method_name || "—"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        payment.payment_status === "confirmed"
                          ? "bg-green-100 text-green-800"
                          : payment.payment_status === "pending"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {payment.payment_status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {payment.receipt_reference || "—"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    {payment.proof_of_payment ? (
                      <a
                        href={payment.proof_of_payment}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                      >
                        View
                      </a>
                    ) : (
                      <span className="text-gray-400 italic text-sm">N/A</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {data.map((payment) => (
          <div
            key={payment.payment_id}
            onClick={() => handleRowClick(payment)}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 cursor-pointer active:bg-gray-50 transition-colors"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <span className="text-sm text-gray-600">
                  {formatDate(payment.payment_date)}
                </span>
              </div>
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                  payment.payment_status === "confirmed"
                    ? "bg-green-100 text-green-800"
                    : payment.payment_status === "pending"
                    ? "bg-amber-100 text-amber-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {payment.payment_status}
              </span>
            </div>

            <div className="text-2xl font-bold text-green-600 mb-3">
              {formatCurrency(payment.amount_paid)}
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Type:</span>
                <span className="text-gray-900 font-medium">
                  {payment.payment_type || "—"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Method:</span>
                <span className="text-gray-900 font-medium">
                  {payment.payment_method_name || "—"}
                </span>
              </div>
              {payment.receipt_reference && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Reference:</span>
                  <span className="text-gray-900 font-medium truncate ml-2">
                    {payment.receipt_reference}
                  </span>
                </div>
              )}
            </div>

            {payment.proof_of_payment && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <a
                  href={payment.proof_of_payment}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  <Eye className="w-4 h-4" />
                  View Proof of Payment
                </a>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
