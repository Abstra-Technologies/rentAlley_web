"use client";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  return (
    <>
      <div className="bg-gray-100 min-h-screen flex flex-col">
        {/* Hero Section */}
        <section className="flex flex-col min-h-screen text-white bg-center bg-cover bg-blend-overlay bg-fixed bg-black/40 bg-hero-pattern">
          <div className="flex-1 flex items-center">
            <div className="text-center mx-auto">
              <h1 className="text-4xl font-bold mb-4">Welcome to Rentahan</h1>
              <p className="text-lg mb-6">
                Find your perfect home with ease. Browse listings, explore
                options, and make your dreams a reality.
              </p>
              <button
                onClick={() => router.push("/pages/find-rent")}
                className="px-6 py-3 bg-white text-blue-600 rounded-md font-semibold hover:bg-gray-200 transition"
              >
                Browse Properties
              </button>
            </div>
          </div>
        </section>

        {/* Card Gallery */}
        <section className="container mx-auto px-6 py-12">
          <h2 className="text-3xl font-semibold text-center mb-8">
            Featured Properties
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Card Example - HARD CODED TO BE CHANGED */}
            {[1, 2, 3, 4, 5, 6].map((property) => (
              <div
                key={property}
                className="overflow-hidden transform transition duration-300 hover:scale-105 hover:shadow-lg hover:cursor-pointer"
              >
                <img
                  src={`https://images.pexels.com/photos/106399/pexels-photo-106399.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=300&w=400&random=${property}`}
                  alt="Property"
                  className="w-full h-48 object-cover"
                />
                <div className="p-4">
                  <h3 className="text-lg font-bold mb-2">Modern Family Home</h3>
                  <p className="text-gray-600 mb-4">
                    3 Bed • 2 Bath • 1,800 sqft
                  </p>
                  <p className="text-blue-600 font-bold">PHP 250,000</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-gray-800 text-white py-6">
          <div className="container mx-auto px-6 text-center">
            <p className="text-sm">
              &copy; {new Date().getFullYear()} Rentahan. All rights reserved.
            </p>
          </div>
        </footer>
      </div>
    </>
  );
}
