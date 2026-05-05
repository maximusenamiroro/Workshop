import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { businessCategories } from "../data/bussinesscategorie";
import { useToast } from "../../hooks/useToast";
import logo from "../../assets/ws-logo.png";

export default function Signup() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { showToast, ToastUI } = useToast();

  // Read role from URL — ?role=worker → pre-select Business Account
  const roleFromUrl = searchParams.get("role"); // "worker" or "client"

  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    country: "",
    accountType: roleFromUrl === "worker" ? "worker" : "client",
    category_group: "",
    category: "",
    otherCategory: "",
    password: "",
    location: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // If user navigates back and changes URL param, update accountType
  useEffect(() => {
    if (roleFromUrl === "worker" || roleFromUrl === "client") {
      setForm(prev => ({ ...prev, accountType: roleFromUrl }));
    }
  }, [roleFromUrl]);

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
      location: "",
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!form.name.trim() || !form.email.trim() || !form.password) {
      setError("Please fill in name, email and password");
      setLoading(false);
      return;
    }

    if (!form.country) {
      setError("Please select your country");
      setLoading(false);
      return;
    }

    if (form.accountType === "worker") {
      if (form.category === "Other Business" && !form.otherCategory.trim()) {
        setError("Please specify your business category");
        setLoading(false);
        return;
      }
    }

    try {
      // Step 1 — Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: form.email.trim(),
        password: form.password,
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("Account creation failed. Please try again.");

      const userId = authData.user.id;

      // Step 2 — Create profile
      const { error: profileError } = await supabase.from("profiles").insert({
        id: userId,
        full_name: form.name.trim(),
        phone: form.phone?.trim() || null,
        role: form.accountType,
        country: form.country || null,
      });

      if (profileError) throw new Error("Profile creation failed: " + profileError.message);

      // Step 3 — Create worker row if business account
      if (form.accountType === "worker") {
        const workerCategory = form.category === "Other Business"
          ? form.otherCategory.trim()
          : form.category?.trim() || null;

        const handSkillFlag = form.category_group === "Handwork & Skilled Workers";

        const { error: workerError } = await supabase.from("workers").insert({
          id: userId,
          category_group: form.category_group?.trim() || null,
          category: workerCategory,
          hand_skill: handSkillFlag,
          location: form.location?.trim() || null,
        });

        if (workerError) throw new Error("Business profile creation failed: " + workerError.message);
      }

      showToast(
        form.accountType === "worker"
          ? "✅ Business account created successfully!"
          : "✅ Client account created successfully!"
      );

      // Small delay so toast is visible before navigating
      setTimeout(() => navigate("/reels"), 800);

    } catch (err) {
      console.error("Signup error:", err);
      const msg = err.message?.includes("already registered")
        ? "This email is already registered. Please login instead."
        : err.message || "Failed to create account. Please try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const isWorker = form.accountType === "worker";

  return (
    <div className="min-h-screen bg-[#0B0F19] text-white flex flex-col">
      <ToastUI />

      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 hover:opacity-80 transition"
        >
          <img src={logo} alt="Omoworkit" className="w-8 h-8 rounded-lg" />
          <span className="font-bold text-base">omoworkit</span>
        </button>
        <button
          onClick={() => navigate("/login")}
          className="text-sm text-gray-400 hover:text-white transition"
        >
          Login →
        </button>
      </div>

      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">

          {/* Title */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold">
              {isWorker ? "Register Your Business" : "Create Your Account"}
            </h1>
            <p className="text-gray-400 mt-2 text-sm">
              {isWorker
                ? "Get discovered by clients near you"
                : "Find and hire workers near you instantly"
              }
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-2xl mb-6 text-sm">
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Account Type Toggle */}
            <div className="flex gap-2 mb-2 bg-white/5 p-1 rounded-2xl">
              <button
                type="button"
                onClick={() => handleAccountType("client")}
                className={`flex-1 py-3 rounded-xl font-semibold text-sm transition ${
                  !isWorker
                    ? "bg-white text-black shadow"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                👥 I'm a Client
              </button>
              <button
                type="button"
                onClick={() => handleAccountType("worker")}
                className={`flex-1 py-3 rounded-xl font-semibold text-sm transition ${
                  isWorker
                    ? "bg-green-600 text-white shadow"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                🏢 I'm a Business
              </button>
            </div>

            {/* What you get banner */}
            <div className={`rounded-2xl p-3 text-xs border ${
              isWorker
                ? "bg-green-500/5 border-green-500/20 text-green-400"
                : "bg-blue-500/5 border-blue-500/20 text-blue-400"
            }`}>
              {isWorker
                ? "✓ Go live · ✓ Get booked · ✓ Post reels · ✓ Sell products"
                : "✓ Find workers nearby · ✓ Track in real-time · ✓ Order products"
              }
            </div>

            {/* Full Name */}
            <input
              type="text"
              name="name"
              placeholder={isWorker ? "Business / Full Name *" : "Full Name *"}
              value={form.name}
              onChange={handleChange}
              required
              className="w-full p-4 bg-[#121826] rounded-2xl text-white placeholder-gray-500 outline-none border border-white/5 focus:border-green-500/50 transition"
            />

            {/* Email */}
            <input
              type="email"
              name="email"
              placeholder="Email Address *"
              value={form.email}
              onChange={handleChange}
              required
              className="w-full p-4 bg-[#121826] rounded-2xl text-white placeholder-gray-500 outline-none border border-white/5 focus:border-green-500/50 transition"
            />

            {/* Phone */}
            <input
              type="tel"
              name="phone"
              placeholder="Phone Number (optional)"
              value={form.phone}
              onChange={handleChange}
              className="w-full p-4 bg-[#121826] rounded-2xl text-white placeholder-gray-500 outline-none border border-white/5 focus:border-green-500/50 transition"
            />

            {/* Country */}
            <select
              name="country"
              value={form.country}
              onChange={handleChange}
              required
              className="w-full p-4 bg-[#121826] rounded-2xl text-white outline-none border border-white/5 focus:border-green-500/50 transition"
            >
              <option value="">Select Country *</option>
              {countries.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            {/* Business-only fields */}
            {isWorker && (
              <div className="space-y-4">
                <div className="border-t border-white/5 pt-2">
                  <p className="text-xs text-gray-400 mb-3">
                    Business category helps clients find you. Skip if you're a general worker.
                  </p>

                  {/* Business Group */}
                  <select
                    name="category_group"
                    value={form.category_group}
                    onChange={(e) => setForm({ ...form, category_group: e.target.value, category: "" })}
                    className="w-full p-4 bg-[#121826] rounded-2xl text-white outline-none border border-white/5 focus:border-green-500/50 transition"
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
                      className="w-full p-4 bg-[#121826] rounded-2xl text-white outline-none border border-white/5 focus:border-green-500/50 transition mt-4"
                    >
                      <option value="">Select Category (optional)</option>
                      {businessCategories[form.category_group].map(item => (
                        <option key={item} value={item}>{item}</option>
                      ))}
                    </select>
                  )}

                  {/* Other category text input */}
                  {form.category === "Other Business" && (
                    <input
                      type="text"
                      name="otherCategory"
                      placeholder="Describe your business *"
                      value={form.otherCategory}
                      onChange={handleChange}
                      className="w-full p-4 bg-[#121826] rounded-2xl text-white placeholder-gray-500 outline-none border border-white/5 focus:border-green-500/50 transition mt-4"
                    />
                  )}

                  {/* Location */}
                  <input
                    type="text"
                    name="location"
                    placeholder="Business Location e.g. Ikeja, Lagos (optional)"
                    value={form.location}
                    onChange={handleChange}
                    className="w-full p-4 bg-[#121826] rounded-2xl text-white placeholder-gray-500 outline-none border border-white/5 focus:border-green-500/50 transition mt-4"
                  />
                </div>
              </div>
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
                minLength={6}
                className="w-full p-4 bg-[#121826] rounded-2xl pr-12 text-white placeholder-gray-500 outline-none border border-white/5 focus:border-green-500/50 transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute top-1/2 right-4 -translate-y-1/2 text-gray-400 hover:text-white transition"
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-4 rounded-2xl font-bold text-lg transition active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed ${
                isWorker
                  ? "bg-green-600 hover:bg-green-500 shadow-lg shadow-green-500/20"
                  : "bg-white text-black hover:bg-gray-100"
              }`}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Creating Account...
                </span>
              ) : isWorker ? (
                "🏢 Create Business Account"
              ) : (
                "👥 Create Client Account"
              )}
            </button>

            {/* Login link */}
            <p className="text-center text-gray-400 text-sm pt-2">
              Already have an account?{" "}
              <span
                onClick={() => navigate("/login")}
                className="text-green-400 cursor-pointer hover:underline font-medium"
              >
                Login here
              </span>
            </p>

          </form>
        </div>
      </div>
    </div>
  );
}