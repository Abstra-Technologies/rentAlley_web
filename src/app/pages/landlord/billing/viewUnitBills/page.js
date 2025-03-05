"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Building, 
  MapPin, 
  Users, 
  Bed, 
  FileText, 
  ChevronLeft, 
  PlusCircle 
} from 'lucide-react';

// Mock data - replace with actual data fetching
const propertyDetails = {
  id: '1',
  name: 'Sunrise Apartments',
  location: 'Metro Manila',
  totalUnits: 5,
  units: [
    {
      id: 'unit1',
      name: 'Unit 101',
      type: 'Studio',
      bedspacing: true,
      currentTenants: 2,
      maxTenants: 2,
      monthlyRent: 15000,
      lastBillingDate: '2024-02-28'
    },
    {
      id: 'unit2',
      name: 'Unit 102',
      type: '1 Bedroom',
      bedspacing: false,
      currentTenants: 1,
      maxTenants: 1,
      monthlyRent: 20000,
      lastBillingDate: '2024-02-28'
    },
    {
      id: 'unit3',
      name: 'Unit 103',
      type: 'Studio',
      bedspacing: true,
      currentTenants: 1,
      maxTenants: 2,
      monthlyRent: 15000,
      lastBillingDate: '2024-02-28'
    }
  ]
};

const PropertyUnitsPage = () => {
  const [searchTerm, setSearchTerm] = useState('');

  // Filter units based on search
  const filteredUnits = propertyDetails.units.filter((unit) => 
    unit.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Header Section */}
      <div className="flex items-center mb-6">
        <Link href="/properties" className="mr-4">
          <ChevronLeft className="text-gray-600 hover:text-blue-500" size={32} />
        </Link>
        <div className="flex-grow">
          <h1 className="text-3xl font-bold text-gray-800 flex items-center">
            <Building className="mr-3 text-blue-500" size={32} />
            {propertyDetails.name}
          </h1>
          <div className="flex items-center text-gray-600 mt-2">
            <MapPin className="mr-2 text-blue-500" size={20} />
            <span>{propertyDetails.location}</span>
          </div>
        </div>
      </div>

      {/* Search and Stats */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-4">
          <div className="flex items-center bg-gray-100 rounded-md px-3 py-2">
            <Users className="mr-2 text-blue-500" size={20} />
            <span>Total Units: {propertyDetails.totalUnits}</span>
          </div>
        </div>
        
        <div className="relative">
          <input 
            type="text"
            placeholder="Search units..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="absolute left-3 top-3 text-gray-400" 
            width="20" 
            height="20" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </div>
      </div>

      {/* Units Grid */}
      {filteredUnits.length === 0 ? (
        <div className="text-center py-10 bg-gray-100 rounded-lg">
          <p className="text-xl text-gray-600">No units found</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredUnits.map((unit) => (
            <div
              key={unit.id}
              className="bg-white shadow-md rounded-lg overflow-hidden hover:shadow-xl transition-all duration-300"
            >
              <div className="p-5">
                <div className="flex justify-between items-start mb-3">
                  <h2 className="text-xl font-semibold text-gray-700">
                    {unit.name}
                  </h2>
                  <span 
                    className={`
                      px-3 py-1 rounded-full text-xs font-bold 
                      ${unit.bedspacing ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}
                    `}
                  >
                    {unit.type}
                  </span>
                </div>
                
                <div className="space-y-3 text-gray-600 mb-4">
                  <div className="flex items-center">
                    <Bed className="mr-2 text-blue-500" size={20} />
                    <span>
                      Occupancy: {unit.currentTenants}/{unit.maxTenants} 
                      {unit.bedspacing ? ' (Bed Spacing)' : ''}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <FileText className="mr-2 text-blue-500" size={20} />
                    <span>Monthly Rent: ₱{unit.monthlyRent.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="font-medium">Last Billing:</span> {unit.lastBillingDate}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Link href={`/billing/unit/${unit.id}`}>
                    <button 
                      className="
                        w-full 
                        bg-blue-500 text-white 
                        py-2 rounded-md 
                        hover:bg-blue-600 
                        transition-colors
                      "
                    >
                      View Utility Billing
                    </button>
                  </Link>
                  <Link href={`/unit/${unit.id}`}>
                    <button 
                      className="
                        w-full 
                        bg-green-500 text-white 
                        py-2 rounded-md 
                        hover:bg-green-600 
                        transition-colors
                      "
                    >
                      View Rent Billing
                    </button>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PropertyUnitsPage;