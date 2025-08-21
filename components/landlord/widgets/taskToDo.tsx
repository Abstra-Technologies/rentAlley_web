"use client";
import { useEffect, useState } from "react";
import { CheckCircle, Clock, Wrench, FileText, Home } from "lucide-react";

export default function TaskWidget({ landlordId }: { landlordId: string }) {
    const [tasks, setTasks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    console.log('landlord id task:', landlordId);

    useEffect(() => {
        fetch(`/api/landlord/tasks?landlordId=${landlordId}`)
            .then((res) => res.json())
            .then((data) => setTasks(data.tasks || []))
            .finally(() => setLoading(false));
    }, [landlordId]);

    const markComplete = async (id: number) => {
        await fetch(`/api/tasks/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: "completed" }),
        });
        setTasks(tasks.map((t) => (t.id === id ? { ...t, status: "completed" } : t)));
    };

    const getIcon = (type: string) => {
        switch (type) {
            case "visit":
                return <Home className="w-4 h-4 text-blue-500" />;
            case "payment":
                return <FileText className="w-4 h-4 text-green-500" />;
            case "maintenance":
                return <Wrench className="w-4 h-4 text-orange-500" />;
            case "agreement":
                return <Clock className="w-4 h-4 text-purple-500" />;
            default:
                return <Clock className="w-4 h-4 text-gray-400" />;
        }
    };

    if (loading) return <p className="text-sm text-gray-500">Loading tasks...</p>;

    return (
        <div className="fixed bottom-4 right-4 bg-white shadow-xl rounded-2xl w-80 p-4 border border-gray-200">
            <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                📌 Tasks
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
          {tasks.length}
        </span>
            </h3>

            {tasks.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-6">✅ All tasks completed</p>
            ) : (
                <ul className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {tasks.map((task) => (
                        <li
                            key={task.id}
                            className={`flex justify-between items-center p-2 rounded-lg hover:bg-gray-50 transition ${
                                task.status === "completed" ? "opacity-60" : ""
                            }`}
                        >
                            <div className="flex items-center gap-2">
                                {getIcon(task.type)}
                                <span
                                    className={`text-sm ${
                                        task.status === "completed" ? "line-through text-gray-400" : "text-gray-800"
                                    }`}
                                >
                  {task.label || task.title}
                </span>
                            </div>

                            {task.status !== "completed" && (
                                <button
                                    onClick={() => markComplete(task.id)}
                                    className="flex items-center gap-1 text-xs bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded-lg transition"
                                >
                                    <CheckCircle className="w-3 h-3" />
                                    Done
                                </button>
                            )}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
