"use client";

import { useState } from "react";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react"; // for google signin
import LoginForm from "../../../../components/LoginForm";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export default function Login() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [errors, setErrors] = useState({
    email: "",
    password: "",
  });

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData({ ...formData, [id]: value });

    // Validate the field as the user types
    try {
      loginSchema.pick({ [id]: true }).parse({ [id]: value });
      setErrors((prevErrors) => ({ ...prevErrors, [id]: "" }));
    } catch (error) {
      setErrors((prevErrors) => ({
        ...prevErrors,
        [id]: error.errors[0]?.message || "",
      }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    try {
      // Validate the entire form
      loginSchema.parse(formData);
      console.log("Login Data:", formData);
      // Proceed with login logic here
    } catch (error) {
      const fieldErrors = error.errors.reduce(
        (acc, err) => ({ ...acc, [err.path[0]]: err.message }),
        {}
      );
      setErrors(fieldErrors);
    }
  };

  return (
    <LoginForm
      handleSubmit={handleSubmit}
      handleChange={handleChange}
      formData={formData}
      errors={errors}
      showGoogleSignIn={true}
      showRegisterLink={true}
      isSystemAdmin={false}
      message={message}
    />
  );
}
