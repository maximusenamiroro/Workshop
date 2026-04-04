import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";
import { FiEye, FiEyeOff } from "react-icons/fi";

export default function Signup() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    country: "",
    accountType: "client",
    category: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const { data, error } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
      });
      if (error) throw error;

      navigate("/welcome"); // adjust redirect if needed
    } catch (error) {
      console.error("Signup error:", error.message);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded-lg shadow-md w-full max-w-md"
      >
        <h2 className="text-2xl font-bold mb-6 text-center">Sign Up</h2>

        <input
          type="text"
          name="name"
          placeholder="Name"
          value={form.name}
          onChange={handleChange}
          required
          className="w-full p-3 mb-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
        />

        <input
          type="text"
          name="phone"
          placeholder="Phone"
          value={form.phone}
          onChange={handleChange}
          required
          className="w-full p-3 mb-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
        />

        <input
          type="email"
          name="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
          required
          className="w-full p-3 mb-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
        />

        <input
          type="text"
          name="country"
          placeholder="Country"
          value={form.country}
          onChange={handleChange}
          required
          className="w-full p-3 mb-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
        />

        <select
          name="accountType"
          value={form.accountType}
          onChange={handleChange}
          className="w-full p-3 mb-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          <option value="client">Client</option>
          <option value="worker">Worker</option>
        </select>

        {form.accountType === "worker" && (
          <input
            type="text"
            name="category"
            placeholder="Category"
            value={form.category}
            onChange={handleChange}
            required
            className="w-full p-3 mb-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        )}

        {/* Password input with eye icon */}
        <div className="relative mb-6">
          <input
            type={showPassword ? "text" : "password"}
            name="password"
            placeholder="Password"
            value={form.password}
            onChange={handleChange}
            required
            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <span
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 cursor-pointer"
          >
            {showPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
          </span>
        </div>

        <button
          type="submit"
          className="w-full bg-blue-500 text-white p-3 rounded-lg hover:bg-blue-600 transition"
        >
          Sign Up
        </button>
      </form>
    </div>
  );
}
