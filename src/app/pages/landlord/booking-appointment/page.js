'use client';
import React, { useState, useEffect } from 'react';
import dayjs from 'dayjs';
import { ChevronLeft, ChevronRight, Calendar, Clock, Home, User } from 'lucide-react';
import LandlordLayout from '../../../../components/navigation/sidebar-landlord';
import axios from 'axios';
import useAuth from '../../../../../hooks/useSession';

const BookingAppointment = () => {
  const { user } = useAuth();
  const [currentMonth, setCurrentMonth] = useState(dayjs());
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(null);
  const [showDisapprovalModal, setShowDisapprovalModal] = useState(false);
  const [selectedVisitId, setSelectedVisitId] = useState(null);
  const [disapprovalReason, setDisapprovalReason] = useState("");

  // Fetch all visits when component mounts
  useEffect(() => {
    if (user?.landlord_id) {
      fetchVisits();
    }
  }, [user]);
  
  const fetchVisits = async () => {
    try {
      if (!user?.landlord_id) {
        console.error("Landlord ID is not available");
        setLoading(false);
        return;
      }
      
      const response = await axios.get(`/api/landlord/visits/visit-all?landlord_id=${user.landlord_id}`);
      setVisits(response.data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching visits:", error);
      setLoading(false);
    }
  };

  const approveVisit = async (visitId) => {
    try {
      await axios.put("/api/landlord/visits/respond", {
        visit_id: visitId,
        status: "approved"
      });
      
      // Update local state
      setVisits(visits.map(visit => 
        visit.visit_id === visitId ? { ...visit, status: "approved" } : visit
      ));
    } catch (error) {
      console.error("Error approving visit:", error);
    }
  };

  const handleDisapprove = (visitId) => {
    setSelectedVisitId(visitId);
    setShowDisapprovalModal(true);
  };

  const submitDisapproval = async () => {
    try {
      await axios.put("/api/landlord/visits/respond", {
        visit_id: selectedVisitId,
        status: "disapproved",
        reason: disapprovalReason
      });
      
      // Update local state
      setVisits(visits.map(visit => 
        visit.visit_id === selectedVisitId ? 
        { ...visit, status: "disapproved", disapproval_reason: disapprovalReason } : 
        visit
      ));
      
      // Close modal and reset state
      setShowDisapprovalModal(false);
      setDisapprovalReason("");
    } catch (error) {
      console.error("Error disapproving visit:", error);
    }
  };

  const prevMonth = () => setCurrentMonth(currentMonth.subtract(1, 'month'));
  const nextMonth = () => setCurrentMonth(currentMonth.add(1, 'month'));
  
  // Format date for calendar display
  const formatVisitDate = (dateString) => {
    return dayjs(dateString.split('T')[0]);
  };

  // Group visits by date for the calendar view
  const visitsByDate = visits.reduce((acc, visit) => {
    const dateKey = formatVisitDate(visit.visit_date).format('YYYY-MM-DD');
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(visit);
    return acc;
  }, {});

  if (loading) {
    return (
      <LandlordLayout>
        <div className="flex justify-center items-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </LandlordLayout>
    );
  }

  return (
    <LandlordLayout>
      <div className="flex flex-col lg:flex-row min-h-screen p-6 bg-gray-100 gap-6">
        {/* Visit Requests Section */}
        <div className="w-full lg:w-1/3 bg-white rounded-lg shadow-md overflow-hidden">
          <div className="bg-blue-600 text-white px-4 py-3">
            <h2 className="text-lg font-bold">Property Visit Requests</h2>
          </div>
          
          {/* Pending Visits */}
          <div className="px-4 py-3 bg-blue-50">
            <h3 className="text-md font-bold text-blue-800 mb-2 flex items-center">
              <Clock className="w-4 h-4 mr-2" /> Pending for Approval
            </h3>
            
            {visits.filter(v => v.status === 'pending').length === 0 ? (
              <p className="text-gray-500 italic p-2">No pending requests</p>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {visits.filter(v => v.status === 'pending').map((visit) => (
                  <div key={visit.visit_id} className="bg-white p-3 rounded-lg shadow border-l-4 border-yellow-400">
                    <div className="flex justify-between">
                      <div>
                        <p className="font-medium flex items-center">
                          <User className="w-4 h-4 mr-1 text-gray-500" />
                          {visit.tenant_first_name} {visit.tenant_last_name}
                        </p>
                        <p className="text-sm text-gray-600 flex items-center mt-1">
                          <Home className="w-4 h-4 mr-1 text-gray-500" />
                          {visit.property_name} - {visit.unit_name}
                        </p>
                        <p className="text-sm font-semibold text-blue-600 mt-1">
                          {formatVisitDate(visit.visit_date).format('MMMM D, YYYY')} at {visit.visit_time}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <button 
                        onClick={() => approveVisit(visit.visit_id)} 
                        className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 transition-colors flex-1"
                      >
                        Approve
                      </button>
                      <button 
                        onClick={() => handleDisapprove(visit.visit_id)} 
                        className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors flex-1"
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Approved Visits */}
          <div className="px-4 py-3 mt-3">
            <h3 className="text-md font-bold text-green-700 mb-2 flex items-center">
              <Calendar className="w-4 h-4 mr-2" /> Upcoming Visits
            </h3>
            
            {visits.filter(v => v.status === 'approved').length === 0 ? (
              <p className="text-gray-500 italic p-2">No upcoming visits</p>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {visits.filter(v => v.status === 'approved').map((visit) => (
                  <div key={visit.visit_id} className="bg-white p-3 rounded-lg shadow border-l-4 border-green-400">
                    <p className="font-medium flex items-center">
                      <User className="w-4 h-4 mr-1 text-gray-500" />
                      {visit.tenant_first_name} {visit.tenant_last_name}
                    </p>
                    <p className="text-sm text-gray-600 flex items-center mt-1">
                      <Home className="w-4 h-4 mr-1 text-gray-500" />
                      {visit.property_name} - {visit.unit_name}
                    </p>
                    <p className="text-sm font-semibold text-green-600 mt-1">
                      {formatVisitDate(visit.visit_date).format('MMMM D, YYYY')} at {visit.visit_time}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Declined Visits */}
          <div className="px-4 py-3 mt-3">
            <h3 className="text-md font-bold text-red-700 mb-2 flex items-center">
              <Calendar className="w-4 h-4 mr-2" /> Declined Visits
            </h3>
            
            {visits.filter(v => v.status === 'disapproved').length === 0 ? (
              <p className="text-gray-500 italic p-2">No declined visits</p>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {visits.filter(v => v.status === 'disapproved').map((visit) => (
                  <div key={visit.visit_id} className="bg-white p-3 rounded-lg shadow border-l-4 border-red-400">
                    <p className="font-medium flex items-center">
                      <User className="w-4 h-4 mr-1 text-gray-500" />
                      {visit.tenant_first_name} {visit.tenant_last_name}
                    </p>
                    <p className="text-sm text-gray-600 flex items-center mt-1">
                      <Home className="w-4 h-4 mr-1 text-gray-500" />
                      {visit.property_name} - {visit.unit_name}
                    </p>
                    <p className="text-sm font-semibold text-red-600 mt-1">
                      {formatVisitDate(visit.visit_date).format('MMMM D, YYYY')} at {visit.visit_time}
                    </p>
                    {visit.disapproval_reason && (
                      <p className="text-sm text-gray-500 mt-1 italic">
                        Reason: {visit.disapproval_reason}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Calendar Section */}
        <div className="w-full lg:w-2/3 bg-white p-6 rounded-lg shadow-lg">
          <div className="flex justify-between items-center mb-6">
            <button onClick={prevMonth} className="text-gray-700 hover:bg-gray-100 p-2 rounded-full">
              <ChevronLeft className="w-6 h-6" />
            </button>
            <h2 className="text-xl font-bold">{currentMonth.format('MMMM YYYY')}</h2>
            <button onClick={nextMonth} className="text-gray-700 hover:bg-gray-100 p-2 rounded-full">
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-2 mb-2">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
              <div key={day} className="text-center font-medium text-gray-500 py-2">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2">
            {/* Empty cells for days before the first day of month */}
            {Array.from({ length: (currentMonth.startOf('month').day() || 7) - 1 }).map((_, i) => (
              <div key={`empty-start-${i}`} className="p-2 h-24"></div>
            ))}
            
            {/* Calendar days */}
            {Array.from({ length: currentMonth.daysInMonth() }).map((_, i) => {
              const date = currentMonth.date(i + 1);
              const dateKey = date.format('YYYY-MM-DD');
              const dayVisits = visitsByDate[dateKey] || [];
              const hasApprovedVisit = dayVisits.some(v => v.status === 'approved');
              const hasPendingVisit = dayVisits.some(v => v.status === 'pending');
              
              let bgClass = '';
              if (hasApprovedVisit) bgClass = 'bg-green-50 border-green-200';
              else if (hasPendingVisit) bgClass = 'bg-yellow-50 border-yellow-200';
              
              const isToday = date.format('YYYY-MM-DD') === dayjs().format('YYYY-MM-DD');
              const isSelected = date.format('YYYY-MM-DD') === selectedDate;
              
              return (
                <div 
                  key={i}
                  onClick={() => setSelectedDate(date.format('YYYY-MM-DD'))}
                  className={`p-2 border rounded-lg h-24 overflow-hidden cursor-pointer transition-colors
                    ${bgClass}
                    ${isToday ? 'ring-2 ring-blue-500' : ''}
                    ${isSelected ? 'ring-2 ring-indigo-500' : ''}
                    hover:bg-gray-50`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className={`font-bold text-lg ${isToday ? 'text-blue-600' : ''}`}>
                      {date.date()}
                    </span>
                    {dayVisits.length > 0 && (
                      <span className="bg-gray-200 text-gray-700 rounded-full px-2 py-1 text-xs">
                        {dayVisits.length}
                      </span>
                    )}
                  </div>
                  
                  {dayVisits.length > 0 && (
                    <div className="space-y-1">
                      {dayVisits.slice(0, 2).map((visit) => (
                        <div 
                          key={visit.visit_id} 
                          className={`text-xs truncate px-1 py-0.5 rounded
                            ${visit.status === 'approved' ? 'bg-green-100 text-green-800' : 
                              visit.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                              'bg-red-100 text-red-800'}`}
                        >
                          {visit.visit_time} - {visit.tenant_first_name}
                        </div>
                      ))}
                      {dayVisits.length > 2 && (
                        <div className="text-xs text-gray-500">
                          +{dayVisits.length - 2} more
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
            
            {/* Empty cells for days after the last day of month */}
            {Array.from({ 
              length: 7 - ((currentMonth.startOf('month').day() || 7) - 1 + currentMonth.daysInMonth()) % 7 
            }).map((_, i) => (
              <div key={`empty-end-${i}`} className="p-2 h-24"></div>
            ))}
          </div>

          {/* Selected Date Details */}
          {selectedDate && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <h3 className="text-lg font-bold mb-3">
                Scheduled Visits on {dayjs(selectedDate).format('MMMM D, YYYY')}
              </h3>
              
              {visitsByDate[selectedDate] && visitsByDate[selectedDate].length > 0 ? (
                <div className="space-y-3">
                  {visitsByDate[selectedDate].map((visit) => (
                    <div 
                      key={visit.visit_id} 
                      className={`p-3 rounded-lg border-l-4
                        ${visit.status === 'approved' ? 'bg-green-50 border-green-500' : 
                          visit.status === 'pending' ? 'bg-yellow-50 border-yellow-500' : 
                          'bg-red-50 border-red-500'}`}
                    >
                      <div className="flex justify-between">
                        <div>
                          <p className="font-medium">
                            {visit.tenant_first_name} {visit.tenant_last_name}
                          </p>
                          <p className="text-sm text-gray-600">
                            {visit.property_name} - {visit.unit_name}
                          </p>
                          <p className="text-sm font-semibold">
                            Time: {visit.visit_time}
                          </p>
                          <p className="text-sm mt-1">
                              Status: <span className={`font-medium
                                ${visit?.status === 'approved' ? 'text-green-600' : 
                                  visit?.status === 'pending' ? 'text-yellow-600' : 
                                  visit?.status === 'disapproved' ? 'text-red-600' : 'text-gray-600'}`}
                              >
                                {visit?.status ? visit.status.charAt(0).toUpperCase() + visit.status.slice(1) : "Loading..."}
                              </span>
                            </p>
                          {visit.disapproval_reason && (
                            <p className="text-sm text-gray-500 mt-1">
                              Reason: {visit.disapproval_reason}
                            </p>
                          )}
                        </div>
                        
                        {visit.status === 'pending' && (
                          <div className="flex flex-col gap-2">
                            <button 
                              onClick={() => approveVisit(visit.visit_id)}
                              className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600"
                            >
                              Approve
                            </button>
                            <button 
                              onClick={() => handleDisapprove(visit.visit_id)}
                              className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
                            >
                              Decline
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No visits scheduled for this date.</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Disapproval Modal */}
      {showDisapprovalModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96 max-w-full mx-4">
            <h2 className="text-lg font-bold mb-4">Provide Reason for Declining</h2>
            <textarea
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows="4"
              value={disapprovalReason}
              onChange={(e) => setDisapprovalReason(e.target.value)}
              placeholder="Enter reason for declining this visit request..."
            ></textarea>
            <div className="flex justify-end mt-4 gap-2">
              <button
                onClick={() => setShowDisapprovalModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={submitDisapproval}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                disabled={!disapprovalReason.trim()}
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </LandlordLayout>
  );
};

export default BookingAppointment;