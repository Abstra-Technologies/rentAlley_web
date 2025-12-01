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
    FaCheckCircle,
    FaComments,
    FaInfoCircle,
} from "react-icons/fa";

export default function InquiryBooking({
                                           tenant_id,
                                           unit_id,
                                           rent_amount,
                                           landlord_id,
                                       }) {
    const router = useRouter();
    const { user } = useAuth();

    const [view, setView] = useState<"inquire" | "schedule" | "apply">("inquire");
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [selectedTime, setSelectedTime] = useState("");
    const [bookedDates, setBookedDates] = useState<Record<string, any>>({});
    const [loading, setLoading] = useState(false);

    const confirmButtonRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        const fetchBookedDates = async () => {
            try {
                const response = await axios.get("/api/tenant/visits/booked-dates");
                setBookedDates(response.data.bookedDates || {});
            } catch (error) {
                console.error("Error fetching booked dates:", error);
            }
        };
        fetchBookedDates();
    }, []);

    useEffect(() => {
        if (
            view === "schedule" &&
            selectedDate &&
            selectedTime &&
            confirmButtonRef.current
        ) {
            confirmButtonRef.current.scrollIntoView({
                behavior: "smooth",
                block: "nearest",
            });
        }
    }, [selectedDate, selectedTime, view]);

    const isTileDisabled = ({ date, view }) => {
        if (view !== "month") return false;

        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        const formatted = `${year}-${month}-${day}`;

        const booked = bookedDates[formatted];
        return (booked && booked.count >= 1) || date < new Date();
    };

    const handleTimeChange = (e) => {
        const value = e.target.value;
        const [hours] = value.split(":").map(Number);

        if (hours < 8 || hours > 20) {
            Swal.fire({
                icon: "error",
                title: "Invalid Time",
                text: "Please select a time between 8 AM and 8 PM.",
                confirmButtonColor: "#3B82F6",
            });
            return;
        }

        setSelectedTime(value);
    };

    const getCombinedDateTime = () => {
        if (!selectedDate || !selectedTime) return "";
        const [hours, minutes] = selectedTime.split(":");
        const updated = new Date(selectedDate);
        updated.setHours(parseInt(hours), parseInt(minutes));
        return updated.toLocaleString("en-US", {
            dateStyle: "full",
            timeStyle: "short",
        });
    };

    const handleJustSchedule = async (e) => {
        e.preventDefault();

        if (!selectedDate || !selectedTime) {
            Swal.fire({
                icon: "error",
                title: "Incomplete Selection",
                text: "Please select both a date and a time.",
                confirmButtonColor: "#3B82F6",
            });
            return;
        }

        try {
            setLoading(true);

            const year = selectedDate.getFullYear();
            const month = String(selectedDate.getMonth() + 1).padStart(2, "0");
            const day = String(selectedDate.getDate()).padStart(2, "0");
            const formattedDate = `${year}-${month}-${day}`;

            const response = await axios.post(
                "/api/tenant/property-finder/schedVisitOnly",
                {
                    tenant_id,
                    unit_id,
                    visit_date: formattedDate,
                    visit_time: `${selectedTime}:00`,
                }
            );

            if (response.status === 200) {
                await Swal.fire({
                    icon: "success",
                    title: "Visit Scheduled",
                    text: "Visit scheduled successfully!",
                    confirmButtonColor: "#3B82F6",
                });
                router.push("/pages/find-rent");
            }
        } catch (error) {
            Swal.fire({
                icon: "error",
                title: "Scheduling Error",
                text: "Failed to schedule visit. Please try again.",
                confirmButtonColor: "#3B82F6",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleApplyNow = () => {
        router.push(
            unit_id ? `/pages/tenant/prospective/${unit_id}` : "/pages/find-rent"
        );
    };

    return (
        <>
            <style jsx global>{`
        .react-calendar {
          width: 100% !important;
          border: 2px solid #e5e7eb !important;
          border-radius: 16px !important;
          background: white !important;
        }
      `}</style>

            <div className="bg-white border-2 border-gray-200 rounded-2xl p-6 shadow-xl">
                {/* HEADER */}
                <div className="pb-6 border-b-2 border-gray-100 mb-6">
          <span className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">
            ₱{rent_amount?.toLocaleString()}
          </span>
                    <span className="text-gray-600 font-medium ml-1">/ month</span>
                </div>

                {/* TABS */}
                <div className="flex border-b-2 border-gray-100 mb-6 -mx-1">
                    {[
                        { id: "inquire", label: "Ask", icon: FaComments },
                        { id: "schedule", label: "Visit", icon: FaCalendarAlt },
                        { id: "apply", label: "Apply", icon: FaFileContract },
                    ].map((t) => {
                        const Icon = t.icon;
                        const active = view === t.id;
                        return (
                            <button
                                key={t.id}
                                onClick={() => setView(t.id)}
                                className={`flex-1 pb-3 px-2 relative font-semibold ${
                                    active ? "text-gray-900" : "text-gray-500"
                                }`}
                            >
                                <div className="flex items-center justify-center gap-2">
                                    <Icon className={`w-4 h-4`} />
                                    <span>{t.label}</span>
                                </div>
                                {active && (
                                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 to-emerald-600 rounded-full" />
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* ASK */}
                {view === "inquire" && (
                    <div className="space-y-4">
                        <div className="bg-gradient-to-br from-blue-50 to-emerald-50 p-4 rounded-xl border border-blue-200">
                            <p className="text-sm font-medium text-gray-900">
                                Have questions?
                            </p>
                            <p className="text-xs text-gray-600">
                                Send a message to the host for more details about this unit.
                            </p>
                        </div>

                        <ChatInquiry landlord_id={landlord_id} />
                    </div>
                )}

                {/* VISIT */}
                {view === "schedule" && (
                    <div className="space-y-5">
                        <Calendar
                            onChange={setSelectedDate}
                            value={selectedDate}
                            tileDisabled={isTileDisabled}
                            minDate={new Date()}
                        />

                        {selectedDate && (
                            <div className="space-y-4 animate-fadeIn">
                                <label className="block text-sm font-semibold mb-2">
                                    <FaClock className="w-4 h-4 inline-block mr-1 text-emerald-600" />
                                    Select time (8 AM - 8 PM)
                                </label>

                                <select
                                    value={selectedTime}
                                    onChange={handleTimeChange}
                                    className="w-full p-3.5 border-2 border-gray-300 rounded-xl"
                                >
                                    <option value="">Choose a time</option>

                                    {Array.from({ length: 25 })
                                        .map((_, i) => {
                                            const hour = Math.floor(i / 2) + 8;
                                            if (hour > 20) return null;

                                            const minute = i % 2 === 0 ? "00" : "30";
                                            const time = `${hour.toString().padStart(2, "0")}:${minute}`;
                                            const display = new Date(
                                                `2024-01-01T${time}`
                                            ).toLocaleTimeString("en-US", {
                                                hour: "numeric",
                                                minute: "2-digit",
                                                hour12: true,
                                            });

                                            return (
                                                <option key={time} value={time}>
                                                    {display}
                                                </option>
                                            );
                                        })
                                        .filter((v) => v !== null)}
                                </select>

                                {selectedTime && (
                                    <div className="p-4 bg-gradient-to-br from-emerald-50 to-blue-50 rounded-xl border-2 border-emerald-200">
                                        <p className="font-semibold text-sm">
                                            Visit scheduled for:
                                        </p>
                                        <p className="text-sm text-gray-700 font-medium mt-1">
                                            {getCombinedDateTime()}
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}

                        <div ref={confirmButtonRef}>
                            <button
                                disabled={!selectedDate || !selectedTime || loading}
                                onClick={handleJustSchedule}
                                className={`w-full py-3.5 rounded-xl text-sm font-bold transition ${
                                    selectedDate && selectedTime
                                        ? "bg-gradient-to-r from-blue-600 to-emerald-600 text-white"
                                        : "bg-gray-200 text-gray-400"
                                }`}
                            >
                                {loading ? "Scheduling..." : "Confirm visit"}
                            </button>
                        </div>
                    </div>
                )}

                {/* APPLY */}
                {view === "apply" && (
                    <div className="space-y-5">
                        <button
                            onClick={handleApplyNow}
                            className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-emerald-600 text-white rounded-xl font-bold shadow-lg"
                        >
                            Start application
                        </button>

                        <p className="text-xs text-gray-500 text-center">
                            By applying, you agree to provide accurate information.
                        </p>
                    </div>
                )}
            </div>
        </>
    );
}
