// components/FeedbackWidget.tsx
'use client';

import { useState } from 'react';
import { MessageSquare, X } from 'lucide-react';

export default function FeedbackWidget() {
  const [isOpen, setIsOpen] = useState(false);

  const handleOpenFeedback = () => {
    window.open('https://tally.so/r/ODldbg', '_blank', 'noopener,noreferrer');
    // Optional: Close the widget after redirect (or keep it open)
    setIsOpen(false);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full p-4 shadow-lg hover:shadow-xl transition-all hover:scale-110 focus:outline-none focus:ring-2 focus:ring-blue-500"
        aria-label="Give feedback"
      >
        <MessageSquare className="h-6 w-6" />
      </button>

      {/* Widget Tooltip / Preview (optional) */}
      {isOpen && (
        <div className="absolute bottom-20 right-0 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-80 sm:w-96 overflow-hidden border border-gray-200 dark:border-gray-700 p-5 animate-fadeIn">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="font-semibold text-lg">We’d love your feedback!</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Help us improve Upkyp Beta — your thoughts matter!
              </p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <p className="text-sm mb-4">
            Click below to open our quick feedback form. It takes less than a minute!
          </p>

          <button
            onClick={handleOpenFeedback}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
          >
            Open Feedback Form
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </button>

          <p className="text-xs text-center mt-3 text-gray-500 dark:text-gray-400">
            Powered by Tally
          </p>
        </div>
      )}
    </div>
  );
}