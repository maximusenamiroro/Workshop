import React from "react";
import {
  FaUser,
  FaBell,
  FaDatabase,
  FaQuestionCircle,
  FaGlobe,
  FaUserPlus,
  FaPlusCircle,
  FaSignOutAlt,
} from "react-icons/fa";

const settingsMenu = [
  { name: "Account", icon: <FaUser /> },
  { name: "Notifications", icon: <FaBell /> },
  { name: "Storage and Data", icon: <FaDatabase /> },
  { name: "Help and Feedback", icon: <FaQuestionCircle /> },
  { name: "Language", icon: <FaGlobe /> },
  { name: "Invite a Friend", icon: <FaUserPlus /> },
  { name: "Add Account", icon: <FaPlusCircle /> },
  { name: "Log Out", icon: <FaSignOutAlt />, danger: true },
];

export default function SettingsMenu() {
  return (
    <div className="max-w-md mx-auto bg-white shadow-lg rounded-2xl p-4">
      <h2 className="text-xl font-semibold mb-4">Settings</h2>

      <ul className="space-y-2">
        {settingsMenu.map((item, index) => (
          <li
            key={index}
            className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition 
              ${item.danger 
                ? "text-red-500 hover:bg-red-50" 
                : "hover:bg-gray-100"
              }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-lg">{item.icon}</span>
              <span className="text-sm font-medium">{item.name}</span>
            </div>

            <span className="text-gray-400">{">"}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}