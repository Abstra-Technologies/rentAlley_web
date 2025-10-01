
import { Box, Typography } from "@mui/material";
import LeaseDetails from "../../../app/pages/lease/[agreement_id]/page"; // Adjust import based on where the interface is defined


interface LeaseInfoProps {
    // @ts-ignore
    lease: LeaseDetails;
}

export default function LeaseInfo({ lease }: LeaseInfoProps) {
    return (
        <Box className="space-y-6 text-gray-700 mt-4">
            {/* Overview Section */}
            <div className="p-4 border rounded-lg shadow-sm bg-white">

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Tenant Information */}
                    <div className="space-y-3">
                        <h4 className="text-sm font-semibold text-gray-800">Tenant Information</h4>
                        <p>
                            <strong>Name:</strong> {lease.tenant_name || "N/A"}
                        </p>
                        <p>
                            <strong>Email:</strong>{" "}
                            {lease.email ? (
                                <a
                                    href={`mailto:${lease.email}`}
                                    className="text-blue-600 underline"
                                >
                                    {lease.email}
                                </a>
                            ) : (
                                <span className="text-gray-400 italic">N/A</span>
                            )}
                        </p>
                        <p>
                            <strong>Phone Number:</strong>{" "}
                            {lease.phoneNumber ? (
                                <a
                                    href={`tel:${lease.phoneNumber}`}
                                    className="text-blue-600 underline"
                                >
                                    {lease.phoneNumber}
                                </a>
                            ) : (
                                <span className="text-gray-400 italic">N/A</span>
                            )}
                        </p>
                    </div>

                    {/* Lease Information */}
                    <div className="space-y-3">
                        <h4 className="text-sm font-semibold text-gray-800">Lease Information</h4>
                        <p>
                            <strong>Property / Unit:</strong> {lease.property_name} – {lease.unit_name}
                        </p>
                        <p>
                            <strong>Lease Period:</strong>{" "}
                            {lease.start_date
                                ? new Date(lease.start_date).toLocaleDateString("en-US", {
                                    year: "numeric",
                                    month: "short",
                                    day: "numeric",
                                })
                                : "N/A"}{" "}
                            →{" "}
                            {lease.end_date
                                ? new Date(lease.end_date).toLocaleDateString("en-US", {
                                    year: "numeric",
                                    month: "short",
                                    day: "numeric",
                                })
                                : "N/A"}
                        </p>
                        <p>
                            <strong>Agreement Document:</strong>{" "}
                            {lease.agreement_url ? (
                                <a
                                    href={lease.agreement_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 underline"
                                >
                                    View
                                </a>
                            ) : (
                                <span className="text-gray-400 italic">N/A</span>
                            )}
                        </p>
                    </div>
                </div>
            </div>

            {/* Financial Terms Section */}
            <div className="p-4 border rounded-lg shadow-sm bg-white">
                <h3 className="text-md font-semibold text-gray-800 mb-3">Financial Terms</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <p>
                        <strong>Security Deposit:</strong> ₱
                        {lease.security_deposit_amount?.toLocaleString() || 0}
                    </p>
                    <p>
                        <strong>Advance Payment:</strong> ₱
                        {lease.advance_payment_amount?.toLocaleString() || 0}
                    </p>
                    <p>
                        <strong>Billing Due Day:</strong> {lease.billing_due_day || "Not set"}
                    </p>
                    <p>
                        <strong>Grace Period:</strong> {lease.grace_period_days || 0} days
                    </p>
                    <p>
                        <strong>Late Penalty:</strong> ₱
                        {lease.late_penalty_amount?.toLocaleString() || 0} per day
                    </p>
                    <p>
                        <strong>Rent Amount:</strong> ₱
                        {lease.rent_amount?.toLocaleString() || 0}
                    </p>
                </div>
            </div>
        </Box>
    );
}