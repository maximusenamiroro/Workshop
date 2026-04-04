import React, { useEffect } from "react";
import { Home, User, MessageCircle, Briefcase, LogOut } from "lucide-react";
import { TbPlanet } from "react-icons/tb";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// ===== Reusable Nav Item =====
function NavItem({ icon, label, active, onClick, ariaLabel }) {
  return (
    <button
      onClick={onClick}
      aria-label={ariaLabel || label}
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

// ===== Reusable Logout Button =====
function LogoutButton({ size = 28 }) {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      navigate("/login", { replace: true });
    }
  };

  return (
    <button
      onClick={handleLogout}
      className="flex flex-col items-center text-red-400 hover:text-red-300 px-3 py-2 transition"
      aria-label="Logout"
    >
      <LogOut size={size} />
      <span className="text-xs mt-1">Logout</span>
    </button>
  );
}

// ===== Main Layout =====
export default function MainLayout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, role, loading } = useAuth();

  // ===== Redirect if not logged in =====
  useEffect(() => {
    if (!loading && !user) {
      navigate("/login", { replace: true });
    }
  }, [user, loading, navigate]);

  if (loading || !user) {
    return (
      <div className="h-screen bg-black flex items-center justify-center text-white">
        Loading...
      </div>
    );
  }

  const isWorker = role === "worker";

  const workspaceLabel = isWorker ? "Workstation" : "Workspace";
  const workspaceIcon = isWorker ? <Briefcase size={28} /> : <TbPlanet size={28} />;
  const profilePath = isWorker ? "/seller-profile" : "/buyer-profile";

  // ===== Improved active route detection =====
  const isActive = (path) => location.pathname.startsWith(path);

  // ===== Nav Items Config =====
  const navItems = [
    { label: "Home", icon: <Home size={28} />, path: "/reels" },
    { label: "Inbox", icon: <MessageCircle size={28} />, path: "/inbox" },
    { label: workspaceLabel, icon: workspaceIcon, path: isWorker ? "/workstation" : "/workspace" },
    { label: "Profile", icon: <User size={28} />, path: profilePath },
  ];

  return (
    <div className="flex flex-col md:flex-row h-screen w-full bg-black text-white">

      {/* ===== DESKTOP SIDEBAR ===== */}
      <div className="hidden md:flex flex-col w-24 bg-gray-900 items-center py-6 space-y-6">
        {navItems.map((item) => (
          <NavItem
            key={item.label}
            icon={item.icon}
            label={item.label}
            active={isActive(item.path)}
            onClick={() => navigate(item.path)}
          />
        ))}

        {/* Logout pinned to bottom */}
        <div className="mt-auto">
          <LogoutButton />
        </div>
      </div>

      {/* ===== MAIN CONTENT ===== */}
      <div className="flex-1 flex flex-col w-full">
        <div className="flex-1 overflow-y-auto">{children}</div>

        {/* ===== MOBILE BOTTOM NAV ===== */}
        <div className="md:hidden bg-black/90 backdrop-blur-md flex justify-around items-center py-3 border-t border-white/10">
          {navItems.map((item) => (
            <NavItem
              key={item.label}
              icon={React.cloneElement(item.icon, { size: 24 })}
              label={item.label}
              active={isActive(item.path)}
              onClick={() => navigate(item.path)}
            />
          ))}
          <LogoutButton size={24} />
        </div>
      </div>
    </div>
  );
}
