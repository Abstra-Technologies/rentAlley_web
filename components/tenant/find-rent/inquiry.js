"use client";
import { useState, useEffect } from "react";
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
  FaHome,
  FaFileContract,
  FaEye,
  FaCheckCircle,
  FaArrowRight,
  FaComments,
  FaClipboardCheck,
  FaUserCheck,
  FaShieldAlt,
  FaIdCard,
  FaBriefcase,
  FaMoneyBillWave,
} from "react-icons/fa";
import { HiSparkles, HiLightningBolt } from "react-icons/hi";

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

  const isTileDisabled = ({ date, view }) => {
    if (view !== "month") return false;
    const formattedDate = date.toISOString().split("T")[0];
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
        confirmButtonColor: "#10B981",
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
        confirmButtonColor: "#10B981",
      });
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post(
        "/api/tenant/property-finder/schedVisitOnly",
        {
          tenant_id,
          unit_id,
          visit_date: selectedDate.toISOString().split("T")[0],
          visit_time: `${selectedTime}:00`,
        }
      );

      if (response.status === 200) {
        await Swal.fire({
          icon: "success",
          title: "Visit Scheduled",
          text: "Visit scheduled successfully!",
          confirmButtonColor: "#10B981",
        });
        router.push("/pages/find-rent");
      }
    } catch (error) {
      console.error("Error scheduling visit:", error);
      await Swal.fire({
        icon: "error",
        title: "Scheduling Error",
        text: "Failed to schedule visit. Please try again.",
        confirmButtonColor: "#10B981",
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

  const tabs = [
    {
      id: "inquire",
      label: "Ask",
      icon: FaComments,
      color: "from-blue-500 to-blue-600",
    },
    {
      id: "schedule",
      label: "Visit",
      icon: FaCalendarAlt,
      color: "from-emerald-500 to-emerald-600",
    },
    {
      id: "apply",
      label: "Apply",
      icon: FaFileContract,
      color: "from-blue-600 to-emerald-600",
    },
  ];

  return (
    <>
      <style jsx global>{`
        .react-calendar {
          width: 100% !important;
          border: none !important;
          border-radius: 1rem !important;
          background: white !important;
          font-family: inherit !important;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1) !important;
        }

        .react-calendar__navigation {
          height: 48px !important;
          margin-bottom: 0.75rem !important;
          background: linear-gradient(to right, #3b82f6, #10b981) !important;
          border-radius: 0.75rem !important;
          padding: 0 0.5rem !important;
        }

        .react-calendar__navigation button {
          color: white !important;
          font-weight: 600 !important;
          min-width: 40px !important;
          font-size: 1rem !important;
          background: none !important;
          border: none !important;
        }

        .react-calendar__navigation button:hover {
          background: rgba(255, 255, 255, 0.1) !important;
          border-radius: 0.5rem !important;
        }

        .react-calendar__navigation button:disabled {
          opacity: 0.5 !important;
        }

        .react-calendar__month-view__weekdays {
          text-transform: uppercase !important;
          font-weight: 700 !important;
          font-size: 0.7rem !important;
          color: #6b7280 !important;
          padding: 0.75rem 0 !important;
        }

        .react-calendar__month-view__weekdays__weekday {
          text-align: center !important;
        }

        .react-calendar__tile {
          height: 48px !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          border-radius: 0.5rem !important;
          font-weight: 500 !important;
          transition: all 0.2s !important;
          border: none !important;
        }

        .react-calendar__tile:enabled:hover {
          background: linear-gradient(
            135deg,
            #dbeafe 0%,
            #d1fae5 100%
          ) !important;
          transform: scale(1.05) !important;
        }

        .react-calendar__tile--now {
          background: linear-gradient(
            135deg,
            #fef3c7 0%,
            #fde68a 100%
          ) !important;
          color: #92400e !important;
          font-weight: 700 !important;
        }

        .react-calendar__tile--active {
          background: linear-gradient(
            135deg,
            #3b82f6 0%,
            #10b981 100%
          ) !important;
          color: white !important;
          font-weight: 700 !important;
          box-shadow: 0 4px 6px -1px rgba(59, 130, 246, 0.3) !important;
        }

        .react-calendar__tile--active:hover {
          background: linear-gradient(
            135deg,
            #2563eb 0%,
            #059669 100%
          ) !important;
        }

        .react-calendar__tile--disabled {
          background: #f9fafb !important;
          color: #d1d5db !important;
          cursor: not-allowed !important;
        }

        .react-calendar__month-view__days__day--weekend {
          color: #dc2626 !important;
        }

        .react-calendar__viewContainer {
          padding: 0.5rem !important;
        }

        @media (max-width: 640px) {
          .react-calendar__tile {
            height: 40px !important;
            font-size: 0.875rem !important;
          }

          .react-calendar__navigation {
            height: 44px !important;
          }
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideDown {
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
          animation: fadeIn 0.4s ease-out;
        }

        .animate-slideDown {
          animation: slideDown 0.3s ease-out;
        }
      `}</style>

      <div className="w-full bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        {/* Animated Header */}
        <div className="relative bg-gradient-to-r from-blue-600 via-blue-500 to-emerald-500 px-4 sm:px-6 py-6 text-white overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-emerald-400/20 animate-pulse"></div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12"></div>

          <div className="relative text-center">
            <div className="inline-flex items-center gap-2 mb-2">
              <HiSparkles className="text-yellow-300 text-xl animate-bounce" />
              <p className="text-white/90 text-sm font-semibold uppercase tracking-wider">
                Monthly Rent
              </p>
              <HiSparkles className="text-yellow-300 text-xl animate-bounce" />
            </div>
            <p className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-1">
              ₱{rent_amount?.toLocaleString()}
            </p>
            <p className="text-white/80 text-sm">per month</p>
          </div>
        </div>

        {/* Enhanced Tab Navigation */}
        <div className="bg-gray-50 border-b border-gray-200 px-2 pt-2">
          <div className="flex gap-1 sm:gap-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = view === tab.id;

              return (
                <button
                  key={tab.id}
                  className={`flex-1 relative py-3 sm:py-4 px-2 sm:px-4 font-semibold text-xs sm:text-sm transition-all duration-300 rounded-t-xl ${
                    isActive
                      ? "bg-white text-transparent bg-clip-text bg-gradient-to-r " +
                        tab.color +
                        " shadow-lg transform scale-105"
                      : "text-gray-600 hover:text-gray-900 hover:bg-white/50"
                  }`}
                  onClick={() => setView(tab.id)}
                >
                  {isActive && (
                    <div
                      className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${tab.color} rounded-t-full`}
                    ></div>
                  )}
                  <div className="flex items-center justify-center gap-1.5 sm:gap-2">
                    <Icon
                      className={`text-sm sm:text-base ${
                        isActive ? "text-blue-600" : ""
                      }`}
                    />
                    <span className="hidden xs:inline">{tab.label}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Content Area */}
        <div className="p-4 sm:p-6">
          {view === "inquire" && (
            <div className="space-y-4 sm:space-y-6 animate-fadeIn">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-blue-100 to-emerald-100 rounded-2xl mb-3 sm:mb-4">
                  <FaComments className="text-2xl sm:text-3xl text-blue-600" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-2">
                  Have Questions?
                </h3>
                <p className="text-sm text-gray-600 max-w-md mx-auto">
                  Chat directly with the landlord to get instant answers about
                  this property
                </p>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-emerald-50 rounded-xl p-4 border border-blue-100">
                <div className="flex items-start gap-3 mb-3">
                  <HiLightningBolt className="text-blue-600 text-xl flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-gray-800 text-sm mb-1">
                      Quick Response
                    </h4>
                    <p className="text-xs text-gray-600">
                      Get answers within minutes from verified landlords
                    </p>
                  </div>
                </div>
              </div>

              <ChatInquiry landlord_id={landlord_id} />
            </div>
          )}

          {view === "schedule" && (
            <div className="space-y-4 sm:space-y-6 animate-fadeIn">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-emerald-100 to-blue-100 rounded-2xl mb-3 sm:mb-4">
                  <FaEye className="text-2xl sm:text-3xl text-emerald-600" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-2">
                  Schedule Your Visit
                </h3>
                <p className="text-sm text-gray-600 max-w-md mx-auto">
                  Book a convenient time to view this property in person
                </p>
              </div>

              <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-3 sm:p-4 border-2 border-gray-100">
                <Calendar
                  onChange={setSelectedDate}
                  value={selectedDate}
                  tileDisabled={isTileDisabled}
                  minDate={new Date()}
                />
              </div>

              {selectedDate && (
                <div className="space-y-4 animate-slideDown">
                  <div className="bg-white rounded-xl p-4 border-2 border-emerald-100 shadow-sm">
                    <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-3">
                      <FaClock className="text-emerald-500" />
                      Select Time (8 AM - 8 PM)
                    </label>

                    <select
                      value={selectedTime}
                      onChange={handleTimeChange}
                      className="w-full p-3 sm:p-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white transition-all text-sm sm:text-base font-medium"
                    >
                      <option value="">Choose your preferred time</option>
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
                    <div className="bg-gradient-to-r from-emerald-50 to-blue-50 rounded-xl p-4 border-2 border-emerald-200 animate-fadeIn">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-blue-500 flex items-center justify-center flex-shrink-0">
                          <FaCheckCircle className="text-white text-lg" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-bold text-gray-800 mb-1">
                            Visit Confirmed For:
                          </p>
                          <p className="text-sm text-gray-700 font-medium leading-relaxed">
                            {getCombinedDateTime()}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <button
                className={`w-full py-3 sm:py-4 rounded-xl transition-all duration-300 text-sm sm:text-base font-bold shadow-lg ${
                  selectedDate && selectedTime
                    ? "bg-gradient-to-r from-emerald-500 to-blue-500 text-white hover:from-emerald-600 hover:to-blue-600 transform hover:scale-[1.02] hover:shadow-xl"
                    : "bg-gray-200 text-gray-400 cursor-not-allowed"
                }`}
                disabled={!selectedDate || !selectedTime || loading}
                onClick={handleJustSchedule}
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                    <span>Scheduling Visit...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <FaCalendarAlt />
                    <span>Confirm Visit Schedule</span>
                  </div>
                )}
              </button>
            </div>
          )}

          {view === "apply" && (
            <div className="space-y-4 sm:space-y-6 animate-fadeIn">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-blue-100 to-emerald-100 rounded-3xl mb-4 shadow-lg">
                  <FaHome className="text-3xl sm:text-4xl text-emerald-600" />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-3">
                  Ready to Apply?
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed max-w-md mx-auto">
                  Take the first step towards making this your new home
                </p>
              </div>

              <div className="bg-gradient-to-br from-emerald-50 to-blue-50 rounded-xl p-4 sm:p-5 border-2 border-emerald-200">
                <h4 className="font-bold text-emerald-800 mb-4 flex items-center gap-2 text-sm sm:text-base">
                  <FaClipboardCheck className="text-lg" />
                  Application Process
                </h4>
                <div className="space-y-3">
                  {[
                    { icon: FaUserCheck, text: "Complete your tenant profile" },
                    { icon: FaIdCard, text: "Upload valid ID" },
                    { icon: FaBriefcase, text: "Provide employment details" },
                    { icon: FaShieldAlt, text: "Get priority review" },
                  ].map((item, index) => (
                    <div key={index} className="flex items-start gap-3 group">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-blue-500 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                        <item.icon className="text-white text-sm" />
                      </div>
                      <span className="text-sm text-gray-700 font-medium mt-1">
                        {item.text}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-gradient-to-r from-blue-50 to-emerald-50 rounded-xl p-4 border border-blue-200">
                <h4 className="font-bold text-blue-800 mb-3 text-sm sm:text-base flex items-center gap-2">
                  <FaMoneyBillWave />
                  Requirements Checklist
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm text-blue-700">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                    <span>Valid ID</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                    <span>Occupation</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                    <span>Income Range</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                    <span>Current Address</span>
                  </div>
                </div>
              </div>

              <button
                className="w-full py-4 sm:py-5 bg-gradient-to-r from-blue-600 to-emerald-600 text-white rounded-xl font-bold text-sm sm:text-base hover:from-blue-700 hover:to-emerald-700 transform hover:scale-[1.02] transition-all duration-300 shadow-xl hover:shadow-2xl flex items-center justify-center gap-2 group"
                onClick={handleApplyNow}
              >
                <FaFileContract className="text-lg group-hover:rotate-12 transition-transform" />
                <span>Start Your Application</span>
                <FaArrowRight className="text-lg group-hover:translate-x-1 transition-transform" />
              </button>

              <p className="text-xs text-gray-500 text-center leading-relaxed px-4">
                By applying, you agree to provide accurate information. False
                details may result in rejection.
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
