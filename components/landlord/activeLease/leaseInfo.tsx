import {
    User,
    Mail,
    Phone,
    Home,
    FileText,
    Calendar,
    Wallet,
    DollarSign,
    Clock,
    Shield,
} from "lucide-react";

interface LeaseDetails {
    tenant_name?: string;
    email?: string;
    phoneNumber?: string;
    property_name?: string;
    unit_name?: string;
    start_date?: string;
    end_date?: string;
    agreement_url?: string;
    security_deposit_amount?: number;
    advance_payment_amount?: number;
    billing_due_day?: number;
    grace_period_days?: number;
    late_penalty_amount?: number;
    rent_amount?: number;
}

interface LeaseInfoProps {
    lease: LeaseDetails;
}

export default function LeaseInfo({ lease }: LeaseInfoProps) {
    return (
        <div className="w-full">
            {/* Grid: 1 col mobile, 2 col md, 3 col lg */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* TENANT INFORMATION */}
                <div className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4">
                    <div className="flex items-center gap-2 mb-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-100 to-emerald-100 rounded-md flex items-center justify-center">
                            <User className="w-4 h-4 text-blue-600" />
                        </div>
                        <h3 className="text-sm font-semibold text-gray-900">Tenant</h3>
                    </div>

                    <div className="space-y-2 text-sm">
                        <div>
                            <p className="text-xs text-gray-500">Name</p>
                            <p className="font-medium text-gray-900 truncate">
                                {lease.tenant_name || <span className="italic text-gray-400">N/A</span>}
                            </p>
                        </div>

                        <div>
                            <p className="text-xs text-gray-500 flex items-center gap-1">
                                <Mail className="w-3 h-3" /> Email
                            </p>
                            {lease.email ? (
                                <a
                                    href={`mailto:${lease.email}`}
                                    className="text-sm text-blue-600 hover:underline break-words"
                                >
                                    {lease.email}
                                </a>
                            ) : (
                                <span className="text-sm italic text-gray-400">N/A</span>
                            )}
                        </div>

                        <div>
                            <p className="text-xs text-gray-500 flex items-center gap-1">
                                <Phone className="w-3 h-3" /> Phone
                            </p>
                            {lease.phoneNumber ? (
                                <a
                                    href={`tel:${lease.phoneNumber}`}
                                    className="text-sm text-blue-600 hover:underline"
                                >
                                    {lease.phoneNumber}
                                </a>
                            ) : (
                                <span className="text-sm italic text-gray-400">N/A</span>
                            )}
                        </div>
                    </div>
                </div>

                {/* LEASE OVERVIEW */}
                <div className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4">
                    <div className="flex items-center gap-2 mb-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-100 to-emerald-100 rounded-md flex items-center justify-center">
                            <Home className="w-4 h-4 text-blue-600" />
                        </div>
                        <h3 className="text-sm font-semibold text-gray-900">Lease Overview</h3>
                    </div>

                    <div className="space-y-2 text-sm">
                        <div>
                            <p className="text-xs text-gray-500">Property / Unit</p>
                            <p className="font-medium text-gray-900 truncate">
                                {lease.property_name || "N/A"}{" "}
                                <span className="text-gray-500">—</span>{" "}
                                {lease.unit_name || "N/A"}
                            </p>
                        </div>

                        <div>
                            <p className="text-xs text-gray-500 flex items-center gap-1">
                                <Calendar className="w-3 h-3" /> Period
                            </p>
                            <p className="text-sm text-gray-900">
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
                        </div>

                        <div>
                            <p className="text-xs text-gray-500 flex items-center gap-1">
                                <FileText className="w-3 h-3" /> Agreement
                            </p>
                            {lease.agreement_url ? (
                                <a
                                    href={lease.agreement_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm text-blue-600 hover:underline font-medium"
                                >
                                    View Document
                                </a>
                            ) : (
                                <span className="text-sm italic text-gray-400">N/A</span>
                            )}
                        </div>
                    </div>
                </div>

                {/* FINANCIAL TERMS */}
                <div className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4">
                    <div className="flex items-center gap-2 mb-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-100 to-emerald-100 rounded-md flex items-center justify-center">
                            <Wallet className="w-4 h-4 text-blue-600" />
                        </div>
                        <h3 className="text-sm font-semibold text-gray-900">Financial Terms</h3>
                    </div>

                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <Shield className="w-4 h-4 text-gray-400" />
                                <p className="text-xs text-gray-600">Security Deposit</p>
                            </div>
                            <span className="text-sm font-semibold text-gray-900">
                ₱{(lease.security_deposit_amount ?? 0).toLocaleString()}
              </span>
                        </div>

                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <DollarSign className="w-4 h-4 text-gray-400" />
                                <p className="text-xs text-gray-600">Advance Payment</p>
                            </div>
                            <span className="text-sm font-semibold text-gray-900">
                ₱{(lease.advance_payment_amount ?? 0).toLocaleString()}
              </span>
                        </div>

                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-gray-400" />
                                <p className="text-xs text-gray-600">Billing Due Day</p>
                            </div>
                            <span className="text-sm font-semibold text-gray-900">
                {lease.billing_due_day ?? "Not set"}
              </span>
                        </div>

                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-gray-400" />
                                <p className="text-xs text-gray-600">Grace Period</p>
                            </div>
                            <span className="text-sm font-semibold text-gray-900">
                {lease.grace_period_days ?? 0} days
              </span>
                        </div>

                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <DollarSign className="w-4 h-4 text-red-500" />
                                <p className="text-xs text-gray-600">Late Penalty</p>
                            </div>
                            <span className="text-sm font-semibold text-gray-900">
                ₱{(lease.late_penalty_amount ?? 0).toLocaleString()} /day
              </span>
                        </div>

                        <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                            <div className="flex items-center gap-2">
                                <DollarSign className="w-4 h-4 text-green-600" />
                                <p className="text-sm font-medium text-gray-900">Monthly Rent</p>
                            </div>
                            <span className="text-lg font-bold text-green-600">
                ₱{(lease.rent_amount ?? 0).toLocaleString()}
              </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
