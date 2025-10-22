"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { useRouter } from "next/navigation";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import CurrentTenant from "@/components/landlord/activeLease/CurrentTenant";
import LeaseActions from "@/components/landlord/activeLease/LeaseActions";

export default function LeaseDetails({ unitId }) {
  const router = useRouter();
  const [lease, setLease] = useState(null);
  const [tenant, setTenant] = useState(null);
  const [propertyName, setPropertyName] = useState("");
  const [unitName, setUnitName] = useState("");
  const [leaseMode, setLeaseMode] = useState(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("tenant");

  const formatDate = (date) =>
      date
          ? new Date(date).toLocaleDateString("en-PH", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })
          : "N/A";

  useEffect(() => {
    fetchAllData();
  }, [unitId]);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const [leaseRes, tenantRes, unitRes] = await Promise.all([
        axios.get(`/api/leaseAgreement/getLeasePerUnit?unit_id=${unitId}`),
        axios.get(`/api/landlord/prospective/getApprovedTenantsDetails?unit_id=${unitId}`),
        axios.get(`/api/propertyListing/getPropertyDetailByUnitId?unit_id=${unitId}`),
      ]);

      const leaseData = leaseRes.data;
      if (leaseData?.agreement_id) {
        setLease(leaseData);
        setStartDate(leaseData.start_date || "");
        setEndDate(leaseData.end_date || "");
      } else {
        setLease(null);
        setStartDate("");
        setEndDate("");
      }

      const tenantData = tenantRes.data;
      setTenant(tenantData && Object.keys(tenantData).length > 0 ? tenantData : null);

      const prop = unitRes.data?.propertyDetails;
      if (prop) {
        setPropertyName(prop.property_name || "Unnamed Property");
        setUnitName(prop.unit_name || "Unnamed Unit");
      } else {
        setPropertyName("");
        setUnitName("");
      }
    } catch (err: any) {
      console.error("❌ Error fetching lease/unit/tenant data:", err);
      Swal.fire("Error", "Failed to load lease, tenant, or unit details.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateLease = () => {
    if (!lease?.agreement_id) {
      return Swal.fire(
          "No Lease Record",
          "Approve the tenant first — a draft lease will be created.",
          "warning"
      );
    }
    router.push(`/pages/lease/generate/${lease?.agreement_id}`);
  };

  const handleUploadLease = () => {
    if (!lease?.agreement_id) {
      return Swal.fire(
          "No Lease Record",
          "Please create a lease record before uploading.",
          "warning"
      );
    }
    router.push(`/pages/lease/scan/${lease.agreement_id}`);
  };

  const handleSaveDates = async () => {
    if (!startDate || !endDate)
      return Swal.fire("Error", "Start and end date are required.", "error");

    if (endDate <= startDate)
      return Swal.fire("Error", "End date must be after start date.", "error");

    // Ask landlord if they want to configure deposit/advance
    const { value: config, isConfirmed, isDismissed } = await Swal.fire({
      title: "Configure Security & Advance Payment?",
      html: `
      <div style="text-align:left">
        <p class="text-gray-600 text-sm mb-3">
          You can optionally configure the security deposit and advance payment for this lease.
          <br/><br/>
          <em>If left empty, these values will default to ₱0.</em>
        </p>
        <input id="swal-deposit" type="number" placeholder="Security Deposit (₱)" class="swal2-input" />
        <input id="swal-advance" type="number" placeholder="Advance Payment (₱)" class="swal2-input" />
      </div>
    `,
      showCancelButton: true,
      confirmButtonText: "Save & Activate",
      cancelButtonText: "Skip",
      preConfirm: () => {
        const deposit = (document.getElementById("swal-deposit") as HTMLInputElement)?.value || "0";
        const advance = (document.getElementById("swal-advance") as HTMLInputElement)?.value || "0";
        return { deposit, advance };
      },
    });

    // ✅ Even if user clicks "Skip", proceed with default values (0)
    const deposit = config?.deposit || "0";
    const advance = config?.advance || "0";

    Swal.fire({
      title: "Activating Lease...",
      text: "Please wait while we update lease details.",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });

    try {
      const res = await fetch("/api/leaseAgreement/updateLeaseDateSet", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          unit_id: unitId,
          start_date: startDate,
          end_date: endDate,
          security_deposit_amount: parseFloat(deposit) || 0,
          advance_payment_amount: parseFloat(advance) || 0,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        console.error("Lease update failed:", data);
        return Swal.fire("Error", data.error || "Failed to update lease.", "error");
      }

      Swal.fire({
        icon: "success",
        title: "Lease Activated!",
        text: "Lease dates, deposit, and advance payment saved successfully. Tenant has been notified.",
        confirmButtonText: "OK",
      });

      fetchAllData();
    } catch (error) {
      console.error("Error updating lease:", error);
      Swal.fire("Error", "Something went wrong while saving lease details.", "error");
    }
  };

  const handleTerminateLease = async () => {
    const confirm = await Swal.fire({
      title: "Terminate Lease?",
      text: "This will mark the lease as terminated but retain record.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, terminate",
    });
    if (!confirm.isConfirmed) return;

    await fetch("/api/leaseAgreement/terminateLease", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ unit_id: unitId }),
    });
    Swal.fire("Terminated!", "Lease has been terminated.", "success");
    fetchAllData();
  };

  const handleSendInvite = async () => {
    const { value: email } = await Swal.fire({
      title: "Invite Tenant",
      input: "email",
      inputPlaceholder: "Enter tenant email",
      confirmButtonText: "Send Invite",
      showCancelButton: true,
    });
    if (!email) return;

    await fetch("/api/invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, unitId, propertyName, unitName }),
    });
    Swal.fire("Sent!", "Invitation email sent.", "success");
  };

  if (loading)
    return <p className="text-center text-gray-500 mt-10">Loading lease details...</p>;

  return (
      <div className="min-h-screen bg-gray-50 p-6">
        {/* Back */}
        <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-6 p-2 hover:bg-blue-50 rounded-lg transition"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Back to Units
        </button>

        {/* Header */}
        <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-1">{propertyName}</h1>
          <p className="text-gray-600">Unit: {unitName}</p>

          {!tenant && (
              <button
                  onClick={handleSendInvite}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
              >
                Send Tenant Invite
              </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex border-b mb-6 space-x-6">
          <button
              onClick={() => setActiveTab("tenant")}
              className={`pb-2 px-3 font-medium ${
                  activeTab === "tenant"
                      ? "border-b-2 border-blue-600 text-blue-700"
                      : "text-gray-500 hover:text-blue-600"
              }`}
          >
            Current Tenant & Lease
          </button>
          <button
              onClick={() => setActiveTab("config")}
              className={`pb-2 px-3 font-medium ${
                  activeTab === "config"
                      ? "border-b-2 border-blue-600 text-blue-700"
                      : "text-gray-500 hover:text-blue-600"
              }`}
          >
            Unit Config
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === "tenant" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left: Tenant Info */}
              <div>
                <CurrentTenant tenant={tenant} formatDate={formatDate} />
              </div>

              {/* Right: Lease Actions or Existing Lease Info */}
              <div>
                {lease?.start_date && lease?.end_date ? (
                    <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-6">
                      <h2 className="text-lg font-bold text-gray-800 mb-3">📄 Active Lease Details</h2>

                      {/* Dates */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm mb-4">
                        <div className="p-3 bg-gray-50 rounded-lg border">
                          <p className="text-gray-500 font-medium">Start Date</p>
                          <p className="text-gray-800 font-semibold">{formatDate(lease.start_date)}</p>
                        </div>
                        <div className="p-3 bg-gray-50 rounded-lg border">
                          <p className="text-gray-500 font-medium">End Date</p>
                          <p className="text-gray-800 font-semibold">{formatDate(lease.end_date)}</p>
                        </div>
                      </div>

                      {/* Agreement Link */}
                      {lease?.agreement_url ? (
                          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm">
                            <p className="text-blue-700 font-semibold mb-1">Existing Lease Document</p>
                            <a
                                href={lease.agreement_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 underline"
                            >
                              View Lease Agreement
                            </a>
                          </div>
                      ) : (
                          <p className="text-sm text-gray-500 italic">
                            No uploaded or generated agreement yet.
                          </p>
                      )}

                      {/* Terminate Button */}
                      <button
                          onClick={handleTerminateLease}
                          className="mt-5 w-full bg-red-600 hover:bg-red-700 text-white py-2.5 rounded-lg font-semibold text-sm"
                      >
                        Terminate Lease
                      </button>
                    </div>
                ) : (
                    <LeaseActions
                        lease={lease}
                        leaseMode={leaseMode}
                        setLeaseMode={setLeaseMode}
                        unitId={unitId}
                        startDate={startDate}
                        endDate={endDate}
                        setStartDate={setStartDate}
                        setEndDate={setEndDate}
                        handleGenerateLease={handleGenerateLease}
                        handleUploadLease={handleUploadLease}
                        handleSaveDates={handleSaveDates}
                        handleTerminateLease={handleTerminateLease}
                    />
                )}
              </div>
            </div>
        )}


        {activeTab === "config" && (
            <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-6 text-center text-gray-500">
              <p>⚙️ Unit configuration details will appear here.</p>
            </div>
        )}
      </div>
  );
}
