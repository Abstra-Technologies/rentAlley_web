"use client";
import { useState } from "react";
import {
  ClipboardDocumentCheckIcon,
  PlusCircleIcon,
  XMarkIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  PhotoIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";

interface MoveInItem {
  item_id: number;
  item_name: string;
  condition: string;
  notes: string;
  photos: File[];
}

interface MoveInChecklistProps {
  agreement_id: number;
}

const CONDITIONS = [
  {
    value: "good",
    label: "Good Condition",
    color: "bg-emerald-50 text-emerald-800 border-emerald-200",
    icon: "✓",
  },
  {
    value: "damaged",
    label: "Damaged",
    color: "bg-red-50 text-red-800 border-red-200",
    icon: "⚠",
  },
  {
    value: "needs_repair",
    label: "Needs Repair",
    color: "bg-orange-50 text-orange-800 border-orange-200",
    icon: "🔧",
  },
  {
    value: "scratched",
    label: "Scratched",
    color: "bg-amber-50 text-amber-800 border-amber-200",
    icon: "〰",
  },
  {
    value: "needs_cleaning",
    label: "Needs Cleaning",
    color: "bg-blue-50 text-blue-800 border-blue-200",
    icon: "🧽",
  },
];

const AVAILABLE_ITEMS = [
  { name: "Doors", icon: "🚪" },
  { name: "Windows", icon: "🪟" },
  { name: "Ceiling", icon: "🏠" },
  { name: "Lights", icon: "💡" },
  { name: "Balcony", icon: "🏢" },
  { name: "TV", icon: "📺" },
  { name: "Aircon", icon: "❄️" },
  { name: "Washing Machine", icon: "🌀" },
];

export default function MoveInChecklist({
  agreement_id,
}: MoveInChecklistProps) {
  const initialItems: MoveInItem[] = [
    {
      item_id: 1,
      item_name: "Floor",
      condition: "good",
      notes: "",
      photos: [],
    },
    {
      item_id: 2,
      item_name: "Walls",
      condition: "good",
      notes: "",
      photos: [],
    },
    {
      item_id: 3,
      item_name: "Bathroom",
      condition: "good",
      notes: "",
      photos: [],
    },
    {
      item_id: 4,
      item_name: "Kitchen",
      condition: "good",
      notes: "",
      photos: [],
    },
  ];

  const [items, setItems] = useState<MoveInItem[]>(initialItems);
  const [dynamicItems, setDynamicItems] = useState<MoveInItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [newItemName, setNewItemName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleConditionChange = (
    item_id: number,
    condition: string,
    isDynamic = false
  ) => {
    const updater = isDynamic ? setDynamicItems : setItems;
    const list = isDynamic ? dynamicItems : items;
    updater(
      list.map((item) =>
        item.item_id === item_id ? { ...item, condition } : item
      )
    );
  };

  const handleNotesChange = (
    item_id: number,
    notes: string,
    isDynamic = false
  ) => {
    const updater = isDynamic ? setDynamicItems : setItems;
    const list = isDynamic ? dynamicItems : items;
    updater(
      list.map((item) => (item.item_id === item_id ? { ...item, notes } : item))
    );
  };

  const handlePhotoUpload = (
    item_id: number,
    files: FileList | null,
    isDynamic = false
  ) => {
    if (!files) return;
    const updater = isDynamic ? setDynamicItems : setItems;
    const list = isDynamic ? dynamicItems : items;
    updater(
      list.map((item) =>
        item.item_id === item_id
          ? { ...item, photos: [...item.photos, ...Array.from(files)] }
          : item
      )
    );
  };

  const handleRemovePhoto = (
    item_id: number,
    photoIndex: number,
    isDynamic = false
  ) => {
    const updater = isDynamic ? setDynamicItems : setItems;
    const list = isDynamic ? dynamicItems : items;
    updater(
      list.map((item) =>
        item.item_id === item_id
          ? {
              ...item,
              photos: item.photos.filter((_, index) => index !== photoIndex),
            }
          : item
      )
    );
  };

  const handleRemoveDynamicItem = (item_id: number) => {
    setDynamicItems((prev) => prev.filter((item) => item.item_id !== item_id));
  };

  const handleAddDynamicItem = () => {
    if (!newItemName) return;
    if (
      items.some((i) => i.item_name === newItemName) ||
      dynamicItems.some((i) => i.item_name === newItemName)
    ) {
      alert("This item already exists in your checklist!");
      return;
    }

    const newItem: MoveInItem = {
      item_id: Date.now(),
      item_name: newItemName,
      condition: "good",
      notes: "",
      photos: [],
    };
    setDynamicItems((prev) => [...prev, newItem]);
    setNewItemName("");
  };

  const allItems = [...items, ...dynamicItems];
  const completionPercentage = Math.round(
    (allItems.filter((item) =>
      item.condition !== "good"
        ? item.notes.length > 0 || item.photos.length > 0
        : true
    ).length /
      allItems.length) *
      100
  );

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const formData = new FormData();

      // Prepare items array with photo file keys
      const itemsPayload = allItems.map((item, idx) => ({
        item_name: item.item_name,
        condition: item.condition,
        notes: item.notes,
        photos: item.photos.map((_, fileIdx) => `file_${idx}_${fileIdx}`),
      }));

      formData.append("items", JSON.stringify(itemsPayload));

      // Append files to FormData using the keys we mapped
      allItems.forEach((item, idx) => {
        item.photos.forEach((file, fileIdx) => {
          formData.append(`file_${idx}_${fileIdx}`, file);
        });
      });

      // Include agreement_id
      formData.append("agreement_id", agreement_id.toString());

      const res = await fetch("/api/tenant/activeRent/moveinchecklist", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Failed to submit checklist");

      alert("Checklist submitted successfully!");
      setIsOpen(false);
      setDynamicItems([]);
      setItems(initialItems);
    } catch (error) {
      console.error(error);
      alert("Error submitting checklist.");
    } finally {
      setSubmitting(false);
    }
  };

  const getConditionIcon = (condition: string) => {
    return CONDITIONS.find((c) => c.value === condition)?.icon || "?";
  };

  const getConditionColor = (condition: string) => {
    return CONDITIONS.find((c) => c.value === condition)?.color || "";
  };

  return (
    <div className="w-full">
      {!isOpen ? (
        /* Trigger Card */
        <div className="bg-gradient-to-br from-blue-50 to-emerald-50 border-2 border-blue-200 rounded-2xl p-6 shadow-md hover:shadow-xl transition-all duration-300">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-white rounded-xl shadow-sm">
                <ClipboardDocumentCheckIcon className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-1">
                  Move-In Inspection
                </h3>
                <p className="text-sm text-gray-600 mb-2">
                  Document the initial condition of your unit
                </p>
                <div className="flex items-center gap-2">
                  <CheckCircleIcon className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-semibold text-emerald-700">
                    Protects your security deposit
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(true)}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 text-white rounded-xl font-bold shadow-md hover:shadow-lg transition-all duration-200"
            >
              <span>Start Inspection</span>
              <ChevronRightIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      ) : (
        /* Full Checklist Modal */
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm">
          <div className="min-h-screen px-4 py-8 flex items-center justify-center">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-600 to-emerald-600 px-6 py-5 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <ClipboardDocumentCheckIcon className="w-8 h-8" />
                    <div>
                      <h2 className="text-2xl font-bold">Move-In Inspection</h2>
                      <p className="text-sm text-blue-100">
                        Document property condition
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <XMarkIcon className="w-6 h-6" />
                  </button>
                </div>

                {/* Progress Bar */}
                <div className="mt-4">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="font-semibold">Inspection Progress</span>
                    <span className="font-bold">{completionPercentage}%</span>
                  </div>
                  <div className="w-full bg-blue-900/30 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="bg-white h-full rounded-full transition-all duration-500"
                      style={{ width: `${completionPercentage}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="max-h-[70vh] overflow-y-auto p-6">
                {/* Add Item Section */}
                <div className="bg-gradient-to-br from-gray-50 to-blue-50 border-2 border-dashed border-blue-300 rounded-xl p-6 mb-6">
                  <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <PlusCircleIcon className="w-5 h-5 text-blue-600" />
                    Add Additional Items
                  </h3>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {AVAILABLE_ITEMS.map((item) => (
                      <button
                        key={item.name}
                        onClick={() => setNewItemName(item.name)}
                        className="px-3 py-2 bg-white border-2 border-blue-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-all text-sm font-medium text-gray-700"
                      >
                        <span className="mr-1">{item.icon}</span>
                        {item.name}
                      </button>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newItemName}
                      onChange={(e) => setNewItemName(e.target.value)}
                      placeholder="Or type custom item name..."
                      className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      onKeyPress={(e) =>
                        e.key === "Enter" && handleAddDynamicItem()
                      }
                    />
                    <button
                      onClick={handleAddDynamicItem}
                      disabled={!newItemName}
                      className="px-6 py-3 bg-gradient-to-r from-blue-600 to-emerald-600 text-white rounded-xl font-semibold disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed hover:shadow-lg transition-all"
                    >
                      Add Item
                    </button>
                  </div>
                </div>

                {/* Items List */}
                <div className="space-y-4">
                  {/* Default Items */}
                  {items.map((item) => (
                    <ItemCard
                      key={item.item_id}
                      item={item}
                      isDynamic={false}
                      onConditionChange={handleConditionChange}
                      onNotesChange={handleNotesChange}
                      onPhotoUpload={handlePhotoUpload}
                      onRemovePhoto={handleRemovePhoto}
                      onRemoveItem={handleRemoveDynamicItem}
                      conditions={CONDITIONS}
                      getConditionColor={getConditionColor}
                      getConditionIcon={getConditionIcon}
                    />
                  ))}

                  {/* Dynamic Items */}
                  {dynamicItems.map((item) => (
                    <ItemCard
                      key={item.item_id}
                      item={item}
                      isDynamic={true}
                      onConditionChange={handleConditionChange}
                      onNotesChange={handleNotesChange}
                      onPhotoUpload={handlePhotoUpload}
                      onRemovePhoto={handleRemovePhoto}
                      onRemoveItem={handleRemoveDynamicItem}
                      conditions={CONDITIONS}
                      getConditionColor={getConditionColor}
                      getConditionIcon={getConditionIcon}
                    />
                  ))}
                </div>
              </div>

              {/* Footer */}
              <div className="border-t-2 border-gray-200 px-6 py-4 bg-gray-50">
                <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
                  <div className="text-sm">
                    <span className="font-bold text-gray-900">
                      {allItems.length}
                    </span>
                    <span className="text-gray-600"> items to inspect • </span>
                    <span className="font-bold text-emerald-600">
                      {completionPercentage}%
                    </span>
                    <span className="text-gray-600"> complete</span>
                  </div>
                  <button
                    onClick={handleSubmit}
                    disabled={submitting || completionPercentage < 100}
                    className="px-8 py-3 bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-xl font-bold disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed hover:from-emerald-700 hover:to-green-700 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                  >
                    {submitting ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Submitting...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircleIcon className="w-5 h-5" />
                        <span>Complete Inspection</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Item Card Component
function ItemCard({
  item,
  isDynamic,
  onConditionChange,
  onNotesChange,
  onPhotoUpload,
  onRemovePhoto,
  onRemoveItem,
  conditions,
  getConditionColor,
  getConditionIcon,
}: {
  item: MoveInItem;
  isDynamic: boolean;
  onConditionChange: (
    id: number,
    condition: string,
    isDynamic: boolean
  ) => void;
  onNotesChange: (id: number, notes: string, isDynamic: boolean) => void;
  onPhotoUpload: (
    id: number,
    files: FileList | null,
    isDynamic: boolean
  ) => void;
  onRemovePhoto: (id: number, photoIndex: number, isDynamic: boolean) => void;
  onRemoveItem: (id: number) => void;
  conditions: typeof CONDITIONS;
  getConditionColor: (condition: string) => string;
  getConditionIcon: (condition: string) => string;
}) {
  return (
    <div
      className={`border-2 rounded-xl p-5 transition-all ${
        isDynamic
          ? "bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200 hover:border-purple-300"
          : "bg-white border-gray-200 hover:border-blue-200 hover:shadow-md"
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold ${getConditionColor(
              item.condition
            )} border-2`}
          >
            {getConditionIcon(item.condition)}
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-lg">
              {item.item_name}
            </h3>
            {isDynamic && (
              <span className="text-xs font-semibold text-purple-600 bg-purple-100 px-2 py-0.5 rounded-full">
                Custom Item
              </span>
            )}
          </div>
        </div>
        {isDynamic && (
          <button
            onClick={() => onRemoveItem(item.item_id)}
            className="p-2 hover:bg-red-100 rounded-lg transition-colors group"
          >
            <XMarkIcon className="w-5 h-5 text-gray-400 group-hover:text-red-600" />
          </button>
        )}
      </div>

      {/* Condition */}
      <div className="mb-4">
        <label className="block text-sm font-bold text-gray-700 mb-2">
          Condition Assessment
        </label>
        <select
          value={item.condition}
          onChange={(e) =>
            onConditionChange(item.item_id, e.target.value, isDynamic)
          }
          className="w-full border-2 border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium"
        >
          {conditions.map((c) => (
            <option key={c.value} value={c.value}>
              {c.icon} {c.label}
            </option>
          ))}
        </select>
      </div>

      {/* Notes */}
      <div className="mb-4">
        <label className="block text-sm font-bold text-gray-700 mb-2">
          Notes & Details
        </label>
        <textarea
          value={item.notes}
          onChange={(e) =>
            onNotesChange(item.item_id, e.target.value, isDynamic)
          }
          className="w-full border-2 border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
          rows={3}
          placeholder={`Describe the condition of the ${item.item_name.toLowerCase()}...`}
        />
      </div>

      {/* Photos */}
      <div>
        <label className="block text-sm font-bold text-gray-700 mb-2">
          Photo Evidence
        </label>
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={(e) =>
            onPhotoUpload(item.item_id, e.target.files, isDynamic)
          }
          className="w-full text-sm text-gray-600 file:mr-4 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 file:cursor-pointer border-2 border-dashed border-gray-300 rounded-xl p-3"
        />

        {item.photos.length > 0 && (
          <div className="mt-3 grid grid-cols-2 gap-2">
            {item.photos.map((file, idx) => (
              <div
                key={idx}
                className="relative bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center justify-between group hover:bg-blue-100 transition-colors"
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <PhotoIcon className="w-5 h-5 text-blue-600 flex-shrink-0" />
                  <span className="text-xs text-gray-700 truncate font-medium">
                    {file.name}
                  </span>
                </div>
                <button
                  onClick={() => onRemovePhoto(item.item_id, idx, isDynamic)}
                  className="w-6 h-6 bg-red-100 hover:bg-red-200 rounded-full flex items-center justify-center transition-colors flex-shrink-0 ml-2"
                >
                  <XMarkIcon className="w-4 h-4 text-red-600" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
