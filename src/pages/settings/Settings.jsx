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
    <div className="h-[85vh] w-full bg-black text-white flex flex-col overflow-hidden">

      {/* Header */}
      <div className="px-5 py-6 border-b border-zinc-800">
        <h2 className="text-2xl font-semibold text-white">Settings</h2>
      </div>

      {/* Scrollable Settings List */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        <div className="max-w-md mx-auto">
          <ul className="space-y-2">
            {settingsMenu.map((item, index) => (
              <li
                key={index}
                className={`flex items-center justify-between p-4 rounded-2xl cursor-pointer transition-all active:scale-[0.985]
                  ${
                    item.danger
                      ? "text-red-400 hover:bg-red-500/10"
                      : "text-gray-200 hover:bg-zinc-800"
                  }`}
                onClick={() => {
                  if (item.name === "Log Out") {
                    // Add your logout logic here later
                    console.log("Logging out...");
                  } else {
                    console.log(`Navigating to: ${item.name}`);
                    // You can add navigation here later using useNavigate
                  }
                }}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{item.icon}</span>
                  <span className="text-base font-medium">{item.name}</span>
                </div>
                <span className="text-zinc-500 text-2xl">›</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}