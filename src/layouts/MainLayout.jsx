import React from "react";
import { Home, User, MessageCircle, Briefcase } from "lucide-react";
import { TbPlanet } from "react-icons/tb";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// ---------------- NAV ITEM ----------------
function NavItem({ icon, label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center transition-all
        ${active
          ? "bg-white text-black px-4 py-2 rounded-2xl scale-105 shadow-md"
          : "text-gray-400 px-3 py-2 hover:text-white"
        }`}
    >
      {icon}
      <span className="text-xs mt-1">{label}</span>
    </button>
  );
}

// ---------------- MAIN LAYOUT ----------------
export default function MainLayout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, role, loading } = useAuth();

  // Show loading while auth is checking
  if (loading) {
    return (
      <div className="h-screen bg-black flex items-center justify-center text-white">
        Loading...
      </div>
    );
  }

  // If no user, redirect to login (safety)
  if (!user) {
    navigate("/login");
    return null;
  }

  const isActive = (path) => location.pathname === path;
  const isWorker = role === "worker";

  // Role-based labels and icons
  const workspaceLabel = isWorker ? "Workstation" : "Workspace";
  const workspaceIcon = isWorker ? <Briefcase size={28} /> : <TbPlanet size={28} />;
  const profilePath = isWorker ? "/seller-profile" : "/buyer-profile";

  return (
    <div className="flex flex-col md:flex-row h-screen w-full bg-black text-white">

      {/* ================= DESKTOP SIDEBAR ================= */}
      <div className="hidden md:flex flex-col w-24 bg-gray-900 items-center py-4 space-y-6">
        <NavItem
          icon={<Home size={28} />}
          label="Home"
          active={isActive("/reels")}
          onClick={() => navigate("/reels")}
        />

        <NavItem
          icon={<MessageCircle size={28} />}
          label="Inbox"
          active={isActive("/inbox")}
          onClick={() => navigate("/inbox")}
        />

        <NavItem
          icon={workspaceIcon}
          label={workspaceLabel}
          active={isActive(isWorker ? "/workstation" : "/workspace")}
          onClick={() => navigate(isWorker ? "/workstation" : "/workspace")}
        />

        <NavItem
          icon={<User size={28} />}
          label="Profile"
          active={isActive(profilePath)}
          onClick={() => navigate(profilePath)}
        />
      </div>

      {/* ================= MAIN CONTENT ================= */}
      <div className="flex-1 flex flex-col w-full">
        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>

        {/* ================= MOBILE BOTTOM NAV ================= */}
        <div className="md:hidden bg-black/90 backdrop-blur-md flex justify-around items-center py-3 border-t border-white/10">
          <NavItem
            icon={<Home size={24} />}
            label="Home"
            active={isActive("/reels")}
            onClick={() => navigate("/reels")}
          />

          <NavItem
            icon={<MessageCircle size={24} />}
            label="Inbox"
            active={isActive("/inbox")}
            onClick={() => navigate("/inbox")}
          />

          <NavItem
            icon={workspaceIcon}
            label={workspaceLabel}
            active={isActive(isWorker ? "/workstation" : "/workspace")}
            onClick={() => navigate(isWorker ? "/workstation" : "/workspace")}
          />

          <NavItem
            icon={<User size={24} />}
            label="Profile"
            active={isActive(profilePath)}
            onClick={() => navigate(profilePath)}
          />
        </div>
      </div>
    </div>
  );
}