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
  const [view, setView] = useState("inquire");
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState("");
  const [bookedDates, setBookedDates] = useState({});
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { user } = useAuth();
  const confirmButtonRef = useRef(null);

  useEffect(() => {
    const fetchBookedDates = async () => {
      try {
        const response = await axios.get("/api/tenant/visits/booked-dates");
        setBookedDates(response.data.bookedDates);
      } catch (error) {
        console.error("Error fetching booked dates:", error);
      }
    };

    fetchBookedDates();
  }, []);

  useEffect(() => {
    // Scroll to confirm button when both date and time are selected
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
    // Format date in local timezone
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const formattedDate = `${year}-${month}-${day}`;

    const bookingInfo = bookedDates[formattedDate];
    return (bookingInfo && bookingInfo.count >= 1) || date < new Date();
  };

  const handleTimeChange = (e) => {
    const selected = e.target.value;
    const [hours] = selected.split(":").map(Number);

    if (hours < 8 || hours > 20) {
      Swal.fire({
        icon: "error",
        title: "Invalid Time",
        text: "Please select a time between 8 AM and 8 PM.",
        confirmButtonColor: "#3B82F6",
      });
      return;
    }
    setSelectedTime(selected);
  };

  const getCombinedDateTime = () => {
    if (!selectedDate || !selectedTime) return null;
    const [hours, minutes] = selectedTime.split(":");
    const updatedDate = new Date(selectedDate);
    updatedDate.setHours(parseInt(hours, 10), parseInt(minutes, 10));
    return updatedDate.toLocaleString("en-US", {
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
        text: "Please select both date and time.",
        confirmButtonColor: "#3B82F6",
      });
      return;
    }

    try {
      setLoading(true);

      // Format date in local timezone to avoid UTC conversion issues
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, "0");
      const day = String(selectedDate.getDate()).padStart(2, "0");
      const localDateString = `${year}-${month}-${day}`;

      console.log("Booking date (local):", localDateString); // For debugging

      const response = await axios.post(
        "/api/tenant/property-finder/schedVisitOnly",
        {
          tenant_id,
          unit_id,
          visit_date: localDateString,
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
      console.error("Error scheduling visit:", error);
      await Swal.fire({
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
          font-family: inherit !important;
          padding: 20px !important;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1) !important;
        }

        .react-calendar__navigation {
          height: 48px !important;
          margin-bottom: 20px !important;
          display: flex !important;
          align-items: center !important;
        }

        .react-calendar__navigation button {
          color: #111827 !important;
          font-weight: 600 !important;
          min-width: 48px !important;
          background: none !important;
          border: none !important;
          font-size: 16px !important;
          transition: all 0.2s !important;
        }

        .react-calendar__navigation button:hover {
          background: linear-gradient(to right, #eff6ff, #ecfdf5) !important;
          border-radius: 12px !important;
        }

        .react-calendar__month-view__weekdays {
          text-transform: uppercase !important;
          font-weight: 600 !important;
          font-size: 12px !important;
          color: #6b7280 !important;
          padding: 12px 0 !important;
          border-bottom: 1px solid #f3f4f6 !important;
          margin-bottom: 8px !important;
        }

        .react-calendar__tile {
          height: 48px !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          border-radius: 12px !important;
          font-weight: 500 !important;
          transition: all 0.2s !important;
          border: none !important;
          font-size: 14px !important;
          margin: 2px !important;
        }

        .react-calendar__tile:enabled:hover {
          background: linear-gradient(
            to bottom right,
            #dbeafe,
            #d1fae5
          ) !important;
          transform: scale(1.05) !important;
        }

        .react-calendar__tile--now {
          background: linear-gradient(
            to bottom right,
            #fef3c7,
            #fed7aa
          ) !important;
          color: #92400e !important;
          font-weight: 700 !important;
          border: 2px solid #fbbf24 !important;
        }

        .react-calendar__tile--active {
          background: linear-gradient(to right, #3b82f6, #10b981) !important;
          color: white !important;
          font-weight: 700 !important;
          box-shadow: 0 4px 6px -1px rgba(59, 130, 246, 0.3) !important;
          transform: scale(1.05) !important;
        }

        .react-calendar__tile--disabled {
          background: #fafafa !important;
          color: #d1d5db !important;
          cursor: not-allowed !important;
          opacity: 0.5 !important;
        }

        .react-calendar__month-view__days__day--weekend {
          color: inherit !important;
        }
      `}</style>

      <div className="bg-white border-2 border-gray-200 rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-shadow duration-300">
        {/* Price Header with Gradient */}
        <div className="pb-6 border-b-2 border-gray-100 mb-6">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">
              ₱{rent_amount?.toLocaleString()}
            </span>
            <span className="text-gray-600 font-medium">/ month</span>
          </div>
          <p className="text-xs text-gray-500 mt-2">Rent price per month</p>
        </div>

        {/* Enhanced Tab Navigation */}
        <div className="flex border-b-2 border-gray-100 mb-6 -mx-1">
          {[
            { id: "inquire", label: "Ask", icon: FaComments, color: "blue" },
            {
              id: "schedule",
              label: "Visit",
              icon: FaCalendarAlt,
              color: "emerald",
            },
            {
              id: "apply",
              label: "Apply",
              icon: FaFileContract,
              color: "purple",
            },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = view === tab.id;

            return (
              <button
                key={tab.id}
                className={`flex-1 pb-3 px-2 font-semibold text-sm transition-all duration-200 relative group ${
                  isActive
                    ? "text-gray-900"
                    : "text-gray-500 hover:text-gray-700"
                }`}
                onClick={() => setView(tab.id)}
              >
                <div className="flex items-center justify-center gap-2">
                  <Icon
                    className={`w-4 h-4 transition-transform ${
                      isActive ? "scale-110" : "group-hover:scale-110"
                    }`}
                  />
                  <span>{tab.label}</span>
                </div>
                {isActive && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 to-emerald-600 rounded-full"></div>
                )}
              </button>
            );
          })}
        </div>

        {/* Content */}
        {view === "inquire" && (
          <div className="space-y-4">
            <div className="bg-gradient-to-br from-blue-50 to-emerald-50 p-4 rounded-xl border border-blue-200">
              <div className="flex items-start gap-3">
                <FaInfoCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-900 mb-1">
                    Have questions?
                  </p>
                  <p className="text-xs text-gray-600">
                    Send a message to the host and get quick responses about
                    this property.
                  </p>
                </div>
              </div>
            </div>
            <ChatInquiry landlord_id={landlord_id} />
          </div>
        )}

        {view === "schedule" && (
          <div className="space-y-5">
            <div className="bg-gradient-to-br from-blue-50 to-emerald-50 p-3 rounded-xl border border-blue-200">
              <p className="text-xs text-gray-700 flex items-center gap-2">
                <FaInfoCircle className="w-4 h-4 text-blue-600" />
                Select your preferred date and time for a property visit
              </p>
            </div>

            <Calendar
              onChange={setSelectedDate}
              value={selectedDate}
              tileDisabled={isTileDisabled}
              minDate={new Date()}
            />

            {selectedDate && (
              <div className="space-y-4 animate-fadeIn">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <FaClock className="w-4 h-4 text-emerald-600" />
                    Select time (8 AM - 8 PM)
                  </label>
                  <select
                    value={selectedTime}
                    onChange={handleTimeChange}
                    className="w-full p-3.5 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm font-medium bg-white hover:border-gray-400"
                  >
                    <option value="">Choose a time</option>
                    {Array.from({ length: 25 }, (_, i) => {
                      const hour = Math.floor(i / 2) + 8;
                      const minute = i % 2 === 0 ? "00" : "30";
                      if (hour > 20) return null;
                      const time = `${hour
                        .toString()
                        .padStart(2, "0")}:${minute}`;
                      const displayTime = new Date(
                        `2024-01-01T${time}`
                      ).toLocaleTimeString("en-US", {
                        hour: "numeric",
                        minute: "2-digit",
                        hour12: true,
                      });
                      return (
                        <option key={time} value={time}>
                          {displayTime}
                        </option>
                      );
                    }).filter(Boolean)}
                  </select>
                </div>

                {selectedTime && (
                  <div className="p-4 bg-gradient-to-br from-emerald-50 to-blue-50 rounded-xl border-2 border-emerald-200 animate-fadeIn">
                    <div className="flex items-start gap-3">
                      <FaCheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-gray-900 mb-1">
                          Visit scheduled for:
                        </p>
                        <p className="text-sm text-gray-700 font-medium">
                          {getCombinedDateTime()}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div ref={confirmButtonRef}>
              <button
                className={`w-full py-3.5 rounded-xl transition-all duration-200 text-sm font-bold shadow-lg ${
                  selectedDate && selectedTime
                    ? "bg-gradient-to-r from-blue-600 to-emerald-600 text-white hover:from-blue-700 hover:to-emerald-700 hover:shadow-xl transform hover:-translate-y-0.5"
                    : "bg-gray-200 text-gray-400 cursor-not-allowed"
                }`}
                disabled={!selectedDate || !selectedTime || loading}
                onClick={handleJustSchedule}
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    <span>Scheduling...</span>
                  </div>
                ) : (
                  "Confirm visit"
                )}
              </button>
            </div>
          </div>
        )}

        {view === "apply" && (
          <div className="space-y-5">
            <div className="bg-gradient-to-br from-purple-50 to-blue-50 p-4 rounded-xl border-2 border-purple-200">
              <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                <FaFileContract className="w-5 h-5 text-purple-600" />
                What you'll need
              </h4>
              <ul className="space-y-2.5 text-sm text-gray-700">
                {[
                  "Valid government-issued ID",
                  "Employment details and references",
                  "Proof of income or financial statement",
                  "Current residential address",
                ].map((item, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-gradient-to-r from-blue-600 to-emerald-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <FaCheckCircle className="w-3 h-3 text-white" />
                    </div>
                    <span className="font-medium">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <button
              className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-emerald-600 text-white rounded-xl font-bold text-sm hover:from-blue-700 hover:to-emerald-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              onClick={handleApplyNow}
            >
              Start application
            </button>

            <p className="text-xs text-gray-500 text-center bg-gray-50 p-3 rounded-lg">
              By applying, you agree to provide accurate information and consent
              to background verification
            </p>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </>
  );
}
