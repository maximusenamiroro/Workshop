import React, { useState } from "react";
import logo from "./assets/sw.jpeg";

export default function ShoppingLogin() {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">

      {/* Login Card */}
      <div className="bg-white p-10 rounded-2xl shadow-xl w-full max-w-md">

        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <img
            src={logo}
            alt="SW Shopping Logo"
            className="w-24 mb-3"
          />

          <h2 className="text-2xl font-bold text-green-800">
            Account Login
          </h2>
        </div>

        {/* Form */}
        <form className="flex flex-col gap-4">

          {/* Email / Phone */}
          <input
            type="text"
            placeholder="Email or Phone Number"
            className="border p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
            required
          />

          {/* Password */}
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              className="border p-3 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-green-600"
              required
            />

            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>

          {/* Login Button */}
          <button
            type="submit"
            className="bg-green-700 text-white py-3 rounded-lg hover:bg-green-800 transition"
          >
            Login
          </button>

        </form>

        {/* Links */}
        <div className="text-center mt-6">

          <p className="text-gray-600">
            Don't have an account?
            <span className="text-green-700 ml-1 cursor-pointer">
              Sign Up
            </span>
          </p>

          <p className="text-sm text-gray-500 mt-2 hover:text-green-700 cursor-pointer">
            Forgot Password?
          </p>

        </div>

      </div>

    </div>
  );
}