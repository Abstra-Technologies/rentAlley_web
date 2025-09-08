"use client";
import { useState } from "react";

interface MoveInItem {
  item_id: number;
  item_name: string;
  condition: string;
  notes: string;
  photos: File[];
}

interface MoveInChecklistProps {
  agreement_id: number; // pass agreement ID from parent
}

const CONDITIONS = [
  {
    value: "good",
    label: "Good Condition",
    color: "bg-green-50 text-green-800 border-green-200",
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
    color: "bg-yellow-50 text-yellow-800 border-yellow-200",
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
  const [currentStep, setCurrentStep] = useState(0);

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

  // API submission
  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const formData = new FormData();

      // Prepare items array to send as JSON
      const itemsPayload = allItems.map((item, idx) => ({
        item_name: item.item_name,
        condition: item.condition,
        notes: item.notes,
        photos: item.photos.map((_, fileIdx) => `file_${idx}_${fileIdx}`), // map to file keys
      }));

      formData.append("items", JSON.stringify(itemsPayload));

      // Append files to FormData using the keys we mapped
      allItems.forEach((item, idx) => {
        item.photos.forEach((file, fileIdx) => {
          formData.append(`file_${idx}_${fileIdx}`, file);
        });
      });

      // Include request_id if needed
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
      setCurrentStep(0);
    } catch (error) {
      console.error(error);
      alert("Error submitting checklist.");
    } finally {
      setSubmitting(false);
    }
  };

  const getConditionStyle = (condition: string) => {
    const conditionData = CONDITIONS.find((c) => c.value === condition);
    return conditionData
      ? conditionData.color
      : "bg-gray-50 text-gray-800 border-gray-200";
  };

  const getConditionIcon = (condition: string) => {
    const conditionData = CONDITIONS.find((c) => c.value === condition);
    return conditionData ? conditionData.icon : "?";
  };

  return (
    <div className="relative">
      <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-xl p-4 sm:p-6 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <span className="text-white text-lg">📋</span>
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-white">
                Move-In Documentation Required
              </h3>
            </div>
            <p className="text-orange-100 text-sm sm:text-base leading-relaxed">
              Complete your property inspection to document the initial
              condition and activate your rental portal
            </p>

            {/* Progress indicator */}
            <div className="mt-4 bg-white bg-opacity-20 rounded-full h-2">
              <div
                className="bg-white h-2 rounded-full transition-all duration-500"
                style={{ width: `${isOpen ? completionPercentage : 0}%` }}
              ></div>
            </div>
            {isOpen && (
              <p className="text-white text-xs mt-1 font-medium">
                {completionPercentage}% Complete
              </p>
            )}
          </div>

          <button
            onClick={() => setIsOpen(true)}
            className="bg-white text-orange-600 px-4 sm:px-6 py-3 rounded-lg font-semibold hover:bg-orange-50 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 relative overflow-hidden group"
          >
            <span className="relative z-10 flex items-center gap-2">
              <span className="text-base sm:text-lg">📝</span>
              <span className="text-sm sm:text-base">Start Inspection</span>
            </span>
            <div className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full animate-ping"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-orange-400 to-red-400 opacity-0 group-hover:opacity-10 transition-opacity"></div>
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60 z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[95vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 sm:p-6 text-white relative">
              <button
                onClick={() => setIsOpen(false)}
                className="absolute top-4 right-4 w-8 h-8 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full flex items-center justify-center transition-colors"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>

              <div className="pr-12">
                <h2 className="text-2xl sm:text-3xl font-bold mb-2">
                  Property Inspection Checklist
                </h2>
                <p className="text-blue-100">
                  Document the condition of each item in your unit
                </p>

                {/* Progress bar */}
                <div className="mt-4 bg-white bg-opacity-20 rounded-full h-2">
                  <div
                    className="bg-white h-2 rounded-full transition-all duration-500"
                    style={{ width: `${completionPercentage}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-xs mt-1 text-blue-100">
                  <span>{allItems.length} items total</span>
                  <span>{completionPercentage}% complete</span>
                </div>
              </div>
            </div>

            {/* Add Item Section */}
            <div className="p-4 sm:p-6 border-b border-gray-200 bg-gray-50">
              <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <span className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-sm">
                  +
                </span>
                Add Additional Items
              </h3>
              <div className="flex flex-col sm:flex-row gap-3">
                <select
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  className="flex-1 border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                >
                  <option value="">Choose an item to inspect...</option>
                  {AVAILABLE_ITEMS.map((item) => (
                    <option key={item.name} value={item.name}>
                      {item.icon} {item.name}
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleAddDynamicItem}
                  disabled={!newItemName}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium text-sm whitespace-nowrap"
                >
                  Add Item
                </button>
              </div>
            </div>

            {/* Checklist Items */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-4 sm:p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                  {/* Default Items */}
                  {items.map((item) => (
                    <div
                      key={item.item_id}
                      className="bg-white border border-gray-200 rounded-xl p-4 sm:p-5 shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-gray-900 text-lg flex items-center gap-2">
                          <span className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm">
                            {getConditionIcon(item.condition)}
                          </span>
                          {item.item_name}
                        </h3>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium border ${getConditionStyle(
                            item.condition
                          )}`}
                        >
                          {
                            CONDITIONS.find((c) => c.value === item.condition)
                              ?.label
                          }
                        </span>
                      </div>

                      {/* Condition Selection */}
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Condition Assessment
                        </label>
                        <select
                          value={item.condition}
                          onChange={(e) =>
                            handleConditionChange(item.item_id, e.target.value)
                          }
                          className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                        >
                          {CONDITIONS.map((c) => (
                            <option key={c.value} value={c.value}>
                              {c.icon} {c.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Notes */}
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Notes & Details
                        </label>
                        <textarea
                          value={item.notes}
                          onChange={(e) =>
                            handleNotesChange(item.item_id, e.target.value)
                          }
                          className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm resize-none"
                          rows={3}
                          placeholder={`Describe the condition of the ${item.item_name.toLowerCase()}...`}
                        />
                      </div>

                      {/* Photo Upload */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Photo Evidence
                        </label>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={(e) =>
                            handlePhotoUpload(item.item_id, e.target.files)
                          }
                          className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 file:cursor-pointer"
                        />

                        {item.photos.length > 0 && (
                          <div className="mt-3 grid grid-cols-2 gap-2">
                            {item.photos.map((file, idx) => (
                              <div
                                key={idx}
                                className="relative bg-gray-50 rounded-lg p-2 flex items-center justify-between"
                              >
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                  <span className="text-green-600">📸</span>
                                  <span className="text-xs text-gray-600 truncate">
                                    {file.name}
                                  </span>
                                </div>
                                <button
                                  onClick={() =>
                                    handleRemovePhoto(item.item_id, idx)
                                  }
                                  className="w-5 h-5 bg-red-100 hover:bg-red-200 rounded-full flex items-center justify-center transition-colors"
                                >
                                  <span className="text-red-600 text-xs">
                                    ×
                                  </span>
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  {/* Dynamic Items */}
                  {dynamicItems.map((item) => (
                    <div
                      key={item.item_id}
                      className="bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-4 sm:p-5 shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-gray-900 text-lg flex items-center gap-2">
                          <span className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-sm">
                            {getConditionIcon(item.condition)}
                          </span>
                          {item.item_name}
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                            Added
                          </span>
                        </h3>
                        <button
                          onClick={() => handleRemoveDynamicItem(item.item_id)}
                          className="w-6 h-6 bg-red-100 hover:bg-red-200 rounded-full flex items-center justify-center transition-colors"
                          title="Remove item"
                        >
                          <span className="text-red-600 text-sm">×</span>
                        </button>
                      </div>

                      {/* Same form structure as default items */}
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Condition Assessment
                        </label>
                        <select
                          value={item.condition}
                          onChange={(e) =>
                            handleConditionChange(
                              item.item_id,
                              e.target.value,
                              true
                            )
                          }
                          className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                        >
                          {CONDITIONS.map((c) => (
                            <option key={c.value} value={c.value}>
                              {c.icon} {c.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Notes & Details
                        </label>
                        <textarea
                          value={item.notes}
                          onChange={(e) =>
                            handleNotesChange(
                              item.item_id,
                              e.target.value,
                              true
                            )
                          }
                          className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm resize-none"
                          rows={3}
                          placeholder={`Describe the condition of the ${item.item_name.toLowerCase()}...`}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Photo Evidence
                        </label>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={(e) =>
                            handlePhotoUpload(
                              item.item_id,
                              e.target.files,
                              true
                            )
                          }
                          className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 file:cursor-pointer"
                        />

                        {item.photos.length > 0 && (
                          <div className="mt-3 grid grid-cols-2 gap-2">
                            {item.photos.map((file, idx) => (
                              <div
                                key={idx}
                                className="relative bg-white bg-opacity-60 rounded-lg p-2 flex items-center justify-between"
                              >
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                  <span className="text-green-600">📸</span>
                                  <span className="text-xs text-gray-600 truncate">
                                    {file.name}
                                  </span>
                                </div>
                                <button
                                  onClick={() =>
                                    handleRemovePhoto(item.item_id, idx, true)
                                  }
                                  className="w-5 h-5 bg-red-100 hover:bg-red-200 rounded-full flex items-center justify-center transition-colors"
                                >
                                  <span className="text-red-600 text-xs">
                                    ×
                                  </span>
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-gray-200 p-4 sm:p-6 bg-gray-50">
              <div className="flex flex-col sm:flex-row gap-3 sm:justify-between sm:items-center">
                <div className="text-sm text-gray-600">
                  <span className="font-medium">{allItems.length}</span> items
                  to inspect •
                  <span className="font-medium text-green-600 ml-1">
                    {completionPercentage}%
                  </span>{" "}
                  complete
                </div>
                <button
                  onClick={handleSubmit}
                  disabled={submitting || completionPercentage < 100}
                  className="px-6 sm:px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-semibold disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed hover:from-green-700 hover:to-emerald-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <span>✅</span>
                      <span>Complete Inspection</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
