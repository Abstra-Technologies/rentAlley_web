"use client";

import useSWR from "swr";
import axios from "axios";
import { CalendarIcon } from "@heroicons/react/24/solid";

export default function TodayCalendar({ landlordId }) {
    const fetcher = (url: string) => axios.get(url).then(res => res.data);

    const { data, isLoading } = useSWR(
        landlordId
            ? `/api/landlord/dashboard/today-events?landlord_id=${landlordId}`
            : null,
        fetcher
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
        ...visits.map(v => ({
            type: "Property Visit",
            label: `${v.unit_name} — ${v.visit_time}`,
            status: v.status,
        })),
        ...maintenance.map(m => ({
            type: "Maintenance",
            label: `${m.unit_name} — ${m.subject}`,
            status: m.status,
        }))
    ];

    return (
        <div
            className="
                relative group
                rounded-2xl border border-gray-200 shadow
                bg-white/30 backdrop-blur-xl
                p-6
                transition-all duration-300
                hover:-translate-y-1 hover:shadow-xl
                min-h-[300px]
            "
        >
            {/* 🔵 Hover Overlay (same effect as PaymentSummaryCard) */}
            <div
                className="
                    absolute inset-0 rounded-2xl
                    bg-gradient-to-r from-blue-600/0 via-emerald-400/0 to-emerald-600/0
                    group-hover:from-blue-600/10 group-hover:via-emerald-400/10 group-hover:to-emerald-600/10
                    opacity-0 group-hover:opacity-100
                    transition-all duration-300
                    pointer-events-none
                "
            />

            {/* CONTENT */}
            <div className="relative z-10">

                {/* Month + Year */}
                <h2 className="text-xl font-bold text-gray-900 text-center">
                    {monthYear}
                </h2>

                {/* Date Number */}
                <p className="text-5xl font-extrabold text-center text-blue-700 leading-tight mt-1">
                    {dayNumber}
                </p>

                {/* Weekday */}
                <p className="text-center text-gray-500 text-sm mb-4">
                    {weekday}
                </p>

                {/* Events Label */}
                <div className="flex items-center gap-2 mb-2">
                    <CalendarIcon className="w-5 h-5 text-blue-600" />
                    <h3 className="font-semibold text-gray-800">Events</h3>
                </div>

                {/* Loading */}
                {isLoading && (
                    <p className="text-gray-500 text-sm">Loading events...</p>
                )}

                {/* No events */}
                {!isLoading && events.length === 0 && (
                    <p className="text-gray-500 text-sm">No events scheduled today.</p>
                )}

                {/* Event Cards */}
                <div className="mt-3 space-y-3">
                    {events.map((ev, index) => (
                        <div
                            key={index}
                            className="
                                p-3 border rounded-xl bg-gray-50
                                flex flex-col transition-all duration-300
                                hover:bg-blue-50 hover:shadow-md hover:-translate-y-[2px]
                            "
                        >
                            <span className="text-xs text-gray-500 uppercase tracking-wide">
                                {ev.type}
                            </span>

                            <span className="font-medium text-gray-800 text-sm">
                                {index + 1}. {ev.label}
                            </span>

                            <span className="text-xs text-gray-600 mt-1">
                                Status: {ev.status}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
