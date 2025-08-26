"use client";

import { useEffect, useState } from "react";

interface Announcement {
    id: number;
    subject: string;
    description: string;
    property_name: string;
    unit_name: string;
    created_at: string;
    photos: string[];
}

export default function AnnouncementFeed({ tenant_id }: { tenant_id: number | undefined }) {
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!tenant_id) return;

        setLoading(true);
        fetch(`/api/tenant/activeRent/announcement?tenant_id=${tenant_id}`)
            .then((res) => res.json())
            .then((data) => setAnnouncements(data.announcements || []))
            .finally(() => setLoading(false));
    }, [tenant_id]);

    if (!tenant_id) return <p>Please login.</p>;
    if (loading) return <p>Loading announcements...</p>;

    return (
        <div className="w-full max-w-2xl mx-auto space-y-6">
            <h2 className="text-xl font-bold mb-4">Announcements</h2>

            {announcements.length === 0 ? (
                <p className="text-gray-500 text-center">No announcements available.</p>
            ) : (
                announcements.map((a) => (
                    <div
                        key={a.id}
                        className="bg-white rounded-lg shadow hover:shadow-md transition p-4"
                    >
                        {/* Header: landlord avatar + name + property */}
                        <div className="flex items-center mb-3">
                            <img
                                src={
                                    a.landlord?.profilePicture ||
                                    "/default-avatar.png" // fallback
                                }
                                alt="Landlord"
                                className="w-10 h-10 rounded-full object-cover border"
                            />
                            <div className="ml-3">
                                <p className="font-semibold text-gray-900">
                                    {a.landlord?.firstName} {a.landlord?.lastName}
                                </p>
                                <p className="text-xs text-gray-500">
                                    {a.property_name} •{" "}
                                    {new Date(a.created_at).toLocaleDateString("en-PH", {
                                        month: "short",
                                        day: "numeric",
                                        year: "numeric",
                                    })}
                                </p>
                            </div>
                        </div>

                        {/* Subject + description */}
                        <div className="mb-3">
                            {a.subject && (
                                <h3 className="font-medium text-gray-800 mb-1">{a.subject}</h3>
                            )}
                            <p className="text-gray-700 whitespace-pre-line break-words overflow-hidden text-ellipsis line-clamp-3">
                                {a.description}
                            </p>                        </div>

                        {/* Photos */}
                        {a.photos?.length > 0 && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                                {a.photos.map((url, i) => (
                                    <img
                                        key={i}
                                        src={url}
                                        alt="Announcement Photo"
                                        className="w-full rounded-lg object-cover max-h-80"
                                    />
                                ))}
                            </div>
                        )}

                        {/* Like + Comment actions */}
                        <div className="flex items-center justify-between mt-4 text-gray-600 text-sm border-t pt-2">
                            <button className="flex items-center gap-1 hover:text-blue-600">
                                👍 Like
                            </button>
                            <button className="flex items-center gap-1 hover:text-blue-600">
                                💬 Comment
                            </button>
                        </div>
                    </div>
                ))
            )}
        </div>
    );

}
