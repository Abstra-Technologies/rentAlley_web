"use client";
import { useState } from "react";
import { ChevronDown, Info } from "lucide-react";

export default function PaymentProcessAccordion() {
  const sections = [
    {
      title: "How tenant payments are processed",
      content:
        "When a tenant submits a payment, the system validates the method, stores the transaction, and updates the landlord's payment ledger. Depending on the payment type, manual review may be required.",
    },
    {
      title: "How tenant receipts are generated",
      content:
        "After confirmation, the system generates a receipt reference number and notifies the tenant automatically.",
    },
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-4 sm:p-6 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-100 to-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <Info className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-gray-900">
              Payment Process Information
            </h2>
            <p className="text-xs sm:text-sm text-gray-600">
              Learn how payments flow through the system
            </p>
          </div>
        </div>
      </div>

      <div className="divide-y divide-gray-200">
        {sections.map((item, i) => (
          <AccordionItem key={i} title={item.title} content={item.content} />
        ))}
      </div>
    </div>
  );
}

function AccordionItem({ title, content }: { title: string; content: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="p-4 sm:p-6 hover:bg-gray-50 transition-colors">
      {/* Header */}
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full text-left group"
      >
        <span className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
          {title}
        </span>

        {/* Arrow Icon */}
        <ChevronDown
          className={`
                        w-5 h-5 text-gray-400 group-hover:text-blue-600
                        transform transition-all duration-300
                        ${open ? "rotate-180" : "rotate-0"}
                    `}
        />
      </button>

      {/* Content */}
      <div
        className={`
                    overflow-hidden transition-all duration-300 ease-in-out
                    ${
                      open
                        ? "max-h-40 opacity-100 mt-3"
                        : "max-h-0 opacity-0 mt-0"
                    }
                `}
      >
        <p className="text-sm text-gray-600 leading-relaxed">{content}</p>
      </div>
    </div>
  );
}
