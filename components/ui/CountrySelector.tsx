"use client";

import { useState } from "react";
import { countries } from "country-data-list";

export default function CountrySelector({ value, onChange }) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");

    // Prepare list
    const countryList = countries.all.map((c) => ({
        code: c.alpha2.toLowerCase(),
        name: c.name,
    }));

    // Filter on search
    const filtered = countryList.filter((country) =>
        country.name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="relative w-full">
            {/* BUTTON */}
            <button
                type="button"
                onClick={() => setOpen(!open)}
                className="w-full flex items-center justify-between px-4 py-3 bg-white
                   border border-gray-300 rounded-xl shadow-sm hover:bg-gray-50"
            >
                {value ? (
                    <span>{value.name}</span>
                ) : (
                    <span className="text-gray-500">Select Citizenship</span>
                )}

                <svg
                    className={`w-4 h-4 transform transition ${open ? "rotate-180" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                >
                    <path d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {/* DROPDOWN */}
            {open && (
                <div className="absolute z-20 mt-2 w-full bg-white border border-gray-300
                        rounded-xl shadow-xl max-h-64 overflow-hidden">

                    {/* SEARCH BAR */}
                    <div className="p-2 border-b border-gray-200">
                        <input
                            type="text"
                            placeholder="Search..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg
                         focus:ring-1 focus:ring-blue-400 outline-none"
                        />
                    </div>

                    {/* LIST */}
                    <div className="max-h-48 overflow-auto">
                        {filtered.length === 0 ? (
                            <div className="text-gray-500 text-center py-3 text-sm">
                                No country found
                            </div>
                        ) : (
                            filtered.map((country) => (
                                <div
                                    key={country.code}
                                    onClick={() => {
                                        onChange(country);
                                        setOpen(false);
                                        setSearch("");
                                    }}
                                    className="px-4 py-2 cursor-pointer hover:bg-gray-100"
                                >
                                    {country.name}

                                    {value?.code === country.code && (
                                        <svg
                                            className="ml-auto h-4 w-4 text-green-600 inline float-right"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="3"
                                            viewBox="0 0 24 24"
                                        >
                                            <path d="M5 13l4 4L19 7" />
                                        </svg>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
