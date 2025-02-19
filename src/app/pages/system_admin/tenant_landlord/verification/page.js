"use client"
import { useRouter, useParams } from "next/navigation";


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
        <div className="container mx-auto p-4">
            <h2 className="text-xl font-bold mb-4">Landlord Verification</h2>
            <table className="w-full border-collapse border border-gray-300">
                <thead>
                <tr className="bg-gray-200">
                    <th className="border p-2">Landlord ID</th>
                    <th className="border p-2">Verified</th>
                    <th className="border p-2">Verification Status</th>
                    <th className="border p-2">Actions</th>
                </tr>
                </thead>
                <tbody>
                {landlords.map((landlord) => (
                    <tr key={landlord.landlord_id} className="border">
                        <td className="border p-2 text-center">{landlord.landlord_id}</td>
                        <td className="border p-2 text-center">
                            {landlord.verified ? "✅ Approved" : "❌ Not Verified"}
                        </td>
                        <td className="border p-2 text-center">
                            {landlord.status}
                        </td>
                        <td className="border p-2 text-center">
                            <button
                                onClick={() => router.push(`./verification/details/${landlord.landlord_id}`)}
                                className="px-4 py-1 bg-blue-500 text-white rounded mr-2">
                                View
                            </button>

                        </td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    );
}

