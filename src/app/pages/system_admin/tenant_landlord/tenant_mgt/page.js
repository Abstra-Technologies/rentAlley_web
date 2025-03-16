"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import useAuth from "../../../../../../hooks/useSession";
import SideNavAdmin from "../../../../../components/navigation/sidebar-admin";
import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    TextField,
    TableSortLabel,
    CircularProgress,
    Button,
} from "@mui/material";
import { Eye } from "lucide-react";
import LoadingScreen from "../../../../../components/loadingScreen";
import Swal from "sweetalert2";
import axios from "axios";

export default function TenantList() {
    const [tenants, setTenants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });

    const { admin } = useAuth();
    const router = useRouter();

    useEffect(() => {
        const fetchTenants = async () => {
            try {
                setLoading(true);
                const response = await fetch("/api/tenant/list");

                if (!response.ok) {
                    throw new Error("Failed to fetch tenants.");
                }
                const data = await response.json();
                setTenants(data.tenants);
            } catch (error) {
                setError(error.message);
            } finally {
                setLoading(false);
            }
        };

        fetchTenants();
    }, []);

    const requestSort = (key) => {
        let direction = "asc";
        if (sortConfig.key === key && sortConfig.direction === "asc") {
            direction = "desc";
        }
        setSortConfig({ key, direction });
    };


    const handleSuspend = async (userId) => {
        const { isConfirmed } = await Swal.fire({
            title: "Are you sure?",
            text: "Do you really want to suspend this account?",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Yes, suspend it!",
            cancelButtonText: "Cancel",
            confirmButtonColor: "#3085d6",
            cancelButtonColor: "#d33"
        });

        if (!isConfirmed) return;

        try {
            await axios.post(`/api/suspendAccount/suspend`, { userId });
            await Swal.fire({
                title: "Suspended!",
                text: "Account has been suspended.",
                icon: "success"
            });
        } catch (error) {
            console.error("Error suspending account:", error);
            await Swal.fire({
                title: "Error!",
                text: "Failed to suspend account. Please try again.",
                icon: "error"
            });
        }
    };


    const filteredAndSortedTenants = tenants
        .filter(
            (tenant) =>
                tenant.user_id.toString().includes(searchTerm) ||
                new Date(tenant.createdAt).toLocaleDateString().includes(searchTerm)
        )
        .sort((a, b) => {
            if (!sortConfig.key) return 0;

            const aValue = a[sortConfig.key];
            const bValue = b[sortConfig.key];

            if (aValue < bValue) {
                return sortConfig.direction === "asc" ? -1 : 1;
            }
            if (aValue > bValue) {
                return sortConfig.direction === "asc" ? 1 : -1;
            }
            return 0;
        });

    if (error) return <p className="text-red-500 p-6">Error: {error}</p>;

    if (loading) {
        return <LoadingScreen />;
    }

    if (!admin) {
        return <p className="text-red-500 p-6">You need to log in to access the dashboard.</p>;
    }

    return (
        <div className="flex">
            <SideNavAdmin />

            <div className="flex-1 p-6 max-w-6xl mx-auto">
                <h1 className="text-2xl font-semibold text-blue-600 mb-6">Tenants List</h1>

                {/* Search Bar */}
                <TextField
                    label="Search tenants..."
                    variant="outlined"
                    fullWidth
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="mb-4"
                />

                <Paper>
                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    {[
                                        { key: "tenant_id", label: "ID" },
                                        { key: "user_id", label: "User ID" },
                                        { key: "createdAt", label: "Date Registered" },
                                        { key: "actions", label: "Actions" },
                                    ].map((column) => (
                                        <TableCell key={column.key} align="center">
                                            {column.key !== "actions" ? (
                                                <TableSortLabel
                                                    active={sortConfig.key === column.key}
                                                    direction={sortConfig.key === column.key ? sortConfig.direction : "asc"}
                                                    onClick={() => requestSort(column.key)}
                                                >
                                                    {column.label}
                                                </TableSortLabel>
                                            ) : (
                                                column.label
                                            )}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            </TableHead>

                            <TableBody>
                                {filteredAndSortedTenants.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} align="center">
                                            No tenants found.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredAndSortedTenants.map((tenant, index) => (
                                        <TableRow key={tenant?.tenant_id} hover>
                                            <TableCell align="center">{index + 1}</TableCell>
                                            <TableCell align="center">{tenant?.user_id}</TableCell>
                                            <TableCell align="center">
                                                {new Date(tenant?.createdAt).toLocaleDateString()}
                                            </TableCell>
                                            <TableCell align="center">
                                                <Button
                                                    variant="contained"
                                                    color="primary"
                                                    size="small"
                                                    onClick={() => router.push(`./viewProfile/tenant/${tenant?.user_id}`)}
                                                    startIcon={<Eye size={16} />}
                                                >
                                                    View
                                                </Button>
                                                <Button
                                                    variant="contained"
                                                    color="secondary"
                                                    size="small"
                                                    onClick={() => handleSuspend(tenant?.user_id)}
                                                    style={{ marginLeft: '8px' }}
                                                >
                                                    Suspend Account
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Paper>
            </div>
        </div>
    );
}
