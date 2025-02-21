'use client';
import React, { useState } from 'react';
import { EyeIcon, ChevronLeftIcon, ChevronRightIcon, ArrowLeftIcon } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import LandlordLayout from '../../../../components/navigation/sidebar-landlord';

const MaintenanceRequestPage = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const initialTab = searchParams?.get('tab') || 'pending';
    const [activeTab, setActiveTab] = useState(initialTab);
  
  // Mock data for different tabs
  const pendingRequests = [
    { id: 1, name: 'Robert Ling', property: 'XYZ Homes', unit: '202', category: 'CAT - 1', type: '(Plumbing Issues)', date: '11/29/24', status: 'PENDING' },
    { id: 2, name: 'Xander De Leon', property: 'XYZ Homes', unit: '203', category: 'CAT - 2', type: '(Electrical Issues)', date: '11/29/24', status: 'PENDING' },
    // More pending requests...
  ];

  const scheduledRequests = [
    { id: 1, name: 'Robert Ling', property: 'XYZ Homes', unit: '20 2', category: 'CAT - 1', type: '(Plumbing Issues)', date: '11/29/24', status: 'APPROVED' },
    { id: 2, name: 'Xander De Leon', property: 'XYZ Homes', unit: '203', category: 'CAT - 2', type: '(Electrical Issues)', date: '11/29/24', status: 'APPROVED' },
    // More scheduled requests...
  ];

  const inProgressRequests = [
    { id: 1, name: 'Jan Protacio', property: 'XYZ Homes', unit: '202', category: 'CAT - 1', type: '(Plumbing Issues)', date: '11/29/24', status: 'In Progress' },
    { id: 2, name: 'Michael Angelo', property: 'XYZ Homes', unit: '303', category: 'CAT - 2', type: '(Electrical Issues)', date: '11/29/24', status: 'In Progress' },
    // More in progress requests...
  ];

  const completedRequests = [
    { id: 1, name: 'Robert Ling', property: 'XYZ Homes', unit: '322', category: 'CAT - 1', type: '(Plumbing Issues)', date: '11/29/24', status: 'COMPLETED' },
    { id: 2, name: 'Jimmy Dominic', property: 'XYZ Homes', unit: '512', category: 'CAT - 2', type: '(Electrical Issues)', date: '11/29/24', status: 'COMPLETED' },
    // More completed requests...
  ];

  // Choose the appropriate data based on the active tab
  const getActiveRequests = () => {
    switch (activeTab) {
      case 'pending':
        return pendingRequests;
      case 'schedule':
        return scheduledRequests;
      case 'progress':
        return inProgressRequests;
      case 'completed':
        return completedRequests;
      default:
        return pendingRequests;
    }
  };

  // Determine appropriate action button based on the active tab
  const renderActionButton = (request) => {
    switch (activeTab) {
      case 'pending':
        return (
          <div className="flex space-x-2">
            <button className="p-1 bg-green-100 rounded-md text-green-600 hover:bg-green-200">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </button>
            <button className="p-1 bg-red-100 rounded-md text-red-600 hover:bg-red-200">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        );
      case 'schedule':
        return (
          <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
            Set Schedule
          </button>
        );
      case 'progress':
        return null; // No action for in-progress
      case 'completed':
        return null; // No action for completed
      default:
        return null;
    }
  };

  // Get status style based on status text
  const getStatusStyle = (status) => {
    switch (status.toUpperCase()) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'APPROVED':
        return 'bg-green-100 text-green-800';
      case 'IN PROGRESS':
        return 'bg-blue-100 text-blue-800';
      case 'COMPLETED':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-500';
    }
  };

  const handleViewRequest = (id) => {
    router.push(`/maintenance-request/view/${id}?status=${activeTab}`);
  };

  return (
    <div className="p-6 w-full bg-gray-50">
      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center text-blue-900">
          <span className="mr-2">
            <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </span>
          Maintenance Request
        </h1>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200 bg-white rounded-t-lg">
        <div className="flex">
          {[
            
            { key: 'pending', label: 'Pending Request' },
            { key: 'schedule', label: 'Schedule Request' },
            { key: 'progress', label: 'In Progress Request' },
            { key: 'completed', label: 'Completed Request' }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`py-3 px-6 font-medium text-sm ${
                activeTab === tab.key
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
        <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
            Name
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
            Property / Unit
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
            Category Type
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
            Date Created
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
            Status
            </th>
            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-1/12">
            View
            </th>
            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-1/12">
            Action
            </th>
        </tr>
        </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
            {getActiveRequests().map((request) => (
                <tr key={request.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{request.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div>{request.property}</div>
                    <div>Unit {request.unit}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div>{request.category}</div>
                    <div className="text-gray-400">{request.type}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{request.date}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusStyle(request.status)}`}>
                    {request.status}
                    </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                    <button onClick={() => handleViewRequest(request.id)} className="text-blue-600 hover:text-blue-900">
                    <EyeIcon className="h-5 w-5" />
                    </button>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                    {activeTab === 'pending' || activeTab === 'schedule' ? renderActionButton(request) : <div className="h-5"></div>}
                </td>
                </tr>
            ))}
</tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-4 px-4">
        <div className="text-sm text-gray-500">
          Showing 1 to 10 out of {activeTab === 'completed' ? '22' : '12'}
        </div>
        <div className="flex justify-end space-x-2">
          <button className="p-2 rounded-md border border-gray-300 text-gray-500 hover:bg-gray-50">
            <ChevronLeftIcon className="h-4 w-4" />
          </button>
          <button className="px-3 py-1 rounded-md border border-blue-500 bg-blue-500 text-white">
            1
          </button>
          <button className="px-3 py-1 rounded-md border border-gray-300 text-gray-500 hover:bg-gray-50">
            2
          </button>
          <button className="p-2 rounded-md border border-gray-300 text-gray-500 hover:bg-gray-50">
            <ChevronRightIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

const MaintenanceRequest = () => {
  return (
    <LandlordLayout>
      <MaintenanceRequestPage />
    </LandlordLayout>
  );
};

export default MaintenanceRequest;