"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Building, 
  MapPin, 
  Users, 
  FileText, 
  ChevronLeft, 
  DollarSign,
  Droplet,
  Zap,
  Home,
  Edit2,
  ArrowRight,
  Check,
  PenTool,
  AlertTriangle
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
      monthlyRent: 15000,
      lastBillingDate: '2024-02-28',
      rentStatus: 'paid',
      utilityStatus: 'unpaid',
      totalRentDue: 0,
      totalUtilityDue: 2500,
      utilityBills: [
        {
          id: 'ub1',
          type: 'Electric',
          date: '2024-02-28',
          amount: 1500,
          status: 'unpaid',
          previousReading: 1250,
          currentReading: 1600,
          rate: 12.50,
          consumption: 350
        },
        {
          id: 'ub2',
          type: 'Water',
          date: '2024-02-28',
          amount: 1000,
          status: 'unpaid',
          previousReading: 5250,
          currentReading: 5500,
          rate: 4.00,
          consumption: 250
        }
      ],
      rentBills: [
        {
          id: 'rb1',
          period: 'February 2024',
          amount: 15000,
          status: 'paid',
          dueDate: '2024-02-05',
          paymentDate: '2024-02-03'
        },
        {
          id: 'rb2',
          period: 'March 2024',
          amount: 15000,
          status: 'paid',
          dueDate: '2024-03-05',
          paymentDate: '2024-03-04'
        }
      ]
    },
    {
      id: 'unit2',
      name: 'Unit 102',
      type: '1 Bedroom',
      monthlyRent: 20000,
      lastBillingDate: '2024-02-28',
      rentStatus: 'unpaid',
      utilityStatus: 'unpaid',
      totalRentDue: 20000,
      totalUtilityDue: 3200,
      utilityBills: [
        {
          id: 'ub3',
          type: 'Electric',
          date: '2024-02-28',
          amount: 2200,
          status: 'unpaid',
          previousReading: 1800,
          currentReading: 2250,
          rate: 12.50,
          consumption: 450
        },
        {
          id: 'ub4',
          type: 'Water',
          date: '2024-02-28',
          amount: 1000,
          status: 'unpaid',
          previousReading: 7250,
          currentReading: 7500,
          rate: 4.00,
          consumption: 250
        }
      ],
      rentBills: [
        {
          id: 'rb3',
          period: 'February 2024',
          amount: 20000,
          status: 'paid',
          dueDate: '2024-02-05',
          paymentDate: '2024-02-05'
        },
        {
          id: 'rb4',
          period: 'March 2024',
          amount: 20000,
          status: 'unpaid',
          dueDate: '2024-03-05',
          paymentDate: null
        }
      ]
    }
  ]
};

const PropertyUnitsPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedUnit, setExpandedUnit] = useState(null);
  const [activeTab, setActiveTab] = useState('summary'); // 'summary', 'create-utility', 'create-rent', 'edit-bill'
  const [utilityBillingStep, setUtilityBillingStep] = useState(1);
  const [editingBill, setEditingBill] = useState(null);
  
  // Form state
  const [utilityForm, setUtilityForm] = useState({
    billingPeriod: '',
    electricityRate: 12.50,
    waterRate: 4.00,
    electricityPrevReading: '',
    electricityCurrentReading: '',
    waterPrevReading: '',
    waterCurrentReading: '',
    otherCharges: 0,
    notes: ''
  });
  
  const [rentForm, setRentForm] = useState({
    billingPeriod: '',
    rentAmount: 0,
    additionalCharges: 0,
    dueDate: '',
    notes: ''
  });

  // Filter units based on search
  const filteredUnits = propertyDetails.units.filter((unit) => 
    unit.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Toggle unit expansion
  const toggleUnitExpansion = (unitId) => {
    if (expandedUnit === unitId) {
      setExpandedUnit(null);
      setActiveTab('summary');
      setUtilityBillingStep(1);
      setEditingBill(null);
    } else {
      setExpandedUnit(unitId);
      setActiveTab('summary');
      setUtilityBillingStep(1);
      setEditingBill(null);
      
      // Set default rent amount based on selected unit
      const unit = propertyDetails.units.find(u => u.id === unitId);
      if (unit) {
        setRentForm({
          ...rentForm,
          rentAmount: unit.monthlyRent
        });
      }
    }
  };

  // Switch to a specific tab for a unit
  const switchToTab = (unitId, tab) => {
    setExpandedUnit(unitId);
    setActiveTab(tab);
    setUtilityBillingStep(1);
    setEditingBill(null);
    
    // Set default rent amount based on selected unit
    if (tab === 'create-rent') {
      const unit = propertyDetails.units.find(u => u.id === unitId);
      if (unit) {
        setRentForm({
          ...rentForm,
          rentAmount: unit.monthlyRent
        });
      }
    }
  };

  // Go to next utility billing step
  const nextUtilityStep = () => {
    setUtilityBillingStep(prevStep => Math.min(prevStep + 1, 4));
  };

  // Go to previous utility billing step
  const prevUtilityStep = () => {
    setUtilityBillingStep(prevStep => Math.max(prevStep - 1, 1));
  };

  // Handle utility form change
  const handleUtilityFormChange = (e) => {
    const { name, value } = e.target;
    setUtilityForm({
      ...utilityForm,
      [name]: value
    });
  };

  // Handle rent form change
  const handleRentFormChange = (e) => {
    const { name, value } = e.target;
    setRentForm({
      ...rentForm,
      [name]: value
    });
  };

  // Function to start editing a bill
  const startEditBill = (bill, type) => {
    setEditingBill({ ...bill, type });
    setActiveTab('edit-bill');
  };

  // Function to get status color
  const getStatusColor = (status) => {
    return status === 'paid' ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100';
  };

  // Calculate utility bill (simulated)
  const calculateUtilityBill = () => {
    const electricityUsage = utilityForm.electricityCurrentReading - utilityForm.electricityPrevReading;
    const waterUsage = utilityForm.waterCurrentReading - utilityForm.waterPrevReading;
    
    const electricityCost = electricityUsage * utilityForm.electricityRate;
    const waterCost = waterUsage * utilityForm.waterRate;
    
    return {
      electricity: {
        usage: electricityUsage,
        cost: electricityCost
      },
      water: {
        usage: waterUsage,
        cost: waterCost
      },
      otherCharges: parseFloat(utilityForm.otherCharges) || 0,
      total: electricityCost + waterCost + (parseFloat(utilityForm.otherCharges) || 0)
    };
  };

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
                      ${unit.type === 'Studio' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}
                    `}
                  >
                    {unit.type}
                  </span>
                </div>
                
                <div className="space-y-3 text-gray-600 mb-4">
                  <div className="flex items-center">
                    <Home className="mr-2 text-blue-500" size={20} />
                    <span>Monthly Rent: ₱{unit.monthlyRent.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center">
                    <DollarSign className="mr-2 text-blue-500" size={20} />
                    <span>Last Billing: {unit.lastBillingDate}</span>
                  </div>
                  
                  {/* Payment Status Indicators */}
                  <div className="flex space-x-2">
                    <span 
                      className={`text-xs px-2 py-1 rounded-full font-medium flex items-center ${getStatusColor(unit.rentStatus)}`}
                    >
                      <span className="mr-1">Rent:</span>
                      {unit.rentStatus === 'paid' ? 'Paid' : `Unpaid (₱${unit.totalRentDue.toLocaleString()})`}
                    </span>
                    <span 
                      className={`text-xs px-2 py-1 rounded-full font-medium flex items-center ${getStatusColor(unit.utilityStatus)}`}
                    >
                      <span className="mr-1">Utilities:</span>
                      {unit.utilityStatus === 'paid' ? 'Paid' : `Unpaid (₱${unit.totalUtilityDue.toLocaleString()})`}
                    </span>
                  </div>
                </div>

                {/* Billing Actions */}
                <div className="grid grid-cols-3 gap-2 mb-2">
                  <button 
                    onClick={() => toggleUnitExpansion(unit.id)}
                    className="flex items-center justify-center bg-blue-500 hover:bg-blue-600 text-white py-2 px-2 rounded-md transition-colors text-sm"
                  >
                    <FileText className="mr-1" size={16} />
                    <span>Billing</span>
                  </button>
                  <button 
                    onClick={() => switchToTab(unit.id, 'create-utility')}
                    className="flex items-center justify-center bg-teal-500 hover:bg-teal-600 text-white py-2 px-2 rounded-md transition-colors text-sm"
                  >
                    <Droplet className="mr-1" size={16} />
                    <span>Utilities</span>
                  </button>
                  <button 
                    onClick={() => switchToTab(unit.id, 'create-rent')}
                    className="flex items-center justify-center bg-indigo-500 hover:bg-indigo-600 text-white py-2 px-2 rounded-md transition-colors text-sm"
                  >
                    <Home className="mr-1" size={16} />
                    <span>Rent</span>
                  </button>
                </div>

                {/* Expanded Section with Tabs */}
                {expandedUnit === unit.id && (
                  <div className="mt-2 p-4 bg-gray-50 rounded-md border border-gray-200">
                    {/* Tab Navigation */}
                    <div className="flex border-b mb-4">
                      <button 
                        onClick={() => setActiveTab('summary')}
                        className={`py-2 px-4 font-medium text-sm ${activeTab === 'summary' ? 'text-blue-600 border-b-2 border-blue-500' : 'text-gray-500 hover:text-gray-700'}`}
                      >
                        Billing History
                      </button>
                      <button 
                        onClick={() => { setActiveTab('create-utility'); setUtilityBillingStep(1); }}
                        className={`py-2 px-4 font-medium text-sm ${activeTab === 'create-utility' ? 'text-blue-600 border-b-2 border-blue-500' : 'text-gray-500 hover:text-gray-700'}`}
                      >
                        Create Utility Bill
                      </button>
                      <button 
                        onClick={() => setActiveTab('create-rent')}
                        className={`py-2 px-4 font-medium text-sm ${activeTab === 'create-rent' ? 'text-blue-600 border-b-2 border-blue-500' : 'text-gray-500 hover:text-gray-700'}`}
                      >
                        Create Rent Bill
                      </button>
                    </div>
                    
                    {/* Billing History Tab */}
                    {activeTab === 'summary' && (
                      <div>
                        {/* Utility Bills Section */}
                        <div className="mb-4">
                          <h3 className="font-medium text-gray-800 mb-2 flex items-center">
                            <Droplet className="mr-2 text-teal-500" size={18} />
                            Utility Bills
                          </h3>
                          
                          {unit.utilityBills && unit.utilityBills.length > 0 ? (
                            <div className="space-y-2">
                              {unit.utilityBills.map(bill => (
                                <div key={bill.id} className="bg-white p-3 rounded border flex justify-between items-center">
                                  <div>
                                    <div className="font-medium">{bill.type} - {bill.date}</div>
                                    <div className="text-sm text-gray-500">
                                      {bill.previousReading} → {bill.currentReading} 
                                      <span className="ml-1">({bill.consumption} units @ ₱{bill.rate})</span>
                                    </div>
                                  </div>
                                  <div className="flex items-center">
                                    <span className={`mr-3 px-2 py-1 rounded-full text-xs ${bill.status === 'paid' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                      {bill.status === 'paid' ? 'Paid' : `₱${bill.amount.toLocaleString()}`}
                                    </span>
                                    <button 
                                      onClick={() => startEditBill(bill, 'utility')}
                                      className="text-gray-500 hover:text-blue-500"
                                    >
                                      <Edit2 size={16} />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-3 bg-gray-100 rounded">
                              <p className="text-gray-500">No utility bills found</p>
                            </div>
                          )}
                        </div>
                        
                        {/* Rent Bills Section */}
                        <div>
                          <h3 className="font-medium text-gray-800 mb-2 flex items-center">
                            <Home className="mr-2 text-indigo-500" size={18} />
                            Rent Bills
                          </h3>
                          
                          {unit.rentBills && unit.rentBills.length > 0 ? (
                            <div className="space-y-2">
                              {unit.rentBills.map(bill => (
                                <div key={bill.id} className="bg-white p-3 rounded border flex justify-between items-center">
                                  <div>
                                    <div className="font-medium">{bill.period}</div>
                                    <div className="text-sm text-gray-500">
                                      Due: {bill.dueDate}
                                      {bill.paymentDate && <span className="ml-2">Paid: {bill.paymentDate}</span>}
                                    </div>
                                  </div>
                                  <div className="flex items-center">
                                    <span className={`mr-3 px-2 py-1 rounded-full text-xs ${bill.status === 'paid' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                      {bill.status === 'paid' ? 'Paid' : `₱${bill.amount.toLocaleString()}`}
                                    </span>
                                    <button 
                                      onClick={() => startEditBill(bill, 'rent')}
                                      className="text-gray-500 hover:text-blue-500"
                                    >
                                      <Edit2 size={16} />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-3 bg-gray-100 rounded">
                              <p className="text-gray-500">No rent bills found</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {/* Create Utility Bill Tab with Steps */}
                    {activeTab === 'create-utility' && (
                      <div>
                        {/* Progress Steps */}
                        <div className="flex justify-between mb-6">
                          {[1, 2, 3, 4].map(step => (
                            <div 
                              key={step} 
                              className={`flex flex-col items-center relative ${step < 4 ? 'w-1/4' : ''}`}
                            >
                              <div className={`
                                rounded-full w-8 h-8 flex items-center justify-center
                                ${utilityBillingStep === step ? 'bg-blue-500 text-white' : 
                                  utilityBillingStep > step ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'}
                              `}>
                                {utilityBillingStep > step ? <Check size={16} /> : step}
                              </div>
                              <div className="text-xs text-center mt-1 font-medium">
                                {step === 1 && "Billing Period"}
                                {step === 2 && "Meter Readings"}
                                {step === 3 && "Calculate"}
                                {step === 4 && "Confirm"}
                              </div>
                              
                              {/* Connecting line */}
                              {step < 4 && (
                                <div className={`absolute top-4 left-8 w-full h-0.5 
                                  ${utilityBillingStep > step ? 'bg-green-500' : 'bg-gray-200'}`}>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                        
                        {/* Step 1: Billing Period and Rates */}
                        {utilityBillingStep === 1 && (
                          <div>
                            <h3 className="font-medium text-gray-800 mb-3">Step 1: Enter Billing Period & Rates</h3>
                            
                            <div className="space-y-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Billing Period</label>
                                <input
                                  type="month"
                                  name="billingPeriod"
                                  value={utilityForm.billingPeriod}
                                  onChange={handleUtilityFormChange}
                                  className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  required
                                />
                              </div>
                              
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    <Zap className="inline-block mr-1" size={16} />
                                    Electricity Rate (₱/kWh)
                                  </label>
                                  <input
                                    type="number"
                                    name="electricityRate"
                                    value={utilityForm.electricityRate}
                                    onChange={handleUtilityFormChange}
                                    step="0.01"
                                    className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    <Droplet className="inline-block mr-1" size={16} />
                                    Water Rate (₱/cubic meter)
                                  </label>
                                  <input
                                    type="number"
                                    name="waterRate"
                                    value={utilityForm.waterRate}
                                    onChange={handleUtilityFormChange}
                                    step="0.01"
                                    className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                  />
                                </div>
                              </div>
                              
                              <div className="pt-3 flex justify-end">
                                <button
                                  onClick={nextUtilityStep}
                                  className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-md transition-colors flex items-center"
                                  disabled={!utilityForm.billingPeriod}
                                >
                                  Next Step
                                  <ArrowRight className="ml-2" size={16} />
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {/* Step 2: Meter Readings */}
                        {utilityBillingStep === 2 && (
                          <div>
                            <h3 className="font-medium text-gray-800 mb-3">Step 2: Enter Meter Readings</h3>
                            
                            <div className="space-y-4">
                              <div className="bg-blue-50 p-3 rounded-md text-sm text-blue-800 flex items-start">
                                <AlertTriangle className="mr-2 mt-0.5 flex-shrink-0" size={16} />
                                <p>Enter the previous and current meter readings to calculate consumption.</p>
                              </div>
                              
                              <div>
                                <h4 className="font-medium text-gray-700 mb-2 flex items-center">
                                  <Zap className="mr-2 text-yellow-500" size={18} />
                                  Electricity Meter
                                </h4>
                                
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Previous Reading (kWh)</label>
                                    <input
                                      type="number"
                                      name="electricityPrevReading"
                                      value={utilityForm.electricityPrevReading}
                                      onChange={handleUtilityFormChange}
                                      className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                      required
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Current Reading (kWh)</label>
                                    <input
                                      type="number"
                                      name="electricityCurrentReading"
                                      value={utilityForm.electricityCurrentReading}
                                      onChange={handleUtilityFormChange}
                                      className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                      required
                                    />
                                  </div>
                                </div>
                              </div>
                              
                              <div>
                                <h4 className="font-medium text-gray-700 mb-2 flex items-center">
                                  <Droplet className="mr-2 text-blue-500" size={18} />
                                  Water Meter
                                </h4>
                                
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Previous Reading (m³)</label>
                                    <input
                                      type="number"
                                      name="waterPrevReading"
                                      value={utilityForm.waterPrevReading}
                                      onChange={handleUtilityFormChange}
                                      className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                      required
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Current Reading (m³)</label>
                                    <input
                                      type="number"
                                      name="waterCurrentReading"
                                      value={utilityForm.waterCurrentReading}
                                      onChange={handleUtilityFormChange}
                                      className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                      required
                                    />
                                  </div>
                                </div>
                              </div>
                              
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Other Charges (₱)</label>
                                <input
                                  type="number"
                                  name="otherCharges"
                                  value={utilityForm.otherCharges}
                                  onChange={handleUtilityFormChange}
                                  className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                              </div>
                              
                              <div className="pt-3 flex justify-between">
                                <button
                                  onClick={prevUtilityStep}
                                  className="bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded-md transition-colors"
                                >
                                  Back
                                </button>
                                <button onClick={nextUtilityStep}
                                  className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-md transition-colors flex items-center"
                                  disabled={!utilityForm.electricityPrevReading || !utilityForm.electricityCurrentReading || 
                                           !utilityForm.waterPrevReading || !utilityForm.waterCurrentReading}
                                >
                                  Next Step
                                  <ArrowRight className="ml-2" size={16} />
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {/* Step 3: Calculate Bills */}
                        {utilityBillingStep === 3 && (
                          <div>
                            <h3 className="font-medium text-gray-800 mb-3">Step 3: Bill Calculation</h3>
                            
                            {/* Calculate bill based on readings */}
                            {(() => {
                              const bill = calculateUtilityBill();
                              return (
                                <div className="space-y-4">
                                  <div className="bg-gray-50 p-4 rounded-md border">
                                    <h4 className="font-medium text-gray-700 mb-3">Billing Summary</h4>
                                    
                                    <div className="space-y-3">
                                      {/* Electricity */}
                                      <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                                        <div className="flex items-center">
                                          <Zap className="mr-2 text-yellow-500" size={18} />
                                          <div>
                                            <div className="font-medium">Electricity</div>
                                            <div className="text-sm text-gray-500">
                                              {utilityForm.electricityPrevReading} → {utilityForm.electricityCurrentReading} 
                                              <span className="ml-1">({bill.electricity.usage} kWh @ ₱{utilityForm.electricityRate})</span>
                                            </div>
                                          </div>
                                        </div>
                                        <div className="font-medium">₱{bill.electricity.cost.toFixed(2)}</div>
                                      </div>
                                      
                                      {/* Water */}
                                      <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                                        <div className="flex items-center">
                                          <Droplet className="mr-2 text-blue-500" size={18} />
                                          <div>
                                            <div className="font-medium">Water</div>
                                            <div className="text-sm text-gray-500">
                                              {utilityForm.waterPrevReading} → {utilityForm.waterCurrentReading} 
                                              <span className="ml-1">({bill.water.usage} m³ @ ₱{utilityForm.waterRate})</span>
                                            </div>
                                          </div>
                                        </div>
                                        <div className="font-medium">₱{bill.water.cost.toFixed(2)}</div>
                                      </div>
                                      
                                      {/* Other Charges */}
                                      {bill.otherCharges > 0 && (
                                        <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                                          <div className="font-medium">Other Charges</div>
                                          <div className="font-medium">₱{bill.otherCharges.toFixed(2)}</div>
                                        </div>
                                      )}
                                      
                                      {/* Total */}
                                      <div className="flex justify-between items-center pt-2">
                                        <div className="font-bold text-lg">Total Amount</div>
                                        <div className="font-bold text-lg text-blue-600">₱{bill.total.toFixed(2)}</div>
                                      </div>
                                    </div>
                                  </div>
                                  
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Notes (Optional)</label>
                                    <textarea
                                      name="notes"
                                      value={utilityForm.notes}
                                      onChange={handleUtilityFormChange}
                                      className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                      rows="3"
                                      placeholder="Add any additional notes about this utility bill..."
                                    ></textarea>
                                  </div>
                                  
                                  <div className="pt-3 flex justify-between">
                                    <button
                                      onClick={prevUtilityStep}
                                      className="bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded-md transition-colors"
                                    >
                                      Back
                                    </button>
                                    <button
                                      onClick={nextUtilityStep}
                                      className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-md transition-colors flex items-center"
                                    >
                                      Next Step
                                      <ArrowRight className="ml-2" size={16} />
                                    </button>
                                  </div>
                                </div>
                              );
                            })()}
                          </div>
                        )}
                        
                        {/* Step 4: Confirm and Save */}
                        {utilityBillingStep === 4 && (
                          <div>
                            <h3 className="font-medium text-gray-800 mb-3">Step 4: Confirm Utility Billing</h3>
                            
                            <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-4 flex items-start">
                              <Check className="text-green-500 mr-3 mt-0.5 flex-shrink-0" size={20} />
                              <div>
                                <h4 className="font-medium text-green-800">Ready to Create Utility Bill</h4>
                                <p className="text-green-700 text-sm mt-1">
                                  Please review the billing details below before confirming.
                                </p>
                              </div>
                            </div>
                            
                            {(() => {
                              const bill = calculateUtilityBill();
                              return (
                                <div className="space-y-4">
                                  <div className="bg-white p-4 rounded-md border">
                                    <div className="grid grid-cols-2 gap-4 mb-4">
                                      <div>
                                        <span className="text-sm text-gray-500">Unit:</span>
                                        <div className="font-medium">{unit.name}</div>
                                      </div>
                                      <div>
                                        <span className="text-sm text-gray-500">Billing Period:</span>
                                        <div className="font-medium">{utilityForm.billingPeriod}</div>
                                      </div>
                                    </div>
                                    
                                    <div className="space-y-3">
                                      <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                                        <div className="font-medium">Electricity</div>
                                        <div className="font-medium">₱{bill.electricity.cost.toFixed(2)}</div>
                                      </div>
                                      
                                      <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                                        <div className="font-medium">Water</div>
                                        <div className="font-medium">₱{bill.water.cost.toFixed(2)}</div>
                                      </div>
                                      
                                      {bill.otherCharges > 0 && (
                                        <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                                          <div className="font-medium">Other Charges</div>
                                          <div className="font-medium">₱{bill.otherCharges.toFixed(2)}</div>
                                        </div>
                                      )}
                                      
                                      <div className="flex justify-between items-center pt-2">
                                        <div className="font-bold text-lg">Total Amount</div>
                                        <div className="font-bold text-lg text-blue-600">₱{bill.total.toFixed(2)}</div>
                                      </div>
                                    </div>
                                    
                                    {utilityForm.notes && (
                                      <div className="mt-4 pt-3 border-t border-gray-200">
                                        <span className="text-sm text-gray-500">Notes:</span>
                                        <p className="mt-1 text-gray-700">{utilityForm.notes}</p>
                                      </div>
                                    )}
                                  </div>
                                  
                                  <div className="pt-3 flex justify-between">
                                    <button
                                      onClick={prevUtilityStep}
                                      className="bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded-md transition-colors"
                                    >
                                      Back
                                    </button>
                                    <button
                                      onClick={() => {
                                        // Here would be the code to save the billing
                                        // For now we'll just close the form
                                        setUtilityBillingStep(1);
                                        setActiveTab('summary');
                                        
                                        // Reset form
                                        setUtilityForm({
                                          billingPeriod: '',
                                          electricityRate: 12.50,
                                          waterRate: 4.00,
                                          electricityPrevReading: '',
                                          electricityCurrentReading: '',
                                          waterPrevReading: '',
                                          waterCurrentReading: '',
                                          otherCharges: 0,
                                          notes: ''
                                        });
                                      }}
                                      className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-md transition-colors flex items-center"
                                    >
                                      <Check className="mr-2" size={16} />
                                      Confirm & Create Bill
                                    </button>
                                  </div>
                                </div>
                              );
                            })()}
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Create Rent Bill Tab */}
                    {activeTab === 'create-rent' && (
                      <div>
                        <h3 className="font-medium text-gray-800 mb-3">Create Rent Bill</h3>
                        
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Billing Period</label>
                            <input
                              type="month"
                              name="billingPeriod"
                              value={rentForm.billingPeriod}
                              onChange={handleRentFormChange}
                              className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              required
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Rent Amount (₱)</label>
                            <input
                              type="number"
                              name="rentAmount"
                              value={rentForm.rentAmount}
                              onChange={handleRentFormChange}
                              className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              required
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Additional Charges (₱)</label>
                            <input
                              type="number"
                              name="additionalCharges"
                              value={rentForm.additionalCharges}
                              onChange={handleRentFormChange}
                              className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                            <input
                              type="date"
                              name="dueDate"
                              value={rentForm.dueDate}
                              onChange={handleRentFormChange}
                              className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              required
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Notes (Optional)</label>
                            <textarea
                              name="notes"
                              value={rentForm.notes}
                              onChange={handleRentFormChange}
                              className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              rows="3"
                              placeholder="Add any additional notes about this rent bill..."
                            ></textarea>
                          </div>
                          
                          <div className="pt-3 flex justify-between">
                            <button
                              onClick={() => setActiveTab('summary')}
                              className="bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded-md transition-colors"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => {
                                // Here would be the code to save the rent bill
                                // For now we'll just go back to summary
                                setActiveTab('summary');
                                
                                // Reset form
                                setRentForm({
                                  billingPeriod: '',
                                  rentAmount: unit.monthlyRent,
                                  additionalCharges: 0,
                                  dueDate: '',
                                  notes: ''
                                });
                              }}
                              className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-md transition-colors flex items-center"
                              disabled={!rentForm.billingPeriod || !rentForm.rentAmount || !rentForm.dueDate}
                            >
                              <Check className="mr-2" size={16} />
                              Create Rent Bill
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Edit Bill Tab */}
                    {activeTab === 'edit-bill' && editingBill && (
                      <div>
                        <h3 className="font-medium text-gray-800 mb-3 flex items-center">
                          <PenTool className="mr-2 text-blue-500" size={18} />
                          Edit {editingBill.type === 'utility' ? editingBill.type + ' Bill' : 'Rent Bill'}
                        </h3>
                        
                        <div className="space-y-4">
                          {/* Utility Bill Edit Form */}
                          {editingBill.type === 'utility' && (
                            <>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Bill Type</label>
                                  <select
                                    className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={editingBill.type}
                                    onChange={(e) => setEditingBill({...editingBill, type: e.target.value})}
                                  >
                                    <option value="Electric">Electric</option>
                                    <option value="Water">Water</option>
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                                  <input
                                    type="date"
                                    value={editingBill.date}
                                    onChange={(e) => setEditingBill({...editingBill, date: e.target.value})}
                                    className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  />
                                </div>
                              </div>
                              
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Previous Reading</label>
                                  <input
                                    type="number"
                                    value={editingBill.previousReading}
                                    onChange={(e) => setEditingBill({...editingBill, previousReading: parseFloat(e.target.value)})}
                                    className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Current Reading</label>
                                  <input
                                    type="number"
                                    value={editingBill.currentReading}
                                    onChange={(e) => {
                                      const currentReading = parseFloat(e.target.value);
                                      const consumption = currentReading - editingBill.previousReading;
                                      const amount = consumption * editingBill.rate;
                                      setEditingBill({
                                        ...editingBill, 
                                        currentReading,
                                        consumption,
                                        amount
                                      });
                                    }}
                                    className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  />
                                </div>
                              </div>
                              
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Rate</label>
                                  <input
                                    type="number"
                                    value={editingBill.rate}
                                    onChange={(e) => {
                                      const rate = parseFloat(e.target.value);
                                      const amount = editingBill.consumption * rate;
                                      setEditingBill({...editingBill, rate, amount});
                                    }}
                                    step="0.01"
                                    className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                  <select
                                    className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={editingBill.status}
                                    onChange={(e) => setEditingBill({...editingBill, status: e.target.value})}
                                  >
                                    <option value="unpaid">Unpaid</option>
                                    <option value="paid">Paid</option>
                                  </select>
                                </div>
                              </div>
                              
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Total Amount (₱)
                                </label>
                                <div className="flex items-center">
                                  <input
                                    type="number"
                                    value={editingBill.amount}
                                    onChange={(e) => setEditingBill({...editingBill, amount: parseFloat(e.target.value)})}
                                    className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    step="0.01"
                                  />
                                </div>
                                <div className="mt-1 text-sm text-gray-500">
                                  Automatically calculated: {editingBill.consumption} units × ₱{editingBill.rate} = ₱{(editingBill.consumption * editingBill.rate).toFixed(2)}
                                </div>
                              </div>
                            </>
                          )}
                          
                          {/* Rent Bill Edit Form */}
                          {editingBill.type === 'rent' && (
                            <>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Billing Period</label>
                                  <input
                                    type="text"
                                    value={editingBill.period}
                                    onChange={(e) => setEditingBill({...editingBill, period: e.target.value})}
                                    className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                  <select
                                    className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={editingBill.status}
                                    onChange={(e) => setEditingBill({...editingBill, status: e.target.value})}
                                  >
                                    <option value="unpaid">Unpaid</option>
                                    <option value="paid">Paid</option>
                                  </select>
                                </div>
                              </div>
                              
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₱)</label>
                                  <input
                                    type="number"
                                    value={editingBill.amount}
                                    onChange={(e) => setEditingBill({...editingBill, amount: parseFloat(e.target.value)})}
                                    className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                                  <input
                                    type="date"
                                    value={editingBill.dueDate}
                                    onChange={(e) => setEditingBill({...editingBill, dueDate: e.target.value})}
                                    className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  />
                                </div>
                              </div>
                              
                              {editingBill.status === 'paid' && (
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Payment Date</label>
                                  <input
                                    type="date"
                                    value={editingBill.paymentDate || ''}
                                    onChange={(e) => setEditingBill({...editingBill, paymentDate: e.target.value})}
                                    className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  />
                                </div>
                              )}
                            </>
                          )}
                          
                          <div className="pt-3 flex justify-between">
                            <button
                              onClick={() => {
                                setActiveTab('summary');
                                setEditingBill(null);
                              }}
                              className="bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded-md transition-colors"
                            >
                              Cancel
                            </button>
                            <div className="space-x-2">
                              <button
                                onClick={() => {
                                  // Here would be code to delete the bill
                                  setActiveTab('summary');
                                  setEditingBill(null);
                                }}
                                className="bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-md transition-colors"
                              >
                                Delete
                              </button>
                              <button
                                onClick={() => {
                                  // Here would be code to save the edited bill
                                  setActiveTab('summary');
                                  setEditingBill(null);
                                }}
                                className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-md transition-colors"
                              >
                                Save Changes
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PropertyUnitsPage;