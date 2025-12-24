"use client";

import { FiUser, FiBriefcase, FiCalendar, FiPhone, FiHeart, FiMapPin, FiGlobe } from "react-icons/fi";
import CountrySelector from "@/components/ui/CountrySelector";
import React, { useRef } from "react";

export default function StepPersonalInfo(props: any) {
    const {
        firstName,
        setFirstName,
        lastName,
        setLastName,
        companyName,
        setCompanyName,
        dateOfBirth,
        setDateOfBirth,
        phoneNumber,
        setPhoneNumber,
        civilStatus,
        setCivilStatus,
        address,
        setAddress,
        citizenship,
        setCitizenship,
        occupation,
        setOccupation,
        suggestions,
        setSuggestions,
    } = props;

    const addressInputRef = useRef<HTMLInputElement | null>(null);

    return (
        <section className="space-y-6">
            <div className="flex items-center mb-6">
                <FiUser className="w-6 h-6 text-blue-500 mr-3" />
                <h2 className="text-2xl font-bold text-gray-900">Personal Information</h2>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* FIRST NAME */}
                <div className="space-y-2">
                    <label className="flex items-center text-sm font-medium text-gray-700">
                        <FiUser className="w-4 h-4 mr-2 text-gray-400" />
                        First Name
                    </label>
                    <input
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-600 focus:outline-none"
                    />
                </div>

                {/* LAST NAME */}
                <div className="space-y-2">
                    <label className="flex items-center text-sm font-medium text-gray-700">
                        <FiUser className="w-4 h-4 mr-2 text-gray-400" />
                        Last Name
                    </label>
                    <input
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-600 focus:outline-none"
                    />
                </div>

                {/* COMPANY */}
                <div className="md:col-span-2 space-y-2">
                    <label className="flex items-center text-sm font-medium text-gray-700">
                        <FiBriefcase className="w-4 h-4 mr-2 text-gray-400" />
                        Company Name (optional)
                    </label>
                    <input
                        type="text"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-600 focus:outline-none"
                    />
                </div>

                {/* DOB */}
                <div className="space-y-2">
                    <label className="flex items-center text-sm font-medium text-gray-700">
                        <FiCalendar className="w-4 h-4 mr-2 text-gray-400" />
                        Date of Birth
                    </label>
                    <input
                        type="date"
                        value={dateOfBirth}
                        onChange={(e) => setDateOfBirth(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-600 focus:outline-none"
                    />
                </div>

                {/* PHONE */}
                <div className="space-y-2">
                    <label className="flex items-center text-sm font-medium text-gray-700">
                        <FiPhone className="w-4 h-4 mr-2 text-gray-400" />
                        Phone Number
                    </label>
                    <input
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-600 focus:outline-none"
                    />
                </div>

                {/* CIVIL STATUS */}
                <div className="space-y-2">
                    <label className="flex items-center text-sm font-medium text-gray-700">
                        <FiHeart className="w-4 h-4 mr-2 text-gray-400" />
                        Civil Status
                    </label>
                    <select
                        value={civilStatus}
                        onChange={(e) => setCivilStatus(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-600 focus:outline-none"
                    >
                        <option value="">Select status...</option>
                        <option value="single">Single</option>
                        <option value="married">Married</option>
                        <option value="widowed">Widowed</option>
                        <option value="separated">Separated</option>
                    </select>
                </div>

                {/* ADDRESS */}
                <div className="md:col-span-2 space-y-2 relative">
                    <label className="flex items-center text-sm font-medium text-gray-700">
                        <FiMapPin className="w-4 h-4 mr-2 text-gray-400" />
                        Home Address
                    </label>
                    <input
                        ref={addressInputRef}
                        type="text"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl"
                    />

                    {address.length > 0 && (
                        <ul className="absolute z-10 bg-white border border-gray-200 w-full rounded-xl mt-1">
                            {suggestions.map((item: any, idx: number) => (
                                <li
                                    key={idx}
                                    onClick={() => {
                                        setAddress(item.display_name);
                                        setSuggestions([]);
                                    }}
                                    className="px-4 py-2 hover:bg-blue-100 cursor-pointer"
                                >
                                    {item.display_name}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                {/* CITIZENSHIP */}
                <div className="space-y-2">
                    <label className="flex items-center text-sm font-medium text-gray-700">
                        <FiGlobe className="w-4 h-4 mr-2 text-gray-400" />
                        Citizenship
                    </label>
                    <CountrySelector value={citizenship} onChange={setCitizenship} />
                </div>

                {/* OCCUPATION */}
                <div className="space-y-2">
                    <label className="flex items-center text-sm font-medium text-gray-700">
                        <FiBriefcase className="w-4 h-4 mr-2 text-gray-400" />
                        Occupation
                    </label>
                    <input
                        type="text"
                        value={occupation}
                        onChange={(e) => setOccupation(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-600 focus:outline-none"
                    />
                </div>
            </div>
        </section>
    );
}
