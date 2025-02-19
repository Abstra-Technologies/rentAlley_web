// "use client";
// import React from "react";
// import { FaStar } from "react-icons/fa";

// const ViewSingleProperty = () => {
//   const imageWidth = 500;
//   const imageHeight = 300;

//   return (
//     <div className="container mx-auto py-8">
//       {/* Header */}
//       <h1 className="text-2xl font-bold mb-4">XYZ Residences</h1>

//       {/* Image Grid */}
//       <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-4">
//         {/* Image 1 */}
//         <div className="bg-gray-300 rounded-lg overflow-hidden relative">
//           <div style={{ paddingTop: `${(imageHeight / imageWidth) * 100}%` }} />{" "}
//           {/* Aspect Ratio Placeholder */}
//         </div>

//         {/* Image 2 */}
//         <div className="bg-gray-300 rounded-lg overflow-hidden relative">
//           <div style={{ paddingTop: `${(imageHeight / imageWidth) * 100}%` }} />
//         </div>

//         {/* Image 3 */}
//         <div className="bg-gray-300 rounded-lg overflow-hidden relative">
//           <div style={{ paddingTop: `${(imageHeight / imageWidth) * 100}%` }} />
//         </div>

//         {/* Image 4 */}
//         <div className="bg-gray-300 rounded-lg overflow-hidden relative">
//           <div style={{ paddingTop: `${(imageHeight / imageWidth) * 100}%` }} />
//         </div>

//         {/* Image 5 */}
//         <div className="bg-gray-300 rounded-lg overflow-hidden relative">
//           <div style={{ paddingTop: `${(imageHeight / imageWidth) * 100}%` }} />
//         </div>

//         {/* View All Photos */}
//         <div className="relative bg-gray-300 rounded-lg overflow-hidden">
//           <div style={{ paddingTop: `${(imageHeight / imageWidth) * 100}%` }} />
//           <div className="absolute inset-0 bg-black opacity-50 rounded-lg flex items-center justify-center text-white text-lg font-semibold">
//             <a href="#" className="hover:underline">
//               View All Photos
//             </a>
//           </div>
//         </div>
//       </div>

//       {/* Details */}
//       <div className="mb-4">
//         <h2 className="text-xl font-semibold">
//           XYZ Residences in Metro Manila, Manila
//         </h2>
//         <p className="text-gray-600">2 bedrooms · 1 Kitchen · 1 bath</p>
//       </div>

//       {/* Rating */}
//       <div className="flex items-center mb-4">
//         {/* Stars */}
//         <span className="text-yellow-500 mr-1">
//           {/* {[...Array(5)].map((_, index) => (
//             <FaStar key={index} />
//           ))} */}
//           <FaStar />
//         </span>
//         {/* Rating Value and Review Count */}
//         <span className="text-gray-700">4.90 · 8 reviews</span>
//       </div>

//       {/* Grid Layout for Content and Inquire Section */}
//       <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
//         {/* Content Section */}
//         <div>
//           {/* Highlights */}
//           <div className="mb-4">
//             <h3 className="text-lg font-semibold">Highlights</h3>
//             <ul className="list-disc pl-5 text-gray-700">
//               <li>1 Month Deposit</li>
//               <li>Free Wifi</li>
//               <li>Refrigerator</li>
//             </ul>
//           </div>

//           {/* Description */}
//           <div className="mb-4">
//             <h3 className="text-lg font-semibold">Description</h3>
//             <p className="text-gray-700">
//               Soar 20 ft in the trees as you overlook the Strait. Relax in many
//               areas of this unique craftsman treehouse. You can be mesmerized as
//               you sit or sleep in the large window seat watching the ships sail
//               by, eagles fly across your window, deer eat in the meadow below-
//               or spend time in the hammock hanging from the tree inside or the
//               loft hammock. Every part of the treehouse is unique-you will find
//               yourself wanting to unplug and enjoy every aspect of the house.
//             </p>
//             <button className="text-blue-500 hover:underline">
//               Show more &gt;
//             </button>
//           </div>

//           {/* Features */}
//           <div className="mb-4">
//             <h3 className="text-lg font-semibold">Features</h3>
//             <ul className="list-disc pl-5 text-gray-700">
//               <li>Bed</li>
//               <li>Bathroom</li>
//               <li>Pets are allowed</li>
//               <li>29sqm</li>
//             </ul>
//           </div>

//           {/* Amenities */}
//           <div className="mb-4">
//             <h3 className="text-lg font-semibold">Amenities</h3>
//             <ul className="list-disc pl-5 text-gray-700">
//               <li>Kitchen</li>
//               <li>Wifi</li>
//               <li>Refrigerator</li>
//               <li>Study Hub</li>
//               <li>Swimming Pool</li>
//               <li>Gym</li>
//             </ul>
//           </div>

//           {/* Payment Terms */}
//           <div className="mb-4">
//             <h3 className="text-lg font-semibold">Payment Terms</h3>
//             <ul className="list-disc pl-5 text-gray-700">
//               <li>Advance Payments: P20,000 (1 month)</li>
//               <li>Security Deposit: P15,000 (1 month)</li>
//               <li>Electricity Bills: Inclusive</li>
//               <li>Water Bills: Inclusive</li>
//             </ul>
//           </div>

//           {/* Reviews */}
//           <div>
//             <h3 className="text-lg font-semibold">Reviews</h3>

//             {/* Review 1 */}
//             <div className="mb-2 p-4 border rounded-lg">
//               <div className="flex items-center mb-1">
//                 <div className="w-8 h-8 rounded-full bg-gray-300 mr-2"></div>{" "}
//                 {/* Placeholder for avatar */}
//                 <div>
//                   <p className="font-semibold">Hanna</p>
//                   <p className="text-sm text-gray-600">January 2020</p>
//                 </div>
//               </div>
//               <p className="text-gray-700">
//                 I had a solid good stay for 1 year in this place.
//               </p>
//             </div>

//             {/* Review 2 */}
//             <div className="mb-2 p-4 border rounded-lg">
//               <div className="flex items-center mb-1">
//                 <div className="w-8 h-8 rounded-full bg-gray-300 mr-2"></div>
//                 <div>
//                   <p className="font-semibold">Matilda</p>
//                   <p className="text-sm text-gray-600">January 2021</p>
//                 </div>
//               </div>
//               <p className="text-gray-700">The place is nice and spacious.</p>
//             </div>

//             {/* Review 3 */}
//             <div className="mb-2 p-4 border rounded-lg">
//               <div className="flex items-center mb-1">
//                 <div className="w-8 h-8 rounded-full bg-gray-300 mr-2"></div>
//                 <div>
//                   <p className="font-semibold">Josep</p>
//                   <p className="text-sm text-gray-600">January 2023</p>
//                 </div>
//               </div>
//               <p className="text-gray-700">
//                 It's a good place to rent. stayed here for 2 years!
//               </p>
//             </div>

//             {/* Review 4 */}
//             <div className="mb-2 p-4 border rounded-lg">
//               <div className="flex items-center mb-1">
//                 <div className="w-8 h-8 rounded-full bg-gray-300 mr-2"></div>
//                 <div>
//                   <p className="font-semibold">Cocoy</p>
//                   <p className="text-sm text-gray-600">January 2025</p>
//                 </div>
//               </div>
//               <p className="text-gray-700">
//                 The place is getting old, but it's still okay.
//               </p>
//             </div>
//           </div>
//         </div>

//         {/* Inquire Section */}
//         <div className="border rounded-lg shadow-md p-4">
//           {/* Inquire Button */}
//           <button className="w-full bg-blue-800 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mb-4">
//             Inquire
//           </button>

//           {/* Schedule a Visit Button */}
//           <button className="w-full border border-blue-800 text-blue-800 font-bold py-2 px-4 rounded mb-4 hover:bg-gray-100">
//             Schedule a Visit
//           </button>

//           {/* Price */}
//           <div className="mb-4">
//             <p className="text-gray-700 text-center">
//               P10,000 / P108,000 <br />
//               <span className="text-sm">monthly yearly</span>
//             </p>
//           </div>

//           {/* Message Landlord Link */}
//           <div className="flex items-center mb-4">
//             <div className="w-6 h-6 rounded-full bg-blue-200 mr-2"></div>{" "}
//             {/* Placeholder for icon */}
//             <p className="text-blue-500 text-sm">
//               Send a message to landlord? <br />
//               <span className="underline">Need to Inquire?</span>
//             </p>
//           </div>

//           {/* Inquiry Textarea */}
//           <textarea
//             className="w-full h-24 p-2 border rounded-lg mb-4"
//             placeholder="ex. Is there any discounts?"
//           ></textarea>

//           {/* Terms and Conditions Checkbox */}
//           <div className="flex items-center mb-4">
//             <input type="checkbox" id="terms" className="mr-2" />
//             <label htmlFor="terms" className="text-gray-700 text-sm">
//               I have read and agreed to the{" "}
//               <span className="underline">Terms</span>,{" "}
//               <span className="underline">Privacy Policy</span>, and{" "}
//               <span className="underline">Safety Guidelines</span>.
//             </label>
//           </div>

//           {/* Send Message Button */}
//           <button className="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
//             Send Message
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default ViewSingleProperty;

"use client";

import { useEffect, useState } from "react";
import {useParams, useRouter} from "next/navigation";
import Image from "next/image";
import ScheduleVisitForm from "../../../../components/tenant/ScheduleVisitForm";
import useAuth from "../../../../../hooks/useSession";

export default function PropertyDetails() {
  const { user } = useAuth();
  const { id } = useParams();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedUnitId, setSelectedUnitId] = useState(null);
const router = useRouter();
  useEffect(() => {
    async function fetchPropertyDetails() {
      try {
        const res = await fetch(`/api/properties/getProperty?id=${id}`);
        if (!res.ok) throw new Error("Failed to fetch property details");

        const data = await res.json();
        setProperty(data);
      } catch (error) {
        console.error(error.message);
      } finally {
        setLoading(false);
      }
    }
    fetchPropertyDetails();
  }, [id]);

  if (loading) return <p className="text-center text-lg">Loading...</p>;
  if (!property)
    return <p className="text-center text-lg">Property not found.</p>;

  const handleUnitChange = (e) => {
    setSelectedUnitId(e.target.value ? parseInt(e.target.value) : null); // Set selected unit ID
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-4">{property.property_name}</h1>

      {/* 🔓 Property Image */}
      {property.property_photo ? (
        <Image
          src={property.property_photo}
          alt={property.property_name}
          width={500}
          height={350}
          className="rounded-lg"
        />
      ) : (
        <div className="w-[500px] h-[350px] bg-gray-300 flex items-center justify-center">
          No Property Image
        </div>
      )}

      <p className="text-gray-600">
        {property.city}, {property.province}
      </p>
      <p className="text-sm text-gray-500">
        {property.property_type.charAt(0).toUpperCase() +
          property.property_type.slice(1)}
      </p>
      <p className="text-md text-gray-700">{property.amenities}</p>

      {/* 🔹 Unit Details */}
      <h2 className="text-xl font-bold mt-6">Available Units</h2>
      {property.units.length === 0 ? (
        <p>No available units.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Unit (Optional)
          </label>
          <select
            className="mb-4 p-2 border border-gray-300 rounded-md"
            onChange={handleUnitChange}
            value={selectedUnitId || ""}
          >
            <option value="">No Unit (Optional)</option>
            {property.units.map((unit) => (
              <option key={unit.unit_id} value={unit.unit_id}>
                {unit.unit_name}
              </option>
            ))}
          </select>

          {property.units.map((unit) => (
            <div key={unit.unit_id} className="border rounded-lg p-4 shadow-md">
              <h3 className="text-lg font-semibold">{unit.unit_name}</h3>
              <p className="text-gray-600">Floor Area: {unit.floor_area} sqm</p>
              <p className="text-gray-600">Furnish: {unit.furnish}</p>
              <p className="text-blue-500 font-semibold">
                ₱{unit.rent_payment}/month
              </p>
              <p
                className={`text-sm ${
                  unit.status === "occupied" ? "text-red-500" : "text-green-500"
                }`}
              >
                {unit.status === "occupied" ? "Occupied" : "Available"}
              </p>

              {/* Unit Image */}
              {unit.photos ? (
                <Image
                  src={unit.photos[0]}
                  alt={unit.unit_name}
                  width={200}
                  height={100}
                  className="rounded-lg mt-2"
                />
              ) : (
                <div className="w-[300px] h-[200px] bg-gray-300 flex items-center justify-center mt-2">
                  No Unit Image
                </div>
              )}
            </div>
          ))}
        </div>
      )}
<div>
    <div className="mt-6">
        <h2 className="text-xl font-semibold">Chat</h2>
        {property.landlord_id && (
            <button
                onClick={() => router.push(`/pages/commons/chat?landlord_id=${property.landlord_id}`)}
                className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
                Chat with Landlord
            </button>
        )}
    </div>
</div>
      <ScheduleVisitForm
        tenant_id={user?.tenant_id}
        property_id={parseInt(id)}
        unit_id={selectedUnitId}
      />
    </div>
  );
}
