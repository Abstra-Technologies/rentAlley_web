'use client'
import {useEffect, useState} from "react";
import useAuth from "../../../../../../hooks/useSession";
import {useRouter} from "next/navigation";

export default function  LandlordList() {
    const [landlords, setLandlords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { admin } = useAuth();
    const router = useRouter();
    useEffect(() => {
        const fetchLandlords = async () => {
            try {
                const response = await fetch("/api/landlord/list");

                if (!response.ok) {
                    new Error('Failed to fetch landlords.');
                }
                const data = await response.json();
                setLandlords(data.landlords);
            } catch (error) {
                setError(error.message);
            } finally {
                setLoading(false);
            }
        };

        fetchLandlords();
    }, []);

    if (loading) return <p>Loading landlords...</p>;
    if (error) return <p>Error: {error}</p>;

    if (loading) {
        return <p>Loading...</p>;
    }

    if (!admin) {
        return <p>You need to log in to access the dashboard.</p>;
    }


    return (
        <div>
            <h2>Landlord List</h2>
            <table border="1" cellPadding="10">
                <thead>
                <tr>
                    <th>#</th>
                    <th>Landlord ID</th>
                    <th>User ID</th>
                    <th>Profile Picture</th>
                    <th>Verified</th>
                    <th>Created At</th>
                </tr>
                </thead>
                <tbody>
                <>
                    {landlords.map((landlord, index) => (
                        <tr key={landlord.landlord_id}>
                            <td>{index + 1}</td>
                            <td>{landlord.landlord_id}</td>
                            <td>
                                <a
                                    href="#"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        router.push(`./viewProfile/landlord/${landlord.user_id}`);
                                    }}
                                    style={{color: "blue", textDecoration: "underline", cursor: "pointer"}}
                                >
                                    {landlord.user_id}
                                </a>
                            </td>
                            <td>{landlord.profilePicture}</td>
                            <td>{landlord.verified}</td>
                            <td>{landlord.createdAt}</td>
                        </tr>
                    ))}
                </>
                </tbody>
            </table>
        </div>
    );
};