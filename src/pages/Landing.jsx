import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";   // ← Make sure this path is correct
import logo from "../assets/ws-logo.png";

export default function LandingPage() {
  const navigate = useNavigate();

  // Strong Supabase Connection Test
  useEffect(() => {
    console.log("🚀 LandingPage loaded - Starting Supabase test...");

    const testSupabase = async () => {
      try {
        console.log("Connecting to Supabase...");

        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .limit(1);

        if (error) {
          console.error("❌ Supabase FAILED:", error.message);
        } else {
          console.log("✅ Supabase SUCCESS! Data received:", data);
          console.log("Supabase is connected and working.");
        }
      } catch (err) {
        console.error("❌ Unexpected error:", err);
      }
    };

    testSupabase();
  }, []);

  return (
    <div className="min-h-screen bg-[#0B0F19] text-white flex flex-col">

      {/* Header */}
      <header className="flex justify-between items-center px-8 py-6">
        <div className="flex items-center gap-3">
          <img src={logo} alt="Workshop Logo" className="w-10 h-10" />
          <h1 className="text-2xl font-bold">Workshop</h1>
        </div>
        <button
          onClick={() => navigate("/login")}
          className="px-6 py-2 border border-gray-600 rounded-full hover:bg-white hover:text-black transition"
        >
          Login
        </button>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-6 py-12">
        <h1 className="text-5xl md:text-6xl font-bold leading-tight mb-6">
          Connect. Work.<br />Grow Together.
        </h1>

        <p className="max-w-xl text-gray-400 text-lg mb-12">
          The simplest platform where skilled workers and clients meet, 
          work together, track jobs in real-time, and grow.
        </p>

        <div className="flex flex-col sm:flex-row gap-5 w-full max-w-md">
          <button
            onClick={() => navigate("/signup?role=worker")}
            className="bg-green-600 hover:bg-green-700 py-4 rounded-2xl font-semibold text-lg flex items-center justify-center gap-3 transition"
          >
            Join as a Worker <span>🔨</span>
          </button>

          <button
            onClick={() => navigate("/signup?role=client")}
            className="bg-white text-black hover:bg-gray-100 py-4 rounded-2xl font-semibold text-lg flex items-center justify-center gap-3 transition"
          >
            Join as a Client <span>👥</span>
          </button>
        </div>
      </main>

      <footer className="py-8 text-center text-gray-500 text-sm">
        © 2026 Workshop • Connecting Workers and Clients
      </footer>
    </div>
  );
}