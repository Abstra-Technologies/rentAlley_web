"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Calendar, Clock, ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

// ============================================
// ANIMATION VARIANTS
// ============================================
const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

const modalVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: "spring", stiffness: 300, damping: 25 },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 20,
    transition: { duration: 0.2 },
  },
};

// ============================================
// SIMPLE CALENDAR COMPONENT (No external deps)
// ============================================
interface SimpleCalendarProps {
  selectedDate: Date;
  onSelect: (date: Date) => void;
}

function SimpleCalendar({ selectedDate, onSelect }: SimpleCalendarProps) {
  const [viewDate, setViewDate] = useState(new Date(selectedDate));

  const daysInMonth = new Date(
    viewDate.getFullYear(),
    viewDate.getMonth() + 1,
    0
  ).getDate();

  const firstDayOfMonth = new Date(
    viewDate.getFullYear(),
    viewDate.getMonth(),
    1
  ).getDay();

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const prevMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  };

  const handleDateClick = (day: number) => {
    const newDate = new Date(selectedDate);
    newDate.setFullYear(viewDate.getFullYear());
    newDate.setMonth(viewDate.getMonth());
    newDate.setDate(day);
    onSelect(newDate);
  };

  const isToday = (day: number) => {
    const today = new Date();
    return (
      day === today.getDate() &&
      viewDate.getMonth() === today.getMonth() &&
      viewDate.getFullYear() === today.getFullYear()
    );
  };

  const isSelected = (day: number) => {
    return (
      day === selectedDate.getDate() &&
      viewDate.getMonth() === selectedDate.getMonth() &&
      viewDate.getFullYear() === selectedDate.getFullYear()
    );
  };

  const isPast = (day: number) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkDate = new Date(
      viewDate.getFullYear(),
      viewDate.getMonth(),
      day
    );
    return checkDate < today;
  };

  // Generate calendar grid
  const days = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(<div key={`empty-${i}`} className="h-10" />);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    const past = isPast(day);
    days.push(
      <motion.button
        key={day}
        whileHover={!past ? { scale: 1.1 } : {}}
        whileTap={!past ? { scale: 0.95 } : {}}
        onClick={() => !past && handleDateClick(day)}
        disabled={past}
        className={`h-10 w-10 rounded-xl flex items-center justify-center text-sm font-medium transition-all duration-200 ${
          isSelected(day)
            ? "bg-gradient-to-r from-blue-600 to-emerald-600 text-white shadow-lg shadow-blue-500/30"
            : isToday(day)
            ? "bg-blue-50 text-blue-600 border-2 border-blue-200"
            : past
            ? "text-gray-300 cursor-not-allowed"
            : "text-gray-700 hover:bg-gray-100"
        }`}
      >
        {day}
      </motion.button>
    );
  }

  return (
    <div className="select-none">
      {/* Month Navigation */}
      <div className="flex items-center justify-between mb-4">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={prevMonth}
          className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </motion.button>

        <h3 className="font-semibold text-gray-900">
          {monthNames[viewDate.getMonth()]} {viewDate.getFullYear()}
        </h3>

        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={nextMonth}
          className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
        >
          <ChevronRight className="w-5 h-5 text-gray-600" />
        </motion.button>
      </div>

      {/* Day Names */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {dayNames.map((day) => (
          <div
            key={day}
            className="h-10 flex items-center justify-center text-xs font-semibold text-gray-400 uppercase"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-1">{days}</div>
    </div>
  );
}

// ============================================
// TIME PICKER COMPONENT
// ============================================
interface TimePickerProps {
  selectedDate: Date;
  onTimeChange: (date: Date) => void;
}

function TimePicker({ selectedDate, onTimeChange }: TimePickerProps) {
  const hours = selectedDate.getHours();
  const minutes = selectedDate.getMinutes();

  const handleHourChange = (newHour: number) => {
    const newDate = new Date(selectedDate);
    newDate.setHours(newHour);
    onTimeChange(newDate);
  };

  const handleMinuteChange = (newMinute: number) => {
    const newDate = new Date(selectedDate);
    newDate.setMinutes(newMinute);
    onTimeChange(newDate);
  };

  // Quick time slots
  const quickSlots = [
    { label: "9:00 AM", hour: 9, minute: 0 },
    { label: "12:00 PM", hour: 12, minute: 0 },
    { label: "2:00 PM", hour: 14, minute: 0 },
    { label: "5:00 PM", hour: 17, minute: 0 },
  ];

  const isSlotSelected = (slot: { hour: number; minute: number }) => {
    return hours === slot.hour && minutes === slot.minute;
  };

  return (
    <div className="space-y-4">
      {/* Quick Time Slots */}
      <div>
        <p className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">
          Quick Select
        </p>
        <div className="grid grid-cols-4 gap-2">
          {quickSlots.map((slot) => (
            <motion.button
              key={slot.label}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                const newDate = new Date(selectedDate);
                newDate.setHours(slot.hour);
                newDate.setMinutes(slot.minute);
                onTimeChange(newDate);
              }}
              className={`py-2 px-3 rounded-xl text-xs font-medium transition-all duration-200 ${
                isSlotSelected(slot)
                  ? "bg-gradient-to-r from-blue-600 to-emerald-600 text-white shadow-lg"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {slot.label}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Manual Time Selection */}
      <div>
        <p className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">
          Or Set Manually
        </p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-600 mb-1 block">Hour</label>
            <select
              value={hours}
              onChange={(e) => handleHourChange(Number(e.target.value))}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
            >
              {Array.from({ length: 24 }).map((_, i) => (
                <option key={i} value={i}>
                  {i.toString().padStart(2, "0")}:00 {i < 12 ? "AM" : "PM"}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs text-gray-600 mb-1 block">Minute</label>
            <select
              value={minutes}
              onChange={(e) => handleMinuteChange(Number(e.target.value))}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
            >
              {[0, 15, 30, 45].map((m) => (
                <option key={m} value={m}>
                  :{m.toString().padStart(2, "0")}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// MAIN MODAL COMPONENT
// ============================================
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
  const formatSelectedDateTime = () => {
    return selectedDate.toLocaleString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  return (
    <AnimatePresence>
      <motion.div
        variants={backdropVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      >
        <motion.div
          variants={modalVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
        >
          {/* Header */}
          <div className="p-5 bg-gradient-to-r from-blue-600 to-emerald-600 text-white relative overflow-hidden">
            {/* Decorative Elements */}
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full" />
            <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-white/10 rounded-full" />

            <div className="relative">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold">Schedule Work</h2>
                    <p className="text-sm text-white/80">
                      Pick a date and time
                    </p>
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={onClose}
                  className="p-2 hover:bg-white/20 rounded-xl transition-colors"
                >
                  <X className="w-5 h-5" />
                </motion.button>
              </div>
            </div>
          </div>

          {/* Selected DateTime Preview */}
          <div className="px-5 py-3 bg-gradient-to-r from-blue-50 to-emerald-50 border-b border-gray-100">
            <div className="flex items-center gap-2 text-sm">
              <Clock className="w-4 h-4 text-blue-600" />
              <span className="text-gray-600">Selected:</span>
              <span className="font-semibold text-gray-900">
                {formatSelectedDateTime()}
              </span>
            </div>
          </div>

          {/* Body */}
          <div className="p-5 space-y-6 max-h-[60vh] overflow-y-auto">
            {/* Calendar */}
            <div>
              <SimpleCalendar
                selectedDate={selectedDate}
                onSelect={setSelectedDate}
              />
            </div>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                Time
              </span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            {/* Time Picker */}
            <TimePicker
              selectedDate={selectedDate}
              onTimeChange={setSelectedDate}
            />
          </div>

          {/* Footer */}
          <div className="p-5 border-t border-gray-100 bg-gray-50/50 flex flex-col-reverse sm:flex-row gap-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl transition-all font-medium text-sm"
            >
              Cancel
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleScheduleConfirm}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-emerald-600 text-white rounded-xl hover:shadow-lg hover:shadow-blue-500/25 transition-all font-semibold text-sm"
            >
              Confirm Schedule
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
