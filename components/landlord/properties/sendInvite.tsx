"use client";
import { useState, useEffect } from "react";
import { X, ChevronDown, UserPlus, Calendar } from "lucide-react";
import Swal from "sweetalert2";

export default function SendTenantInviteModal({
                                                landlord_id,
                                              }: {
  landlord_id: number;
}) {
  const [open, setOpen] = useState(false);
  const [properties, setProperties] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [selectedProperty, setSelectedProperty] = useState("");
  const [selectedUnit, setSelectedUnit] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(false);

  // Fetch landlord properties on modal open
// Fetch landlord properties on modal open
  useEffect(() => {
    if (!open || !landlord_id) return;

    const fetchProperties = async () => {
      try {
        const res = await fetch(`/api/landlord/${landlord_id}/properties`);
        const data = await res.json();

        // ✅ Normalize field names (in case backend returns camelCase)
        const normalized =
            data.data?.map((p: any) => ({
              property_id: p.property_id ?? p.propertyId,
              property_name: p.property_name ?? p.propertyName,
              ...p,
            })) || [];

        setProperties(normalized);
      } catch (err) {
        console.error("Error fetching properties:", err);
      }
    };

    fetchProperties();
  }, [open, landlord_id]);

  // Fetch units when property changes
  useEffect(() => {
    if (!selectedProperty) return;

    const fetchUnits = async () => {
      try {
        const res = await fetch(`/api/properties/${selectedProperty}/units`);
        const data = await res.json();
        setUnits(data.data || []);
      } catch (err) {
        console.error("Error fetching units:", err);
      }
    };

    fetchUnits();
  }, [selectedProperty]);

  const handleSendInvite = async () => {
    if (
        !selectedProperty ||
        !selectedUnit ||
        !inviteEmail ||
        !startDate ||
        !endDate
    ) {
      Swal.fire(
          "Error",
          "Please complete all fields including start and end dates.",
          "error"
      );
      return;
    }

    // Basic date validation
    if (new Date(startDate) >= new Date(endDate)) {
      Swal.fire("Error", "End date must be after start date.", "warning");
      return;
    }

    setLoading(true);

    try {
      const property = properties.find(
          (p) => String(p.property_id) === String(selectedProperty)
      );
      const unit = units.find(
          (u) => String(u.unit_id) === String(selectedUnit)
      );

      const res = await fetch("/api/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: inviteEmail,
          unitId: selectedUnit,
          propertyName: property?.property_name || "",
          unitName: unit?.unit_name || "",
          startDate,
          endDate,
        }),
      });

      const data = await res.json();

      if (data.success) {
        Swal.fire(
            "✅ Sent!",
            `Invitation email sent to ${inviteEmail}.`,
            "success"
        );
        setInviteEmail("");
        setSelectedProperty("");
        setSelectedUnit("");
        setStartDate("");
        setEndDate("");
        setOpen(false);
      } else {
        Swal.fire("Error", data.error || "Could not send invite.", "error");
      }
    } catch (err) {
      console.error("Invite error:", err);
      Swal.fire("Error", "Something went wrong. Try again later.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
      <>
        {/* Trigger Button */}
        <button
            onClick={() => setOpen(true)}
            className="w-full sm:w-auto px-4 sm:px-6 py-3 sm:py-4 bg-gradient-to-r from-blue-600 to-emerald-500 hover:from-blue-700 hover:to-emerald-600 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center sm:justify-start space-x-2 group"
        >
          <div className="p-2 bg-white/20 rounded-lg group-hover:bg-white/30 transition-colors">
            <UserPlus className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="text-left">
          <span className="block text-sm sm:text-base font-semibold">
            Invite Tenant
          </span>
            <span className="hidden sm:block text-xs text-blue-100">
            Send invitation to join
          </span>
          </div>
        </button>

        {/* Modal */}
        {open && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center">
              <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl shadow-2xl animate-slide-up sm:animate-fade-in max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 rounded-t-3xl sm:rounded-t-2xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                        Send Tenant Invite
                      </h2>
                      <p className="text-xs sm:text-sm text-gray-500 mt-1">
                        Invite a tenant to join your property
                      </p>
                    </div>
                    <button
                        onClick={() => setOpen(false)}
                        className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                    >
                      <X className="w-5 h-5 text-gray-500" />
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="px-6 py-4 space-y-4">
                  {/* Property Selector */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Property
                    </label>
                    <div className="relative">
                      <select
                          value={selectedProperty}
                          onChange={(e) => setSelectedProperty(e.target.value)}
                          className="w-full appearance-none border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 bg-white"
                      >
                        <option value="">Choose a property...</option>
                        {properties.map((p) => (
                            <option key={p.property_id} value={p.property_id}>
                              {p.property_name}
                            </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                    </div>
                  </div>

                  {/* Unit Selector */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Unit
                    </label>
                    <div className="relative">
                      <select
                          value={selectedUnit}
                          onChange={(e) => setSelectedUnit(e.target.value)}
                          className={`w-full appearance-none border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 bg-white ${
                              !selectedProperty ? "opacity-50 cursor-not-allowed" : ""
                          }`}
                          disabled={!selectedProperty}
                      >
                        <option value="">
                          {selectedProperty
                              ? "Choose a unit..."
                              : "Select property first"}
                        </option>
                        {units.map((u) => (
                            <option key={u.unit_id} value={u.unit_id}>
                              {u.unit_name} - {u.status}
                            </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                    </div>
                  </div>

                  {/* Email Input */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tenant Email Address
                    </label>
                    <input
                        type="email"
                        placeholder="tenant@example.com"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder:text-gray-400"
                    />
                  </div>

                  {/* Lease Start and End Dates */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Lease Start Date
                      </label>
                      <div className="relative">
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 pr-10 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900"
                        />
                        <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Lease End Date
                      </label>
                      <div className="relative">
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 pr-10 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900"
                        />
                        <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      </div>
                    </div>
                  </div>

                  {/* Info Card */}
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <p className="text-sm text-blue-800">
                      💡 The tenant will receive an email with the invite link.
                      Once accepted, the lease will start from the chosen start date
                      and mark the unit as occupied.
                    </p>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-4 rounded-b-3xl sm:rounded-b-2xl">
                  <div className="flex gap-3">
                    <button
                        onClick={() => setOpen(false)}
                        className="flex-1 sm:flex-initial px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-all duration-200"
                    >
                      Cancel
                    </button>
                    <button
                        onClick={handleSendInvite}
                        disabled={
                            loading ||
                            !selectedProperty ||
                            !selectedUnit ||
                            !inviteEmail ||
                            !startDate ||
                            !endDate
                        }
                        className={`flex-1 sm:flex-initial px-6 py-3 font-medium rounded-xl transition-all duration-200 flex items-center justify-center space-x-2 ${
                            loading ||
                            !selectedProperty ||
                            !selectedUnit ||
                            !inviteEmail ||
                            !startDate ||
                            !endDate
                                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                                : "bg-gradient-to-r from-blue-600 to-emerald-500 hover:from-blue-700 hover:to-emerald-600 text-white shadow-lg hover:shadow-xl"
                        }`}
                    >
                      {loading ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            <span>Sending...</span>
                          </>
                      ) : (
                          <>
                            <UserPlus className="w-4 h-4" />
                            <span>Send Invite</span>
                          </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
        )}
      </>
  );
}
