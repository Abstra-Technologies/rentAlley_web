"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FaSearch, FaChevronDown, FaMapMarkerAlt, FaBuilding, FaHome } from "react-icons/fa";
import { HiBadgeCheck } from "react-icons/hi";
import Footer from "../components/navigation/footer";

// Define TypeScript interfaces for the data structures
interface Property {
  property_id: number;
  property_name: string;
  property_photo: string;
  city: string;
  province: string;
  rent_payment: number;
  type: string;
  rating: number;
}

interface PropertyCardProps {
  property: Property;
}

export default function SplashScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [showLocationDropdown, setShowLocationDropdown] = useState<boolean>(false);
  const [showTypeDropdown, setShowTypeDropdown] = useState<boolean>(false);
  const [selectedLocation, setSelectedLocation] = useState<string>("");
  const [selectedType, setSelectedType] = useState<string>("");

  // Sample locations and property types
  const locations: string[] = ["Manila", "Cebu", "Davao", "Quezon City", "Makati"];
  const propertyTypes: string[] = ["Apartment", "Townhouses", "House", "Dormitory", "Studio"];

  // Featured properties data
  const featuredProperties: Property[] = [
    {
      property_id: 1,
      property_name: "RedDoors Apartment",
      property_photo: "/images/Reddoorz.jpeg",
      city: "Manila",
      province: "Luzon",
      rent_payment: 15000,
      type: "property",
      rating: 3.7
    },
    {
      property_id: 2,
      property_name: "Torre De Duplex",
      property_photo: "/images/Torre.jpeg",
      city: "Manila",
      province: "Luzon",
      rent_payment: 20000,
      type: "unit",
      rating: 4.6
    },
    {
      property_id: 3,
      property_name: "UP Residence",
      property_photo: "/images/apartment.jpeg",
      city: "Quezon City",
      province: "Luzon",
      rent_payment: 12000,
      type: "property",
      rating: 3.8
    }
  ];

  // Recently added properties
  const recentProperties: Property[] = [
    ...featuredProperties,
    {
      property_id: 4,
      property_name: "RedDoors Apartment",
      property_photo: "/images/Reddoorz.jpeg",
      city: "Manila",
      province: "Luzon",
      rent_payment: 17000,
      type: "property",
      rating: 3.9
    },
    {
      property_id: 5,
      property_name: "Manila de Apartment",
      property_photo: "/images/apt-img.jpg",
      city: "Manila",
      province: "Luzon",
      rent_payment: 22000,
      type: "unit",
      rating: 4.2
    },
    {
      property_id: 6,
      property_name: "UP Student",
      property_photo: "/images/apartment-building.jpeg",
      city: "Quezon City",
      province: "Luzon",
      rent_payment: 10000,
      type: "property",
      rating: 3.6
    }
  ];

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    router.push(`/pages/find-rent?searchQuery=${searchQuery}&location=${selectedLocation}&type=${selectedType}`);
  };

  const navigateToFindRent = () => {
    router.push("/pages/find-rent");
  };

  // Property card component to maintain consistency with your existing design
  const PropertyCard = ({ property }: PropertyCardProps) => {
    const isUnitAverage = property.type === "unit";
    
    return (
      <div 
        className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer"
        onClick={() => router.push(`/pages/find-rent/${property.property_id}`)}
      >
        {/* Property Image */}
        <div className="relative">
          {property?.property_photo ? (
            <div className="relative h-48">
              <Image
                src={property.property_photo}
                alt={property.property_name}
                fill
                className="object-cover"
              />
            </div>
          ) : (
            <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
              <span className="text-gray-400">No Image Available</span>
            </div>
          )}

          {/* Price Badge with Type Indicator */}
          <div className="absolute bottom-3 right-3 flex items-center gap-2">
            <div
              className={`px-3 py-1 rounded-full font-medium shadow-sm ${
                isUnitAverage ? "bg-green-600" : "bg-blue-600"
              } text-white`}
            >
              ₱{Math.round(property.rent_payment).toLocaleString()}
            </div>
          </div>
        </div>

        {/* Property Details */}
        <div className="p-4">
          <div className="flex justify-between items-start">
            <h2 className="text-lg font-semibold flex items-center gap-1 mb-1 text-gray-900">
              {property.property_name}
              <HiBadgeCheck className="text-blue-500" />
            </h2>
            <div className="flex items-center">
              <span className="text-yellow-500">★</span>
              <span className="text-sm text-gray-700 ml-1">{property.rating}</span>
            </div>
          </div>

          <div className="flex items-center text-gray-600 mb-2">
            <FaMapMarkerAlt className="mr-1 text-gray-400" />
            <p>
              {property.city}, {property.province}
            </p>
          </div>

          <p className="text-sm text-gray-500 mb-3">
            ₱{property.rent_payment.toLocaleString()} / Year
          </p>

          <button className="mt-1 w-full py-2 bg-gray-100 hover:bg-gray-200 rounded-md text-gray-800 font-medium transition-colors">
            View Details
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section with Background Image */}
      <div className="relative h-[500px]">
        <div className="absolute inset-0">
          <Image 
            src="/images/hero-section.jpeg" 
            alt="Cityscape view of high-rise buildings" 
            fill
            className="object-cover brightness-75"
            priority
          />
        </div>
        <div className="relative z-10 container mx-auto px-4 h-full flex flex-col justify-center items-center text-white">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-center">Rent with No Compromises</h1>
          <p className="text-xl md:text-2xl mb-8 max-w-2xl text-center">
            Enjoy a home that offers everything you've been searching for, all in one place.
          </p>
        </div>
      </div>
      
      {/* Featured Properties Section */}
      <section className="py-12 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Featured Property</h2>
              <p className="text-gray-600">Recommended Place to Live for You</p>
            </div>
            <div className="flex space-x-2">
              <button className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center">
                <span className="sr-only">Previous</span>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                </svg>
              </button>
              <button className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center">
                <span className="sr-only">Next</span>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredProperties.map((property) => (
              <PropertyCard key={property.property_id} property={property} />
            ))}
          </div>
          
          <div className="flex justify-center mt-8">
            <Link 
              href="/pages/find-rent"
              className="bg-gray-800 hover:bg-gray-900 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Show all Property
            </Link>
          </div>
        </div>
      </section>
      
      {/* About Us Section */}
      <section className="py-16 bg-gray-900 text-white relative overflow-hidden">
  <div className="container mx-auto max-w-6xl px-4 flex flex-col lg:flex-row items-center">
    <div className="lg:w-1/2 z-10 mb-10 lg:mb-0">
      <h3 className="text-lg font-medium mb-2">About Us</h3>
      <h2 className="text-3xl font-bold mb-4">
        Search, Find, and Invest in Good Properties with Us
      </h2>
      <p className="mb-6 opacity-80">
        Discover your perfect rental property with Rentahan. We provide a curated selection of quality homes, apartments, and condominiums across the Philippines, making property hunting simple and stress-free.
      </p>
      <Link 
        href="/pages/about"
        className="bg-white text-gray-900 px-6 py-3 rounded-lg font-medium hover:bg-blue-100 transition-colors"
      >
        Know More
      </Link>
    </div>
    <div className="lg:w-1/2 relative">
      <div className="w-full h-64 lg:h-80 relative">
        <Image
          src="/images/aboutrent.jpeg"
          alt="Aerial view of properties"
          fill
          className="object-cover rounded-lg"
        />
        <h4 className="absolute bottom-4 right-4 bg-white bg-opacity-80 text-2xl font-bold text-blue-600 text-center px-4 py-2 rounded-lg shadow-lg">
          Rentahan
        </h4>
      </div>
    </div>
  </div>
</section>

      
      {/* Recently Added Properties */}
      <section className="py-12 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Recently Added Property</h2>
              <p className="text-gray-600">Find Properties that suits you</p>
            </div>
            <div className="flex space-x-2">
              <button className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center">
                <span className="sr-only">Previous</span>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                </svg>
              </button>
              <button className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center">
                <span className="sr-only">Next</span>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recentProperties.map((property) => (
              <PropertyCard key={property.property_id} property={property} />
            ))}
          </div>
          
          <div className="flex justify-center mt-8">
            <Link 
              href="/pages/find-rent"
              className="bg-gray-800 hover:bg-gray-900 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Show all Property
            </Link>
          </div>
        </div>
      </section>
      
      {/* Newsletter Section */}
      <section className="py-10 px-4 bg-gray-700 text-white">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between">
            <div className="mb-6 lg:mb-0">
              <h3 className="text-lg font-medium mb-2">Join Us</h3>
              <h2 className="text-2xl font-bold">Get Property Insights and Listings Directly to Your Email</h2>
              <p className="mt-2 text-gray-300">Subscribe to get newsletter about property information.</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 lg:w-2/5">
              <input 
                type="email" 
                placeholder="Enter your email here" 
                className="px-4 py-3 rounded-lg bg-gray-600 text-white placeholder-gray-400 border border-gray-500 focus:outline-none focus:border-blue-500 flex-grow"
              />
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors whitespace-nowrap">
                Subscribe
              </button>
            </div>
          </div>
        </div>
      </section>
      
      {/* Comfort Section */}
      <section className="relative py-16 bg-gray-900 text-white">
        <div className="container mx-auto max-w-6xl px-4">
          <h2 className="text-3xl font-bold text-center">Discover the Comfort of Your Life</h2>
        </div>
      </section>
      
      {/* Footer Section */}
      <Footer/>

    </div>
  );
}