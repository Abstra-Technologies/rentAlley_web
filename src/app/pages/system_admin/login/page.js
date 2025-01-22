'use client'

import { useState } from "react";
import {router, useRouter} from "next/navigation";


export default function Login() {
  const [form, setForm] = useState({ username: "", password: "" });
  const [message, setMessage] = useState("");
  const router = useRouter();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch("/api/systemadmin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage("Login successful!");
        // Redirect to dashboard
        router.push("/dashboard");
      } else {
        setMessage(data.error || "Invalid login credentials.");
      }
    } catch (error) {
      console.error("Error:", error);
      setMessage("Something went wrong. Please try again.");
    }
  };

  return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="bg-white p-8 shadow-md rounded-lg w-full max-w-md">
          <h1 className="text-2xl font-bold text-center mb-6">Rentahan Logo</h1>

          {/* Login Form */}
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label
                  htmlFor="username"
                  className="block text-sm font-medium text-gray-700"
              >
                Username
              </label>
              <input
                  type="text"
                  name="username"
                  placeholder="Username"
                  className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={form.username}
                  onChange={handleChange}
                  required
              />
            </div>

            <div>
              <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700"
              >
                Password
              </label>
              <input
                  type="password"
                  name="password"
                  placeholder="Password"
                  className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={form.password}
                  onChange={handleChange}
                  required
              />
            </div>
            <button
                type="submit"
                className="w-full py-2 px-4 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition"
            >
              Login
            </button>
          </form>

          {message && (
              <p className="mt-4 text-center text-sm text-red-500">{message}</p>
          )}
        </div>
      </div>
  );
}