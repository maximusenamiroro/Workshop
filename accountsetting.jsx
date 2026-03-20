import React, { useState } from "react";
import toast, { Toaster } from "react-hot-toast";

export default function AccountSettings() {
  // 🔌 Placeholder for backend user data
  const user = {
    name: "",
    username: "",
    profileImage: null,
  };

  const [form, setForm] = useState({
    isPrivate: false,
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // 🔁 Privacy toggle (auto-save)
  const handleToggle = () => {
    const updated = !form.isPrivate;
    setForm({ ...form, isPrivate: updated });

    toast.success(
      updated ? "Account is now Private 🔒" : "Account is now Public 🌍"
    );
  };

  // 🔐 Password update
  const handlePasswordChange = () => {
    if (!form.currentPassword) {
      toast.error("Enter current password");
      return;
    }

    if (form.newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    if (form.newPassword !== form.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    toast.success("Password updated successfully 🔐");

    setForm({
      ...form,
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
  };

  // ⚠️ Delete account flow
  const handleDelete = () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }

    toast.error("Account deleted (connect backend)");
  };

  return (
    <div className="max-w-2xl mx-auto py-6 px-4 space-y-6 bg-gray-100 min-h-screen">
      <Toaster position="top-right" />

      {/* 🔝 PROFILE (READ ONLY / BACKEND READY) */}
      <div className="bg-green-900 text-white rounded-2xl p-5 flex items-center gap-4 shadow">
        <div className="w-16 h-16 rounded-full bg-green-700 overflow-hidden">
          {user.profileImage && (
            <img
              src={user.profileImage}
              alt=""
              className="w-full h-full object-cover"
            />
          )}
        </div>

        <div className="flex-1">
          {/* 🔌 Backend will inject real data */}
          <div className="h-4 w-32 bg-green-700 rounded mb-2 animate-pulse" />
          <div className="h-3 w-24 bg-green-800 rounded animate-pulse" />
        </div>
      </div>

      {/* 🔒 PRIVACY */}
      <div className="bg-white rounded-2xl shadow p-5 flex justify-between items-center">
        <div>
          <p className="font-medium">Private Account</p>
          <p className="text-sm text-gray-500">
            Only approved followers can see your content
          </p>
        </div>

        <button
          onClick={handleToggle}
          className={`w-12 h-6 flex items-center rounded-full p-1 transition ${
            form.isPrivate ? "bg-green-800" : "bg-gray-300"
          }`}
        >
          <div
            className={`bg-white w-4 h-4 rounded-full shadow transform transition ${
              form.isPrivate ? "translate-x-6" : ""
            }`}
          />
        </button>
      </div>

      {/* 🔐 CHANGE PASSWORD */}
      <div className="bg-white rounded-2xl shadow p-5 space-y-4">
        <h3 className="font-semibold text-green-900">Change Password</h3>

        <input
          type={showPassword ? "text" : "password"}
          placeholder="Current Password"
          value={form.currentPassword}
          onChange={(e) =>
            setForm({ ...form, currentPassword: e.target.value })
          }
          className="w-full border rounded-xl px-3 py-2 focus:ring-2 focus:ring-green-700"
        />

        <input
          type={showPassword ? "text" : "password"}
          placeholder="New Password"
          value={form.newPassword}
          onChange={(e) =>
            setForm({ ...form, newPassword: e.target.value })
          }
          className="w-full border rounded-xl px-3 py-2 focus:ring-2 focus:ring-green-700"
        />

        <input
          type={showPassword ? "text" : "password"}
          placeholder="Confirm Password"
          value={form.confirmPassword}
          onChange={(e) =>
            setForm({ ...form, confirmPassword: e.target.value })
          }
          className="w-full border rounded-xl px-3 py-2 focus:ring-2 focus:ring-green-700"
        />

        <button
          onClick={() => setShowPassword(!showPassword)}
          className="text-sm text-green-800"
        >
          {showPassword ? "Hide Password" : "Show Password"}
        </button>

        <button
          onClick={handlePasswordChange}
          className="w-full bg-green-900 text-white py-2 rounded-xl hover:bg-green-800"
        >
          Update Password
        </button>
      </div>

      {/* ⚠️ DELETE ACCOUNT (IMPROVED UX) */}
      <div className="bg-white rounded-2xl shadow p-5">
        <h3 className="text-red-500 font-semibold mb-3">Danger Zone</h3>

        <button
          onClick={handleDelete}
          className={`w-full py-2 rounded-xl transition ${
            confirmDelete
              ? "bg-red-600 text-white"
              : "border border-red-500 text-red-500 hover:bg-red-50"
          }`}
        >
          {confirmDelete
            ? "Click again to confirm delete"
            : "Delete Account"}
        </button>
      </div>
    </div>
  );
}
