"use client";

import { useEffect, useState } from "react";
import axios from "axios";

type CalendarTask = {
    id: string | number;
    date: string;
    time?: string;
    title: string;
    status?: string;
    type: "visit";
};

interface TenantCalendarProps {
    tenantId: string;
}

export default function TenantCalendar({ tenantId }: TenantCalendarProps) {
    const today = new Date();

    const [currentDate, setCurrentDate] = useState<Date>(today);
    const [tasks, setTasks] = useState<CalendarTask[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentTime, setCurrentTime] = useState("");

    // ✅ LOCAL DATE KEY (NO UTC)
    const dateKey = `${currentDate.getFullYear()}-${String(
        currentDate.getMonth() + 1
    ).padStart(2, "0")}-${String(currentDate.getDate()).padStart(2, "0")}`;

    const monthYear = currentDate.toLocaleDateString(undefined, {
        month: "long",
        year: "numeric",
    });

    const dayNumber = currentDate.getDate();
    const weekday = currentDate.toLocaleDateString(undefined, {
        weekday: "long",
    });

    /* ===============================
       LIVE CURRENT TIME
    =============================== */
    useEffect(() => {
        const update = () => {
            setCurrentTime(
                new Date().toLocaleTimeString(undefined, {
                    hour: "numeric",
                    minute: "2-digit",
                })
            );
        };

        update();
        const interval = setInterval(update, 60000);
        return () => clearInterval(interval);
    }, []);

    /* ===============================
       FETCH VISITS (DATE-AWARE)
    =============================== */
    useEffect(() => {
        if (!tenantId) return;

        const fetchVisits = async () => {
            try {
                setLoading(true);

                const res = await axios.get(
                    `/api/tenant/property-finder/viewBookings`,
                    {
                        params: {
                            tenant_id: tenantId,
                            date: dateKey,
                        },
                    }
                );

                const visitTasks: CalendarTask[] = (res.data || []).map(
                    (v: any) => ({
                        id: v.visit_id,
                        date: v.visit_date,
                        time: v.visit_time,
                        title: `${v.property_name} · ${v.unit_name}`,
                        status: v.status,
                        type: "visit",
                    })
                );

                setTasks(visitTasks);
            } catch (err) {
                console.error("Failed to load visits", err);
            } finally {
                setLoading(false);
            }
        };

        fetchVisits();
    }, [tenantId, dateKey]); // 🔥 REFETCH ON DATE CHANGE

    /* ===============================
       NAVIGATION
    =============================== */
    const changeDay = (offset: number) => {
        setCurrentDate((prev) => {
            const next = new Date(prev);
            next.setDate(prev.getDate() + offset);
            return next;
        });
    };

    const formatTime = (time?: string) => {
        if (!time) return "";
        const [h, m] = time.split(":");
        const hour = Number(h);
        const suffix = hour >= 12 ? "PM" : "AM";
        return `${hour % 12 || 12}:${m} ${suffix}`;
    };

    /* ===============================
       UI
    =============================== */
    return (
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl border border-gray-200 shadow-sm p-5">
            {/* HEADER */}
            <div className="flex items-center justify-between mb-4">
                <button
                    onClick={() => changeDay(-1)}
                    className="px-3 py-1 rounded-lg bg-white border border-gray-200 hover:bg-blue-50"
                >
                    ‹
                </button>

                <h2 className="text-lg font-bold">{monthYear}</h2>

                <button
                    onClick={() => changeDay(1)}
                    className="px-3 py-1 rounded-lg bg-white border border-gray-200 hover:bg-blue-50"
                >
                    ›
                </button>
            </div>

            {/* DATE */}
            <div className="flex flex-col items-center mb-5">
                <div className="w-20 h-20 bg-white border rounded-2xl text-4xl font-bold flex items-center justify-center">
                    {dayNumber}
                </div>
                <p className="mt-2 font-semibold">{weekday}</p>
                <p className="text-sm text-gray-500">{currentTime}</p>
            </div>

            {/* TASKS */}
            {loading ? (
                <div className="h-4 bg-gray-200 rounded animate-pulse" />
            ) : tasks.length === 0 ? (
                <p className="text-sm text-gray-500 text-center">
                    No event scheduled for this day
                </p>
            ) : (
                tasks.map((task) => (
                    <div
                        key={task.id}
                        className="bg-blue-50 border border-blue-200 rounded-xl px-3 py-2 mb-2 flex justify-between"
                    >
                        <span className="truncate">{task.title}</span>
                        {task.time && (
                            <span className="text-xs">{formatTime(task.time)}</span>
                        )}
                    </div>
                ))
            )}
        </div>
    );
}
