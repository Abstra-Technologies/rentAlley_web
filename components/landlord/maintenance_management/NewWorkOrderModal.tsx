"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import Swal from "sweetalert2";
import {
  X,
  Scan,
  Upload,
  Home,
  Package,
  Tag,
  AlertCircle,
  User,
  FileText,
  Loader2,
  Camera,
  Trash2,
  CheckCircle,
  ChevronDown,
} from "lucide-react";
import useAuthStore from "@/zustand/authStore";
import { useAssetWithQR } from "@/hooks/workorders/useAssetWithQR";

// ============================================
// ANIMATION VARIANTS
// ============================================
const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

const modalVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { type: "spring", stiffness: 300, damping: 30 },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: { duration: 0.2 },
  },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05, delayChildren: 0.1 },
  },
};

const fadeInUp = {
  hidden: { opacity: 0, y: 15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 300, damping: 24 },
  },
};

// ============================================
// CATEGORY OPTIONS
// ============================================
const categories = [
  { value: "Plumbing", icon: "🚿", color: "from-blue-500 to-cyan-500" },
  { value: "Electrical", icon: "⚡", color: "from-amber-500 to-yellow-500" },
  { value: "Aircon", icon: "❄️", color: "from-cyan-500 to-blue-500" },
  { value: "Furniture", icon: "🪑", color: "from-amber-600 to-orange-500" },
  { value: "Appliance", icon: "📺", color: "from-purple-500 to-indigo-500" },
  { value: "General", icon: "🔧", color: "from-gray-500 to-slate-500" },
];

const priorities = [
  {
    value: "Low",
    color: "bg-gray-100 text-gray-700 border-gray-200",
    dot: "bg-gray-400",
  },
  {
    value: "Medium",
    color: "bg-blue-50 text-blue-700 border-blue-200",
    dot: "bg-blue-500",
  },
  {
    value: "High",
    color: "bg-orange-50 text-orange-700 border-orange-200",
    dot: "bg-orange-500",
  },
  {
    value: "Urgent",
    color: "bg-red-50 text-red-700 border-red-200",
    dot: "bg-red-500",
  },
];

// ============================================
// MAIN COMPONENT
// ============================================
export default function NewWorkOrderModal({
  landlordId,
  onClose,
  onCreated,
}: {
  landlordId: number | string;
  onClose: () => void;
  onCreated: (data: any) => void;
}) {
  const { user } = useAuthStore();

  // Form state
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("General");
  const [priority, setPriority] = useState("Low");
  const [assignedTo, setAssignedTo] = useState("");
  const [description, setDescription] = useState("");
  const [photos, setPhotos] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);

  // Asset + QR
  const {
    assetId,
    assetDetails,
    loadingAsset,
    showScanner,
    setAssetId,
    setShowScanner,
  } = useAssetWithQR({
    userId: user?.user_id,
  });

  // Property / Unit
  const [properties, setProperties] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [selectedProperty, setSelectedProperty] = useState("");
  const [selectedUnit, setSelectedUnit] = useState("");

  // Current step for mobile stepper
  const [currentStep, setCurrentStep] = useState(0);
  const steps = ["Details", "Location", "Photos"];

  // Fetch properties
  useEffect(() => {
    if (!user?.landlord_id) return;

    const fetchProperties = async () => {
      try {
        const res = await axios.get(
          `/api/landlord/${user.landlord_id}/properties`
        );
        setProperties(res.data.data || []);
      } catch (err) {
        console.error("Error fetching properties", err);
      }
    };

    fetchProperties();
  }, [user?.landlord_id]);

  // Fetch units when property changes
  useEffect(() => {
    if (!selectedProperty) {
      setUnits([]);
      setSelectedUnit("");
      return;
    }

    const fetchUnits = async () => {
      try {
        const res = await axios.get(
          `/api/properties/${selectedProperty}/units`
        );
        setUnits(res.data.data || []);
      } catch (err) {
        console.error("Error fetching units", err);
      }
    };

    fetchUnits();
  }, [selectedProperty]);

  // Photo handling
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const newPhotos = Array.from(e.target.files);
    setPhotos((prev) => [...prev, ...newPhotos].slice(0, 6)); // Max 6 photos
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  // Save handler
  const handleSave = async () => {
    if (!title.trim()) {
      Swal.fire({
        icon: "warning",
        title: "Missing Title",
        text: "Please enter a work order title.",
        confirmButtonColor: "#3b82f6",
      });
      return;
    }

    if (!selectedProperty) {
      Swal.fire({
        icon: "warning",
        title: "Property Required",
        text: "Please select a property.",
        confirmButtonColor: "#3b82f6",
      });
      return;
    }

    setLoading(true);

    try {
      const encodedPhotos = await Promise.all(
        photos.map((f) => fileToBase64(f))
      );

      const payload = {
        subject: title,
        category,
        priority_level: priority,
        assigned_to: assignedTo || null,
        description,
        landlord_id: landlordId,
        property_id: selectedProperty,
        unit_id: selectedUnit || null,
        asset_id: assetId || null,
        photo_urls: encodedPhotos,
        user_id: user?.user_id,
      };

      const res = await axios.post(
        `/api/maintenance/createMaintenance/workOrder`,
        payload
      );

      Swal.fire({
        icon: "success",
        title: "Work Order Created!",
        text: "The work order has been submitted successfully.",
        timer: 1500,
        showConfirmButton: false,
      });

      onCreated(res.data.data);
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to create work order. Please try again.",
        confirmButtonColor: "#3b82f6",
      });
    } finally {
      setLoading(false);
    }
  };

  const selectedCategoryData = categories.find((c) => c.value === category);

  return (
    <AnimatePresence>
      <motion.div
        variants={backdropVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      >
        <motion.div
          variants={modalVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          onClick={(e) => e.stopPropagation()}
          className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl max-h-[90vh] overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div
            className={`relative overflow-hidden bg-gradient-to-r ${
              selectedCategoryData?.color || "from-blue-600 to-emerald-600"
            } flex-shrink-0`}
          >
            {/* Decorative circles */}
            <div className="absolute -top-12 -right-12 w-40 h-40 bg-white/10 rounded-full" />
            <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-white/10 rounded-full" />

            <div className="relative p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                    <FileText className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">
                      New Work Order
                    </h2>
                    <p className="text-sm text-white/80">
                      Create a maintenance request
                    </p>
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={onClose}
                  className="p-2 hover:bg-white/20 rounded-xl transition-colors"
                >
                  <X className="w-5 h-5 text-white" />
                </motion.button>
              </div>
            </div>
          </div>

          {/* Body */}
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="flex-1 overflow-y-auto p-5 space-y-5"
          >
            {/* Title Input */}
            <motion.div variants={fadeInUp}>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                placeholder="e.g., Leaking sink, AC not cooling..."
              />
            </motion.div>

            {/* Property & Unit */}
            <motion.div
              variants={fadeInUp}
              className="grid grid-cols-1 sm:grid-cols-2 gap-4"
            >
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Property <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Home className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <select
                    value={selectedProperty}
                    onChange={(e) => setSelectedProperty(e.target.value)}
                    className="w-full pl-10 pr-10 py-3 border border-gray-200 rounded-xl appearance-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm bg-white"
                  >
                    <option value="">Select property</option>
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
                    disabled={!units.length}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl appearance-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm bg-white disabled:bg-gray-50 disabled:text-gray-400"
                  >
                    <option value="">No unit selected</option>
                    {units.map((u) => (
                      <option key={u.unit_id} value={u.unit_id}>
                        {u.unit_name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </motion.div>

            {/* Category Selection */}
            <motion.div variants={fadeInUp}>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Category
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {categories.map((cat) => (
                  <motion.button
                    key={cat.value}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setCategory(cat.value)}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all duration-200 ${
                      category === cat.value
                        ? `border-transparent bg-gradient-to-r ${cat.color} text-white shadow-lg`
                        : "border-gray-100 bg-gray-50 hover:bg-gray-100 text-gray-700"
                    }`}
                  >
                    <span className="text-xl">{cat.icon}</span>
                    <span className="text-[10px] font-medium">{cat.value}</span>
                  </motion.button>
                ))}
              </div>
            </motion.div>

            {/* Priority Selection */}
            <motion.div variants={fadeInUp}>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Priority
              </label>
              <div className="flex flex-wrap gap-2">
                {priorities.map((p) => (
                  <motion.button
                    key={p.value}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setPriority(p.value)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl border-2 transition-all duration-200 ${
                      priority === p.value
                        ? `${p.color} border-current shadow-sm`
                        : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${p.dot}`} />
                    <span className="text-sm font-medium">{p.value}</span>
                  </motion.button>
                ))}
              </div>
            </motion.div>

            {/* Asset ID with QR Scanner */}
            <motion.div variants={fadeInUp}>
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
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                    placeholder="Scan QR or enter Asset ID"
                  />
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowScanner(true)}
                  className="px-4 py-3 bg-gradient-to-r from-blue-600 to-emerald-600 text-white rounded-xl hover:shadow-lg transition-all flex items-center gap-2"
                >
                  <Scan className="w-4 h-4" />
                  <span className="hidden sm:inline text-sm font-medium">
                    Scan
                  </span>
                </motion.button>
              </div>

              {/* Asset Loading */}
              {loadingAsset && (
                <div className="flex items-center gap-2 mt-2 text-sm text-blue-600">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading asset details...
                </div>
              )}

              {/* Asset Details */}
              {assetDetails && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-3 p-3 bg-gradient-to-r from-blue-50 to-emerald-50 rounded-xl border border-blue-100"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="font-semibold text-gray-900">
                      {assetDetails.asset_name}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600">
                    Serial: {assetDetails.serial_number}
                  </p>
                  <p className="text-xs text-gray-600 capitalize">
                    Status: {assetDetails.status}
                  </p>
                </motion.div>
              )}
            </motion.div>

            {/* Assigned To */}
            <motion.div variants={fadeInUp}>
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
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                  placeholder="Technician or vendor name"
                />
              </div>
            </motion.div>

            {/* Description */}
            <motion.div variants={fadeInUp}>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Description
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none text-sm"
                placeholder="Describe the issue in detail..."
              />
            </motion.div>

            {/* Photo Upload */}
            <motion.div variants={fadeInUp}>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Photos{" "}
                <span className="text-gray-400 font-normal">(Max 6)</span>
              </label>

              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {/* Existing Photos */}
                {photos.map((file, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="relative group"
                  >
                    <img
                      src={URL.createObjectURL(file)}
                      alt={`Upload ${idx + 1}`}
                      className="w-full h-20 object-cover rounded-xl border border-gray-200"
                    />
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => removePhoto(idx)}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </motion.button>
                  </motion.div>
                ))}

                {/* Upload Button */}
                {photos.length < 6 && (
                  <motion.label
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full h-20 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition-all"
                  >
                    <Camera className="w-5 h-5 text-gray-400 mb-1" />
                    <span className="text-[10px] text-gray-500">Add Photo</span>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                  </motion.label>
                )}
              </div>
            </motion.div>
          </motion.div>

          {/* Footer */}
          <div className="p-5 border-t border-gray-100 bg-gray-50/50 flex flex-col-reverse sm:flex-row gap-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-3 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl transition-all font-medium text-sm disabled:opacity-50"
            >
              Cancel
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSave}
              disabled={loading}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold text-sm transition-all ${
                loading
                  ? "bg-blue-400 cursor-not-allowed"
                  : `bg-gradient-to-r ${
                      selectedCategoryData?.color ||
                      "from-blue-600 to-emerald-600"
                    } hover:shadow-lg hover:shadow-blue-500/25`
              } text-white`}
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
            </motion.button>
          </div>
        </motion.div>

        {/* QR Scanner Modal */}
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
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-2xl p-5 w-full max-w-sm shadow-2xl"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900">
                    Scan Asset QR
                  </h3>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setShowScanner(false)}
                    className="p-1.5 hover:bg-gray-100 rounded-lg"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </motion.button>
                </div>

                <div
                  id="qr-reader"
                  className="w-full aspect-square bg-gray-100 rounded-xl overflow-hidden"
                />

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowScanner(false)}
                  className="mt-4 w-full px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-colors"
                >
                  Cancel
                </motion.button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
}
