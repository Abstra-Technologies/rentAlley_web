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

const CONDITIONS = ["good", "damaged", "needs_repair", "scratched", "needs_cleaning"];
const AVAILABLE_ITEMS = ["Doors", "Windows", "Ceiling", "Lights", "Balcony", "TV", "Aircon", "Washing Machine"];

export default function MoveInChecklist({ agreement_id }: MoveInChecklistProps) {
    const initialItems: MoveInItem[] = [
        { item_id: 1, item_name: "Floor", condition: "good", notes: "", photos: [] },
        { item_id: 2, item_name: "Walls", condition: "good", notes: "", photos: [] },
        { item_id: 3, item_name: "Bathroom", condition: "good", notes: "", photos: [] },
        { item_id: 4, item_name: "Kitchen", condition: "good", notes: "", photos: [] },
    ];

    const [items, setItems] = useState<MoveInItem[]>(initialItems);
    const [dynamicItems, setDynamicItems] = useState<MoveInItem[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [newItemName, setNewItemName] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const handleConditionChange = (item_id: number, condition: string, isDynamic = false) => {
        const updater = isDynamic ? setDynamicItems : setItems;
        const list = isDynamic ? dynamicItems : items;
        updater(list.map((item) => (item.item_id === item_id ? { ...item, condition } : item)));
    };

    const handleNotesChange = (item_id: number, notes: string, isDynamic = false) => {
        const updater = isDynamic ? setDynamicItems : setItems;
        const list = isDynamic ? dynamicItems : items;
        updater(list.map((item) => (item.item_id === item_id ? { ...item, notes } : item)));
    };

    const handlePhotoUpload = (item_id: number, files: FileList | null, isDynamic = false) => {
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

    const handleAddDynamicItem = () => {
        if (!newItemName) return;
        if (
            items.some((i) => i.item_name === newItemName) ||
            dynamicItems.some((i) => i.item_name === newItemName)
        )
            return;

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

    // API submission
    const handleSubmit = async () => {
        setSubmitting(true);
        try {
            const formData = new FormData();

            // Combine initial + dynamic items
            const allItems = [...items, ...dynamicItems];

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
        } catch (error) {
            console.error(error);
            alert("Error submitting checklist.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="bg-red-500 text-white px-4 py-2 rounded animate-pulse relative"
            >
                Complete Move-In Checklist
                <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full animate-ping"></span>
            </button>

            {isOpen && (
                <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50 overflow-auto p-4">
                    <div className="bg-white rounded-2xl shadow-lg p-6 max-w-2xl w-full relative">
                        <button
                            onClick={() => setIsOpen(false)}
                            className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 font-bold text-lg"
                        >
                            ✕
                        </button>

                        <h2 className="text-2xl font-bold mb-6 text-center">Move-In Checklist</h2>

                        {/* Add Dynamic Item */}
                        <div className="flex gap-2 mb-6">
                            <select
                                value={newItemName}
                                onChange={(e) => setNewItemName(e.target.value)}
                                className="border p-2 rounded flex-1"
                            >
                                <option value="">Select item to add...</option>
                                {AVAILABLE_ITEMS.map((name) => (
                                    <option key={name} value={name}>
                                        {name}
                                    </option>
                                ))}
                            </select>
                            <button
                                onClick={handleAddDynamicItem}
                                className="bg-blue-500 text-white px-4 py-2 rounded"
                            >
                                Add
                            </button>
                        </div>

                        {/* Scrollable checklist */}
                        <div className="max-h-[60vh] overflow-y-auto pr-2">
                            <ul className="space-y-4">
                                {items.map((item) => (
                                    <li key={item.item_id} className="border rounded-lg p-4 shadow-sm">
                                        <h3 className="font-semibold mb-2">{item.item_name}</h3>

                                        <label className="block mb-2">
                                            Condition:
                                            <select
                                                value={item.condition}
                                                onChange={(e) =>
                                                    handleConditionChange(item.item_id, e.target.value)
                                                }
                                                className="border p-1 rounded w-full mt-1"
                                            >
                                                {CONDITIONS.map((c) => (
                                                    <option key={c} value={c}>
                                                        {c}
                                                    </option>
                                                ))}
                                            </select>
                                        </label>

                                        <label className="block mb-2">
                                            Notes:
                                            <textarea
                                                value={item.notes}
                                                onChange={(e) =>
                                                    handleNotesChange(item.item_id, e.target.value)
                                                }
                                                className="border p-2 rounded w-full mt-1"
                                                placeholder="Add notes..."
                                            />
                                        </label>

                                        <label className="block mb-2">
                                            Capture Photo:
                                            <input
                                                type="file"
                                                accept="image/*"
                                                multiple
                                                onChange={(e) =>
                                                    handlePhotoUpload(item.item_id, e.target.files)
                                                }
                                                className="mt-1"
                                            />
                                        </label>

                                        {item.photos.length > 0 && (
                                            <div className="flex gap-2 flex-wrap mt-2">
                                                {item.photos.map((file, idx) => (
                                                    <span key={idx} className="text-sm bg-gray-100 p-1 rounded">
                                                        {file.name}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </li>
                                ))}

                                {dynamicItems.map((item) => (
                                    <li
                                        key={item.item_id}
                                        className="border rounded-lg p-4 shadow-sm bg-gray-50"
                                    >
                                        <h3 className="font-semibold mb-2">{item.item_name} (Added)</h3>

                                        <label className="block mb-2">
                                            Condition:
                                            <select
                                                value={item.condition}
                                                onChange={(e) =>
                                                    handleConditionChange(item.item_id, e.target.value, true)
                                                }
                                                className="border p-1 rounded w-full mt-1"
                                            >
                                                {CONDITIONS.map((c) => (
                                                    <option key={c} value={c}>
                                                        {c}
                                                    </option>
                                                ))}
                                            </select>
                                        </label>

                                        <label className="block mb-2">
                                            Notes:
                                            <textarea
                                                value={item.notes}
                                                onChange={(e) =>
                                                    handleNotesChange(item.item_id, e.target.value, true)
                                                }
                                                className="border p-2 rounded w-full mt-1"
                                                placeholder="Add notes..."
                                            />
                                        </label>

                                        <label className="block mb-2">
                                            Photos:
                                            <input
                                                type="file"
                                                accept="image/*"
                                                multiple
                                                onChange={(e) =>
                                                    handlePhotoUpload(item.item_id, e.target.files, true)
                                                }
                                                className="mt-1"
                                            />
                                        </label>

                                        {item.photos.length > 0 && (
                                            <div className="flex gap-2 flex-wrap mt-2">
                                                {item.photos.map((file, idx) => (
                                                    <span key={idx} className="text-sm bg-gray-100 p-1 rounded">
                                                        {file.name}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <button
                            onClick={handleSubmit}
                            disabled={submitting}
                            className="bg-green-500 text-white px-6 py-2 rounded mt-6 w-full font-semibold disabled:opacity-50"
                        >
                            {submitting ? "Submitting..." : "Submit Checklist"}
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}
