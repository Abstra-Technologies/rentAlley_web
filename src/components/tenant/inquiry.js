"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import axios from "axios";

export default function InquiryBooking({ tenant_id, property_id, unit_id }) {
  const [view, setView] = useState("inquire");
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Handle time change
  const handleTimeChange = (e) => {
    setSelectedTime(e.target.value);
  };

  // Combine Date and Time into a single Date object
  const getCombinedDateTime = () => {
    if (!selectedDate || !selectedTime) return null;

    const [hours, minutes] = selectedTime.split(":");
    const updatedDate = new Date(selectedDate);
    updatedDate.setHours(parseInt(hours, 10), parseInt(minutes, 10));

    return updatedDate.toLocaleString(); // Format the date & time
  };

  // Handle scheduling a visit

  const handleScheduleVisit = () => {
    setShowModal(true);
  };

  // Proceed to apply as a tenant
  const handleApplyAsTenant = async (e) => {
    e.preventDefault();
    setShowModal(false);

    if (!selectedDate || !selectedTime) {
      alert("Please select both date and time.");
      return;
    } else if (!tenant_id) {
      alert("Please log in.");
      return;
    }

    try {
      setLoading(true);

      const formattedTime = selectedTime.includes(":")
        ? `${selectedTime}:00`
        : selectedTime;

      console.log({
        tenant_id,
        property_id,
        unit_id,
        visit_date: selectedDate,
        visit_time: formattedTime.toString(),
      });

      const response = await axios.post("/api/tenant/visits/schedule-visit", {
        tenant_id,
        property_id,
        unit_id,
        visit_date: selectedDate,
        visit_time: formattedTime,
      });

      if (response.status === 200) {
        alert("Visit scheduled successfully!");
        router.push(`/pages/find-rent/${property_id}`);
      }
    } catch (error) {
      console.error("Error scheduling visit:", error);
      setError("Failed to schedule visit. Please try again.");
    } finally {
      setLoading(false);
    }

    router.push(`/pages/tenant/prospective/${property_id}`);
  };

  // Just schedule the visit without applying as a tenant
  const handleJustSchedule = async (e) => {
    e.preventDefault();

    if (!selectedDate || !selectedTime) {
      alert("Please select both date and time.");
      return;
    } else if (!tenant_id) {
      alert("Please log in.");
      return;
    }

    try {
      setShowModal(false);
      setLoading(true);

      const formattedTime = selectedTime.includes(":")
        ? `${selectedTime}:00`
        : selectedTime;

      console.log({
        tenant_id,
        property_id,
        unit_id,
        visit_date: selectedDate,
        visit_time: formattedTime.toString(),
      });

      const response = await axios.post("/api/tenant/visits/schedule-visit", {
        tenant_id,
        property_id,
        unit_id,
        visit_date: selectedDate,
        visit_time: formattedTime,
      });

      if (response.status === 200) {
        alert("Visit scheduled successfully!");
        router.push(`/pages/find-rent/${property_id}`);
      }
    } catch (error) {
      console.error("Error scheduling visit:", error);
      setError("Failed to schedule visit. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-sm p-4 border rounded-lg shadow-md bg-white">
      <button
        className={`w-full py-2 text-white font-semibold rounded ${
          view === "inquire" ? "bg-blue-900" : "bg-gray-200"
        }`}
        onClick={() => setView("inquire")}
      >
        Inquire
      </button>
      <button
        className={`w-full py-2 mt-2 font-semibold rounded ${
          view === "schedule" ? "bg-blue-900 text-white" : "bg-gray-200"
        }`}
        onClick={() => setView("schedule")}
      >
        Schedule a Visit
      </button>

      <div className="mt-4 text-center">
        <p className="text-xl font-bold">P10,000 / P108,000</p>
        <p className="text-gray-600">monthly / yearly</p>
      </div>

      {view === "inquire" && (
        <div className="mt-4">
          <textarea
            className="w-full p-2 border rounded-md"
            placeholder="ex. Is there any discounts?"
          ></textarea>
          <div className="mt-2 flex items-center">
            <input type="checkbox" className="mr-2" />
            <p className="text-xs">
              I have read and agreed to the{" "}
              <a href="#" className="text-blue-600">
                Terms
              </a>
              ,
              <a href="#" className="text-blue-600">
                {" "}
                Privacy Policy
              </a>
              , and
              <a href="#" className="text-blue-600">
                {" "}
                Safety Guidelines
              </a>
              .
            </p>
          </div>
          <button className="w-full mt-2 bg-blue-700 text-white py-2 rounded">
            Send Message
          </button>
        </div>
      )}

      {view === "schedule" && (
        <div className="mt-4">
          <p className="text-sm text-blue-600">
            Select a date and time to schedule a visit.
          </p>
          <Calendar
            onChange={(date) => setSelectedDate(date)}
            value={selectedDate}
            className="mt-2 w-full border rounded-md"
          />

          {selectedDate && (
            <div className="mt-4">
              <label className="block text-sm font-semibold">
                Select Time:
              </label>
              <input
                type="time"
                value={selectedTime}
                onChange={handleTimeChange}
                className="w-full p-2 mt-2 border rounded-md"
              />
            </div>
          )}

          {selectedDate && selectedTime && (
            <div className="mt-4 p-3 bg-gray-200 rounded-lg shadow">
              <p className="text-sm font-semibold text-gray-700">
                Selected: {getCombinedDateTime()}
              </p>
            </div>
          )}

          <button
            className={`w-full mt-4 py-2 rounded ${
              selectedDate && selectedTime
                ? "bg-blue-900 text-white"
                : "bg-gray-300 text-gray-500"
            }`}
            disabled={!selectedDate || !selectedTime}
            onClick={handleScheduleVisit}
          >
            Schedule a Visit
          </button>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96">
            <h2 className="text-lg font-bold mb-4">
              Do you want to proceed to applying as a tenant?
            </h2>

            <div className="flex justify-center gap-4 mb-4">
              <button
                className="px-4 py-2 bg-green-600 text-white rounded"
                onClick={handleApplyAsTenant}
              >
                Yes
              </button>

              <button
                className="px-4 py-2 bg-red-600 text-white rounded"
                onClick={() => setShowModal(false)}
              >
                No
              </button>
            </div>

            <p
              className="text-blue-600 underline cursor-pointer text-center"
              onClick={handleJustSchedule}
            >
              No, I just want to schedule a visit.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
