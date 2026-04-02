import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";

export default function Signup() {
  const navigate = useNavigate();

  const [role, setRole] = useState("client"); // default to client
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    password: "",
    phone: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!formData.full_name || !formData.email || !formData.password) {
      setError("Please fill all required fields");
      setLoading(false);
      return;
    }

    try {
      // 1. Create Auth User
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: { full_name: formData.full_name },
        },
      });

      if (authError) throw authError;

      if (authData.user) {
        // 2. Create Profile with selected role
        const { error: profileError } = await supabase.from("profiles").insert({
          id: authData.user.id,
          full_name: formData.full_name,
          phone: formData.phone || null,
          role: role,
        });

        if (profileError) throw profileError;

        // 3. If Worker, create additional worker record
        if (role === "worker") {
          await supabase.from("workers").insert({
            id: authData.user.id,
            category: "General",
            hand_skill: false,
          });
        }

        alert(`✅ Account created successfully as ${role}!`);
        navigate("/reels");
      }
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to create account");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] text-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-green-500 rounded-2xl mx-auto flex items-center justify-center mb-4">
            <span className="text-4xl">🔨</span>
          </div>
          <h1 className="text-3xl font-bold">Create Account</h1>
          <p className="text-gray-400 mt-2">Join Workshop today</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500 text-red-400 p-4 rounded-2xl mb-6">
            {error}
          </div>
        )}

        {/* Role Selection */}
        <div className="flex gap-4 mb-8">
          <button
            type="button"
            onClick={() => setRole("client")}
            className={`flex-1 py-4 rounded-2xl font-medium transition ${
              role === "client"
                ? "bg-green-500 text-white"
                : "bg-[#121826] text-gray-400 hover:bg-[#1a2332]"
            }`}
          >
            Client Account
          </button>

          <button
            type="button"
            onClick={() => setRole("worker")}
            className={`flex-1 py-4 rounded-2xl font-medium transition ${
              role === "worker"
                ? "bg-green-500 text-white"
                : "bg-[#121826] text-gray-400 hover:bg-[#1a2332]"
            }`}
          >
            Worker Account
          </button>
        </div>

        <form onSubmit={handleSignup} className="space-y-5">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Full Name</label>
            <input
              type="text"
              name="full_name"
              value={formData.full_name}
              onChange={handleChange}
              required
              className="w-full bg-[#121826] border border-gray-700 rounded-2xl px-5 py-4 focus:border-green-500 outline-none"
              placeholder="Enter your full name"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">Email Address</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full bg-[#121826] border border-gray-700 rounded-2xl px-5 py-4 focus:border-green-500 outline-none"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">Phone Number (Optional)</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="w-full bg-[#121826] border border-gray-700 rounded-2xl px-5 py-4 focus:border-green-500 outline-none"
              placeholder="+234 801 234 5678"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              className="w-full bg-[#121826] border border-gray-700 rounded-2xl px-5 py-4 focus:border-green-500 outline-none"
              placeholder="Create a strong password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-500 hover:bg-green-600 disabled:bg-green-700 py-4 rounded-2xl font-semibold text-lg mt-8 transition"
          >
            {loading ? "Creating Account..." : `Create ${role === "worker" ? "Worker" : "Client"} Account`}
          </button>
        </form>

        <p className="text-center text-gray-400 mt-8">
          Already have an account?{" "}
          <span
            onClick={() => navigate("/login")}
            className="text-green-400 cursor-pointer hover:underline"
          >
            Login here
          </span>
        </p>
      </div>
    </div>
  );
}