import { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabaseClient";
import { useNavigate } from "react-router-dom";

// ── ADMIN PASSWORD — change this to something secret ──
const ADMIN_PASSWORD = "omoworkit_admin_2026";

const formatDate = (d) =>
  new Date(d).toLocaleDateString("en-US", {
    month: "short", day: "numeric",
    year: "numeric", hour: "2-digit", minute: "2-digit",
  });

const formatNum = (n) =>
  n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n || 0);

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [authed, setAuthed] = useState(() => sessionStorage.getItem("admin_authed") === "true");
  const [pwInput, setPwInput] = useState("");
  const [pwError, setPwError] = useState("");

  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Overview stats
  const [stats, setStats] = useState({
    totalUsers: 0,
    workers: 0,
    clients: 0,
    liveWorkers: 0,
    totalReels: 0,
    totalOrders: 0,
    totalBookings: 0,
    totalProducts: 0,
    totalMessages: 0,
    totalLikes: 0,
    totalComments: 0,
    pendingOrders: 0,
    deliveredOrders: 0,
    acceptedBookings: 0,
  });

  // Users
  const [users, setUsers] = useState([]);
  const [userSearch, setUserSearch] = useState("");
  const [userFilter, setUserFilter] = useState("all");
  const [userPage, setUserPage] = useState(0);
  const PAGE_SIZE = 20;

  // Growth data
  const [dailySignups, setDailySignups] = useState([]);

  // DB size estimate
  const [dbStats, setDbStats] = useState([]);

  // Recent activity
  const [recentActivity, setRecentActivity] = useState([]);

  const intervalRef = useRef(null);

  useEffect(() => {
    if (!authed) return;
    fetchAll();
    // Auto refresh every 60 seconds
    intervalRef.current = setInterval(fetchAll, 60000);
    return () => clearInterval(intervalRef.current);
  }, [authed]);

  const fetchAll = async () => {
    setRefreshing(true);
    await Promise.all([
      fetchStats(),
      fetchUsers(),
      fetchGrowthData(),
      fetchDbStats(),
      fetchRecentActivity(),
    ]);
    setLoading(false);
    setRefreshing(false);
  };

  const fetchStats = async () => {
    try {
      const [
        totalUsersRes, workersRes, clientsRes, liveRes,
        reelsRes, ordersRes, bookingsRes, productsRes,
        messagesRes, likesRes, commentsRes,
        pendingRes, deliveredRes, acceptedRes,
      ] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "worker"),
        supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "client"),
        supabase.from("live_workers").select("id", { count: "exact", head: true }),
        supabase.from("reels").select("id", { count: "exact", head: true }),
        supabase.from("orders").select("id", { count: "exact", head: true }),
        supabase.from("hire_requests").select("id", { count: "exact", head: true }),
        supabase.from("products").select("id", { count: "exact", head: true }),
        supabase.from("messages").select("id", { count: "exact", head: true }),
        supabase.from("reel_likes").select("id", { count: "exact", head: true }),
        supabase.from("reel_comments").select("id", { count: "exact", head: true }),
        supabase.from("orders").select("id", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("orders").select("id", { count: "exact", head: true }).eq("status", "delivered"),
        supabase.from("hire_requests").select("id", { count: "exact", head: true }).eq("status", "accepted"),
      ]);

      setStats({
        totalUsers: totalUsersRes.count || 0,
        workers: workersRes.count || 0,
        clients: clientsRes.count || 0,
        liveWorkers: liveRes.count || 0,
        totalReels: reelsRes.count || 0,
        totalOrders: ordersRes.count || 0,
        totalBookings: bookingsRes.count || 0,
        totalProducts: productsRes.count || 0,
        totalMessages: messagesRes.count || 0,
        totalLikes: likesRes.count || 0,
        totalComments: commentsRes.count || 0,
        pendingOrders: pendingRes.count || 0,
        deliveredOrders: deliveredRes.count || 0,
        acceptedBookings: acceptedRes.count || 0,
      });
    } catch (err) {
      console.error("fetchStats error:", err.message);
    }
  };

  const fetchUsers = async () => {
    try {
      const { data } = await supabase
        .from("profiles")
        .select("id, full_name, role, country, created_at, phone")
        .order("created_at", { ascending: false })
        .limit(500);
      setUsers(data || []);
    } catch (err) {
      console.error("fetchUsers error:", err.message);
    }
  };

  const fetchGrowthData = async () => {
    try {
      const { data } = await supabase
        .from("profiles")
        .select("created_at, role")
        .order("created_at", { ascending: true });

      // Group by day
      const grouped = {};
      (data || []).forEach(u => {
        const day = new Date(u.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" });
        if (!grouped[day]) grouped[day] = { day, total: 0, workers: 0, clients: 0 };
        grouped[day].total++;
        if (u.role === "worker") grouped[day].workers++;
        if (u.role === "client") grouped[day].clients++;
      });

      // Last 14 days
      const days = Object.values(grouped).slice(-14);
      setDailySignups(days);
    } catch (err) {
      console.error("fetchGrowthData error:", err.message);
    }
  };

  const fetchDbStats = async () => {
    // Estimate row counts per table
    try {
      const tables = [
        { name: "profiles", label: "Users" },
        { name: "reels", label: "Reels" },
        { name: "products", label: "Products" },
        { name: "orders", label: "Orders" },
        { name: "hire_requests", label: "Bookings" },
        { name: "messages", label: "Messages" },
        { name: "reel_likes", label: "Likes" },
        { name: "reel_comments", label: "Comments" },
        { name: "live_workers", label: "Live Sessions" },
        { name: "tracking_sessions", label: "Tracking Sessions" },
        { name: "followers", label: "Follows" },
        { name: "saved_reels", label: "Saved Reels" },
      ];

      const results = await Promise.all(
        tables.map(t =>
          supabase.from(t.name).select("id", { count: "exact", head: true })
            .then(res => ({ ...t, count: res.count || 0 }))
        )
      );

      const total = results.reduce((sum, r) => sum + r.count, 0);
      setDbStats(results.map(r => ({ ...r, pct: total > 0 ? ((r.count / total) * 100).toFixed(1) : 0 })));
    } catch (err) {
      console.error("fetchDbStats error:", err.message);
    }
  };

  const fetchRecentActivity = async () => {
    try {
      const [ordersRes, bookingsRes, reelsRes, usersRes] = await Promise.all([
        supabase.from("orders").select("id, product_name, status, created_at, user_id").order("created_at", { ascending: false }).limit(5),
        supabase.from("hire_requests").select("id, job_description, status, created_at").order("created_at", { ascending: false }).limit(5),
        supabase.from("reels").select("id, description, created_at").order("created_at", { ascending: false }).limit(5),
        supabase.from("profiles").select("id, full_name, role, created_at").order("created_at", { ascending: false }).limit(5),
      ]);

      const activity = [
        ...(ordersRes.data || []).map(o => ({ type: "order", icon: "📦", text: `New order: ${o.product_name || "Product"}`, time: o.created_at, status: o.status })),
        ...(bookingsRes.data || []).map(b => ({ type: "booking", icon: "📋", text: `Booking: ${b.job_description || "Job request"}`, time: b.created_at, status: b.status })),
        ...(reelsRes.data || []).map(r => ({ type: "reel", icon: "🎬", text: `New reel posted`, time: r.created_at })),
        ...(usersRes.data || []).map(u => ({ type: "user", icon: u.role === "worker" ? "🏢" : "👤", text: `${u.full_name || "User"} joined as ${u.role}`, time: u.created_at })),
      ].sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 15);

      setRecentActivity(activity);
    } catch (err) {
      console.error("fetchRecentActivity error:", err.message);
    }
  };

  const deleteUser = async (userId, userName) => {
    if (!window.confirm(`Delete ${userName}? This cannot be undone.`)) return;
    try {
      await supabase.from("profiles").delete().eq("id", userId);
      setUsers(prev => prev.filter(u => u.id !== userId));
      fetchStats();
    } catch (err) {
      alert("Failed to delete: " + err.message);
    }
  };

  // ── AUTH GATE ──
  if (!authed) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
        <div className="bg-[#111] border border-white/10 rounded-3xl p-8 w-full max-w-sm text-white">
          <div className="text-center mb-6">
            <p className="text-4xl mb-3">🔐</p>
            <h1 className="text-2xl font-bold">Admin Access</h1>
            <p className="text-gray-500 text-sm mt-1">Omoworkit Dashboard</p>
          </div>
          <input
            type="password"
            placeholder="Enter admin password"
            value={pwInput}
            onChange={e => setPwInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === "Enter") {
                if (pwInput === ADMIN_PASSWORD) {
                  sessionStorage.setItem("admin_authed", "true");
                  setAuthed(true);
                } else {
                  setPwError("Incorrect password");
                }
              }
            }}
            className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-gray-600 outline-none focus:border-green-500/50 transition mb-3"
          />
          {pwError && <p className="text-red-400 text-xs mb-3">{pwError}</p>}
          <button
            onClick={() => {
              if (pwInput === ADMIN_PASSWORD) {
                sessionStorage.setItem("admin_authed", "true");
                setAuthed(true);
              } else {
                setPwError("Incorrect password");
              }
            }}
            className="w-full bg-green-600 hover:bg-green-500 py-3 rounded-2xl font-semibold transition"
          >
            Enter Dashboard
          </button>
        </div>
      </div>
    );
  }

  // ── FILTERED USERS ──
  const filteredUsers = users
    .filter(u => userFilter === "all" || u.role === userFilter)
    .filter(u =>
      !userSearch ||
      u.full_name?.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.country?.toLowerCase().includes(userSearch.toLowerCase())
    );
  const pagedUsers = filteredUsers.slice(userPage * PAGE_SIZE, (userPage + 1) * PAGE_SIZE);
  const totalPages = Math.ceil(filteredUsers.length / PAGE_SIZE);

  const maxBar = Math.max(...dailySignups.map(d => d.total), 1);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">

      {/* ── TOPBAR ── */}
      <div className="sticky top-0 z-50 bg-[#0a0a0a]/95 backdrop-blur border-b border-white/5 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl font-extrabold tracking-tight">⚡ Admin</span>
            <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full border border-green-500/20">
              omoworkit
            </span>
          </div>
          <div className="flex items-center gap-3">
            {refreshing && (
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <div className="w-3 h-3 border border-gray-500 border-t-transparent rounded-full animate-spin" />
                Refreshing...
              </div>
            )}
            <button
              onClick={fetchAll}
              className="text-xs bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-1.5 rounded-lg transition"
            >
              🔄 Refresh
            </button>
            <button
              onClick={() => {
                sessionStorage.removeItem("admin_authed");
                setAuthed(false);
              }}
              className="text-xs text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 px-3 py-1.5 rounded-lg transition"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6">

        {/* ── TABS ── */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
          {[
            { id: "overview", label: "📊 Overview" },
            { id: "users", label: "👥 Users" },
            { id: "growth", label: "📈 Growth" },
            { id: "database", label: "🗄️ Database" },
            { id: "activity", label: "⚡ Activity" },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition ${
                activeTab === tab.id
                  ? "bg-green-600 text-white"
                  : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-10 h-10 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* ── OVERVIEW TAB ── */}
            {activeTab === "overview" && (
              <div className="space-y-6">

                {/* Live indicator */}
                <div className="flex items-center gap-2 text-sm">
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  <span className="text-green-400 font-medium">{stats.liveWorkers} businesses live right now</span>
                  <span className="text-gray-600">· Auto-refreshes every 60s</span>
                </div>

                {/* Primary stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: "Total Users", value: stats.totalUsers, icon: "👥", color: "text-blue-400", sub: `${stats.workers} businesses · ${stats.clients} clients` },
                    { label: "Live Now", value: stats.liveWorkers, icon: "🟢", color: "text-green-400", sub: "Active businesses" },
                    { label: "Total Orders", value: stats.totalOrders, icon: "📦", color: "text-yellow-400", sub: `${stats.pendingOrders} pending · ${stats.deliveredOrders} delivered` },
                    { label: "Bookings", value: stats.totalBookings, icon: "📋", color: "text-purple-400", sub: `${stats.acceptedBookings} accepted` },
                  ].map((s, i) => (
                    <div key={i} className="bg-[#111] border border-white/5 rounded-2xl p-5">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-2xl">{s.icon}</span>
                        <span className={`text-3xl font-extrabold ${s.color}`}>{formatNum(s.value)}</span>
                      </div>
                      <p className="text-sm font-semibold text-white">{s.label}</p>
                      <p className="text-xs text-gray-600 mt-0.5">{s.sub}</p>
                    </div>
                  ))}
                </div>

                {/* Secondary stats */}
                <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                  {[
                    { label: "Reels", value: stats.totalReels, icon: "🎬" },
                    { label: "Products", value: stats.totalProducts, icon: "🛍️" },
                    { label: "Messages", value: stats.totalMessages, icon: "💬" },
                    { label: "Likes", value: stats.totalLikes, icon: "❤️" },
                    { label: "Comments", value: stats.totalComments, icon: "💭" },
                    { label: "Businesses", value: stats.workers, icon: "🏢" },
                  ].map((s, i) => (
                    <div key={i} className="bg-[#111] border border-white/5 rounded-xl p-4 text-center">
                      <p className="text-xl mb-1">{s.icon}</p>
                      <p className="text-xl font-bold text-white">{formatNum(s.value)}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
                    </div>
                  ))}
                </div>

                {/* Platform health */}
                <div className="bg-[#111] border border-white/5 rounded-2xl p-5">
                  <h3 className="font-bold mb-4">Platform Health</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                      {
                        label: "Order Completion Rate",
                        value: stats.totalOrders > 0 ? ((stats.deliveredOrders / stats.totalOrders) * 100).toFixed(1) : 0,
                        suffix: "%",
                        color: "bg-green-500",
                        good: true,
                      },
                      {
                        label: "Booking Acceptance Rate",
                        value: stats.totalBookings > 0 ? ((stats.acceptedBookings / stats.totalBookings) * 100).toFixed(1) : 0,
                        suffix: "%",
                        color: "bg-blue-500",
                        good: true,
                      },
                      {
                        label: "Business to Client Ratio",
                        value: stats.clients > 0 ? (stats.workers / stats.clients).toFixed(2) : 0,
                        suffix: "x",
                        color: "bg-purple-500",
                        good: false,
                      },
                    ].map((m, i) => (
                      <div key={i}>
                        <div className="flex justify-between items-center mb-1.5">
                          <span className="text-xs text-gray-400">{m.label}</span>
                          <span className="text-sm font-bold text-white">{m.value}{m.suffix}</span>
                        </div>
                        <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${m.color} rounded-full transition-all duration-1000`}
                            style={{ width: `${Math.min(parseFloat(m.value) * (m.good ? 1 : 50), 100)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── USERS TAB ── */}
            {activeTab === "users" && (
              <div className="space-y-4">
                {/* Controls */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    value={userSearch}
                    onChange={e => { setUserSearch(e.target.value); setUserPage(0); }}
                    placeholder="Search by name or country..."
                    className="flex-1 px-4 py-2.5 bg-[#111] border border-white/10 rounded-xl text-white placeholder-gray-600 outline-none focus:border-green-500/50 transition text-sm"
                  />
                  <div className="flex gap-2">
                    {["all", "worker", "client"].map(f => (
                      <button
                        key={f}
                        onClick={() => { setUserFilter(f); setUserPage(0); }}
                        className={`px-3 py-2 rounded-xl text-xs font-medium transition capitalize ${
                          userFilter === f ? "bg-green-600 text-white" : "bg-white/5 text-gray-400 hover:bg-white/10"
                        }`}
                      >
                        {f === "all" ? `All (${users.length})` : f === "worker" ? `Businesses (${stats.workers})` : `Clients (${stats.clients})`}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Table */}
                <div className="bg-[#111] border border-white/5 rounded-2xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-white/5 text-gray-500 text-xs">
                          <th className="text-left px-4 py-3 font-medium">Name</th>
                          <th className="text-left px-4 py-3 font-medium">Role</th>
                          <th className="text-left px-4 py-3 font-medium">Country</th>
                          <th className="text-left px-4 py-3 font-medium">Phone</th>
                          <th className="text-left px-4 py-3 font-medium">Joined</th>
                          <th className="text-left px-4 py-3 font-medium">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pagedUsers.map((u, i) => (
                          <tr key={u.id} className={`border-b border-white/5 hover:bg-white/3 transition ${i % 2 === 0 ? "" : "bg-white/[0.01]"}`}>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${u.role === "worker" ? "bg-green-600/30 text-green-400" : "bg-blue-600/30 text-blue-400"}`}>
                                  {u.full_name?.[0]?.toUpperCase() || "?"}
                                </div>
                                <span className="text-white font-medium truncate max-w-[140px]">{u.full_name || "—"}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                u.role === "worker" ? "bg-green-500/10 text-green-400" : "bg-blue-500/10 text-blue-400"
                              }`}>
                                {u.role === "worker" ? "Business" : "Client"}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-gray-400 text-xs">{u.country || "—"}</td>
                            <td className="px-4 py-3 text-gray-400 text-xs">{u.phone || "—"}</td>
                            <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                              {new Date(u.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "2-digit" })}
                            </td>
                            <td className="px-4 py-3">
                              <button
                                onClick={() => deleteUser(u.id, u.full_name)}
                                className="text-xs text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 px-2 py-1 rounded-lg transition"
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between px-4 py-3 border-t border-white/5 text-xs text-gray-500">
                      <span>Showing {userPage * PAGE_SIZE + 1}–{Math.min((userPage + 1) * PAGE_SIZE, filteredUsers.length)} of {filteredUsers.length}</span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setUserPage(p => Math.max(0, p - 1))}
                          disabled={userPage === 0}
                          className="px-3 py-1 bg-white/5 rounded-lg disabled:opacity-30 hover:bg-white/10 transition"
                        >
                          ← Prev
                        </button>
                        <span className="px-3 py-1">{userPage + 1} / {totalPages}</span>
                        <button
                          onClick={() => setUserPage(p => Math.min(totalPages - 1, p + 1))}
                          disabled={userPage === totalPages - 1}
                          className="px-3 py-1 bg-white/5 rounded-lg disabled:opacity-30 hover:bg-white/10 transition"
                        >
                          Next →
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── GROWTH TAB ── */}
            {activeTab === "growth" && (
              <div className="space-y-6">
                <div className="bg-[#111] border border-white/5 rounded-2xl p-6">
                  <h3 className="font-bold mb-1">Daily Signups — Last 14 Days</h3>
                  <p className="text-xs text-gray-500 mb-6">Breakdown of new businesses vs clients per day</p>

                  {dailySignups.length === 0 ? (
                    <p className="text-gray-500 text-sm">No data yet</p>
                  ) : (
                    <div className="space-y-3">
                      {dailySignups.map((d, i) => (
                        <div key={i} className="flex items-center gap-3">
                          <span className="text-xs text-gray-500 w-16 flex-shrink-0">{d.day}</span>
                          <div className="flex-1 flex gap-1 h-7 items-center">
                            {/* Businesses bar */}
                            <div
                              className="h-full bg-green-600 rounded-l-md transition-all"
                              style={{ width: `${(d.workers / maxBar) * 100}%`, minWidth: d.workers > 0 ? "4px" : "0" }}
                              title={`${d.workers} businesses`}
                            />
                            {/* Clients bar */}
                            <div
                              className="h-full bg-blue-500 rounded-r-md transition-all"
                              style={{ width: `${(d.clients / maxBar) * 100}%`, minWidth: d.clients > 0 ? "4px" : "0" }}
                              title={`${d.clients} clients`}
                            />
                          </div>
                          <span className="text-xs text-white font-bold w-8 flex-shrink-0">{d.total}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-4 mt-4 text-xs text-gray-500">
                    <div className="flex items-center gap-1.5"><span className="w-3 h-3 bg-green-600 rounded-sm" /> Businesses</div>
                    <div className="flex items-center gap-1.5"><span className="w-3 h-3 bg-blue-500 rounded-sm" /> Clients</div>
                  </div>
                </div>

                {/* Summary cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: "Signups This Week", value: dailySignups.slice(-7).reduce((s, d) => s + d.total, 0), icon: "📅" },
                    { label: "Signups Today", value: dailySignups.slice(-1)[0]?.total || 0, icon: "☀️" },
                    { label: "Best Day", value: Math.max(...dailySignups.map(d => d.total), 0), icon: "🏆" },
                    { label: "Avg Daily", value: dailySignups.length > 0 ? (dailySignups.reduce((s, d) => s + d.total, 0) / dailySignups.length).toFixed(1) : 0, icon: "📊" },
                  ].map((s, i) => (
                    <div key={i} className="bg-[#111] border border-white/5 rounded-2xl p-4 text-center">
                      <p className="text-2xl mb-1">{s.icon}</p>
                      <p className="text-2xl font-bold text-green-400">{s.value}</p>
                      <p className="text-xs text-gray-500 mt-1">{s.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── DATABASE TAB ── */}
            {activeTab === "database" && (
              <div className="space-y-6">
                <div className="bg-[#111] border border-white/5 rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-bold">Database Table Sizes</h3>
                    <span className="text-xs text-gray-500">
                      Total rows: {dbStats.reduce((s, r) => s + r.count, 0).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mb-6">
                    Supabase free tier: 500MB storage · 50,000 monthly active users
                  </p>

                  <div className="space-y-4">
                    {dbStats.sort((a, b) => b.count - a.count).map((row, i) => (
                      <div key={i}>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm text-white">{row.label}</span>
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-gray-500">{row.pct}%</span>
                            <span className="text-sm font-bold text-white">{row.count.toLocaleString()} rows</span>
                          </div>
                        </div>
                        <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-700 ${
                              parseFloat(row.pct) > 30 ? "bg-red-500" :
                              parseFloat(row.pct) > 15 ? "bg-yellow-500" :
                              "bg-green-500"
                            }`}
                            style={{ width: `${row.pct}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Supabase free tier limits */}
                <div className="bg-[#111] border border-white/5 rounded-2xl p-6">
                  <h3 className="font-bold mb-4">Supabase Free Tier Limits</h3>
                  <div className="space-y-4">
                    {[
                      { label: "Monthly Active Users", used: stats.totalUsers, limit: 50000, unit: "users" },
                      { label: "Database Size", used: dbStats.reduce((s, r) => s + r.count, 0), limit: 500000, unit: "rows (estimate)" },
                      { label: "Storage", used: stats.totalReels + stats.totalProducts, limit: 1000, unit: "files (estimate)" },
                    ].map((item, i) => {
                      const pct = Math.min((item.used / item.limit) * 100, 100).toFixed(1);
                      const isCritical = parseFloat(pct) > 80;
                      const isWarning = parseFloat(pct) > 50;
                      return (
                        <div key={i}>
                          <div className="flex justify-between items-center mb-1.5">
                            <span className="text-sm text-gray-300">{item.label}</span>
                            <div className="flex items-center gap-2">
                              {isCritical && <span className="text-xs text-red-400 font-bold">⚠️ Critical</span>}
                              {isWarning && !isCritical && <span className="text-xs text-yellow-400">⚡ Watch</span>}
                              <span className="text-xs text-gray-500">{item.used.toLocaleString()} / {item.limit.toLocaleString()} {item.unit}</span>
                            </div>
                          </div>
                          <div className="h-3 bg-white/5 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-700 ${
                                isCritical ? "bg-red-500" : isWarning ? "bg-yellow-500" : "bg-green-500"
                              }`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <p className={`text-xs mt-1 ${isCritical ? "text-red-400" : isWarning ? "text-yellow-400" : "text-gray-600"}`}>
                            {pct}% used
                          </p>
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-6 bg-blue-500/5 border border-blue-500/20 rounded-xl p-4 text-xs text-blue-400">
                    💡 If any bar reaches 80%+, upgrade to Supabase Pro ($25/month) for 8GB storage and unlimited users.
                  </div>
                </div>
              </div>
            )}

            {/* ── ACTIVITY TAB ── */}
            {activeTab === "activity" && (
              <div className="space-y-4">
                <div className="bg-[#111] border border-white/5 rounded-2xl p-6">
                  <h3 className="font-bold mb-4">Recent Platform Activity</h3>
                  <div className="space-y-3">
                    {recentActivity.length === 0 ? (
                      <p className="text-gray-500 text-sm">No recent activity</p>
                    ) : (
                      recentActivity.map((a, i) => (
                        <div key={i} className="flex items-start gap-3 py-2 border-b border-white/5 last:border-0">
                          <span className="text-lg flex-shrink-0 mt-0.5">{a.icon}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-white truncate">{a.text}</p>
                            {a.status && (
                              <span className={`text-[10px] px-1.5 py-0.5 rounded-full mt-0.5 inline-block ${
                                a.status === "delivered" || a.status === "accepted" ? "bg-green-500/10 text-green-400" :
                                a.status === "pending" ? "bg-yellow-500/10 text-yellow-400" :
                                "bg-gray-500/10 text-gray-400"
                              }`}>
                                {a.status}
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-gray-600 flex-shrink-0 whitespace-nowrap">
                            {new Date(a.time).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}