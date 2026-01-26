"use client";

import useSWR from "swr";
import axios from "axios";
import { Calendar, Clock } from "lucide-react";
import {
  CARD_CONTAINER,
  CARD_HOVER,
  SECTION_HEADER,
  GRADIENT_DOT,
  SECTION_TITLE,
  GRADIENT_TEXT,
  GRADIENT_BG_LIGHT,
  EMPTY_STATE_ICON,
} from "@/constant/design-constants";

export default function TodayCalendar({ landlordId }) {
  const fetcher = (url: string) => axios.get(url).then((res) => res.data);

  const { data, isLoading } = useSWR(
    landlordId
      ? `/api/landlord/propertyVisits/today-events?landlord_id=${landlordId}`
      : null,
    fetcher,
  );

  const today = new Date();

  const monthYear = today.toLocaleString("en-US", {
    month: "long",
    year: "numeric",
  });

  const dayNumber = today.toLocaleString("en-US", {
    day: "2-digit",
  });

  const weekday = today.toLocaleString("en-US", {
    weekday: "long",
  });

  const visits = data?.propertyVisits || [];
  const maintenance = data?.maintenanceRequests || [];

  const events = [
    ...visits.map((v) => ({
      type: "Property Visit",
      label: `${v.unit_name} — ${v.visit_time}`,
      status: v.status,
    })),
    ...maintenance.map((m) => ({
      type: "Maintenance",
      label: `${m.unit_name} — ${m.subject}`,
      status: m.status,
    })),
  ];

  return (
    <div
      className={`${CARD_CONTAINER} ${CARD_HOVER} min-h-[480px] flex flex-col`}
    >
      {/* Header */}
      <div className={`${SECTION_HEADER} mb-4`}>
        <div className={GRADIENT_DOT}></div>
        <h2 className={SECTION_TITLE}>Today's Schedule</h2>
      </div>

      {/* Date Display */}
      <div className="text-center mb-6">
        <p className="text-sm text-gray-600 mb-1">{monthYear}</p>
        <p className={`text-4xl md:text-5xl font-bold ${GRADIENT_TEXT} mb-1`}>
          {dayNumber}
        </p>
        <p className="text-xs text-gray-500">{weekday}</p>
      </div>

      {/* Events Section */}
      <div className="space-y-3 flex-1 flex flex-col">
        <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
          <Calendar className="w-4 h-4 text-blue-600" />
          <h3 className="text-sm font-semibold text-gray-900">Events</h3>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="space-y-2 animate-pulse">
            <div className="h-16 bg-gray-100 rounded-lg"></div>
            <div className="h-16 bg-gray-100 rounded-lg"></div>
          </div>
        )}

        {/* No events */}
        {!isLoading && events.length === 0 && (
          <div className="text-center py-6">
            <div className={EMPTY_STATE_ICON}>
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
            <p className="text-sm text-gray-600">No events scheduled today</p>
          </div>
        )}

        {/* Event Cards */}
        {!isLoading && events.length > 0 && (
          <div className="space-y-2 overflow-y-auto flex-1">
            {events.map((ev, index) => (
              <div
                key={index}
                className="p-3 border border-gray-200 rounded-lg bg-gray-50 hover:bg-blue-50 hover:border-blue-200 transition-all duration-200"
              >
                <div className="flex items-start gap-2 mb-1">
                  <Clock className="w-3 h-3 text-gray-500 mt-0.5 flex-shrink-0" />
                  <span className="text-xs text-gray-500 uppercase font-medium">
                    {ev.type}
                  </span>
                </div>
                <p className="font-medium text-gray-900 text-sm mb-1">
                  {ev.label}
                </p>
                <span
                  className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium ${
                    ev.status === "Confirmed"
                      ? "bg-emerald-100 text-emerald-700"
                      : ev.status === "Pending"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-gray-100 text-gray-700"
                  }`}
                >
                  {ev.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
