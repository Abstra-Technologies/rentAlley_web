"use client";

import React, { useState } from "react";
import useSWR from "swr";
import { BackButton } from "@/components/navigation/backButton";
import { FaSearch, FaQuestionCircle, FaBook } from "react-icons/fa";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function SupportPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [activeTab, setActiveTab] = useState<"faqs" | "guides">("faqs");

    // Fetch FAQs
    const { data: faqs, error: faqError } = useSWR("/api/support/faqs", fetcher);
    // Fetch How-To Guides
    const { data: guides, error: guideError } = useSWR("/api/support/guides", fetcher);

    const filteredFAQs = faqs?.filter(
        (faq: any) =>
            faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
            faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredGuides = guides?.filter(
        (guide: any) =>
            guide.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            guide.content.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
            <BackButton label="Back to Dashboard" />

            <div className="mt-6 bg-white p-6 rounded-2xl shadow-lg">
                {/* Page Header */}
                <div className="flex items-center gap-3 mb-6">
                    <FaQuestionCircle className="text-blue-600 w-6 h-6" />
                    <h1 className="text-2xl font-bold text-gray-800">Support Center</h1>
                </div>

                {/* Search Input */}
                <div className="flex items-center gap-2 mb-6 border rounded-lg overflow-hidden">
                    <input
                        type="text"
                        placeholder="Search guides or FAQs..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="flex-1 p-2 text-gray-700 focus:outline-none"
                    />
                    <div className="bg-blue-600 p-2 text-white">
                        <FaSearch />
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-6">
                    <button
                        className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
                            activeTab === "faqs"
                                ? "bg-blue-600 text-white shadow-md"
                                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                        onClick={() => setActiveTab("faqs")}
                    >
                        <FaQuestionCircle className="inline w-4 h-4 mr-1" />
                        FAQs
                    </button>
                    <button
                        className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
                            activeTab === "guides"
                                ? "bg-blue-600 text-white shadow-md"
                                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                        onClick={() => setActiveTab("guides")}
                    >
                        <FaBook className="inline w-4 h-4 mr-1" />
                        How-To Guides
                    </button>
                </div>

                {/* Content */}
                <div className="space-y-4">
                    {activeTab === "faqs" &&
                        (faqError ? (
                            <p className="text-red-500">Failed to load FAQs.</p>
                        ) : !faqs ? (
                            <p className="text-gray-500 text-center">Loading...</p>
                        ) : filteredFAQs.length ? (
                            filteredFAQs.map((faq: any) => (
                                <div
                                    key={faq.id}
                                    className="border border-gray-200 rounded-lg p-4 bg-gray-50"
                                >
                                    <h3 className="font-semibold text-gray-800 mb-2">{faq.question}</h3>
                                    <p className="text-gray-700">{faq.answer}</p>
                                </div>
                            ))
                        ) : (
                            <p className="text-gray-500 text-center">No FAQs found.</p>
                        ))}

                    {activeTab === "guides" &&
                        (guideError ? (
                            <p className="text-red-500">Failed to load guides.</p>
                        ) : !guides ? (
                            <p className="text-gray-500 text-center">Loading...</p>
                        ) : filteredGuides.length ? (
                            filteredGuides.map((guide: any) => (
                                <div
                                    key={guide.id}
                                    className="border border-gray-200 rounded-lg p-4 bg-gray-50"
                                >
                                    <h3 className="font-semibold text-gray-800 mb-2">{guide.title}</h3>
                                    <p className="text-gray-700">{guide.content}</p>
                                </div>
                            ))
                        ) : (
                            <p className="text-gray-500 text-center">No guides found.</p>
                        ))}
                </div>
            </div>
        </div>
    );
}
