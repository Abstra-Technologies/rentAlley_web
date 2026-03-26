import { useEffect, useState } from "react";

export default function PropertyListUser({ user_id }) {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user_id) return;

    const fetchProperties = async () => {
      try {
        const response = await fetch(
          `/api/systemadmin/users/landlords/getProperties?user_id=${user_id}`
        );
        if (!response.ok) throw new Error("Failed to fetch properties.");
        const data = await response.json();

        setProperties(data);
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProperties();
  }, [user_id]);

  if (loading)
    return (
      <div className="text-center py-4 text-gray-500">
        Loading properties...
      </div>
    );

  if (error)
    return (
      <div className="text-center py-4 text-red-500">
        Error: {error}
      </div>
    );

  return (
    <div>
      {properties.length > 0 ? (
        <div className="space-y-2">
          {properties.map((property) => (
            <div
              key={property.property_id}
              className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <span className="font-medium text-gray-900">
                  {property.property_name}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">
                  {property.unit_count} {property.unit_count === 1 ? "unit" : "units"}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-4 text-gray-500">
          No properties listed.
        </div>
      )}
    </div>
  );
}
