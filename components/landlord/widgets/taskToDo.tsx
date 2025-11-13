"use client";
import { useEffect, useState } from "react";

export default function TaskWidget({ landlordId }: { landlordId: string }) {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/landlord/tasks?landlordId=${landlordId}`)
      .then((res) => res.json())
      .then((data) => setTasks(data.tasks || []))
      .finally(() => setLoading(false));
  }, [landlordId]);

  return (
    <div
      className="
        relative group cursor-pointer
        bg-white shadow-xl rounded-2xl w-full p-4 
        border border-gray-200
        h-[300px]
        flex flex-col
        transition-all duration-300
        hover:-translate-y-1 hover:shadow-xl
      "
    >
      {/* Hover Overlay (same as PaymentSummaryCard) */}
      <div
        className="
          absolute inset-0 rounded-2xl 
          bg-gradient-to-r from-blue-600/0 via-emerald-400/0 to-emerald-600/0
          opacity-0 group-hover:opacity-100 
          group-hover:from-blue-600/10 group-hover:via-emerald-400/10 group-hover:to-emerald-600/10
          transition-all duration-300
          pointer-events-none
        "
      ></div>

      {/* CONTENT (kept above the overlay) */}
      <div className="relative z-10 flex flex-col h-full">
        {/* Header */}
        <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
          📌 Tasks
          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
            {tasks.length}
          </span>
        </h3>

        {/* Loading */}
        {loading && (
          <p className="text-sm text-gray-500 text-center py-6 flex-1">
            Loading tasks...
          </p>
        )}

        {/* Empty */}
        {!loading && tasks.length === 0 && (
          <div className="flex flex-col items-center justify-center flex-1">
            <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center shadow-sm">
              <div className="text-3xl mb-2">✅</div>
              <p className="text-sm font-semibold text-green-700">No pending tasks.</p>
              <p className="text-xs text-green-600">You’re all caught up!</p>
            </div>
          </div>
        )}

        {/* Task List */}
        {!loading && tasks.length > 0 && (
          <ul className="space-y-2 overflow-y-auto pr-1 flex-1">
            {tasks.map((task) => (
              <li
                key={task.id}
                className={`
                  flex justify-between items-center p-3 rounded-xl border 
                  bg-white hover:bg-gray-50 shadow-sm transition
                  ${task.status === "completed" ? "opacity-60" : ""}
                `}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100">
                    📍
                  </div>

                  <div className="flex flex-col">
                    <span
                      className={`text-sm ${
                        task.status === "completed"
                          ? "line-through text-gray-400"
                          : "text-gray-800"
                      }`}
                    >
                      {task.label || task.title}
                    </span>

                    {task.date && (
                      <span className="text-xs text-gray-500">{task.date}</span>
                    )}

                    {task.time && (
                      <span className="text-xs text-gray-500">{task.time}</span>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
