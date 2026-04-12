import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";
import { useAuth } from "../../context/AuthContext";

export default function Bookings() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadBookings = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get fresh auth user
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) return;

      let query = supabase
        .from("hire_requests")
        .select("id, job_description, location, status, created_at, client_id")
        .eq("worker_id", currentUser.id)
        .order("created_at", { ascending: false });

      if (filter !== "all") {
        query = query.eq("status", filter);
      }

      const { data, error: supabaseError } = await query;
      if (supabaseError) throw supabaseError;

      const bookingsData = data || [];

      // Fetch client names separately
      const clientIds = [...new Set(bookingsData.map(b => b.client_id).filter(Boolean))];
      let clientMap = {};

      if (clientIds.length > 0) {
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", clientIds);

        (profilesData || []).forEach(p => {
          clientMap[p.id] = p.full_name;
        });
      }

      // Merge client names
      const merged = bookingsData.map(b => ({
        ...b,
        client_name: clientMap[b.client_id] || "Client",
      }));

      setBookings(merged);
    } catch (err) {
      console.error("Error loading bookings:", err);
      setError("Failed to load bookings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) loadBookings();
  }, [user, filter]);

  // Real-time updates
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`bookings_page_${user.id}`)
      .on("postgres_changes", {
        event: "*", schema: "public",
        table: "hire_requests",
        filter: `worker_id=eq.${user.id}`,
      }, loadBookings)
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [user]);

  const updateStatus = async (id, status) => {
    try {
      const { error } = await supabase
        .from("hire_requests")
        .update({ status })
        .eq("id", id);
      if (error) throw error;
      loadBookings();
    } catch (err) {
      alert("Failed to update booking");
    }
  };

  const formatDate = (dateStr) =>
    new Date(dateStr).toLocaleDateString("en-US", {
      month: "short", day: "numeric",
      hour: "2-digit", minute: "2-digit",
    });

  const getStatusColor = (status) => {
    switch (status) {
      case "accepted": return "bg-green-500/20 text-green-400";
      case "rejected": return "bg-red-500/20 text-red-400";
      default: return "bg-yellow-500/20 text-yellow-400";
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-white p-4 pb-24">
      <h2 className="text-2xl font-bold mb-1">Bookings</h2>
      <p className="text-slate-400 text-sm mb-4">Hire requests from clients</p>

      {/* FILTER TABS */}
      <div className="flex gap-2 mb-4 overflow-x-auto">
        {["all", "pending", "accepted", "rejected"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition ${
              filter === f ? "bg-green-600 text-white" : "bg-white/10 text-gray-400"
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center mt-20">
          <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : error ? (
        <p className="text-red-400 text-center mt-10">{error}</p>
      ) : bookings.length === 0 ? (
        <div className="text-center mt-20">
          <p className="text-4xl mb-3">📋</p>
          <p className="text-slate-400">No {filter} bookings yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => (
            <div key={booking.id} className="bg-[#1e293b] p-4 rounded-2xl space-y-3">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  {/* Client name */}
                  <p className="text-xs text-green-400 mb-1">
                    👤 {booking.client_name}
                  </p>
                  <p className="font-semibold text-sm">
                    {booking.job_description || "Job Request"}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    📍 {booking.location || "No location"}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    {formatDate(booking.created_at)}
                  </p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(booking.status)}`}>
                  {booking.status || "pending"}
                </span>
              </div>

              {/* Accept/Reject for pending */}
              {(!booking.status || booking.status === "pending") && (
                <div className="flex gap-2">
                  <button
                    onClick={() => updateStatus(booking.id, "accepted")}
                    className="flex-1 bg-green-600 hover:bg-green-700 py-2 rounded-xl text-sm font-semibold transition"
                  >
                    ✅ Accept
                  </button>
                  <button
                    onClick={() => updateStatus(booking.id, "rejected")}
                    className="flex-1 bg-red-600/20 hover:bg-red-600/40 text-red-400 py-2 rounded-xl text-sm font-semibold transition"
                  >
                    ❌ Decline
                  </button>
                </div>
              )}

              {/* Message client — direct to their conversation */}
              {booking.status === "accepted" && booking.client_id && (
                <button
                  onClick={() => navigate(`/inbox?user=${booking.client_id}`)}
                  className="w-full bg-white/10 hover:bg-white/20 py-2 rounded-xl text-sm transition"
                >
                  💬 Message {booking.client_name}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}