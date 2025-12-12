"use client";

import { FiX, FiInfo, FiAlertCircle } from "react-icons/fi";
import { DOCUMENT_TYPES } from "@/constant/docTypes";
import { MdCreditCard } from "react-icons/md"; // example ID card style icon

export default function DocumentModal({ open, onClose }) {
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl overflow-hidden animate-fadeIn">
                {/* HEADER */}
                <div className="flex items-center justify-between px-6 py-4 border-b bg-gray-50">
                    <div className="flex items-center gap-2">
                        <FiInfo className="w-5 h-5 text-blue-500" />
                        <h3 className="text-lg font-semibold text-gray-900">
                            Accepted Document Types
                        </h3>
                    </div>

                    <button
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-gray-200 transition"
                    >
                        <FiX className="w-5 h-5 text-gray-700" />
                    </button>
                </div>

                {/* CONTENT */}
                <div className="p-6 space-y-6">
                    {/* Accepted Docs */}
                    <div>
                        <h4 className="font-medium text-gray-700 mb-3">You may submit:</h4>
                        <ul className="space-y-2">
                            {DOCUMENT_TYPES.map((doc) => (
                                <li
                                    key={doc.value}
                                    className="flex items-center gap-3 p-3 border border-gray-200 rounded-xl bg-gray-50"
                                >
                                    <FiIdCard className="w-5 h-5 text-blue-600" />
                                    <span className="text-gray-700 font-medium">{doc.label}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Requirements */}
                    <div>
                        <h4 className="font-medium text-gray-700 mb-3">
                            Important Requirements
                        </h4>

                        <div className="space-y-2">
                            <p className="flex items-start gap-3 text-sm text-gray-600">
                                <FiAlertCircle className="w-5 h-5 text-amber-500 mt-0.5" />
                                Make sure the document is not expired.
                            </p>

                            <p className="flex items-start gap-3 text-sm text-gray-600">
                                <FiAlertCircle className="w-5 h-5 text-amber-500 mt-0.5" />
                                Ensure all details are clear and readable.
                            </p>

                            <p className="flex items-start gap-3 text-sm text-gray-600">
                                <FiAlertCircle className="w-5 h-5 text-amber-500 mt-0.5" />
                                Remove any glare, blur, or shadows covering text.
                            </p>
                        </div>
                    </div>
                </div>

                {/* FOOTER */}
                <div className="p-4 border-t bg-gray-50">
                    <button
                        onClick={onClose}
                        className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold transition"
                    >
                        Got it!
                    </button>
                </div>
            </div>
        </div>
    );
}
