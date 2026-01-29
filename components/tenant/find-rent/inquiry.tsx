"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import Swal from "sweetalert2";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import ChatInquiry from "../chatInquiry";
import useAuth from "../../../hooks/useSession";
import {
    FaCalendarAlt,
    FaClock,
    FaFileContract,
    FaComments,
    FaLock,
} from "react-icons/fa";

type ViewType = "inquire" | "schedule" | "apply";

export default function InquiryBooking({
                                           tenant_id,
                                           unit_id,
                                           rent_amount,
                                           landlord_id,
                                       }: any) {
    const router = useRouter();
    const { user } = useAuth();

    const [view, setView] = useState<ViewType>("inquire");
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [selectedTime, setSelectedTime] = useState("");
    const [bookedDates, setBookedDates] = useState<Record<string, any>>({});
    const [loading, setLoading] = useState(false);

    const confirmRef = useRef<HTMLDivElement | null>(null);

    /* =====================================================
       AUTH GUARD (GLOBAL STYLE)
    ===================================================== */
    const requireAuth = (action: () => void) => {
        if (!user) {
            const callbackUrl = encodeURIComponent(
                window.location.pathname + window.location.search
            );

            Swal.fire({
                icon: "info",
                title: "Login required",
                text: "Please log in to continue.",
                confirmButtonText: "Login",
                confirmButtonColor: "#3B82F6",
            }).then(() => {
                router.push(`/pages/auth/login?callbackUrl=${callbackUrl}`);
            });

            return;
        }

        action();
    };

    /* =====================================================
       DATA
    ===================================================== */
    useEffect(() => {
        axios
            .get("/api/tenant/visits/booked-dates")
            .then((res) => setBookedDates(res.data.bookedDates || {}))
            .catch(() => {});
    }, []);

    useEffect(() => {
        if (view === "schedule" && selectedDate && selectedTime) {
            confirmRef.current?.scrollIntoView({ behavior: "smooth" });
        }
    }, [selectedDate, selectedTime, view]);

    /* =====================================================
       HELPERS
    ===================================================== */
    const isTileDisabled = ({ date, view }: any) => {
        if (view !== "month") return false;

        const key = date.toISOString().split("T")[0];
        return bookedDates[key]?.count >= 1 || date < new Date();
    };

    const handleSchedule = async () => {
        requireAuth(async () => {
            if (!selectedDate || !selectedTime) {
                Swal.fire("Missing info", "Select date & time", "error");
                return;
            }

            try {
                setLoading(true);

                const visit_date = selectedDate.toISOString().split("T")[0];

                await axios.post(
                    "/api/tenant/property-finder/schedVisitOnly",
                    {
                        tenant_id,
                        unit_id,
                        visit_date,
                        visit_time: `${selectedTime}:00`,
                    }
                );

                Swal.fire("Success", "Visit scheduled!", "success");
                router.push("/pages/find-rent");
            } catch {
                Swal.fire("Error", "Failed to schedule visit", "error");
            } finally {
                setLoading(false);
            }
        });
    };

    const handleApply = () => {
        requireAuth(() => {
            router.push(`/pages/tenant/prospective/${unit_id}`);
        });
    };

    /* =====================================================
       UI
    ===================================================== */
    return (
        <>
            <style jsx global>{`
        .react-calendar {
          width: 100%;
          border-radius: 16px;
          border: 2px solid #e5e7eb;
        }
      `}</style>

            <div className="bg-white border border-gray-200 rounded-2xl shadow-xl p-6 space-y-6">
                {/* PRICE */}
                <div className="border-b pb-4">
                    <p className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">
                        ₱{rent_amount?.toLocaleString()}
                        <span className="text-gray-500 text-base font-medium ml-1">
              / month
            </span>
                    </p>
                </div>

                {/* TABS */}
                <div className="flex border-b">
                    {[
                        { id: "inquire", label: "Ask", icon: FaComments },
                        { id: "schedule", label: "Visit", icon: FaCalendarAlt },
                        { id: "apply", label: "Apply", icon: FaFileContract },
                    ].map(({ id, label, icon: Icon }) => (
                        <button
                            key={id}
                            onClick={() => setView(id as ViewType)}
                            className={`flex-1 py-3 font-semibold flex items-center justify-center gap-2
                ${
                                view === id
                                    ? "text-blue-600 border-b-4 border-blue-600"
                                    : "text-gray-500"
                            }`}
                        >
                            <Icon />
                            {label}
                        </button>
                    ))}
                </div>

                {/* INQUIRE */}
                {view === "inquire" && (
                    <div className="space-y-4">
                        <div className="p-4 rounded-xl bg-blue-50 border border-blue-200">
                            <p className="font-semibold">Have questions?</p>
                            <p className="text-sm text-gray-600">
                                Message the landlord directly.
                            </p>
                        </div>

                        {!user ? (
                            <button
                                onClick={() => requireAuth(() => {})}
                                className="w-full py-3 rounded-xl bg-blue-600 text-white font-semibold flex items-center justify-center gap-2"
                            >
                                <FaLock /> Login to message
                            </button>
                        ) : (
                            <ChatInquiry landlord_id={landlord_id} />
                        )}
                    </div>
                )}

                {/* VISIT */}
                {view === "schedule" && (
                    <div className="space-y-5">
                        <Calendar
                            value={selectedDate}
                            onChange={setSelectedDate}
                            tileDisabled={isTileDisabled}
                            minDate={new Date()}
                        />

                        {selectedDate && (
                            <select
                                value={selectedTime}
                                onChange={(e) => setSelectedTime(e.target.value)}
                                className="w-full p-3 border-2 rounded-xl"
                            >
                                <option value="">Select time (8AM – 8PM)</option>
                                {Array.from({ length: 25 }).map((_, i) => {
                                    const hour = Math.floor(i / 2) + 8;
                                    if (hour > 20) return null;
                                    const minute = i % 2 === 0 ? "00" : "30";
                                    return (
                                        <option
                                            key={`${hour}:${minute}`}
                                            value={`${hour.toString().padStart(2, "0")}:${minute}`}
                                        >
                                            {`${hour}:${minute}`}
                                        </option>
                                    );
                                })}
                            </select>
                        )}

                        <div ref={confirmRef}>
                            <button
                                disabled={loading}
                                onClick={handleSchedule}
                                className="w-full py-3 rounded-xl font-bold bg-gradient-to-r from-blue-600 to-emerald-600 text-white disabled:opacity-50"
                            >
                                {loading ? "Scheduling..." : "Confirm visit"}
                            </button>
                        </div>
                    </div>
                )}

                {/* APPLY */}
                {view === "apply" && (
                    <div className="space-y-4">
                        <button
                            onClick={handleApply}
                            className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-emerald-600 text-white font-bold"
                        >
                            Start application
                        </button>

                        <p className="text-xs text-gray-500 text-center">
                            Accurate information is required to proceed.
                        </p>
                    </div>
                )}
            </div>
        </>
    );
}
