"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import Swal from "sweetalert2";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import ChatInquiry from "./chatInquiry";
import useAuth from "../../../hooks/useSession";

const customCalendarStyles = `
  .react-calendar__tile--disabled {
    background-color: #f0f0f0 !important;
    color: #999 !important;
    cursor: not-allowed !important;
    opacity: 0.6;
  }
`;

export default function InquiryBooking({
  tenant_id,
  unit_id,
  rent_amount,
  landlord_id,
}) {
  const [view, setView] = useState("inquire");
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [bookedDates, setBookedDates] = useState({});
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { user } = useAuth();

  // Fetch booked dates when the component mounts
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
    if (view !== 'month') return false;
  
    const formattedDate = date.toISOString().split('T')[0];
    const bookingInfo = bookedDates[formattedDate];
    
    // Disable date if it has 1
    return (bookingInfo && bookingInfo.count >= 1) || date < new Date();
  };

  const handleTimeChange = (e) => {
    const selected = e.target.value;
    const [hours] = selected.split(":").map(Number);
    
    if (hours < 8 || hours > 20) {
      Swal.fire({
        icon: 'error',
        title: 'Invalid Time',
        text: 'Please select a time between 8 AM and 8 PM.',
        confirmButtonColor: '#3085d6'
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

    return updatedDate.toLocaleString('en-US', {
      dateStyle: 'full',
      timeStyle: 'short'
    });
  };

  const handleScheduleVisit = () => {
    setShowModal(true);
  };

  const handleApplyAsTenant = async (e) => {
    e.preventDefault();
    setShowModal(false);

    if (!selectedDate || !selectedTime) {
      Swal.fire({
        icon: 'error',
        title: 'Incomplete Selection',
        text: 'Please select both date and time.',
        confirmButtonColor: '#3085d6'
      });
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post("/api/tenant/visits/schedule-visit", {
        tenant_id,
        unit_id,
        visit_date: selectedDate.toISOString().split('T')[0],
        visit_time: `${selectedTime}:00`,
      });

      if (response.status === 200) {
        await Swal.fire({
          icon: 'success',
          title: 'Visit Scheduled',
          text: 'Visit scheduled successfully! Redirecting to Tenant Application...',
          confirmButtonColor: '#3085d6'
        });

        router.push(unit_id ? `/pages/tenant/prospective/${unit_id}` : '/pages/find-rent');
      }
    } catch (error) {
      console.error("Error scheduling visit:", error);
      Swal.fire({
        icon: 'error',
        title: 'Scheduling Error',
        text: 'Failed to schedule visit. Please try again.',
        confirmButtonColor: '#3085d6'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleJustSchedule = async (e) => {
    e.preventDefault();

    if (!selectedDate || !selectedTime) {
      Swal.fire({
        icon: 'error',
        title: 'Incomplete Selection',
        text: 'Please select both date and time.',
        confirmButtonColor: '#3085d6'
      });
      return;
    }

    try {
      setShowModal(false);
      setLoading(true);

      const response = await axios.post("/api/tenant/visits/schedule-visit", {
        tenant_id,
        unit_id,
        visit_date: selectedDate.toISOString().split('T')[0],
        visit_time: `${selectedTime}:00`,
      });

      if (response.status === 200) {
        await Swal.fire({
          icon: 'success',
          title: 'Visit Scheduled',
          text: 'Visit scheduled successfully!',
          confirmButtonColor: '#3085d6'
        });
        router.push('/pages/find-rent');
      }
    } catch (error) {
      console.error("Error scheduling visit:", error);
      await Swal.fire({
        icon: 'error',
        title: 'Scheduling Error',
        text: 'Failed to schedule visit. Please try again.',
        confirmButtonColor: '#3085d6'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-sm mx-auto p-6 border rounded-lg shadow-lg bg-white">
      {/* Custom Calendar Styles */}
      <style>{customCalendarStyles}</style>
  
      {/* View Toggle Buttons */}
      <div className="flex mb-6">
        <button
          className={`flex-1 py-3 font-semibold rounded-l-lg transition-colors ${
            view === "inquire" 
              ? "bg-blue-900 text-white" 
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
          onClick={() => setView("inquire")}
        >
          Inquire
        </button>
        <button
          className={`flex-1 py-3 font-semibold rounded-r-lg transition-colors ${
            view === "schedule" 
              ? "bg-blue-900 text-white" 
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
          onClick={() => setView("schedule")}
        >
          Schedule a Visit
        </button>
      </div>
  
      {view === "inquire" && (
        <div className="space-y-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-600 mb-1">Monthly Rent</p>
            <p className="text-3xl font-bold text-blue-900">₱{rent_amount}</p>
          </div>
          <ChatInquiry landlord_id={landlord_id} />
        </div>
      )}
  
      {view === "schedule" && (
        <div className="space-y-5">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <p className="text-sm font-medium text-blue-900">
              Select a date and time to schedule a visit
            </p>
          </div>
          
          <Calendar
            onChange={setSelectedDate}
            value={selectedDate}
            tileDisabled={isTileDisabled}
            className="w-full border rounded-md custom-calendar shadow-sm"
            minDetail="month"
            minDate={new Date()}
          />
  
          {selectedDate && (
            <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
              <label className="block text-sm font-semibold text-gray-700">
                Select Time:
              </label>
              
              <div className="flex space-x-2">
                <select
                  value={selectedTime}
                  onChange={handleTimeChange}
                  className="w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-900 focus:border-blue-900 bg-white"
                >
                  <option value="">Select a time</option>
                  {Array.from({ length: 19 }, (_, i) => {
                    const hour = Math.floor(i / 2) + 8;
                    const minute = i % 2 === 0 ? "00" : "30";
                    const time = `${hour.toString().padStart(2, '0')}:${minute}`;
                    return <option key={time} value={time}>{time}</option>;
                  })}
                </select>
              </div>
  
              {selectedTime && (
                <div className="mt-2 p-3 bg-blue-100 rounded-lg">
                  <p className="text-sm font-medium text-blue-900">
                    Selected: {getCombinedDateTime()}
                  </p>
                </div>
              )}
            </div>
          )}
  
          <button
            className={`w-full py-3 rounded-lg transition-colors text-lg font-medium ${
              selectedDate && selectedTime
                ? "bg-blue-900 text-white hover:bg-blue-800"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
            disabled={!selectedDate || !selectedTime}
            onClick={handleScheduleVisit}
          >
            Schedule a Visit
          </button>
        </div>
      )}
  
      {/* Modal for Confirmation */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-96 space-y-5">
            <h2 className="text-xl font-bold text-center text-blue-900">
              Proceed with Rental Application?
            </h2>
  
            <div className="space-y-3">
              <button
                className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                onClick={handleApplyAsTenant}
              >
                Yes, I want to apply
              </button>
  
              <button
                className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                onClick={handleJustSchedule}
              >
                Just schedule a visit
              </button>
  
              <button
                className="w-full py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                onClick={() => setShowModal(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}