"use client";

import { useState } from "react";
import { X, FolderPlus } from "lucide-react";
import axios from "axios";
import Swal from "sweetalert2";

interface Props {
    propertyId: string;
    isOpen: boolean;
    onClose: () => void;
    onCreated?: () => void; // refetch folders
    disabled?: boolean; // storage limit reached
}

export default function CreateFolderModal({
                                              propertyId,
                                              isOpen,
                                              onClose,
                                              onCreated,
                                              disabled = false,
                                          }: Props) {
    const [name, setName] = useState("");
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleCreate = async () => {
        if (!name.trim()) {
            Swal.fire("Folder name required", "", "warning");
            return;
        }

        try {
            setLoading(true);

            await axios.post("/api/landlord/documents/folders/create", {
                property_id: propertyId,
                name: name.trim(),
            });

            Swal.fire("Folder created", "", "success");
            setName("");
            onCreated?.();
            onClose();
        } catch (err: any) {
            Swal.fire(
                "Error",
                err?.response?.data?.message || "Failed to create folder",
                "error"
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white w-full max-w-md rounded-xl shadow-lg border">

                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b">
                    <div className="flex items-center gap-2">
                        <FolderPlus className="w-5 h-5 text-blue-600" />
                        <h2 className="font-semibold text-gray-800">
                            Create Folder
                        </h2>
                    </div>

                    <button onClick={onClose}>
                        <X className="w-5 h-5 text-gray-500 hover:text-gray-700" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-5 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Folder name
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Contracts, Permits, Receipts"
                            className="w-full rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                    </div>

                    {disabled && (
                        <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
                            Storage limit reached. Upgrade your plan to create more folders.
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-2 px-5 py-4 border-t">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm rounded-lg border text-gray-600 hover:bg-gray-50"
                    >
                        Cancel
                    </button>

                    <button
                        onClick={handleCreate}
                        disabled={loading || disabled}
                        className={`px-4 py-2 text-sm rounded-lg font-semibold transition
              ${
                            loading || disabled
                                ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                                : "bg-gradient-to-r from-blue-600 to-emerald-600 text-white hover:shadow-md"
                        }`}
                    >
                        {loading ? "Creating..." : "Create"}
                    </button>
                </div>
            </div>
        </div>
    );
}
