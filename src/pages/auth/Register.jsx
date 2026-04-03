import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";

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
    location: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handworkList = ["Carpenter", "Plumber", "Electrician", "Mechanic", "Tailor", "Welder", "Painter", "Bricklayer", "Barber", "Shoemaker", "Technician"];
  const hireList = ["Cleaner", "Driver", "Security", "Assistant", "Delivery Agent", "Office Helper"];
  const productList = ["Home Supplies", "Electronics", "Fashion", "Mechanical", "Food", "Office Tools"];
  const countries = ["Nigeria", "Ghana", "Kenya", "South Africa", "United States", "United Kingdom", "Canada", "India", "Germany", "France"];

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
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

    try {
      // 1. Create user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
      });

      if (authError) throw authError;

      if (authData.user) {
        // 2. Create profile
        const { error: profileError } = await supabase.from("profiles").insert({
          id: authData.user.id,
          full_name: form.name,
          phone: form.phone || null,
          role: form.accountType,
        });

        if (profileError) throw profileError;

        // 3. If Worker, create worker record
        if (form.accountType === "worker") {
          const { error: workerError } = await supabase.from("workers").insert({
            id: authData.user.id,
            category: form.category || "General",
            hand_skill: handworkList.includes(form.category),
            location: form.location || null,
          });

          if (workerError) console.error("Worker record error:", workerError);
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

        {error && <div className="bg-red-500/10 border border-red-500 text-red-400 p-4 rounded-2xl mb-6">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-5">

          <div className="flex gap-3 mb-6">
            <button
              type="button"
              onClick={() => setForm({ ...form, accountType: "client", category: "" })}
              className={`flex-1 py-4 rounded-2xl font-medium ${form.accountType === "client" ? "bg-green-500" : "bg-gray-800"}`}
            >
              Client
            </button>
            <button
              type="button"
              onClick={() => setForm({ ...form, accountType: "worker" })}
              className={`flex-1 py-4 rounded-2xl font-medium ${form.accountType === "worker" ? "bg-green-500" : "bg-gray-800"}`}
            >
              Worker
            </button>
          </div>

          <input type="text" name="name" placeholder="Full Name *" value={form.name} onChange={handleChange} required className="w-full p-4 bg-[#121826] rounded-2xl" />

          <input type="email" name="email" placeholder="Email *" value={form.email} onChange={handleChange} required className="w-full p-4 bg-[#121826] rounded-2xl" />

          <input type="tel" name="phone" placeholder="Phone Number" value={form.phone} onChange={handleChange} className="w-full p-4 bg-[#121826] rounded-2xl" />

          <select name="country" value={form.country} onChange={handleChange} className="w-full p-4 bg-[#121826] rounded-2xl" required>
            <option value="">Select Country *</option>
            {countries.map(c => <option key={c} value={c}>{c}</option>)}
          </select>

          {form.accountType === "worker" && (
            <select name="category" value={form.category} onChange={handleChange} className="w-full p-4 bg-[#121826] rounded-2xl" required>
              <option value="">Select Category *</option>
              {[...handworkList, ...hireList, ...productList].map(item => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          )}

          <input type="password" name="password" placeholder="Password *" value={form.password} onChange={handleChange} required className="w-full p-4 bg-[#121826] rounded-2xl" />

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