"use client";

import { useState } from "react";
import { io } from "socket.io-client";
import useAuthStore from "@/zustand/authStore";
import {
  Send,
  CheckCircle,
  AlertCircle,
  MessageSquare,
  Shield,
  FileText,
  Lock,
} from "lucide-react";

interface ChatInquiryProps {
  landlord_id: string;
  propertyName?: string;
}

const ChatInquiry = ({ landlord_id, propertyName }: ChatInquiryProps) => {
  const { user } = useAuthStore();

  const [message, setMessage] = useState("");
  const [agreementChecked, setAgreementChecked] = useState(false);
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [socket] = useState(() =>
    io("http://localhost:4000", { autoConnect: true }),
  );

  const chat_room = `chat_${[user?.user_id, landlord_id].sort().join("_")}`;
  console.log("Chatroom Generated:", chat_room);

  const sendMessageToChat = async () => {
    if (!user) {
      setError("You must be logged in to send inquiries.");
      setTimeout(() => setError(null), 3000);
      return;
    }

    if (!message.trim() || !agreementChecked) {
      setError("Please enter a message and agree to the terms.");
      setTimeout(() => setError(null), 3000);
      return;
    }

    setSending(true);
    setError(null);

    try {
      socket.emit("sendMessage", {
        sender_id: user.tenant_id || user.landlord_id,
        sender_type: user.tenant_id ? "tenant" : "landlord",
        receiver_id: landlord_id,
        receiver_type: "landlord",
        message,
        chat_room,
      });

      setMessage("");
      setSuccess(true);
      setTimeout(() => setSuccess(false), 4000);
    } catch (err) {
      setError("Failed to send message. Please try again.");
      setTimeout(() => setError(null), 3000);
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && e.ctrlKey && agreementChecked && message.trim()) {
      sendMessageToChat();
    }
  };

  const isFormValid = agreementChecked && message.trim() !== "";

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header - Compact */}
      <div className="px-4 py-3 bg-gradient-to-r from-blue-50 to-emerald-50 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-lg flex items-center justify-center shadow-sm">
            <MessageSquare className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-800 text-sm">
              Send Inquiry
            </h3>
            <p className="text-xs text-slate-500">
              {propertyName
                ? `About: ${propertyName}`
                : "Message the landlord directly"}
            </p>
          </div>
        </div>
      </div>

      {/* Content - Compact */}
      <div className="p-4">
        {/* Success Message */}
        {success && (
          <div className="mb-3 p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2.5 animate-in slide-in-from-top-2 duration-300">
            <div className="w-7 h-7 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-emerald-800">
                Message sent successfully!
              </p>
              <p className="text-[11px] text-emerald-600">
                The landlord will respond in your messages.
              </p>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-3 p-2.5 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2.5 animate-in slide-in-from-top-2 duration-300">
            <div className="w-7 h-7 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-4 h-4 text-red-600" />
            </div>
            <p className="text-xs text-red-700">{error}</p>
          </div>
        )}

        {/* Textarea - Smaller height */}
        <div className="relative mb-3">
          <textarea
            className="w-full min-h-[100px] p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 placeholder:text-slate-400 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 focus:bg-white transition-all"
            placeholder="Hi! I'm interested in this property. Is it still available? Do you offer any discounts for long-term rentals?"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            maxLength={1000}
          />
          <div className="absolute bottom-2 right-3 text-[11px] text-slate-400">
            {message.length}/1000
          </div>
        </div>

        {/* Quick Messages - Compact */}
        <div className="mb-3">
          <p className="text-xs text-slate-500 mb-1.5">Quick messages:</p>
          <div className="flex flex-wrap gap-1.5">
            {[
              "Is this unit still available?",
              "Can I schedule a viewing?",
              "What are the move-in costs?",
            ].map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => setMessage(suggestion)}
                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs rounded-full transition-colors"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>

        {/* Agreement - Compact */}
        <div className="mb-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
          <label className="flex items-start gap-2.5 cursor-pointer group">
            <div className="relative flex-shrink-0 mt-0.5">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={agreementChecked}
                onChange={() => setAgreementChecked(!agreementChecked)}
              />
              <div className="w-4 h-4 border-2 border-slate-300 rounded peer-checked:border-blue-500 peer-checked:bg-blue-500 transition-all">
                {agreementChecked && (
                  <svg
                    className="w-full h-full text-white p-0.5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    viewBox="0 0 24 24"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </div>
            </div>

            <div className="text-xs text-slate-600 leading-relaxed">
              I agree to the{" "}
              <a
                href="/terms"
                className="text-blue-600 font-medium hover:underline"
              >
                Terms of Service
              </a>
              ,{" "}
              <a
                href="/privacy"
                className="text-blue-600 font-medium hover:underline"
              >
                Privacy Policy
              </a>
              , and{" "}
              <a
                href="/safety"
                className="text-blue-600 font-medium hover:underline"
              >
                Safety Guidelines
              </a>
              .
            </div>
          </label>
        </div>

        {/* Send Button */}
        <button
          className={`w-full py-2.5 px-4 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition-all shadow-sm ${
            isFormValid
              ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:shadow-md hover:from-blue-600 hover:to-blue-700 active:scale-[0.98]"
              : "bg-slate-200 text-slate-400 cursor-not-allowed"
          }`}
          onClick={sendMessageToChat}
          disabled={!isFormValid || sending}
        >
          {sending ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              Send Message
            </>
          )}
        </button>

        {/* Trust Indicators - Compact */}
        <div className="mt-3 pt-3 border-t border-slate-100">
          <div className="flex items-center justify-center gap-4 text-[11px] text-slate-400">
            <div className="flex items-center gap-1">
              <Shield className="w-3 h-3" />
              <span>Secure</span>
            </div>
            <div className="flex items-center gap-1">
              <Lock className="w-3 h-3" />
              <span>Private</span>
            </div>
            <div className="flex items-center gap-1">
              <FileText className="w-3 h-3" />
              <span>Verified</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInquiry;
