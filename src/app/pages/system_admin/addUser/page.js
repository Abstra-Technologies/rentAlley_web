/*
TODO:

1. Design this addUser page.

 */
'use client'
import { useState } from "react";
import {roles} from "../../../../constant/adminroles";

export default function RegisterAdmin() {
    const [form, setForm] = useState({ username: "", password: "", role: "" });
    const [message, setMessage] = useState("");

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSelectRole = (e) => {
        const selectedRole = e.target.value;
        setForm({ ...form, role: selectedRole });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch("/api/systemadmin/addUsers", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            });

            const data = await res.json();

            if (res.ok) {
                setMessage("Admin registered successfully.");
                setForm({ username: "", password: "", role: "" }); // Reset form
            } else {
                setMessage(data.error);
            }
        } catch (error) {
            console.error("Error:", error);
            setMessage("Something went wrong.");
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <h1>Register Admin</h1>
            <input
                type="text"
                name="username"
                placeholder="Username"
                value={form.username}
                onChange={handleChange}
                required
            />
            <input
                type="password"
                name="password"
                placeholder="Password"
                value={form.password}
                onChange={handleChange}
                required
            />
            <select
                id="roles"
                name="role"
                value={form.role}
                onChange={handleSelectRole}
                required
            >
                <option value="" disabled>
                    Choose a role
                </option>
                {roles.map((role) => (
                    <option key={role.value} value={role.value}>
                        {role.label}
                    </option>
                ))}
            </select>
            <button type="submit">Add User</button>
            <p>{message}</p>
        </form>
    );
}