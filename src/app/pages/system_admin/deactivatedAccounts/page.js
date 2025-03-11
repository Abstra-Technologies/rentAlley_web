'use client'

import { useEffect, useState } from 'react';
import SideNavAdmin from "../../../../components/navigation/sidebar-admin";

export default function DeactivatedAccounts() {
    const [accounts, setAccounts] = useState([]);

    useEffect(() => {
        fetch('/api/systemadmin/deactivated/list')
            .then((res) => res.json())
            .then((data) => setAccounts(data))
            .catch((err) => console.error('Error:', err));
    }, []);

    return (
        <div className="flex">
            <SideNavAdmin />

        <div>
            <h1 className="text-2xl font-semibold text-blue-600 mb-6">Deactivated Accounts</h1>
            <ul>
                {accounts.length > 0 ? (
                    accounts.map((account) => (
                        <li key={account.user_id}>
                            {account.firstName} {account.lastName} ({account.email}) - {account.userType}
                        </li>
                    ))
                ) : (
                    <p>No deactivated accounts found.</p>
                )}
            </ul>
        </div>
        </div>
    );
}
