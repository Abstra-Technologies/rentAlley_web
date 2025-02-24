"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import useAuth from "../../../../../../hooks/useSession";
import { 
  FaBed, FaRuler, FaCouch, FaMapMarkerAlt, FaCalendarAlt, 
  FaMoneyBillWave, FaUserTie, FaShareAlt, FaRegHeart, FaHeart,
  FaCheck, FaHome, FaArrowLeft, FaBath, FaKey, FaRegFilePdf
} from "react-icons/fa";
import { BsImageAlt, BsCheckCircleFill } from "react-icons/bs";
import { MdVerified, MdOutlineApartment, MdKeyboardArrowRight } from "react-icons/md";
import { IoIosWater, IoMdPower } from "react-icons/io";
import { TbAirConditioning, TbSofa } from "react-icons/tb";
import InquiryBooking from "../../../../../components/tenant/inquiry";

export default function UnitDetails() {
  const { user } = useAuth();
  const { propertyId, unitId } = useParams();
  const [property, setProperty] = useState(null);
  const [unit, setUnit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [showAllAmenities, setShowAllAmenities] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function fetchUnitDetails() {
      try {
        // Fetch property details first
        const propertyRes = await fetch(`/api/properties/getProperty?id=${propertyId}`);
        if (!propertyRes.ok) throw new Error("Failed to fetch property details");
        
        const propertyData = await propertyRes.json();
        setProperty(propertyData);
        
        // Find the unit in the property data
        const unitData = propertyData.units.find(u => u.unit_id === unitId);
        if (!unitData) throw new Error("Unit not found");
        
        setUnit(unitData);
      } catch (error) {
        console.error(error.message);
      } finally {
        setLoading(false);
      }
    }
    
    fetchUnitDetails();
  }, [propertyId, unitId]);

  // Function to parse features from string to array
  const parseFeatures = (featuresString) => {
    if (!featuresString) return [];
    return featuresString.split(',').map(item => item.trim());
  };

  // Dummy unit features - in a real app, this would come from your database
  const unitFeatures = unit ? parseFeatures(unit.features || "Air Conditioning,Balcony,Built-in Wardrobe,Ceiling Fan,High Ceiling,Kitchen Cabinet") : [];
  
  // Additional unit details - in a real app, these would come from your database
  const additionalDetails = {
    move_in_date: unit?.move_in_date || "Immediate",
    lease_term: unit?.lease_term || "12 months minimum",
    deposit: unit?.deposit || (unit?.rent_payment ? unit.rent_payment * 2 : 0),
    utilities: unit?.utilities || "Electricity and water not included"
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!unit || !property) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center p-8 bg-white rounded-lg shadow-md">
          <h2 className="text-2xl font-bold text-gray-700 mb-4">Unit Not Found</h2>
          <p className="text-gray-600 mb-6">We couldn't find the unit you're looking for.</p>
          <button 
            onClick={() => router.push(`/pages/property/${propertyId}`)}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Back to Property
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen pb-16">
      {/* Header */}
      <div className="w-full bg-white shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-2">
                <button 
                  onClick={() => router.push(`/pages/property/${propertyId}`)}
                  className="flex items-center text-gray-600 hover:text-blue-600 transition"
                >
                  <FaArrowLeft className="text-sm mr-1" />
                  <span className="text-sm">Back to Property</span>
                </button>
              </div>
              <div className="flex items-center mt-2">
                <h1 className="text-2xl font-bold text-gray-800">{unit.unit_name}</h1>
                {unit.status !== "occupied" && (
                  <span className="ml-3 px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                    Available
                  </span>
                )}
              </div>
              <div className="flex items-center text-gray-600 mt-1">
                <FaMapMarkerAlt className="mr-2 text-gray-400" />
                <span>{property.city}, {property.province}</span>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button 
                onClick={() => setIsFavorite(!isFavorite)}
                className="p-2 rounded-full hover:bg-gray-100"
              >
                {isFavorite ? 
                  <FaHeart className="text-red-500 text-xl" /> : 
                  <FaRegHeart className="text-gray-400 text-xl" />
                }
              </button>
              <button className="p-2 rounded-full hover:bg-gray-100">
                <FaShareAlt className="text-gray-400 text-xl" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Gallery Section */}
      <div className="container mx-auto px-4 py-6">
        {unit.photos && unit.photos.length > 0 ? (
          <div className="relative">
            {/* Main Image */}
            <div className="w-full h-[500px] rounded-xl overflow-hidden shadow-lg relative">
              <Image
                src={unit.photos[activeImageIndex]}
                alt={`${unit.unit_name} Image`}
                fill
                className="object-cover"
                priority
              />
              <div className="absolute bottom-4 right-4 bg-black bg-opacity-60 text-white px-3 py-1 rounded-md text-sm">
                {activeImageIndex + 1} / {unit.photos.length}
              </div>
            </div>
            
            {/* Thumbnail Row */}
            {unit.photos.length > 1 && (
              <div className="flex mt-4 space-x-2 overflow-x-auto pb-2">
                {unit.photos.map((photo, index) => (
                  <div 
                    key={index}
                    className={`relative flex-shrink-0 w-28 h-28 rounded-lg overflow-hidden cursor-pointer transition transform hover:scale-105 ${activeImageIndex === index ? 'ring-2 ring-blue-500' : 'opacity-80'}`}
                    onClick={() => setActiveImageIndex(index)}
                  >
                    <Image
                      src={photo}
                      alt={`Unit Thumbnail ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="w-full h-[500px] bg-gray-200 flex items-center justify-center rounded-xl">
            <div className="text-center">
              <BsImageAlt className="text-5xl text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">No Unit Images Available</p>
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Unit Details */}
          <div className="lg:col-span-2">
            {/* Pricing and Quick Info Banner */}
            <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div className="mb-4 md:mb-0">
                  <h2 className="text-3xl font-bold text-blue-600">₱{unit.rent_payment.toLocaleString()}<span className="text-sm text-gray-500">/month</span></h2>
                  <div className="mt-2 flex items-center text-gray-600">
                    <FaHome className="mr-2 text-gray-400" />
                    <span>{property.property_name}</span>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-6">
                  <div className="flex items-center">
                    <div className="p-2 rounded-full bg-blue-50">
                      <FaRuler className="text-blue-600" />
                    </div>
                    <div className="ml-2">
                      <span className="text-gray-500 text-sm">Area</span>
                      <p className="font-medium">{unit.floor_area} sqm</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <div className="p-2 rounded-full bg-blue-50">
                      <FaCouch className="text-blue-600" />
                    </div>
                    <div className="ml-2">
                      <span className="text-gray-500 text-sm">Furnishing</span>
                      <p className="font-medium">{unit.furnish}</p>
                    </div>
                  </div>
                  
                  {unit.bedrooms && (
                    <div className="flex items-center">
                      <div className="p-2 rounded-full bg-blue-50">
                        <FaBed className="text-blue-600" />
                      </div>
                      <div className="ml-2">
                        <span className="text-gray-500 text-sm">Bedrooms</span>
                        <p className="font-medium">{unit.bedrooms}</p>
                      </div>
                    </div>
                  )}
                  
                  {unit.bathrooms && (
                    <div className="flex items-center">
                      <div className="p-2 rounded-full bg-blue-50">
                        <FaBath className="text-blue-600" />
                      </div>
                      <div className="ml-2">
                        <span className="text-gray-500 text-sm">Bathrooms</span>
                        <p className="font-medium">{unit.bathrooms}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Description */}
            <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
              <h2 className="text-xl font-bold mb-4 text-gray-800">Description</h2>
              <p className="text-gray-700 leading-relaxed">
                {unit.description || `This ${unit.unit_name} offers a comfortable living space of ${unit.floor_area} sqm with ${unit.furnish.toLowerCase()} furnishings. Located in ${property.property_name}, this unit provides convenient access to local amenities in ${property.city}, ${property.province}.`}
              </p>
            </div>
            
            {/* Unit Features */}
            <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
              <h2 className="text-xl font-bold mb-4 text-gray-800">Features & Amenities</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4">
                {(showAllAmenities ? unitFeatures : unitFeatures.slice(0, 6)).map((feature, index) => (
                  <div key={index} className="flex items-center">
                    <FaCheck className="text-green-500 mr-2 flex-shrink-0" />
                    <span className="text-gray-700">{feature}</span>
                  </div>
                ))}
              </div>
              
              {unitFeatures.length > 6 && (
                <button 
                  onClick={() => setShowAllAmenities(!showAllAmenities)}
                  className="mt-4 text-blue-600 hover:underline font-medium"
                >
                  {showAllAmenities ? "Show Less" : `Show All (${unitFeatures.length})`}
                </button>
              )}
            </div>
            
            {/* Key Details */}
            <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
              <h2 className="text-xl font-bold mb-4 text-gray-800">Key Details</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="border-b pb-4 md:border-b-0 md:border-r md:pr-4">
                  <h3 className="text-lg font-medium mb-4">Terms</h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-start">
                      <div className="p-2 rounded-full bg-blue-50 mt-1">
                        <FaCalendarAlt className="text-blue-600" />
                      </div>
                      <div className="ml-3">
                        <h4 className="font-medium">Availability</h4>
                        <p className="text-gray-600">{additionalDetails.move_in_date}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <div className="p-2 rounded-full bg-blue-50 mt-1">
                        <FaKey className="text-blue-600" />
                      </div>
                      <div className="ml-3">
                        <h4 className="font-medium">Minimum Lease</h4>
                        <p className="text-gray-600">{additionalDetails.lease_term}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <div className="p-2 rounded-full bg-blue-50 mt-1">
                        <FaMoneyBillWave className="text-blue-600" />
                      </div>
                      <div className="ml-3">
                        <h4 className="font-medium">Security Deposit</h4>
                        <p className="text-gray-600">₱{additionalDetails.deposit.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium mb-4">Utilities</h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-start">
                      <div className="p-2 rounded-full bg-blue-50 mt-1">
                        <IoMdPower className="text-blue-600" />
                      </div>
                      <div className="ml-3">
                        <h4 className="font-medium">Electricity</h4>
                        <p className="text-gray-600">Tenant's responsibility</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <div className="p-2 rounded-full bg-blue-50 mt-1">
                        <IoIosWater className="text-blue-600" />
                      </div>
                      <div className="ml-3">
                        <h4 className="font-medium">Water</h4>
                        <p className="text-gray-600">Tenant's responsibility</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <div className="p-2 rounded-full bg-blue-50 mt-1">
                        <TbAirConditioning className="text-blue-600" />
                      </div>
                      <div className="ml-3">
                        <h4 className="font-medium">Air Conditioning</h4>
                        <p className="text-gray-600">{unitFeatures.some(f => f.toLowerCase().includes('air conditioning')) ? 'Available' : 'Not available'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Documents */}
            <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
              <h2 className="text-xl font-bold mb-4 text-gray-800">Documents</h2>
              
              <div className="flex items-center p-4 bg-gray-50 rounded-lg border border-gray-200">
                <FaRegFilePdf className="text-red-500 text-2xl" />
                <div className="ml-3 flex-1">
                  <h4 className="font-medium">Lease Agreement Sample</h4>
                  <p className="text-gray-600 text-sm">Preview the standard lease agreement for this property</p>
                </div>
                <button className="ml-4 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100 transition">
                  Download
                </button>
              </div>
            </div>
            
            {/* Location */}
            <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
              <h2 className="text-xl font-bold mb-4 text-gray-800">Location</h2>
              
              <div className="aspect-video w-full bg-gray-200 rounded-lg overflow-hidden">
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-center">
                    <FaMapMarkerAlt className="text-4xl text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500">Map view available</p>
                    <p className="text-sm text-gray-400">{property.city}, {property.province}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Right Column - Booking and Contact */}
          <div className="lg:col-span-1">
            {/* Booking Widget */}
            <div className="bg-white rounded-xl shadow-sm p-6 sticky top-24 mb-6">
              <h2 className="text-xl font-bold mb-4 text-gray-800">Book a Viewing</h2>
              
              <div className="p-4 bg-blue-50 rounded-lg mb-6">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-gray-700 font-medium">{unit.unit_name}</p>
                    <p className="text-gray-600 text-sm">{property.property_name}</p>
                  </div>
                  <p className="font-bold text-blue-600">₱{unit.rent_payment.toLocaleString()}/mo</p>
                </div>
              </div>
              
              <InquiryBooking
                tenant_id={user?.tenant_id}
                property_id={propertyId}
                unit_id={unitId}
              />
            </div>
            
            {/* Landlord Contact */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-bold mb-4 text-gray-800">Contact Landlord</h2>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <FaUserTie className="text-blue-500" />
                  </div>
                  <div className="ml-4">
                    <p className="font-medium">Property Manager</p>
                    <p className="text-gray-600 text-sm">Response time: Usually within 24 hours</p>
                  </div>
                </div>
              </div>
              
              <div className="mt-4 grid grid-cols-2 gap-3">
                <button
                  onClick={() => router.push(`/pages/commons/chat?landlord_id=${property.landlord_id}`)}
                  className="py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition flex items-center justify-center"
                >
                  <span>Chat Now</span>
                  <MdKeyboardArrowRight />
                </button>
                
                <button
                  className="py-2 border border-blue-600 text-blue-600 rounded-md hover:bg-blue-50 transition flex items-center justify-center"
                >
                  <span>Call</span>
                </button>
              </div>
            </div>
            
            {/* Similar Units */}
            <div className="bg-white rounded-xl shadow-sm p-6 mt-6">
              <h2 className="text-xl font-bold mb-4 text-gray-800">Similar Units</h2>
              
              {property.units
                .filter(u => u.unit_id !== unitId && u.status !== "occupied")
                .slice(0, 2)
                .map((similarUnit, index) => (
                  <div key={index} className="border-b last:border-b-0 pb-4 mb-4 last:mb-0 last:pb-0">
                    <div className="flex">
                      <div className="relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                        {similarUnit.photos ? (
                          <Image
                            src={similarUnit.photos[0]}
                            alt={similarUnit.unit_name}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                            <BsImageAlt className="text-gray-400" />
                          </div>
                        )}
                      </div>
                      
                      <div className="ml-3 flex-1">
                        <h3 className="font-medium">{similarUnit.unit_name}</h3>
                        <p className="text-blue-600 font-bold">₱{similarUnit.rent_payment.toLocaleString()}/mo</p>
                        <button 
                          onClick={() => router.push(`/pages/property/${propertyId}/unit/${similarUnit.unit_id}`)}
                          className="text-sm text-blue-600 hover:underline mt-1"
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              
              {property.units.filter(u => u.unit_id !== unitId && u.status !== "occupied").length === 0 && (
                <p className="text-gray-500 text-center py-4">No other units available</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}