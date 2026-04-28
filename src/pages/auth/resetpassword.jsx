import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";
import logo from "../../assets/ws-logo.png";

export default function ResetPassword() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleReset = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`, // Change this if needed
      });

      if (error) throw error;

      setMessage("Password reset link sent to your email. Check your inbox.");
    } catch (err) {
      setError(err.message || "Failed to send reset link");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] flex items-center justify-center p-4 text-white">
      <div className="bg-[#121826] p-10 rounded-3xl w-full max-w-md">

        <div className="flex flex-col items-center mb-10">
          <img src={logo} alt="omoworkit Logo" className="w-20 mb-4" />
          <h2 className="text-3xl font-bold">Reset Password</h2>
          <p className="text-gray-400 text-sm text-center mt-2">
            Enter your email to receive a reset link
          </p>
        </div>

        {error && <div className="bg-red-500/10 border border-red-500 text-red-400 p-4 rounded-2xl mb-6">{error}</div>}
        {message && <div className="bg-green-500/10 border border-green-500 text-green-400 p-4 rounded-2xl mb-6">{message}</div>}

        <form onSubmit={handleReset} className="space-y-6">
          <input
            type="email"
            placeholder="Enter your email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full p-4 bg-[#1a2332] rounded-2xl border border-gray-700 focus:border-green-500 outline-none"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 py-4 rounded-2xl font-semibold text-lg transition"
          >
            {loading ? "Sending link..." : "Send Reset Link"}
          </button>
        </form>

        <div className="text-center mt-6">
          <button
            onClick={() => navigate("/login")}
            className="text-green-400 hover:underline"
          >
            Back to Login
          </button>
        </div>
      </div>
    </div>
  );
}