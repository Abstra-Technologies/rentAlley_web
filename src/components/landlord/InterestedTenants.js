"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import {
  AiOutlineArrowLeft,
  AiOutlineCheck,
  AiOutlineClose,
} from "react-icons/ai";
import Swal from "sweetalert2";
import LoadingScreen from "../../components/loadingScreen";
import Image from "next/image";

export default function InterestedTenants({ unitId }) {
  const router = useRouter();
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = "";

  // Fetch tenants from the API
  useEffect(() => {
    const fetchTenants = async () => {
      try {
        const response = await axios.get(
          `/api/landlord/prospective/interested-tenants?unitId=${unitId}`
        );
        setTenants(response.data);
      } catch (err) {
        setError("Failed to load tenants.");
      } finally {
        setLoading(false);
      }
    };

    fetchTenants();
  }, [unitId]);

  if (loading) return <LoadingScreen />;
  if (error) return <div className="p-6 text-red-500 text-center">{error}</div>;

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button and Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors duration-200"
            onClick={() => router.back()}
          >
            <AiOutlineArrowLeft className="text-xl" />
            <span className="font-medium">Back to Properties</span>
          </button>
          <h2 className="text-3xl font-bold text-blue-600">
            Prospective Tenants
          </h2>
        </div>

        {/* Content Card */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          {/* Status Summary */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center gap-4">
              <div className="text-sm font-medium text-gray-500">
                Total Applicants:{" "}
                <span className="text-gray-900 ml-1">{tenants.length}</span>
              </div>
              <div className="text-sm font-medium text-gray-500">
                Approved:{" "}
                <span className="text-green-600 ml-1">
                  {tenants.filter((t) => t.status === "approved").length}
                </span>
              </div>
              <div className="text-sm font-medium text-gray-500">
                Pending:{" "}
                <span className="text-amber-600 ml-1">
                  {tenants.filter((t) => t.status === "pending").length}
                </span>
              </div>
              <div className="text-sm font-medium text-gray-500">
                Disapproved:{" "}
                <span className="text-red-600 ml-1">
                  {tenants.filter((t) => t.status === "disapproved").length}
                </span>
              </div>
            </div>
          </div>

          {/* Tenants Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Profile
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Phone
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Address
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {tenants.map((tenant) => (
                  <tr
                    key={tenant?.id}
                    className="hover:bg-gray-50 transition-colors duration-150"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex-shrink-0 h-12 w-12">
                        <Image
                          src={
                            tenant?.profilePicture ||
                            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTwgEJf3figiiLmSgtwKnEgEkRw1qUf2ke1Bg&s"
                          }
                          alt="Tenant Profile"
                          width={48}
                          height={48}
                          className="h-12 w-12 rounded-full border-2 border-gray-200 object-cover"
                        />
                      </div>
                    </td>
                    <td
                      className="px-6 py-4 whitespace-nowrap cursor-pointer"
                      onClick={() => {
                        router.push(
                          `/pages/landlord/property-listing/view-unit/view-tenant/${unitId}`
                        );
                      }}
                    >
                      <div className="font-medium text-blue-600 hover:text-blue-800 hover:underline transition-colors">
                        {tenant?.firstName} {tenant?.lastName}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                      {tenant?.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                      {tenant?.phoneNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                      {tenant?.address}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                          tenant?.status === "approved"
                            ? "bg-green-100 text-green-800"
                            : tenant?.status === "disapproved"
                            ? "bg-red-100 text-red-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {tenant?.status?.charAt(0).toUpperCase() +
                          tenant?.status?.slice(1)}
                      </span>
                    </td>
                  </tr>
                ))}
                {tenants.length === 0 && (
                  <tr>
                    <td
                      colSpan="7"
                      className="px-6 py-10 text-center text-gray-500"
                    >
                      No prospective tenants found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
