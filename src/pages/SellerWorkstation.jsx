import { useState, useEffect } from "react";
import {
  FaBell,
  FaToggleOn,
  FaToggleOff,
  FaTrash,
  FaPlus,
  FaSearch,
  FaMapMarkerAlt,
  FaComment,
} from "react-icons/fa";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../context/AuthContext";

export default function SellerWorkstation() {
  const { user } = useAuth();

  const [products, setProducts] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isLive, setIsLive] = useState(false);
  const [service, setService] = useState("");
  const [liveLoading, setLiveLoading] = useState(false);

  const [workerCategory, setWorkerCategory] = useState(null);

  const [showUpload, setShowUpload] = useState(false);
  const [search, setSearch] = useState("");

  const [feedTab, setFeedTab] = useState("products");

  const [chatUser, setChatUser] = useState(null);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);

  const [form, setForm] = useState({
    title: "",
    description: "",
    price: "",
    file: null,
  });

  // ================= INIT =================
  useEffect(() => {
    if (!user) return;
    fetchAll();

    // 🔔 REAL-TIME BOOKINGS
    const channel = supabase
      .channel("hire_requests_realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "hire_requests" },
        (payload) => {
          if (payload.new.worker_id === user.id) {
            setBookings((prev) => [payload.new, ...prev]);
            alert("🔔 New Booking Request!");
          }
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [user]);

  const fetchAll = async () => {
    await Promise.all([
      fetchProducts(),
      fetchBookings(),
      fetchWorkerCategory(),
    ]);
    setLoading(false);
  };

  // ================= CATEGORY =================
  const fetchWorkerCategory = async () => {
    const { data } = await supabase
      .from("workers")
      .select("category")
      .eq("worker_id", user.id)
      .maybeSingle();

    setWorkerCategory(data?.category || null);
  };

  // ================= PRODUCTS =================
  const fetchProducts = async () => {
    const { data } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });

    setProducts(data || []);
  };

  const fetchBookings = async () => {
    const { data } = await supabase
      .from("hire_requests")
      .select("*")
      .eq("worker_id", user.id)
      .limit(10);

    setBookings(data || []);
  };

  // ================= LIVE MAP DATA (optional fields lat/lng) =================
  const [workers, setWorkers] = useState([]);

  useEffect(() => {
    const loadWorkers = async () => {
      const { data } = await supabase
        .from("workers")
        .select("worker_id, category, lat, lng, status");

      setWorkers(data || []);
    };

    loadWorkers();
  }, []);

  // ================= LIVE STATUS =================
  const toggleLive = async () => {
    setLiveLoading(true);

    const finalService =
      service?.trim() || workerCategory || "General Worker";

    if (isLive) {
      await supabase
        .from("live_workers")
        .delete()
        .eq("worker_id", user.id);

      setIsLive(false);
    } else {
      await supabase.from("live_workers").upsert({
        worker_id: user.id,
        service: finalService,
      });

      setIsLive(true);
    }

    setLiveLoading(false);
  };

  // ================= CHAT =================
  const openChat = async (otherUserId) => {
    setChatUser(otherUserId);

    const { data } = await supabase
      .from("messages")
      .select("*")
      .or(
        `sender_id.eq.${user.id},receiver_id.eq.${user.id}`
      )
      .limit(20);

    setMessages(data || []);
  };

  const sendMessage = async () => {
    if (!message) return;

    await supabase.from("messages").insert({
      sender_id: user.id,
      receiver_id: chatUser,
      content: message,
    });

    setMessage("");
  };

  // ================= FILTERED PRODUCTS =================
  const filteredProducts = products.filter((p) => {
    return (
      p.title?.toLowerCase().includes(search.toLowerCase()) ||
      p.category?.toLowerCase().includes(search.toLowerCase())
    );
  });

  if (loading) return <div className="text-white p-6">Loading...</div>;

  return (
    <div className="min-h-screen bg-[#1A1A1A] text-white p-4 space-y-5">

      {/* HEADER */}
      <div className="flex justify-between items-center">
        <FaMapMarkerAlt />
        <h1 className="text-xl">Workstation Pro</h1>
        <FaBell />
      </div>

      {/* SEARCH */}
      <input
        placeholder="Search products or category..."
        className="w-full p-2 bg-black/30 rounded"
        onChange={(e) => setSearch(e.target.value)}
      />

      {/* TABS */}
      <div className="flex gap-2">
        <button onClick={() => setFeedTab("products")}>Products</button>
        <button onClick={() => setFeedTab("feed")}>Feed</button>
        <button onClick={() => setFeedTab("map")}>Map</button>
        <button onClick={() => setFeedTab("bookings")}>Bookings</button>
      </div>

      {/* ================= PRODUCTS / FEED ================= */}
      {feedTab === "products" && (
        <div>
          {filteredProducts.map((p) => (
            <div
              key={p.id}
              className="p-3 border-b border-white/10 flex justify-between"
            >
              <div>
                <p>{p.title}</p>
                <p className="text-xs text-gray-400">{p.category}</p>
              </div>
              <button onClick={() => openChat(p.worker_id)}>
                <FaComment />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ================= TIKTOK FEED ================= */}
      {feedTab === "feed" && (
        <div className="space-y-3">
          {products.map((p) => (
            <div key={p.id} className="bg-black/30 p-3 rounded-xl">
              <p className="font-bold">{p.title}</p>
              <p className="text-sm text-gray-400">{p.description}</p>
            </div>
          ))}
        </div>
      )}

      {/* ================= MAP ================= */}
      {feedTab === "map" && (
        <div className="bg-black/30 p-4 rounded">
          <p className="mb-2">Live Workers</p>
          {workers.map((w, i) => (
            <div key={i} className="text-sm border-b border-white/10 py-1">
              {w.category} - {w.status || "offline"}
            </div>
          ))}
        </div>
      )}

      {/* ================= BOOKINGS ================= */}
      {feedTab === "bookings" && (
        <div>
          {bookings.map((b) => (
            <div key={b.id} className="p-2 border-b border-white/10">
              <p>New Hire Request</p>
              <p className="text-xs text-gray-400">{b.status}</p>
            </div>
          ))}
        </div>
      )}

      {/* ================= CHAT PANEL ================= */}
      {chatUser && (
        <div className="fixed bottom-0 left-0 right-0 bg-black p-3">
          <div className="h-40 overflow-y-auto">
            {messages.map((m, i) => (
              <p key={i} className="text-sm">
                {m.content}
              </p>
            ))}
          </div>

          <input
            className="w-full p-2 mt-2 bg-gray-800"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />

          <button onClick={sendMessage} className="mt-2 bg-green-600 p-2">
            Send
          </button>
        </div>
      )}
    </div>
  );
}
