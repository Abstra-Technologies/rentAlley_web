'use client'
import { useEffect, useState } from "react";
import axios from "axios";


export default function TenantLeasePayments({ tenant_id }) {
    const [payments, setPayments] = useState([]);
    const [lease, setLease] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!tenant_id) return;

        const fetchPayments = async () => {
            setLoading(true);
            setError(null);

            try {
                const res = await axios.get(`/api/tenant/payment/currentLease?tenant_id=${tenant_id}`);
                console.log(res.data);
                if (res.status === 200) {
                    setLease(res.data.leaseAgreement || null);
                    setPayments(res.data.payments || []);
                } else {
                    setError(`Unexpected response: ${res.status}`);
                }
            } catch (err) {
                setError(`Failed to fetch payments. ${err.response?.data?.error || err.message}`);
            } finally {
                setLoading(false);
            }
        };

        fetchPayments();
    }, [tenant_id]);


    if (loading) return <p className="text-gray-500">Loading payments...</p>;
    if (error) return <p className="text-red-500">{error}</p>;
    if (!lease) return <p className="text-gray-500">No active lease found.</p>;
    if (payments.length === 0) return <p className="text-gray-500">No payments found.</p>;

    return (
        <div className="p-6 max-w-3xl mx-auto">
            <h1 className="text-2xl font-bold mb-4">Payments for Active Lease</h1>

            <h2 className="text-xl font-semibold mt-4 mb-2">Lease Details</h2>
            <p className="text-gray-600">Lease Agreement ID: <span className="font-bold">{lease.agreement_id}</span></p>
            <p className="text-gray-600">Unit ID: <span className="font-bold">{lease.unit_id}</span></p>

            <h2 className="text-xl font-semibold mt-6 mb-2">Payments</h2>
            {payments.map((payment) => (
                <div key={payment.payment_id} className="p-4 border rounded-lg bg-white shadow-md mb-4">
                    <h3 className="text-lg font-semibold">{payment.payment_type.replace("_", " ")}</h3>
                    <p className="text-gray-600">Amount Paid: <span className="font-bold">₱{payment?.amount_paid}</span></p>
                    <p className="text-gray-600">Payment Method: {payment?.payment_method}</p>
                    <p className="text-gray-600">Payment Status: <span className={`font-bold ${payment?.payment_status === "confirmed" ? "text-green-600" : "text-red-600"}`}>{payment.payment_status}</span></p>
                    {payment.receipt_reference && <p className="text-gray-600">Receipt Reference: {payment?.receipt_reference}</p>}
                    <p className="text-gray-500 text-sm">Date: {new Date(payment?.payment_date).toLocaleDateString()}</p>
                </div>
            ))}
        </div>
    );
}
