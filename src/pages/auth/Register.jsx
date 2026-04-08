import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { businessCategories } from "../data/bussinesscategorie";

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

  const countries = [
    "Nigeria", "Ghana", "Kenya", "South Africa",
    "United States", "United Kingdom", "Canada",
    "India", "Germany", "France",
  ];

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleAccountType = (type) => {
    setForm({ ...form, accountType: type, category_group: "", category: "", otherCategory: "" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!form.name || !form.email || !form.password) {
      setError("Please fill name, email and password");
      setLoading(false);
      return;
    }

    if (form.accountType === "worker") {
      if (!form.category_group) {
        setError("Please select business group");
        setLoading(false);
        return;
      }
      if (!form.category) {
        setError("Please select category");
        setLoading(false);
        return;
      }
      if (form.category === "Other Business" && !form.otherCategory) {
        setError("Please specify your category");
        setLoading(false);
        return;
      }
    }

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
      });

      if (authError) throw authError;

      if (authData.user) {
        const { error: profileError } = await supabase.from("profiles").insert({
          id: authData.user.id,
          full_name: form.name,
          phone: form.phone || null,
          role: form.accountType,
          country: form.country || null,
        });

        if (profileError) throw profileError;

        if (form.accountType === "worker") {
          const workerCategory = form.category === "Other Business"
            ? form.otherCategory
            : form.category;

          const handSkillFlag = form.category_group === "Handwork & Skilled Workers";

          const { error: workerError } = await supabase.from("workers").insert({
            id: authData.user.id,
            category_group: form.category_group,
            category: workerCategory,
            hand_skill: handSkillFlag,
            location: form.location || null,
          });

          if (workerError) console.error("Worker insert error:", workerError);
        }

        alert(`✅ Account created successfully as ${form.accountType}!`);
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
    <div className="min-h-screen bg-[#0B0F19] text-white p-4 flex items-center justify-center">
      <div className="w-full max-w-md">

        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold">Create Account</h1>
          <p className="text-gray-400 mt-2">Join Workshop</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500 text-red-400 p-4 rounded-2xl mb-6">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Account Type */}
          <div className="flex gap-3 mb-6">
            <button
              type="button"
              onClick={() => handleAccountType("client")}
              className={`flex-1 py-4 rounded-2xl font-medium ${form.accountType === "client" ? "bg-green-500" : "bg-gray-800"}`}
            >
              Client
            </button>
            <button
              type="button"
              onClick={() => handleAccountType("worker")}
              className={`flex-1 py-4 rounded-2xl font-medium ${form.accountType === "worker" ? "bg-green-500" : "bg-gray-800"}`}
            >
              Worker
            </button>
          </div>

          <input type="text" name="name" placeholder="Full Name *" value={form.name} onChange={handleChange} required className="w-full p-4 bg-[#121826] rounded-2xl text-white" />
          <input type="email" name="email" placeholder="Email *" value={form.email} onChange={handleChange} required className="w-full p-4 bg-[#121826] rounded-2xl text-white" />
          <input type="tel" name="phone" placeholder="Phone Number" value={form.phone} onChange={handleChange} className="w-full p-4 bg-[#121826] rounded-2xl text-white" />

          <select name="country" value={form.country} onChange={handleChange} required className="w-full p-4 bg-[#121826] rounded-2xl text-white">
            <option value="">Select Country *</option>
            {countries.map(c => <option key={c} value={c}>{c}</option>)}
          </select>

          {/* Worker Fields */}
          {form.accountType === "worker" && (
            <>
              <select name="category_group" value={form.category_group} onChange={handleChange} className="w-full p-4 bg-[#121826] rounded-2xl text-white">
                <option value="">Select Business Group</option>
                {Object.keys(businessCategories).map(group => (
                  <option key={group} value={group}>{group}</option>
                ))}
              </select>

              {form.category_group && (
                <select name="category" value={form.category} onChange={handleChange} className="w-full p-4 bg-[#121826] rounded-2xl text-white">
                  <option value="">Select Category</option>
                  {businessCategories[form.category_group].map(item => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </select>
              )}

              {form.category === "Other Business" && (
                <input
                  type="text"
                  name="otherCategory"
                  placeholder="Specify your category"
                  value={form.otherCategory}
                  onChange={handleChange}
                  className="w-full p-4 bg-[#121826] rounded-2xl text-white"
                />
              )}

              <input
                type="text"
                name="location"
                placeholder="Business Location"
                value={form.location}
                onChange={handleChange}
                className="w-full p-4 bg-[#121826] rounded-2xl text-white"
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
              className="w-full p-4 bg-[#121826] rounded-2xl pr-12 text-white"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute top-1/2 right-4 -translate-y-1/2 text-gray-400"
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-500 py-4 rounded-2xl font-semibold text-lg disabled:bg-gray-600"
          >
            {loading ? "Creating Account..." : `Create ${form.accountType === "worker" ? "Worker" : "Client"} Account`}
          </button>
        </form>
      </div>
    </div>
  );
}