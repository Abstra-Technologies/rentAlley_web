// components/landlordVerification/steps/Step1PersonalInfo.jsx
"use client";

import {
    FiUser,
    FiBriefcase,
    FiPhone,
    FiGlobe,
    FiHeart,
    FiCalendar,
    FiMapPin
} from "react-icons/fi";

import CountrySelector from "@/components/ui/CountrySelector";

export default function Step1PersonalInfo({
                                              firstName, setFirstName,
                                              lastName, setLastName,
                                              companyName, setCompanyName,
                                              phoneNumber, setPhoneNumber,
                                              civilStatus, setCivilStatus,
                                              dateOfBirth, setDateOfBirth,
                                              address, setAddress,
                                              suggestions, setSuggestions,
                                              addressInputRef,
                                              citizenship, setCitizenship,
                                              occupation, setOccupation,
                                          }) {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center mb-6">
                <FiUser className="w-6 h-6 text-blue-500 mr-3" />
                <h2 className="text-2xl font-bold text-gray-900">
                    Personal Information
                </h2>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* First Name */}
                <div className="space-y-2">
                    <label className="flex items-center text-sm font-medium text-gray-700">
                        <FiUser className="w-4 h-4 mr-2 text-gray-400" />
                        First Name
                    </label>

                    <input
                        type="text"
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-600 focus:outline-none"
                        placeholder="Your first name"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                    />
                </div>

                {/* Last Name */}
                <div className="space-y-2">
                    <label className="flex items-center text-sm font-medium text-gray-700">
                        <FiUser className="w-4 h-4 mr-2 text-gray-400" />
                        Last Name
                    </label>

                    <input
                        type="text"
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-600 focus:outline-none"
                        placeholder="Your last name"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                    />
                </div>

                {/* Company Name */}
                <div className="md:col-span-2 space-y-2">
                    <label className="flex items-center text-sm font-medium text-gray-700">
                        <FiBriefcase className="w-4 h-4 mr-2 text-gray-400" />
                        Company Name (optional)
                    </label>

                    <input
                        type="text"
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-600 focus:outline-none"
                        placeholder="Enter company name"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                    />
                </div>

                {/* Date of Birth */}
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

                {/* Phone Number */}
                <div className="space-y-2">
                    <label className="flex items-center text-sm font-medium text-gray-700">
                        <FiPhone className="w-4 h-4 mr-2 text-gray-400" />
                        Phone Number
                    </label>

                    <input
                        type="tel"
                        placeholder="09XXXXXXXXX"
                        className={`w-full px-4 py-3 border rounded-xl bg-gray-50 text-gray-600 focus:outline-none ${
                            phoneNumber && !/^09\d{9}$/.test(phoneNumber)
                                ? "border-red-400"
                                : "border-gray-200"
                        }`}
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                    />

                    {phoneNumber && !/^09\d{9}$/.test(phoneNumber) && (
                        <p className="text-red-500 text-xs mt-1">
                            Phone number must be 11 digits starting with 09
                        </p>
                    )}
                </div>

                {/* Civil Status */}
                <div className="space-y-2">
                    <label className="flex items-center text-sm font-medium text-gray-700">
                        <FiHeart className="w-4 h-4 mr-2 text-gray-400" />
                        Civil Status
                    </label>

                    <select
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-600 focus:outline-none"
                        value={civilStatus}
                        onChange={(e) => setCivilStatus(e.target.value)}
                    >
                        <option value="">Select status...</option>
                        <option value="single">Single</option>
                        <option value="married">Married</option>
                        <option value="widowed">Widowed</option>
                        <option value="separated">Separated</option>
                    </select>
                </div>

                {/* Address with Autocomplete */}
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
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder="Start typing your address..."
                    />

                    {address.length > 0 && suggestions.length > 0 && (
                        <ul className="absolute z-10 bg-white border border-gray-200 w-full rounded-xl max-h-60 overflow-auto mt-1 shadow-lg">
                            {suggestions.map((item, idx) => (
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

                {/* Citizenship Selector */}
                <div className="space-y-2">
                    <label className="flex items-center text-sm font-medium text-gray-700">
                        <FiGlobe className="w-4 h-4 mr-2 text-gray-400" />
                        Citizenship
                    </label>

                    <CountrySelector value={citizenship} onChange={setCitizenship} />
                </div>

                {/* Occupation */}
                <div className="space-y-2">
                    <label className="flex items-center text-sm font-medium text-gray-700">
                        <FiBriefcase className="w-4 h-4 mr-2 text-gray-400" />
                        Occupation
                    </label>

                    <input
                        type="text"
                        placeholder="Enter occupation"
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-600 focus:outline-none"
                        value={occupation}
                        onChange={(e) => setOccupation(e.target.value)}
                    />
                </div>

            </div>
        </div>
    );
}
