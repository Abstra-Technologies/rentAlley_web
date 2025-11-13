"use client";

import CalendarComponent from "react-calendar";
import "react-calendar/dist/Calendar.css";

export default function MaintenanceCalendarModal({
    selectedDate,
    setSelectedDate,
    handleScheduleConfirm,
    onClose,
}: {
    selectedDate: Date;
    setSelectedDate: (date: Date) => void;
    handleScheduleConfirm: () => void;
    onClose: () => void;
}) {
    // Extract hours & minutes from selected date
    const hours = selectedDate.getHours();
    const minutes = selectedDate.getMinutes();

    const handleTimeChange = (type: "hour" | "minute", value: string) => {
        const newDate = new Date(selectedDate);
        if (type === "hour") newDate.setHours(Number(value));
        if (type === "minute") newDate.setMinutes(Number(value));
        setSelectedDate(newDate);
    };

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
                <div className="p-4 sm:p-6 border-b border-gray-200">
                    <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                        Select Schedule Date & Time
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">
                        Choose when to start the maintenance work
                    </p>
                </div>

                <div className="p-4 sm:p-6">
                    <div className="flex justify-center mb-4">
                        <CalendarComponent
                            onChange={(date: any) => setSelectedDate(date)}
                            value={selectedDate}
                            className="rounded-lg border-0"
                        />
                    </div>

                    {/* TIME PICKER */}
                    <div className="grid grid-cols-2 gap-4 mt-2">
                        <div className="flex flex-col">
                            <label className="text-sm text-gray-700 mb-1">Hour</label>
                            <select
                                value={hours}
                                onChange={(e) => handleTimeChange("hour", e.target.value)}
                                className="border rounded-lg px-3 py-2"
                            >
                                {Array.from({ length: 24 }).map((_, i) => (
                                    <option key={i} value={i}>
                                        {i.toString().padStart(2, "0")}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="flex flex-col">
                            <label className="text-sm text-gray-700 mb-1">Minutes</label>
                            <select
                                value={minutes}
                                onChange={(e) => handleTimeChange("minute", e.target.value)}
                                className="border rounded-lg px-3 py-2"
                            >
                                {[0, 15, 30, 45].map((m) => (
                                    <option key={m} value={m}>
                                        {m.toString().padStart(2, "0")}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                <div className="p-4 sm:p-6 border-t border-gray-200 flex flex-col-reverse sm:flex-row gap-2">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors font-medium"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleScheduleConfirm}
                        className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-emerald-600 text-white rounded-lg hover:shadow-lg transition-all font-medium"
                    >
                        Confirm Schedule
                    </button>
                </div>
            </div>
        </div>
    );
}
