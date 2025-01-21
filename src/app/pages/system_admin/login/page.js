"use client";

import { useState } from "react";
import LoginForm from "../../../../components/LoginForm";

export default function AdminLogin() {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData({ ...formData, [id]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle admin login logic here
    console.log("Admin Login Submitted", formData);
  };

  return (
    <LoginForm
      handleSubmit={handleSubmit}
      handleChange={handleChange}
      formData={formData}
      errors={errors}
      showGoogleSignIn={false} // Admin login does not have Google Sign-In
      showRegisterLink={false} // Admin login does not have a register link
      isSystemAdmin={true}
      message={message}
    />
  );
}
