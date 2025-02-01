"use client";

import { useState } from "react";
import {roles} from "../../../../../constant/adminroles";
//import axios from "axios";

const CreateCoAdmin = () => {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    role:"",
  });

  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSelectRole = (e) => {
    const selectedRole = e.target.value;
    setFormData({ ...formData, role: selectedRole });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/systemadmin/addUsers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage("Admin registered successfully.");
        setFormData({ username: "", email:" ", password: "", role: "" }); // Reset form
      } else {
        setMessage(data.error);
      }
    } catch (error) {
      console.error("Error:", error);
      setMessage("Something went wrong.");
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-4">Add New Co-Admin</h2>
      {message && <p className="mb-4 text-green-600">{message}</p>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">username</label>
          <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded"
              required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded"
              required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Password</label>
          <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded"
              required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Role</label>
          <select
              id="roles"
              name="role"
              value={formData.role}
              onChange={handleSelectRole}
              required

          >
            <option  value="" disabled>
              Choose a role
            </option>
            {roles.map((role) => (
                <option key={role.value} value={role.value} >
                  {role.label}
                </option>
            ))}
          </select>
        </div>
        <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
        >
          Create Co-Admin
        </button>
      </form>
    </div>
  );
};

export default CreateCoAdmin;
