import React, { useState } from "react";
import toast, { Toaster } from "react-hot-toast";

export default function AccountSettings() {
  const [form, setForm] = useState({
    name: "",
    username: "",
    email: "",
    password: "",
  });

  const [errors, setErrors] = useState({});
  const [profileImage, setProfileImage] = useState(null);
  const [loading, setLoading] = useState(false);

  // Handle input change
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Image upload
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfileImage(URL.createObjectURL(file));
      toast.success("Profile image updated!");
    }
  };

  // Validation
  const validate = () => {
    let newErrors = {};

    if (!form.name.trim()) newErrors.name = "Name is required";
    if (!form.username.trim()) newErrors.username = "Username is required";

    if (!form.email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(form.email)) {
      newErrors.email = "Invalid email format";
    }

    if (form.password && form.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    return newErrors;
  };

  // Submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationErrors = validate();
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      toast.error("Please fix the errors");
      return;
    }

    setLoading(true);

    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      toast.success("Account updated successfully!");
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center py-10 px-4">
      <Toaster position="top-right" />

      <form
        onSubmit={handleSubmit}
        className="w-full max-w-2xl bg-white rounded-2xl shadow-lg p-6 space-y-6"
      >
        <h2 className="text-2xl font-semibold text-gray-800">
          Account Settings
        </h2>

        {/* Profile */}
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-full bg-gray-200 overflow-hidden">
            {profileImage && (
              <img
                src={profileImage}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            )}
          </div>

          <label className="cursor-pointer text-blue-600 text-sm font-medium">
            Change Photo
            <input
              type="file"
              onChange={handleImageChange}
              className="hidden"
            />
          </label>
        </div>

        {/* Name */}
        <div>
          <label className="text-sm text-gray-600">Full Name</label>
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            className="w-full border rounded-lg px-3 py-2 mt-1 focus:ring-2 focus:ring-blue-400 outline-none"
          />
          {errors.name && (
            <p className="text-red-500 text-sm">{errors.name}</p>
          )}
        </div>

        {/* Username */}
        <div>
          <label className="text-sm text-gray-600">Username</label>
          <input
            name="username"
            value={form.username}
            onChange={handleChange}
            className="w-full border rounded-lg px-3 py-2 mt-1 focus:ring-2 focus:ring-blue-400 outline-none"
          />
          {errors.username && (
            <p className="text-red-500 text-sm">{errors.username}</p>
          )}
        </div>

        {/* Email */}
        <div>
          <label className="text-sm text-gray-600">Email</label>
          <input
            name="email"
            value={form.email}
            onChange={handleChange}
            className="w-full border rounded-lg px-3 py-2 mt-1 focus:ring-2 focus:ring-blue-400 outline-none"
          />
          {errors.email && (
            <p className="text-red-500 text-sm">{errors.email}</p>
          )}
        </div>

        {/* Password */}
        <div>
          <label className="text-sm text-gray-600">New Password</label>
          <input
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            className="w-full border rounded-lg px-3 py-2 mt-1 focus:ring-2 focus:ring-blue-400 outline-none"
          />
          {errors.password && (
            <p className="text-red-500 text-sm">{errors.password}</p>
          )}
        </div>

        {/* Save */}
        <button
          type="submit"
          disabled={loading}
          className={`w-full py-2 rounded-lg text-white transition ${
            loading
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          {loading ? "Saving..." : "Save Changes"}
        </button>

        {/* Danger Zone */}
        <div className="border-t pt-4">
          <h3 className="text-red-500 font-semibold mb-2">
            Danger Zone
          </h3>
          <button
            type="button"
            onClick={() => toast.error("Account deletion not implemented")}
            className="w-full border border-red-500 text-red-500 py-2 rounded-lg hover:bg-red-50 transition"
          >
            Delete Account
          </button>
        </div>
      </form>
    </div>
  );
}