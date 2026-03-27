import React, { useState } from "react";
import logo from "../assets/ws-logo.png";

export default function ResetPassword() {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">

      <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md">

        {/* Logo */}
        <div className="flex flex-col items-center mb-6">
          <img
            src={logo}
            alt="Workshop Logo"
            className="w-28 h-28 object-contain"
          />

          <h2 className="text-2xl font-bold text-green-800 mt-3">
            Reset Password
          </h2>

          <p className="text-gray-500 text-sm text-center mt-1">
            Enter OTP and create new password
          </p>
        </div>

        <form className="flex flex-col gap-4">

          <input
            type="text"
            placeholder="OTP Code"
            className="border p-3 rounded-lg"
          />

          <input
            type={showPassword ? "text" : "password"}
            placeholder="New Password"
            className="border p-3 rounded-lg"
          />

          <input
            type={showPassword ? "text" : "password"}
            placeholder="Confirm Password"
            className="border p-3 rounded-lg"
          />

          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="text-green-700 text-sm"
          >
            Show Password
          </button>

          <button
            className="bg-green-700 text-white py-3 rounded-lg"
          >
            Reset Password
          </button>

        </form>

      </div>
    </div>
  );
}
