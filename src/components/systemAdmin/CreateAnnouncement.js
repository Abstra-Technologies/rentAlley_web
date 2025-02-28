"use client";
/**
 *  TODO:
 *  1. Error on the useEffect.
 *  When i navigate back using the web browser for the first time it triggers.
 *  But when i navigate back again and click on the back it does not trigger anymore.
 *
 */
import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import useAnnouncementStore from "../../zustand/annoucementAdminStore";

export default function CreateAnnouncement() {
    const router = useRouter();
    const pathname = usePathname(); // Detects page changes in Next.js App Router

    const { title, message, targetAudience, setTitle, setMessage, setTargetAudience, resetForm } =
        useAnnouncementStore();

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [isDirty, setIsDirty] = useState(false);

    useEffect(() => {
        // Mark form as dirty when inputs change
        if (title || message || targetAudience) {
            setIsDirty(true);
        }

        // Warn on page refresh or tab close
        const handleBeforeUnload = (event) => {
            if (isDirty) {
                event.preventDefault();
                event.returnValue = "You have unsaved changes. Do you really want to leave?";
            }
        };

        // Detect browser back button click
        const handlePopState = () => {
            if (isDirty && !window.confirm("You have unsaved changes. Do you really want to leave?")) {
                router.replace(pathname); // Stay on the page
            } else {
                resetForm(); // Reset the form before leaving
            }
        };

        window.addEventListener("beforeunload", handleBeforeUnload);
        window.addEventListener("popstate", handlePopState);

        return () => {
            window.removeEventListener("beforeunload", handleBeforeUnload);
            window.removeEventListener("popstate", handlePopState);
        };
    }, [title, message, targetAudience, isDirty, router, pathname, resetForm]);

    useEffect(() => {
        const handleRouteChange = () => {
            if (isDirty && !window.confirm("You have unsaved changes. Do you really want to leave?")) {
                throw "Navigation prevented"; // Prevent route change
            } else {
                resetForm(); // Reset form if confirmed
            }
        };

        router.events?.on("routeChangeStart", handleRouteChange);

        return () => {
            router.events?.off("routeChangeStart", handleRouteChange);
        };
    }, [isDirty, router, resetForm]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            const res = await fetch("/api/systemadmin/annoucement/annoucement", {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ title, message, target_audience: targetAudience }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.message);

            setSuccess("Announcement created successfully!");
            resetForm();
            setIsDirty(false);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 max-w-lg mx-auto bg-white shadow-md rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Create Announcement</h2>

            {error && <p className="text-red-500 mb-2">{error}</p>}
            {success && <p className="text-green-500 mb-2">{success}</p>}

            <form onSubmit={handleSubmit}>
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700">Title</label>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-300"
                        required
                    />
                </div>

                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700">Message</label>
                    <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-300"
                        rows="4"
                        required
                    ></textarea>
                </div>

                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700">Target Audience</label>
                    <select
                        value={targetAudience}
                        onChange={(e) => setTargetAudience(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-300"
                        required
                    >
                        <option value="all">All</option>
                        <option value="tenant">Tenants</option>
                        <option value="landlord">Landlords</option>
                    </select>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-600 text-white font-bold py-2 px-4 rounded hover:bg-blue-700 disabled:bg-gray-400"
                >
                    {loading ? "Creating..." : "Create Announcement"}
                </button>
                <button
                    type="button"
                    onClick={resetForm}
                    className="w-full bg-gray-500 text-white font-bold py-2 px-4 rounded hover:bg-gray-600 mt-2"
                >
                    Disregard
                </button>
            </form>
        </div>
    );
}
