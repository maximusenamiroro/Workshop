import React, { useState } from "react";
import {
  FaEye,
  FaEyeSlash,
  FaUser,
  FaPhone,
  FaEnvelope,
  FaTools,
  FaLock,
  FaGlobe,
  FaMapMarkerAlt,
} from "react-icons/fa";

import workshopLogo from "../assets/workshop-logo.png";

export default function WorkingAccount() {

  const [showPassword, setShowPassword] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);

  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    country: "",
    accountType: "",
    category: "",
    password: "",
    location: "",
    latitude: "",
    longitude: "",
  });

  const handworkList = [
    "Carpenter",
    "Plumber",
    "Electrician",
    "Mechanic",
    "Tailor",
    "Welder",
    "Painter",
    "Bricklayer",
    "Barber",
    "Shoemaker",
    "Technician",
  ];

  const hireList = [
    "Cleaner",
    "Driver",
    "Security",
    "Assistant",
    "Delivery Agent",
    "Office Helper",
  ];

  const productList = [
    "Home Supplies",
    "Electronics",
    "Fashion",
    "Mechanical",
    "Food",
    "Office Tools",
  ];

  const countries = [
    "Nigeria",
    "Ghana",
    "Kenya",
    "South Africa",
    "United States",
    "United Kingdom",
    "Canada",
    "India",
    "Germany",
    "France",
  ];

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const getLocation = () => {

    setLocationLoading(true);

    if (!navigator.geolocation) {
      alert("Geolocation is not supported");
      setLocationLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {

        setForm({
          ...form,
          location: "Location detected",
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });

        setLocationLoading(false);
      },
      () => {
        alert("Unable to retrieve location");
        setLocationLoading(false);
      }
    );
  };

  const handleSubmit = (e) => {

    e.preventDefault();

    if (!form.accountType || !form.category) {
      alert("Please select account type and category");
      return;
    }

    const profile = {
      ...form,
      type: form.accountType === "product" ? "product" : "worker",
      handSkill: form.accountType === "handSkill",
      createdAt: new Date().toISOString(),
    };

    localStorage.setItem(
      "workstationProfile",
      JSON.stringify(profile)
    );

    console.log(profile);

    alert("Working account created successfully!");
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">

      <div className="bg-white shadow-xl rounded-2xl w-full max-w-md p-8">

        {/* Logo */}
        <div className="flex justify-center mb-3">
          <img
            src={workshopLogo}
            alt="Workshop Logo"
            className="w-24"
          />
        </div>

        <h1 className="text-2xl font-bold text-center text-green-700">
          Workshop
        </h1>

        <p className="text-center text-gray-500 mb-6">
          Create Working Account
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Name */}
          <div className="flex items-center border rounded-lg px-3 py-2">
            <FaUser className="text-gray-400 mr-2" />
            <input
              type="text"
              name="name"
              placeholder="Full Name"
              className="w-full outline-none"
              value={form.name}
              onChange={handleChange}
              required
            />
          </div>

          {/* Phone */}
          <div className="flex items-center border rounded-lg px-3 py-2">
            <FaPhone className="text-gray-400 mr-2" />
            <input
              type="tel"
              name="phone"
              placeholder="Phone Number"
              className="w-full outline-none"
              value={form.phone}
              onChange={handleChange}
              required
            />
          </div>

          {/* Email */}
          <div className="flex items-center border rounded-lg px-3 py-2">
            <FaEnvelope className="text-gray-400 mr-2" />
            <input
              type="email"
              name="email"
              placeholder="Email Address"
              className="w-full outline-none"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>

          {/* Country */}
          <div className="flex items-center border rounded-lg px-3 py-2">
            <FaGlobe className="text-gray-400 mr-2" />

            <select
              name="country"
              className="w-full outline-none bg-transparent"
              value={form.country}
              onChange={handleChange}
              required
            >
              <option value="">Select Country</option>

              {countries.map((country, index) => (
                <option key={index} value={country}>
                  {country}
                </option>
              ))}
            </select>
          </div>

          {/* Account Type */}
          <div className="flex items-center border rounded-lg px-3 py-2">
            <FaTools className="text-gray-400 mr-2" />

            <select
              name="accountType"
              className="w-full outline-none bg-transparent"
              value={form.accountType}
              onChange={handleChange}
              required
            >
              <option value="">Select Account Type</option>

              <option value="handSkill">
                Hand Skill Service (Book Workers)
              </option>

              <option value="hire">
                Non Hand Skill Service (Hire Workers)
              </option>

              <option value="product">
                Sell Products (Order Products)
              </option>
            </select>
          </div>

          {/* Category */}
          <div className="flex items-center border rounded-lg px-3 py-2">
            <FaTools className="text-gray-400 mr-2" />

            <select
              name="category"
              className="w-full outline-none bg-transparent"
              value={form.category}
              onChange={handleChange}
              required
            >
              <option value="">Select Category</option>

              {form.accountType === "handSkill" &&
                handworkList.map((work, index) => (
                  <option key={index} value={work}>
                    {work}
                  </option>
                ))}

              {form.accountType === "hire" &&
                hireList.map((work, index) => (
                  <option key={index} value={work}>
                    {work}
                  </option>
                ))}

              {form.accountType === "product" &&
                productList.map((work, index) => (
                  <option key={index} value={work}>
                    {work}
                  </option>
                ))}
            </select>
          </div>

          {/* Location */}
          <div className="flex items-center border rounded-lg px-3 py-2">
            <FaMapMarkerAlt className="text-gray-400 mr-2" />

            <input
              type="text"
              placeholder="Real-time Location"
              className="w-full outline-none"
              value={form.location}
              readOnly
            />

            <button
              type="button"
              onClick={getLocation}
              className="text-green-700 text-sm ml-2"
            >
              {locationLoading ? "Getting..." : "Get"}
            </button>
          </div>

          {/* Password */}
          <div className="flex items-center border rounded-lg px-3 py-2">
            <FaLock className="text-gray-400 mr-2" />

            <input
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Password"
              className="w-full outline-none"
              value={form.password}
              onChange={handleChange}
              required
            />

            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <FaEyeSlash className="text-gray-500" />
              ) : (
                <FaEye className="text-gray-500" />
              )}
            </button>
          </div>

          {/* Button */}
          <button
            type="submit"
            className="w-full bg-green-700 text-white py-2 rounded-lg hover:bg-green-800"
          >
            Create Working Account
          </button>

        </form>
      </div>
    </div>
  );
}
