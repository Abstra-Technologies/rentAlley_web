import { useEffect, useState } from "react";
import axios from "axios";

export default function TenantSignatureStatus({ agreement_id }: { agreement_id: string }) {
    const [tenantSignature, setTenantSignature] = useState<{
        id: number | null;
        status: string;
        signed_at: string | null;
        email: string | null;
    } | null>(null);

    const [leaseInfo, setLeaseInfo] = useState<{
        agreement_status: string;
        property_name: string;
        unit_name: string;
    }>({
        agreement_status: "pending",
        property_name: "",
        unit_name: "",
    });

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // ✅ Tenant-specific fetch logic
    useEffect(() => {
        async function fetchTenantSignature() {
            try {
                setLoading(true);
                setError(null);

                const res = await axios.get(`/api/tenant/activeRent/leaseAgreement/signatureStatus?agreement_id=${agreement_id}`);
                const data = res.data;

                if (data?.success) {
                    setTenantSignature(data.tenant_signature || null);
                    setLeaseInfo({
                        agreement_status: data.agreement_status,
                        property_name: data.property_name,
                        unit_name: data.unit_name,
                    });
                } else {
                    setTenantSignature(null);
                    setError("No tenant signature data found.");
                }
            } catch (err) {
                console.error("❌ Failed to fetch tenant signature:", err);
                setError("Unable to fetch tenant signature status.");
            } finally {
                setLoading(false);
            }
        }

        if (agreement_id) fetchTenantSignature();
    }, [agreement_id]);

    // ✅ Simple display for testing
    if (loading) return <p className="text-gray-500">Loading...</p>;
    if (error) return <p className="text-red-500">{error}</p>;

    return (
        <div className="bg-white rounded-xl p-4 border border-gray-200">
            <h3 className="font-semibold text-gray-800 mb-2">
                Lease: {leaseInfo.property_name} — {leaseInfo.unit_name}
            </h3>
            <p className="text-sm text-gray-600">
                Agreement Status:{" "}
                <span className="font-bold text-blue-600">{leaseInfo.agreement_status}</span>
            </p>
            <p className="text-sm text-gray-600 mt-1">
                Tenant Signature Status:{" "}
                <span
                    className={`font-bold ${
                        tenantSignature?.status === "signed"
                            ? "text-emerald-600"
                            : tenantSignature?.status === "pending"
                                ? "text-amber-500"
                                : "text-gray-500"
                    }`}
                >
          {tenantSignature?.status || "pending"}
        </span>
            </p>

            {tenantSignature?.signed_at && (
                <p className="text-xs text-gray-500 mt-1">
                    Signed on{" "}
                    {new Date(tenantSignature.signed_at).toLocaleString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                    })}
                </p>
            )}
        </div>
    );
}
