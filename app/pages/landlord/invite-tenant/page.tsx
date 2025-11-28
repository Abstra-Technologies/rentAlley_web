"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, UserPlus, Building2, Send, Calendar, Home } from "lucide-react";
import Swal from "sweetalert2";
import useAuthStore from "@/zustand/authStore";
import axios from "axios";
import LoadingScreen from "@/components/loadingScreen";
import { BackButton } from "@/components/navigation/backButton";

export default function InviteTenantPage() {
  const router = useRouter();
  const { user, fetchSession } = useAuthStore();

  const [properties, setProperties] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [selectedProperty, setSelectedProperty] = useState("");
  const [selectedUnit, setSelectedUnit] = useState("");
  const [tenantEmail, setTenantEmail] = useState("");
  const [leaseStart, setLeaseStart] = useState("");
  const [leaseEnd, setLeaseEnd] = useState("");
  const [loading, setLoading] = useState(true);

  const landlordId = user?.landlord_id;

  // 🧩 Fetch Properties
  useEffect(() => {
    const fetchProperties = async () => {
      if (!landlordId) {
        await fetchSession();
        return;
      }
      try {
        const response = await axios.get(
          `/api/landlord/${landlordId}/properties`
        );
        setProperties(response.data.data || []);
      } catch (error) {
        console.error("Error fetching properties:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProperties();
  }, [landlordId, fetchSession]);

  // 🧩 Fetch Units when property changes
  useEffect(() => {
    const fetchUnits = async () => {
      if (!selectedProperty) {
        setUnits([]);
        setSelectedUnit("");
        return;
      }
      try {
        const res = await axios.get(
          `/api/unitListing/getUnitListings?property_id=${selectedProperty}`
        );
        setUnits(res.data || []);
      } catch (error) {
        console.error("Error fetching units:", error);
        setUnits([]);
      }
    };
    fetchUnits();
  }, [selectedProperty]);

  const handleSendInvite = async () => {
    if (
      !tenantEmail ||
      !selectedProperty ||
      !selectedUnit ||
      !leaseStart ||
      !leaseEnd
    ) {
      Swal.fire({
        icon: "warning",
        title: "Missing Required Fields",
        text: "Please fill out all required fields before sending an invite.",
        confirmButtonColor: "#2563eb",
      });
      return;
    }

    const property = properties.find((p) => p.property_id === selectedProperty);
    const unit = units.find((u) => u.unit_id === selectedUnit);

    const propertyName = property?.property_name || "Unknown Property";
    const unitName = unit?.unit_name || unit?.unit_name || "Unknown Unit";

    try {
      Swal.fire({
        title: "Sending Invite...",
        text: "Please wait while we send the tenant invitation.",
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });

      const payload = {
        email: tenantEmail,
        unitId: selectedUnit,
        propertyName,
        unitName,
        startDate: leaseStart,
        endDate: leaseEnd,
      };

      const res = await axios.post("/api/invite", payload, {
        headers: { "Content-Type": "application/json" },
      });

      Swal.close();

      if (res.data.success) {
        Swal.fire({
          icon: "success",
          title: "Invitation Sent!",
          text: `An invite has been sent to ${tenantEmail}.`,
          confirmButtonColor: "#10b981",
        });

        // Reset form
        setTenantEmail("");
        setSelectedProperty("");
        setSelectedUnit("");
        setLeaseStart("");
        setLeaseEnd("");
        setUnits([]);
      } else {
        throw new Error(res.data.message || "Failed to send invite.");
      }
    } catch (error: any) {
      Swal.fire({
        icon: "error",
        title: "Failed to Send Invite",
        text: error.message || "Something went wrong.",
        confirmButtonColor: "#ef4444",
      });
    }
  };

  if (loading)
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white/80 z-50">
        <LoadingScreen message="Loading properties..." />
      </div>
    );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-emerald-50/30">
      <div className="px-4 pt-20 pb-24 md:px-8 lg:px-12 xl:px-16 max-w-3xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 p-6 md:p-8">
          {/* Back Button */}
          <div className="mb-6">
            <BackButton label="Back to Tenants" />
          </div>

          {/* Header */}
          <div className="text-center mb-8">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-blue-500/20">
              <UserPlus className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              Invite a Tenant
            </h1>
            <p className="text-gray-600 mt-2 text-sm">
              Send an invitation link to your tenant with lease details.
            </p>
          </div>

          {/* Form */}
          <div className="space-y-5">
            {/* Tenant Email */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Tenant Email <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={tenantEmail}
                  onChange={(e) => setTenantEmail(e.target.value)}
                  placeholder="tenant@example.com"
                  className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-gray-50 focus:bg-white transition-all text-sm"
                />
              </div>
            </div>

            {/* Property */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Select Property <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none z-10" />
                <select
                  value={selectedProperty}
                  onChange={(e) => {
                    setSelectedProperty(e.target.value);
                    setSelectedUnit("");
                  }}
                  className="w-full pl-11 pr-10 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-gray-50 focus:bg-white transition-all text-sm appearance-none cursor-pointer"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236b7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                    backgroundRepeat: "no-repeat",
                    backgroundPosition: "right 0.75rem center",
                    backgroundSize: "1.25rem",
                  }}
                >
                  <option value="">Choose a property...</option>
                  {properties.length > 0 ? (
                    properties.map((p) => (
                      <option key={p.property_id} value={p.property_id}>
                        {p.property_name}
                      </option>
                    ))
                  ) : (
                    <option disabled>No properties found</option>
                  )}
                </select>
              </div>
            </div>

            {/* Unit */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Select Unit <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Home className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none z-10" />
                <select
                  value={selectedUnit}
                  onChange={(e) => setSelectedUnit(e.target.value)}
                  className="w-full pl-11 pr-10 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-gray-50 focus:bg-white transition-all text-sm appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!selectedProperty || units.length === 0}
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236b7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                    backgroundRepeat: "no-repeat",
                    backgroundPosition: "right 0.75rem center",
                    backgroundSize: "1.25rem",
                  }}
                >
                  <option value="">Choose a unit...</option>
                  {units.length > 0 ? (
                    units.map((u: any) => (
                      <option key={u.unit_id} value={u.unit_id}>
                        {u.unit_name} — {u.status}
                      </option>
                    ))
                  ) : (
                    <option disabled>No units available</option>
                  )}
                </select>
              </div>
            </div>

            {/* Lease Dates */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Lease Start Date <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="date"
                    value={leaseStart}
                    onChange={(e) => setLeaseStart(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-gray-50 focus:bg-white transition-all text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Lease End Date <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="date"
                    value={leaseEnd}
                    onChange={(e) => setLeaseEnd(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-gray-50 focus:bg-white transition-all text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Submit */}
            <div className="pt-4 flex justify-end">
              <button
                onClick={handleSendInvite}
                className="flex items-center justify-center gap-2 px-8 py-3 rounded-xl font-semibold text-white text-sm bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 shadow-lg shadow-blue-500/30 hover:shadow-xl transition-all"
              >
                <Send className="w-5 h-5" />
                Send Invitation
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
