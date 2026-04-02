import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";
import logo from "../../assets/ws-logo.png";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Redirect will be handled by AuthContext + routing
      navigate("/reels");
    } catch (err) {
      setError(err.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white p-10 rounded-3xl shadow-xl w-full max-w-md">

        <div className="flex flex-col items-center mb-10">
          <img src={logo} alt="Workshop Logo" className="w-20 mb-4" />
          <h2 className="text-3xl font-bold text-green-800">Welcome Back</h2>
          <p className="text-gray-500 mt-2">Sign in to continue</p>
        </div>

        {error && (
          <div className="bg-red-100 text-red-700 p-4 rounded-xl mb-6 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <input
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full border border-gray-300 p-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-green-600"
          />

          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full border border-gray-300 p-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-green-600"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-500"
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-700 text-white py-4 rounded-2xl font-semibold text-lg hover:bg-green-800 transition disabled:opacity-70"
          >
            {loading ? "Signing in..." : "Login"}
          </button>
        </form>

        <div className="text-center mt-8">
          <p className="text-gray-600">
            Don't have an account?{" "}
            <span 
              onClick={() => navigate("/signup")} 
              className="text-green-700 cursor-pointer font-medium"
            >
              Sign Up
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}