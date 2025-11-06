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
    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
                <div className="p-4 sm:p-6 border-b border-gray-200">
                    <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                        Select Schedule Date
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">
                        Choose when to start the maintenance work
                    </p>
                </div>
                <div className="p-4 sm:p-6">
                    <div className="flex justify-center mb-4">
                        <CalendarComponent
                            onChange={setSelectedDate}
                            value={selectedDate}
                            className="rounded-lg border-0"
                        />
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
