import React from "react";
import logo from "./assets/logo.png";

export default function WorkshopLandingPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col">

      {/* Header */}
      <header className="flex justify-end items-center px-8 py-5">
        <button className="text-green-700 font-semibold hover:text-green-900">
          Account Login
        </button>
      </header>

      {/* Main Section */}
      <main className="flex flex-col items-center justify-center text-center px-6 py-10 flex-1">

        {/* Logo */}
        <img
          src={logo}
          alt="Workshop Logo"
          className="w-64 mb-8"
        />

        {/* Title */}
        <h1 className="text-4xl font-bold text-green-700 mb-4">
          Workshop
        </h1>

        {/* Write-up */}
        <p className="max-w-2xl text-gray-600 mb-10">
          Workshop is a simple platform where workers and clients connect.
          Work, hire, and grow together in one digital space built to help
          people find opportunities and build strong working relationships.
        </p>

        {/* Buttons */}
        <div className="flex gap-8">

          <button className="bg-green-700 text-white px-6 py-3 rounded-lg hover:bg-green-800">
            Create Working Account
          </button>

          <button className="border border-green-700 text-green-700 px-6 py-3 rounded-lg hover:bg-green-50">
            Create Client Account
          </button>

        </div>

      </main>

      {/* Footer */}
      <footer className="text-center py-4 text-gray-500">
        © 2026 Workshop • Work • Client • Connect
      </footer>

    </div>
  );
}
