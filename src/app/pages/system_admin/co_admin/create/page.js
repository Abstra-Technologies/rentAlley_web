"use client";

import { useState } from "react";
//import axios from "axios";

const CreateCoAdmin = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    // GPT GENERATED
    //
    // const { name, value } = e.target;
    // setFormData((prevData) => ({
    //   ...prevData,
    //   [name]: value,
    // }));
  };

  const handleSubmit = async (e) => {
    // GPT GENERATED
    //
    // e.preventDefault();
    // try {
    //   await axios.post("/api/co-admins", formData);
    //   setMessage("Co-admin created successfully!");
    //   setFormData({ name: "", email: "", password: "" });
    // } catch (error) {
    //   setMessage("Error creating co-admin");
    // }
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-4">Create New Co-Admin</h2>
      {message && <p className="mb-4 text-green-600">{message}</p>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Name</label>
          <input
            type="text"
            name="name"
            value={formData.name}
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
