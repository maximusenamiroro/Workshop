import React, { useState } from "react";
import logo from "./assets/sw-logo.jpeg";

export default function ClientSignup() {

  const [password, setPassword] = useState("");

  const hasLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);

  const passwordValid = hasLength && hasUppercase && hasNumber;

  const countries = [
    "Nigeria",
    "United States",
    "United Kingdom",
    "Canada",
    "Germany",
    "France",
    "Italy",
    "Spain",
    "Netherlands",
    "India",
    "China",
    "Japan",
    "Brazil",
    "South Africa",
    "Australia",
    "Mexico",
    "Argentina",
    "Turkey",
    "Saudi Arabia",
    "United Arab Emirates",
    "Ghana",
    "Kenya",
    "Egypt"
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">

      <div className="bg-white p-10 rounded-xl shadow-lg w-full max-w-md">

        {/* Logo */}
        <div className="flex flex-col items-center mb-6">
          <img src={logo} alt="Workshop Logo" className="w-20 mb-2" />
          <h2 className="text-2xl font-bold text-green-800">
            Create Client Account
          </h2>
        </div>

        <form className="flex flex-col gap-4">

          <input
            type="text"
            placeholder="Full Name"
            className="border p-3 rounded-lg focus:ring-2 focus:ring-green-600"
            required
          />

          <input
            type="email"
            placeholder="Email Address"
            className="border p-3 rounded-lg focus:ring-2 focus:ring-green-600"
            required
          />

          <input
            type="tel"
            placeholder="Phone Number"
            className="border p-3 rounded-lg focus:ring-2 focus:ring-green-600"
            required
          />

          {/* Country Dropdown */}
          <select
            className="border p-3 rounded-lg focus:ring-2 focus:ring-green-600"
            required
          >
            <option value="">Select Country</option>

            {countries.map((country, index) => (
              <option key={index} value={country}>
                {country}
              </option>
            ))}

          </select>

          <input
            type="password"
            placeholder="Create Password"
            className="border p-3 rounded-lg focus:ring-2 focus:ring-green-600"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <div className="text-sm">
            <p className={hasLength ? "text-green-600" : "text-gray-500"}>
              ✓ At least 8 characters
            </p>
            <p className={hasUppercase ? "text-green-600" : "text-gray-500"}>
              ✓ One uppercase letter
            </p>
            <p className={hasNumber ? "text-green-600" : "text-gray-500"}>
              ✓ One number
            </p>
          </div>

          <button
            disabled={!passwordValid}
            className={`py-3 rounded-lg text-white
            ${passwordValid ? "bg-green-700 hover:bg-green-800" : "bg-gray-400 cursor-not-allowed"}`}
          >
            Create Client Account
          </button>

        </form>

        <p className="text-center text-gray-600 mt-6">
          Already have an account?
          <span className="text-green-700 cursor-pointer ml-1">
            Login
          </span>
        </p>

      </div>

    </div>
  );
}