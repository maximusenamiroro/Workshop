import React from "react";
import { Home, User, MessageCircle, Briefcase } from "lucide-react";
import { TbPlanet } from "react-icons/tb";
import { useNavigate, useLocation, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function NavItem({ icon, label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center transition-all ${
        active
          ? "bg-white text-black px-4 py-2 rounded-2xl scale-105 shadow-md"
          : "text-gray-400 px-3 py-2 hover:text-white"
      }`}
    >
      {icon}
      <span className="text-xs mt-1">{label}</span>
    </button>
  );
}

export default function MainLayout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-screen bg-black flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  const isActive = (path) => location.pathname === path;
  const isWorker = role === "worker";
  const workspaceLabel = isWorker ? "Workstation" : "Workspace";
  const workspaceIcon = isWorker ? <Briefcase size={24} /> : <TbPlanet size={24} />;
  const profilePath = isWorker ? "/seller-profile" : "/buyer-profile";

  return (
    <div className="flex flex-col md:flex-row h-screen w-full bg-black text-white">

      {/* DESKTOP SIDEBAR */}
      <div className="hidden md:flex flex-col w-24 bg-gray-900 items-center py-6 space-y-6">
        <NavItem icon={<Home size={28} />} label="Home" active={isActive("/reels")} onClick={() => navigate("/reels")} />
        <NavItem icon={<MessageCircle size={28} />} label="Inbox" active={isActive("/inbox")} onClick={() => navigate("/inbox")} />
        <NavItem icon={workspaceIcon} label={workspaceLabel} active={isActive(isWorker ? "/workstation" : "/workspace")} onClick={() => navigate(isWorker ? "/workstation" : "/workspace")} />
        <NavItem icon={<User size={28} />} label="Profile" active={isActive(profilePath)} onClick={() => navigate(profilePath)} />
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 overflow-y-auto pb-20 md:pb-0">
        {children}
      </div>

      {/* MOBILE BOTTOM NAV — fixed like TikTok */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-black/95 backdrop-blur-md border-t border-white/10 flex justify-around items-center py-2 safe-area-inset-bottom">
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
  );
}