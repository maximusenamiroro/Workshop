import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { businessCategories } from "../data/bussinesscategorie";
import { useToast } from "../../hooks/useToast";

export default function Signup() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    country: "",
    accountType: "client",
    category_group: "",
    category: "",
    otherCategory: "",
    password: "",
    location: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { showToast, ToastUI } = useToast();

  const countries = [
    "Nigeria", "Ghana", "Kenya", "South Africa",
    "United States", "United Kingdom", "Canada",
    "India", "Germany", "France",
  ];

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleAccountType = (type) => {
    setForm({
      ...form,
      accountType: type,
      category_group: "",
      category: "",
      otherCategory: "",
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Basic validation
    if (!form.name || !form.email || !form.password) {
      setError("Please fill name, email and password");
      setLoading(false);
      return;
    }

    if (!form.country) {
      setError("Please select your country");
      setLoading(false);
      return;
    }

    // Worker validation — category is optional
    if (form.accountType === "worker") {
      if (form.category === "Other Business" && !form.otherCategory) {
        setError("Please specify your category");
        setLoading(false);
        return;
      }
    }

    try {
      // Step 1 — Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("Account creation failed. Please try again.");

      const userId = authData.user.id;

      // Step 2 — Create profile
      const { error: profileError } = await supabase.from("profiles").insert({
        id: userId,
        full_name: form.name,
        phone: form.phone || null,
        role: form.accountType,
        country: form.country || null,
      });

      if (profileError) throw new Error("Profile creation failed: " + profileError.message);

      // Step 3 — Create worker row
      // Category is optional — if not picked they are a general worker
      if (form.accountType === "worker") {
        const workerCategory = form.category === "Other Business"
          ? form.otherCategory.trim()
          : form.category?.trim() || null; // null if no category picked = general worker

        const handSkillFlag = form.category_group === "Handwork & Skilled Workers";

        const { error: workerError } = await supabase.from("workers").insert({
          id: userId,
          category_group: form.category_group?.trim() || null,
          category: workerCategory,
          hand_skill: handSkillFlag,
          location: form.location?.trim() || null,
        });

        if (workerError) {
          console.error("Worker insert error:", workerError);
          throw new Error("Worker profile creation failed: " + workerError.message);
        }
      }

      showToast(`✅ Account created successfully as ${form.accountType}!`, "success");
      navigate("/reels");

    } catch (err) {
      console.error("Signup error:", err);
      setError(err.message || "Failed to create account. Please try again.");
      showToast("Failed to create account. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] text-white p-4 flex items-center justify-center">
      <div className="w-full max-w-md">

        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold">Create Account</h1>
          <p className="text-gray-400 mt-2">Join omoworkit</p>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-500/10 border border-red-500 text-red-400 p-4 rounded-2xl mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Account Type */}
          <div className="flex gap-3 mb-6">
            <button
              type="button"
              onClick={() => handleAccountType("client")}
              className={`flex-1 py-4 rounded-2xl font-medium transition ${
                form.accountType === "client" ? "bg-green-500" : "bg-gray-800"
              }`}
            >
              Client
            </button>
            <button
              type="button"
              onClick={() => handleAccountType("worker")}
              className={`flex-1 py-4 rounded-2xl font-medium transition ${
                form.accountType === "worker" ? "bg-green-500" : "bg-gray-800"
              }`}
            >
              Worker
            </button>
          </div>

          {/* Basic Info */}
          <input
            type="text"
            name="name"
            placeholder="Full Name *"
            value={form.name}
            onChange={handleChange}
            required
            className="w-full p-4 bg-[#121826] rounded-2xl text-white placeholder-gray-500 outline-none"
          />

          <input
            type="email"
            name="email"
            placeholder="Email *"
            value={form.email}
            onChange={handleChange}
            required
            className="w-full p-4 bg-[#121826] rounded-2xl text-white placeholder-gray-500 outline-none"
          />

          <input
            type="tel"
            name="phone"
            placeholder="Phone Number"
            value={form.phone}
            onChange={handleChange}
            className="w-full p-4 bg-[#121826] rounded-2xl text-white placeholder-gray-500 outline-none"
          />

          {/* Country */}
          <select
            name="country"
            value={form.country}
            onChange={handleChange}
            required
            className="w-full p-4 bg-[#121826] rounded-2xl text-white outline-none"
          >
            <option value="">Select Country *</option>
            {countries.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          {/* Worker Fields */}
          {form.accountType === "worker" && (
            <>
              <p className="text-xs text-gray-400">
                Category is optional — skip if you are a general worker
              </p>

              {/* Business Group */}
              <select
                name="category_group"
                value={form.category_group}
                onChange={handleChange}
                className="w-full p-4 bg-[#121826] rounded-2xl text-white outline-none"
              >
                <option value="">Select Business Group (optional)</option>
                {Object.keys(businessCategories).map(group => (
                  <option key={group} value={group}>{group}</option>
                ))}
              </select>

              {/* Category */}
              {form.category_group && (
                <select
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  className="w-full p-4 bg-[#121826] rounded-2xl text-white outline-none"
                >
                  <option value="">Select Category (optional)</option>
                  {businessCategories[form.category_group].map(item => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </select>
              )}

              {/* Other Category */}
              {form.category === "Other Business" && (
                <input
                  type="text"
                  name="otherCategory"
                  placeholder="Specify your category"
                  value={form.otherCategory}
                  onChange={handleChange}
                  className="w-full p-4 bg-[#121826] rounded-2xl text-white placeholder-gray-500 outline-none"
                />
              )}

              {/* Location */}
              <input
                type="text"
                name="location"
                placeholder="Business Location (optional)"
                value={form.location}
                onChange={handleChange}
                className="w-full p-4 bg-[#121826] rounded-2xl text-white placeholder-gray-500 outline-none"
              />
            </>
          )}

          {/* Password */}
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Password *"
              value={form.password}
              onChange={handleChange}
              required
              className="w-full p-4 bg-[#121826] rounded-2xl pr-12 text-white placeholder-gray-500 outline-none"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute top-1/2 right-4 -translate-y-1/2 text-gray-400"
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-500 hover:bg-green-600 py-4 rounded-2xl font-semibold text-lg disabled:bg-gray-600 transition"
          >
            {loading
              ? "Creating Account..."
              : `Create ${form.accountType === "worker" ? "Worker" : "Client"} Account`
            }
          </button>

          {/* Login link */}
          <p className="text-center text-gray-400 text-sm">
            Already have an account?{" "}
            <span
              onClick={() => navigate("/login")}
              className="text-green-400 cursor-pointer hover:underline"
            >
              Login
            </span>
          </p>

        </form>
      </div>
    </div>
  );
}