"use client"
import { useRouter, useParams } from "next/navigation";
import SideNavAdmin from "../../../../../components/navigation/sidebar-admin";
import {
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
    Typography, CircularProgress, Box
} from "@mui/material";
import {useEffect, useState} from "react";

export default function LandlordVerificationList(){
    const [landlords, setLandlords] = useState([]);
    const router = useRouter();

    useEffect(() => {
        fetch("/api/landlord/verifications")
            .then((res) => res.json())
            .then((data) => setLandlords(data))
            .catch((error) => console.error("Error fetching landlords:", error));
    }, []);

    return (
        <div className="flex">
        {/* Sidebar Navigation */}
        <SideNavAdmin />

        {/* Main Content */}
        <div className="flex-1 p-6 max-w-6xl mx-auto">
            <h1 className="text-2xl font-semibold text-blue-600 mb-6">Landlord Verification</h1>

            {/* Landlord Verification Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <TableContainer component={Paper}>
                    <Table className="min-w-full">
                        <TableHead className="bg-gray-50">
                            <TableRow>
                                <TableCell className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Landlord ID</TableCell>
                                <TableCell className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Verified</TableCell>
                                <TableCell className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Verification Status</TableCell>
                                <TableCell className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {landlords.length > 0 ? (
                                landlords.map((landlord) => (
                                    <TableRow key={landlord.landlord_id} className="hover:bg-gray-50">
                                        <TableCell className="px-6 py-4">{landlord.landlord_id}</TableCell>
                                        <TableCell className="px-6 py-4">
                                            {landlord.verified ? "✅ Approved" : "❌ Not Verified"}
                                        </TableCell>
                                        <TableCell className="px-6 py-4">{landlord.status}</TableCell>
                                        <TableCell className="px-6 py-4">
                                            <button
                                                onClick={() =>
                                                    router.push(`./verification/details/${landlord.landlord_id}`)
                                                }
                                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition">
                                                View Details
                                            </button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={4} className="px-6 py-12 text-center text-sm text-gray-500">
                                        <p>No landlord verifications found</p>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </div>
        </div>
    </div>
    );
}

