 // /api/properties/units/meterReadings?unit_id=${unitId}

 "use client";
 import React, { useEffect, useState } from "react";
 import {
     LineChart,
     Line,
     XAxis,
     YAxis,
     CartesianGrid,
     Tooltip,
     ResponsiveContainer,
     Legend,
 } from "recharts";
 import axios from "axios";
 import { ChartBarIcon } from "@heroicons/react/24/outline";

 /**
  * @component    UnitConsumptionChart
  * @desc         Visualizes water and electricity meter reading utilization trends per unit.
  * @usedIn       UnitAnalytics / UnitDetails
  * @props
  *    - unitId: string
  */

 interface Reading {
     reading_date: string;
     utility_type: "water" | "electricity";
     previous_reading: number;
     current_reading: number;
 }

 interface ChartPoint {
     date: string;
     water: number;
     electricity: number;
 }

 interface UnitConsumptionChartProps {
     unitId: string;
 }

 export default function UnitConsumptionChart({ unitId }: UnitConsumptionChartProps) {
     const [data, setData] = useState<ChartPoint[]>([]);
     const [loading, setLoading] = useState(true);

     useEffect(() => {
         if (unitId) fetchReadings();
     }, [unitId]);

     const fetchReadings = async () => {
         try {
             setLoading(true);
             const res = await axios.get(`/api/properties/units/meterReadings?unit_id=${unitId}`);
             const { readings } = res.data;

             if (!readings || readings.length === 0) {
                 setData([]);
                 return;
             }

             // 🧮 Group readings by date, then map water/electricity into same object
             const grouped: Record<string, Partial<ChartPoint>> = {};

             readings.forEach((r: Reading) => {
                 const date = new Date(r.reading_date).toLocaleDateString("en-US", {
                     month: "short",
                     day: "numeric",
                 });

                 if (!grouped[date]) grouped[date] = { date, water: 0, electricity: 0 };

                 const consumption = Math.max(0, r.current_reading - r.previous_reading);
                 if (r.utility_type === "water") grouped[date].water = consumption;
                 if (r.utility_type === "electricity") grouped[date].electricity = consumption;
             });

             // Convert to array sorted by date ascending
             const chartData = Object.values(grouped).sort((a, b) => {
                 return new Date(a.date!).getTime() - new Date(b.date!).getTime();
             });

             setData(chartData as ChartPoint[]);
         } catch (error) {
             console.error("❌ Error loading readings:", error);
             setData([]);
         } finally {
             setLoading(false);
         }
     };

     return (
         <div className="w-full bg-white p-5 sm:p-6 rounded-2xl border border-gray-100 shadow-sm">
             <div className="flex items-center gap-2 mb-4">
                 <ChartBarIcon className="h-5 w-5 text-blue-600" />
                 <h2 className="text-lg sm:text-xl font-bold text-gray-800">
                     Meter Reading Utilization
                 </h2>
             </div>

             {loading ? (
                 <p className="text-sm text-gray-500 text-center py-6">Loading chart...</p>
             ) : data.length === 0 ? (
                 <p className="text-sm text-gray-500 text-center py-6">
                     No meter readings found for this unit.
                 </p>
             ) : (
                 <div className="h-72 sm:h-96">
                     <ResponsiveContainer width="100%" height="100%">
                         <LineChart
                             data={data}
                             margin={{ top: 10, right: 30, left: 0, bottom: 10 }}
                         >
                             <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                             <XAxis
                                 dataKey="date"
                                 tick={{ fontSize: 12 }}
                                 tickLine={false}
                                 axisLine={{ stroke: "#e5e7eb" }}
                             />
                             <YAxis
                                 label={{
                                     value: "Consumption",
                                     angle: -90,
                                     position: "insideLeft",
                                     style: { textAnchor: "middle", fontSize: 12, fill: "#374151" },
                                 }}
                                 tick={{ fontSize: 12 }}
                                 axisLine={{ stroke: "#e5e7eb" }}
                                 tickLine={false}
                             />
                             <Tooltip
                                 contentStyle={{ fontSize: 12, borderRadius: 10 }}
                                 formatter={(value: number, name: string) =>
                                     name === "Water" ? [`${value} m³`, "Water"] : [`${value} kWh`, "Electricity"]
                                 }
                             />
                             <Legend wrapperStyle={{ fontSize: 12 }} />
                             <Line
                                 type="monotone"
                                 dataKey="water"
                                 name="Water"
                                 stroke="#3b82f6"
                                 strokeWidth={2.5}
                                 dot={{ r: 3 }}
                                 activeDot={{ r: 5 }}
                             />
                             <Line
                                 type="monotone"
                                 dataKey="electricity"
                                 name="Electricity"
                                 stroke="#10b981"
                                 strokeWidth={2.5}
                                 dot={{ r: 3 }}
                                 activeDot={{ r: 5 }}
                             />
                         </LineChart>
                     </ResponsiveContainer>
                 </div>
             )}
         </div>
     );
 }
