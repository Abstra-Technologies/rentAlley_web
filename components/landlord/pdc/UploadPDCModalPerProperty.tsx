"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { X, Plus, Trash2, Upload, CreditCard } from "lucide-react";

interface UploadPDCModalProps {
  isOpen: boolean;
  onClose: () => void;
  propertyId: number | string;
  onSuccess?: () => void;
}

interface LeaseOption {
  lease_id: number;
  unit_name: string;
  tenant_name: string;
  rent_amount: number;
}

interface PDCEntry {
  check_number: string;
  bank_name: string;
  amount: string;
  due_date: string;
  notes?: string;
  uploaded_image: File | null;
}

export default function UploadPDCModal({
  isOpen,
  onClose,
  propertyId,
  onSuccess,
}: UploadPDCModalProps) {
  const [leases, setLeases] = useState<LeaseOption[]>([]);
  const [selectedLease, setSelectedLease] = useState<string>("");
  const [pdcList, setPdcList] = useState<PDCEntry[]>([
    {
      check_number: "",
      bank_name: "",
      amount: "",
      due_date: "",
      notes: "",
      uploaded_image: null,
    },
  ]);
  const [uploading, setUploading] = useState(false);
  const [loadingLeases, setLoadingLeases] = useState(true);

  // 🔹 Fetch leases for the property
  useEffect(() => {
    if (!propertyId || !isOpen) return;
    const fetchLeases = async () => {
      setLoadingLeases(true);
      try {
        const { data } = await axios.get(
          `/api/landlord/activeLease/getByProperty?property_id=${propertyId}`
        );
        setLeases(Array.isArray(data.leases) ? data.leases : []);
      } catch (err) {
        console.error("Failed to fetch leases:", err);
        Swal.fire("Error", "Failed to load lease options.", "error");
        setLeases([]);
      } finally {
        setLoadingLeases(false);
      }
    };
    fetchLeases();
  }, [propertyId, isOpen]);

  // 🔹 Handle changes
  const handleAddRow = () => {
    const first = pdcList[0];
    setPdcList([
      ...pdcList,
      {
        check_number: "",
        bank_name: first.bank_name, // auto-fill
        amount: first.amount, // auto-fill
        due_date: "",
        notes: "",
        uploaded_image: null,
      },
    ]);
  };

  const handleRemoveRow = (index: number) => {
    setPdcList(pdcList.filter((_, i) => i !== index));
  };

  const handleChange = (index: number, field: keyof PDCEntry, value: any) => {
    const updated = [...pdcList];
    updated[index][field] = value;

    // 🪄 Auto-fill amount/bank name in all rows if user edits the first
    if (index === 0 && (field === "bank_name" || field === "amount")) {
      for (let i = 1; i < updated.length; i++) {
        if (field === "bank_name") updated[i].bank_name = value;
        if (field === "amount") updated[i].amount = value;
      }
    }

    setPdcList(updated);
  };

  const handleFileChange = (index: number, file: File | null) => {
    const updated = [...pdcList];
    updated[index].uploaded_image = file;
    setPdcList(updated);
  };

  // 🔹 Submit handler
  const handleSubmit = async () => {
    if (!propertyId) {
      Swal.fire("Missing Info", "Property ID is required.", "warning");
      return;
    }
    if (!selectedLease) {
      Swal.fire("Missing Lease", "Please select a lease.", "warning");
      return;
    }

    const validPDCs = pdcList.filter(
      (p) => p.check_number && p.bank_name && p.amount && p.due_date
    );

    if (validPDCs.length === 0) {
      Swal.fire(
        "Incomplete",
        "Please fill out all required PDC fields.",
        "warning"
      );
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("property_id", String(propertyId));

      validPDCs.forEach((pdc, i) => {
        formData.append(`pdcs[${i}][lease_id]`, selectedLease);
        formData.append(`pdcs[${i}][check_number]`, pdc.check_number);
        formData.append(`pdcs[${i}][bank_name]`, pdc.bank_name);
        formData.append(`pdcs[${i}][amount]`, pdc.amount);
        formData.append(`pdcs[${i}][due_date]`, pdc.due_date);
        formData.append(`pdcs[${i}][notes]`, pdc.notes || "");
        if (pdc.uploaded_image) {
          formData.append(`pdcs[${i}][uploaded_image]`, pdc.uploaded_image);
        }
      });

      await axios.post("/api/landlord/pdc/uploadPerProperty", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      Swal.fire("Success", "PDCs uploaded successfully!", "success");
      setPdcList([
        {
          check_number: "",
          bank_name: "",
          amount: "",
          due_date: "",
          notes: "",
          uploaded_image: null,
        },
      ]);
      setSelectedLease("");
      onSuccess?.();
      onClose();
    } catch (error: any) {
      console.error(error);
      Swal.fire("Error", "Failed to upload PDCs.", "error");
    } finally {
      setUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-xl w-full max-w-3xl shadow-xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-5 bg-gradient-to-r from-blue-600 to-emerald-600 flex-shrink-0">
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-white" />
            <h2 className="text-lg font-bold text-white">
              Upload Post-Dated Check(s)
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-lg p-1 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {loadingLeases ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : leases.length === 0 ? (
            <div className="text-center py-8">
              <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600 font-medium">
                No active leases found for this property.
              </p>
            </div>
          ) : (
            <>
              {/* Lease Select (only once) */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wider">
                  Select Lease / Unit <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedLease}
                  onChange={(e) => setSelectedLease(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                >
                  <option value="">-- Select Lease --</option>
                  {leases.map((l) => (
                    <option key={l.lease_id} value={l.lease_id}>
                      🏠 {l.unit_name} — {l.tenant_name}
                    </option>
                  ))}
                </select>
              </div>

              {/* PDC Rows */}
              {pdcList.map((pdc, index) => (
                <div
                  key={index}
                  className="border border-gray-200 rounded-lg bg-gray-50 p-4 relative"
                >
                  {pdcList.length > 1 && (
                    <button
                      onClick={() => handleRemoveRow(index)}
                      className="absolute top-3 right-3 p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors"
                      title="Remove"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wider">
                        Check Number <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        value={pdc.check_number}
                        onChange={(e) =>
                          handleChange(index, "check_number", e.target.value)
                        }
                        placeholder="e.g. 001234"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wider">
                        Bank Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        value={pdc.bank_name}
                        onChange={(e) =>
                          handleChange(index, "bank_name", e.target.value)
                        }
                        placeholder="e.g. BDO, BPI"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wider">
                        Amount <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        value={pdc.amount}
                        onChange={(e) =>
                          handleChange(index, "amount", e.target.value)
                        }
                        placeholder="0.00"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wider">
                        Due Date <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        value={pdc.due_date}
                        onChange={(e) =>
                          handleChange(index, "due_date", e.target.value)
                        }
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wider">
                        Notes (optional)
                      </label>
                      <textarea
                        className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        rows={2}
                        value={pdc.notes}
                        onChange={(e) =>
                          handleChange(index, "notes", e.target.value)
                        }
                        placeholder="Additional notes about this check..."
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wider">
                        Upload Image (Check Photo)
                      </label>
                      <div className="flex items-center gap-3">
                        <label className="flex-1 cursor-pointer">
                          <div className="border-2 border-dashed border-gray-300 rounded-lg px-4 py-3 hover:border-blue-400 transition-colors bg-white">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Upload className="w-4 h-4" />
                              <span>
                                {pdc.uploaded_image
                                  ? pdc.uploaded_image.name
                                  : "Choose file or take photo"}
                              </span>
                            </div>
                          </div>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) =>
                              handleFileChange(
                                index,
                                e.target.files?.[0] || null
                              )
                            }
                            className="hidden"
                          />
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Add More */}
              <button
                onClick={handleAddRow}
                className="inline-flex items-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-50 border border-blue-200 rounded-lg font-medium text-sm transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Another PDC
              </button>
            </>
          )}
        </div>

        {/* Page_footer */}
        <div className="flex flex-col sm:flex-row justify-end gap-3 p-5 border-t border-gray-200 bg-gray-50 flex-shrink-0">
          <button
            onClick={onClose}
            disabled={uploading}
            className="w-full sm:w-auto px-5 py-2.5 rounded-lg text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 font-semibold transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={uploading || loadingLeases}
            className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 text-white font-semibold shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? "Uploading..." : "Upload PDCs"}
          </button>
        </div>
      </div>
    </div>
  );
}
