"use client";
import { useState } from "react";

export default function PaymentProcessAccordion() {
    const sections = [
        {
            title: "How tenant payments are processed",
            content:
                "When a tenant submits a payment, the system validates the method, stores the transaction, and updates the landlord’s payment ledger. Depending on the payment type, manual review may be required.",
        },

        {
            title: "How tenant receipts are generated",
            content:
                "After confirmation, the system generates a receipt reference number and notifies the tenant automatically.",
        },
    ];

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mt-6">
            <div className="p-4 sm:p-6 border-b border-gray-200">
                <h2 className="text-base sm:text-lg font-bold text-gray-900">
                    Payment Process Information
                </h2>
                <p className="text-xs sm:text-sm text-gray-600">
                    Learn how payments flow through the system
                </p>
            </div>

            <div className="divide-y divide-gray-200">
                {sections.map((item, i) => (
                    <AccordionItem key={i} title={item.title} content={item.content} />
                ))}
            </div>
        </div>
    );
}

function AccordionItem({
                           title,
                           content,
                       }: {
    title: string;
    content: string;
}) {
    const [open, setOpen] = useState(false);

    return (
        <div className="p-4 sm:p-6">
            {/* Header */}
            <button
                onClick={() => setOpen(!open)}
                className="flex items-center justify-between w-full text-left"
            >
                <span className="font-medium text-gray-900">{title}</span>

                {/* Arrow */}
                <span
                    className={`
            transform transition-transform duration-300
            ${open ? "rotate-180" : "rotate-0"}
          `}
                >
          ⌄
        </span>
            </button>

            {/* Content */}
            <div
                className={`
          overflow-hidden transition-all duration-300 text-sm text-gray-600 mt-2
          ${open ? "max-h-40 opacity-100" : "max-h-0 opacity-0"}
        `}
            >
                {content}
            </div>
        </div>
    );
}
