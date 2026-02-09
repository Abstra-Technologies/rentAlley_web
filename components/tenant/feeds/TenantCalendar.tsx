"use client";

import { useEffect, useState } from "react";
import axios from "axios";

type CalendarTask = {
    id: string | number;
    date: string; // YYYY-MM-DD
    time?: string; // HH:mm:ss
    title: string;
    type?: "visit" | "maintenance" | "other";
};

interface TenantCalendarProps {
    tenantId: string;
}

export default function TenantCalendar({ tenantId }: TenantCalendarProps) {
    const today = new Date();

    const [currentDate, setCurrentDate] = useState<Date>(today);
    const [tasks, setTasks] = useState<CalendarTask[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentTime, setCurrentTime] = useState<string>("");

    const dateKey = currentDate.toISOString().split("T")[0];

    const monthYear = currentDate.toLocaleDateString(undefined, {
        month: "long",
        year: "numeric",
    });

    const dayNumber = currentDate.getDate();
    const weekday = currentDate.toLocaleDateString(undefined, {
        weekday: "long",
    });

    /* ===============================
       LIVE TIME
    =============================== */
    useEffect(() => {
        const updateTime = () => {
            const now = new Date();
            setCurrentTime(
                now.toLocaleTimeString(undefined, {
                    hour: "numeric",
                    minute: "2-digit",
                })
            );
        };

        updateTime();
        const interval = setInterval(updateTime, 60000);
        return () => clearInterval(interval);
    }, []);

    /* ===============================
       FETCH TASKS
    =============================== */
    useEffect(() => {
        if (!tenantId) return;

        const fetchTasks = async () => {
            try {
                setLoading(true);

                const [visitsRes, maintenanceRes] = await Promise.all([
                    axios.get(`/api/tenant/visits?tenant_id=${tenantId}`),
                    axios.get(
                        `/api/maintenance/getMaintenancebyTenantId?tenant_id=${tenantId}`
                    ),
                ]);

                const visitTasks: CalendarTask[] =
                    visitsRes.data?.visits?.map((v: any) => ({
                        id: `visit-${v.visit_id}`,
                        date: v.visit_date,
                        time: v.visit_time,
                        title: "Property Visit",
                        type: "visit",
                    })) ?? [];

                const maintenanceTasks: CalendarTask[] =
                    maintenanceRes.data?.maintenance_requests?.map((m: any) => ({
                        id: `maintenance-${m.request_id}`,
                        date: m.created_at.split("T")[0],
                        title: "Maintenance Request",
                        type: "maintenance",
                    })) ?? [];

                setTasks([...visitTasks, ...maintenanceTasks]);
            } catch (err) {
                console.error("Failed to load calendar tasks", err);
            } finally {
                setLoading(false);
            }
        };

        fetchTasks();
    }, [tenantId]);

    /* ===============================
       HELPERS
    =============================== */
    const changeDay = (offset: number) => {
        const next = new Date(currentDate);
        next.setDate(currentDate.getDate() + offset);
        setCurrentDate(next);
    };

    const formatTime = (time?: string) => {
        if (!time) return "";
        const [h, m] = time.split(":");
        const hour = Number(h);
        const suffix = hour >= 12 ? "PM" : "AM";
        const displayHour = hour % 12 || 12;
        return `${displayHour}:${m} ${suffix}`;
    };

    const tasksForDay = tasks.filter((t) => t.date === dateKey);

    /* ===============================
       UI
    =============================== */
    return (
        <div
            className="
        bg-gradient-to-br from-gray-50 to-gray-100
        rounded-2xl border border-gray-200
        shadow-sm p-5
        transition-all duration-300
        hover:shadow-md hover:-translate-y-0.5
      "
        >
            {/* HEADER */}
            <div className="flex items-center justify-between mb-4">
                <button
                    onClick={() => changeDay(-1)}
                    className="
            px-3 py-1 rounded-lg
            bg-white border border-gray-200
            text-sm font-semibold
            transition
            hover:bg-blue-50 hover:text-blue-600
          "
                >
                    ‹
                </button>

                <h2 className="text-lg font-bold text-gray-900">{monthYear}</h2>

                <button
                    onClick={() => changeDay(1)}
                    className="
            px-3 py-1 rounded-lg
            bg-white border border-gray-200
            text-sm font-semibold
            transition
            hover:bg-blue-50 hover:text-blue-600
          "
                >
                    ›
                </button>
            </div>

            {/* DATE CARD */}
            <div className="flex flex-col items-center text-center mb-5">
                <div
                    className="
            w-20 h-20 rounded-2xl
            bg-white border border-gray-300
            flex items-center justify-center
            text-gray-900 font-extrabold text-4xl
            shadow-sm
            transition
            hover:scale-105
          "
                >
                    {dayNumber}
                </div>

                <p className="mt-2 text-base font-semibold text-gray-900">
                    {weekday}
                </p>

                <p className="text-sm text-gray-500">{currentTime}</p>
            </div>

            {/* TASKS */}
            <div className="space-y-2">
                {loading && (
                    <div className="h-4 bg-gray-200 rounded animate-pulse" />
                )}

                {!loading && tasksForDay.length === 0 && (
                    <p className="text-sm text-gray-500 text-center">
                        No tasks scheduled for this day
                    </p>
                )}

                {!loading &&
                    tasksForDay.map((task) => (
                        <div
                            key={task.id}
                            className={`
                px-3 py-2 rounded-xl border
                text-sm font-semibold
                flex justify-between items-center
                transition
                hover:shadow-sm hover:-translate-y-0.5
                ${
                                task.type === "visit"
                                    ? "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
                                    : task.type === "maintenance"
                                        ? "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
                                        : "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                            }
              `}
                        >
                            <span>{task.title}</span>
                            {task.time && (
                                <span className="text-xs font-medium">
                  {formatTime(task.time)}
                </span>
                            )}
                        </div>
                    ))}
            </div>
        </div>
    );
}
