'use client';
import React, { useState } from 'react';
import dayjs from 'dayjs';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import LandlordLayout from "../../../../components/navigation/sidebar-landlord";

const BookingAppointment = () => {
  const [currentMonth, setCurrentMonth] = useState(dayjs());
  const [visits, setVisits] = useState([
    { id: 1, name: 'Aidan Tsang', date: '2025-01-31', time: '2:00 PM', unit: 'Unit 706', status: 'pending' },
    { id: 2, name: 'Jennifer Mandel', date: '2025-02-03', time: '2:00 PM', unit: 'Unit 706', status: 'pending' },
    { id: 3, name: 'Steven Liao', date: '2025-02-01', time: '2:00 PM', unit: 'Unit 706', status: 'upcoming' },
    { id: 4, name: 'Uncle Roger', date: '2025-02-04', time: '2:00 PM', unit: 'Unit 706', status: 'upcoming' },
  ]);

  const prevMonth = () => setCurrentMonth(currentMonth.subtract(1, 'month'));
  const nextMonth = () => setCurrentMonth(currentMonth.add(1, 'month'));
  
  const approveVisit = (id) => {
    setVisits(visits.map(visit => visit.id === id ? { ...visit, status: 'upcoming' } : visit));
  };

  const [selectedDate, setSelectedDate] = useState(null);
  
  return (
    <LandlordLayout>
      <div className="flex flex-col lg:flex-row min-h-screen p-6 bg-gray-100 gap-6">
        {/* Visit Requests Section */}
        <div className="w-full lg:w-1/3 bg-blue-100 rounded-lg p-4">
          <h2 className="text-lg font-bold text-blue-800 mb-2">Pending for Approval</h2>
          {visits.filter(v => v.status === 'pending').map((visit) => (
            <div key={visit.id} className="bg-white p-3 rounded-lg shadow mb-2">
              <p className="font-medium">{visit.name}</p>
              <p className="text-sm text-gray-600">{visit.unit}</p>
              <p className="text-sm font-semibold text-blue-600">{dayjs(visit.date).format('MMMM D, YYYY')} : {visit.time}</p>
              <div className="flex gap-2 mt-2">
                <button onClick={() => approveVisit(visit.id)} className="px-3 py-1 bg-green-500 text-white rounded">✔</button>
                <button className="px-3 py-1 bg-red-500 text-white rounded">✖</button>
              </div>
            </div>
          ))}

          <h2 className="text-lg font-bold text-blue-800 mt-4">Upcoming Visits</h2>
          {visits.filter(v => v.status === 'upcoming').map((visit) => (
            <div key={visit.id} className="bg-white p-3 rounded-lg shadow mb-2">
              <p className="font-medium">{visit.name}</p>
              <p className="text-sm text-gray-600">{visit.unit}</p>
              <p className="text-sm font-semibold text-blue-600">{dayjs(visit.date).format('MMMM D, YYYY')} : {visit.time}</p>
            </div>
          ))}
        </div>

        {/* Calendar Section */}
        <div className="w-full lg:w-2/3 bg-white p-6 rounded-lg shadow-lg">
          <div className="flex justify-between items-center mb-4">
            <button onClick={prevMonth} className="text-gray-700"><ChevronLeft /></button>
            <h2 className="text-xl font-bold">{currentMonth.format('MMMM YYYY')}</h2>
            <button onClick={nextMonth} className="text-gray-700"><ChevronRight /></button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center font-medium">
            {['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'].map((day) => (
              <div key={day} className="p-2 text-gray-700">{day}</div>
            ))}
            {[...Array(currentMonth.startOf('month').day())].map((_, i) => (
              <div key={i} className="p-4"></div>
            ))}
            {[...Array(currentMonth.daysInMonth())].map((_, i) => {
              const date = currentMonth.date(i + 1);
              const hasVisit = visits.some(v => v.status === 'upcoming' && v.date === date.format('YYYY-MM-DD'));
              return (
                <div 
                  key={i} 
                  onClick={() => setSelectedDate(date.format('YYYY-MM-DD'))} 
                  className={`p-4 border rounded-lg cursor-pointer ${hasVisit ? 'bg-green-200' : 'hover:bg-gray-200'}`}>
                  <span className="font-bold">{date.date()}</span>
                </div>
              );
            })}
          </div>

          {selectedDate && (
            <div className="mt-4 p-4 bg-gray-200 rounded-lg">
              <h3 className="text-lg font-bold">Appointments on {dayjs(selectedDate).format('MMMM D, YYYY')}</h3>
              {visits.filter(v => v.date === selectedDate && v.status === 'upcoming').map((visit) => (
                <p key={visit.id} className="text-sm font-medium">{visit.time} - {visit.name}</p>
              ))}
            </div>
          )}
        </div>
      </div>
    </LandlordLayout>
  );
};

export default BookingAppointment;
