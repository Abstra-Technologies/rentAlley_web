"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import Swal from "sweetalert2";
import {
  X,
  Scan,
  Home,
  Package,
  User,
  FileText,
  Loader2,
  Camera,
  CheckCircle,
  ChevronDown,
  Info,
} from "lucide-react";
import useAuthStore from "@/zustand/authStore";
import { useAssetWithQR } from "@/hooks/workorders/useAssetWithQR";

const CATEGORIES = [
  { value: "Plumbing", icon: "🚿", gradient: "from-blue-500 to-cyan-500" },
  { value: "Electrical", icon: "⚡", gradient: "from-amber-500 to-yellow-500" },
  { value: "Aircon", icon: "❄️", gradient: "from-cyan-500 to-blue-500" },
  { value: "Furniture", icon: "🪑", gradient: "from-amber-600 to-orange-500" },
  { value: "Appliance", icon: "📺", gradient: "from-purple-500 to-indigo-500" },
  { value: "General", icon: "🔧", gradient: "from-gray-500 to-slate-500" },
] as const;

const PRIORITIES = [
  {
    value: "Low",
    bg: "bg-gray-100 text-gray-700 border-gray-200",
    dot: "bg-gray-400",
  },
  {
    value: "Medium",
    bg: "bg-blue-50 text-blue-700 border-blue-200",
    dot: "bg-blue-500",
  },
  {
    value: "High",
    bg: "bg-orange-50 text-orange-700 border-orange-200",
    dot: "bg-orange-500",
  },
  {
    value: "Urgent",
    bg: "bg-red-50 text-red-700 border-red-200",
    dot: "bg-red-500",
  },
] as const;

interface Property {
  property_id: number | string;
  property_name: string;
}
interface Unit {
  unit_id: number | string;
  unit_name: string;
}

interface Props {
  landlordId: number | string | undefined;
  onClose: () => void;
  onCreated: (data: any) => void;
}

export default function NewWorkOrderModal({
  landlordId,
  onClose,
  onCreated,
}: Props) {
  const { user } = useAuthStore();

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("General");
  const [priority, setPriority] = useState("Low");
  const [assignedTo, setAssignedTo] = useState("");
  const [description, setDescription] = useState("");
  const [photos, setPhotos] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);

  const {
    assetId,
    assetDetails,
    loadingAsset,
    showScanner,
    setAssetId,
    setShowScanner,
  } = useAssetWithQR({ userId: user?.user_id });

  const [properties, setProperties] = useState<Property[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [selectedProperty, setSelectedProperty] = useState("");
  const [selectedUnit, setSelectedUnit] = useState("");
  const [loadingProperties, setLoadingProperties] = useState(false);
  const [loadingUnits, setLoadingUnits] = useState(false);

  useEffect(() => {
    if (!user?.landlord_id) return;
    setLoadingProperties(true);
    axios
      .get(`/api/landlord/${user.landlord_id}/properties`)
      .then((res) => setProperties(res.data.data || []))
      .catch(console.error)
      .finally(() => setLoadingProperties(false));
  }, [user?.landlord_id]);

  useEffect(() => {
    if (!selectedProperty) {
      setUnits([]);
      setSelectedUnit("");
      return;
    }
    setLoadingUnits(true);
    axios
      .get(`/api/properties/${selectedProperty}/units`)
      .then((res) => setUnits(res.data.data || []))
      .catch(console.error)
      .finally(() => setLoadingUnits(false));
  }, [selectedProperty]);

  const getPropName = () =>
    properties.find((p) => String(p.property_id) === String(selectedProperty))
      ?.property_name || "";
  const getUnitName = () =>
    units.find((u) => String(u.unit_id) === String(selectedUnit))?.unit_name ||
    "";

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files)
      setPhotos((prev) =>
        [...prev, ...Array.from(e.target.files!)].slice(0, 6),
      );
  };
  const removePhoto = (i: number) =>
    setPhotos((prev) => prev.filter((_, idx) => idx !== i));
  const toBase64 = (file: File): Promise<string> =>
    new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = () => res(r.result as string);
      r.onerror = rej;
      r.readAsDataURL(file);
    });

  const handleSave = async () => {
    if (!title.trim()) {
      Swal.fire({
        icon: "warning",
        title: "Missing Title",
        confirmButtonColor: "#3b82f6",
      });
      return;
    }
    if (!selectedProperty) {
      Swal.fire({
        icon: "warning",
        title: "Property Required",
        confirmButtonColor: "#3b82f6",
      });
      return;
    }

    setLoading(true);
    try {
      const encoded = await Promise.all(photos.map(toBase64));
      const payload = {
        subject: title.trim(),
        category,
        priority_level: priority,
        assigned_to: assignedTo.trim() || null,
        description: description.trim() || null,
        landlord_id: landlordId,
        property_id: selectedProperty,
        unit_id: selectedUnit || null,
        asset_id: assetId || null,
        photo_urls: encoded,
        user_id: user?.user_id,
      };

      const res = await axios.post(
        "/api/maintenance/createMaintenance/workOrder",
        payload,
      );
      const data = res.data.data || res.data;

      onCreated({
        request_id: data.request_id,
        subject: title.trim(),
        description: description.trim() || undefined,
        category,
        priority_level: priority,
        status: data.status || "approved",
        assigned_to: assignedTo.trim() || undefined,
        property_id: selectedProperty,
        property_name: data.property_name || getPropName(),
        unit_id: selectedUnit || undefined,
        unit_name: data.unit_name || getUnitName(),
        created_at: data.created_at || new Date().toISOString(),
      });
    } catch (err: any) {
      console.error("Error creating:", err);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: err.response?.data?.message || "Failed to create",
        confirmButtonColor: "#3b82f6",
      });
    } finally {
      setLoading(false);
    }
  };

  const selCat = CATEGORIES.find((c) => c.value === category);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl max-h-[90vh] overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div
            className={`relative overflow-hidden bg-gradient-to-r ${selCat?.gradient || "from-blue-600 to-emerald-600"} flex-shrink-0`}
          >
            <div className="absolute -top-12 -right-12 w-40 h-40 bg-white/10 rounded-full" />
            <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-white/10 rounded-full" />
            <div className="relative p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">
                    New Work Order
                  </h2>
                  <p className="text-sm text-white/80">
                    Create a maintenance task
                  </p>
                </div>
              </div>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-xl"
              >
                <X className="w-5 h-5 text-white" />
              </motion.button>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-xl border border-blue-100">
              <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-blue-700">
                Work orders start as <strong>Approved</strong> and are ready to
                be scheduled.
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                placeholder="e.g., Fix leaking faucet"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Property <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Home className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <select
                    value={selectedProperty}
                    onChange={(e) => setSelectedProperty(e.target.value)}
                    disabled={loadingProperties}
                    className="w-full pl-10 pr-10 py-3 border border-gray-200 rounded-xl appearance-none text-sm bg-white disabled:bg-gray-50 outline-none"
                  >
                    <option value="">
                      {loadingProperties ? "Loading..." : "Select property"}
                    </option>
                    {properties.map((p) => (
                      <option key={p.property_id} value={p.property_id}>
                        {p.property_name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Unit{" "}
                  <span className="text-gray-400 font-normal">(Optional)</span>
                </label>
                <div className="relative">
                  <select
                    value={selectedUnit}
                    onChange={(e) => setSelectedUnit(e.target.value)}
                    disabled={
                      !selectedProperty || loadingUnits || !units.length
                    }
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl appearance-none text-sm bg-white disabled:bg-gray-50 disabled:text-gray-400 outline-none"
                  >
                    <option value="">
                      {loadingUnits
                        ? "Loading..."
                        : !selectedProperty
                          ? "Select property first"
                          : !units.length
                            ? "No units"
                            : "Select unit"}
                    </option>
                    {units.map((u) => (
                      <option key={u.unit_id} value={u.unit_id}>
                        {u.unit_name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Category
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {CATEGORIES.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setCategory(c.value)}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all ${category === c.value ? `border-transparent bg-gradient-to-r ${c.gradient} text-white shadow-lg` : "border-gray-100 bg-gray-50 hover:bg-gray-100 text-gray-700"}`}
                  >
                    <span className="text-xl">{c.icon}</span>
                    <span className="text-[10px] font-medium">{c.value}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Priority
              </label>
              <div className="flex flex-wrap gap-2">
                {PRIORITIES.map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => setPriority(p.value)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl border-2 transition-all ${priority === p.value ? `${p.bg} border-current` : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"}`}
                  >
                    <span className={`w-2 h-2 rounded-full ${p.dot}`} />
                    <span className="text-sm font-medium">{p.value}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Asset ID{" "}
                <span className="text-gray-400 font-normal">(Optional)</span>
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Package className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={assetId}
                    onChange={(e) => setAssetId(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm outline-none"
                    placeholder="Scan or enter ID"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setShowScanner(true)}
                  className="px-4 py-3 bg-gradient-to-r from-blue-600 to-emerald-600 text-white rounded-xl flex items-center gap-2"
                >
                  <Scan className="w-4 h-4" />
                  <span className="hidden sm:inline text-sm font-medium">
                    Scan
                  </span>
                </button>
              </div>
              {loadingAsset && (
                <div className="flex items-center gap-2 mt-2 text-sm text-blue-600">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading...
                </div>
              )}
              {assetDetails && (
                <div className="mt-3 p-3 bg-gradient-to-r from-blue-50 to-emerald-50 rounded-xl border border-blue-100">
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="font-semibold text-gray-900">
                      {assetDetails.asset_name}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600">
                    Serial: {assetDetails.serial_number}
                  </p>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Assign To{" "}
                <span className="text-gray-400 font-normal">(Optional)</span>
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={assignedTo}
                  onChange={(e) => setAssignedTo(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm outline-none"
                  placeholder="Technician name"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Description{" "}
                <span className="text-gray-400 font-normal">(Optional)</span>
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm resize-none outline-none"
                placeholder="Describe the issue..."
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Photos{" "}
                <span className="text-gray-400 font-normal">(Max 6)</span>
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {photos.map((f, i) => (
                  <div key={i} className="relative group">
                    <img
                      src={URL.createObjectURL(f)}
                      alt=""
                      className="w-full h-20 object-cover rounded-xl border"
                    />
                    <button
                      type="button"
                      onClick={() => removePhoto(i)}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                {photos.length < 6 && (
                  <label className="w-full h-20 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/50">
                    <Camera className="w-5 h-5 text-gray-400 mb-1" />
                    <span className="text-[10px] text-gray-500">Add Photo</span>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-5 border-t border-gray-100 bg-gray-50/50 flex flex-col-reverse sm:flex-row gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-3 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl font-medium text-sm disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={loading || !title.trim() || !selectedProperty}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold text-sm transition-all ${loading || !title.trim() || !selectedProperty ? "bg-gray-300 text-gray-500 cursor-not-allowed" : `bg-gradient-to-r ${selCat?.gradient || "from-blue-600 to-emerald-600"} text-white hover:shadow-lg`}`}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Create Work Order
                </>
              )}
            </button>
          </div>
        </motion.div>

        {/* QR Scanner */}
        <AnimatePresence>
          {showScanner && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
              onClick={() => setShowScanner(false)}
            >
              <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.9 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-2xl p-5 w-full max-w-sm shadow-2xl"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900">
                    Scan Asset QR
                  </h3>
                  <button
                    onClick={() => setShowScanner(false)}
                    className="p-1.5 hover:bg-gray-100 rounded-lg"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
                <div
                  id="qr-reader"
                  className="w-full aspect-square bg-gray-100 rounded-xl"
                />
                <button
                  type="button"
                  onClick={() => setShowScanner(false)}
                  className="mt-4 w-full px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium"
                >
                  Cancel
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
}
