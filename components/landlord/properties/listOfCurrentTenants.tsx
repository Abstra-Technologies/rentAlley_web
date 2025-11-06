
"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  MaterialReactTable,
  type MRT_ColumnDef,
} from "material-react-table";

import LoadingScreen from "../../loadingScreen";

type Tenant = {
  tenant_id: number;
  firstName: string;
  email: string;
  property_name: string;
  unit_id: number;
  start_date: string;
  end_date: string;
};

export default function TenantList({ landlord_id }: { landlord_id: number }) {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (!landlord_id) return;

    fetch(`/api/landlord/properties/getCurrentTenants?landlord_id=${landlord_id}`)
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) {
            setTenants(data);
          } else {
            setTenants([]);
          }
          setLoading(false);
        })
        .catch((error) => {
          console.error("Error fetching tenants:", error);
          setError("Failed to load tenants.");
          setLoading(false);
        });
  }, [landlord_id]);

  const handleViewDetails = (tenant_id: number) => {
    router.push(`/pages/landlord/list_of_tenants/${tenant_id}`);
  };

  const columns: MRT_ColumnDef<Tenant>[] = [
    {
      accessorKey: "firstName",
      header: "Tenant Name",
      Cell: ({ row }) => (
          <span className="font-medium text-gray-800">{row.original.firstName}</span>
      ),
    },
    { accessorKey: "email", header: "Email" },
    { accessorKey: "property_name", header: "Property" },
    { accessorKey: "unit_id", header: "Unit Occupied" },
    // {
    //   accessorKey: "start_date",
    //   header: "Start Date",
    //   Cell: ({ cell }) => new Date(cell.getValue<string>()).toLocaleDateString(),
    // },
    // {
    //   accessorKey: "end_date",
    //   header: "End Date",
    //   Cell: ({ cell }) => new Date(cell.getValue<string>()).toLocaleDateString(),
    // },
    {
      id: "actions",
      header: "Actions",
      Cell: ({ row }) => (
          <button
              onClick={() => handleViewDetails(row.original.tenant_id)}
              className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition"
          >
            View Details
          </button>
      ),
    },
  ];

  if (loading) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/0 w-full">
          <LoadingScreen message="Fetching your current tenants, please wait..." />
        </div>
    );
  }

  if (error) return <p className="text-red-500">{error}</p>;

  return (
      <div className="w-full px-4 py-6 lg:px-6">
        <div className="max-w-6xl mx-auto">
          <h1 className="gradient-header">My Tenants</h1>

          <MaterialReactTable
              columns={columns}
              data={tenants}
              enableSorting
              enableColumnActions={false}
              enableDensityToggle={false}
              initialState={{
                pagination: { pageSize: 10, pageIndex: 0 },
              }}
              muiTableBodyRowProps={{
                sx: {
                  "&:hover": {
                    backgroundColor: "#f9fafb",
                  },
                },
              }}
          />
        </div>
      </div>
  );
}
