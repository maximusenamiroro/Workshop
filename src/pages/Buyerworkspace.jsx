import { useState, useEffect, useMemo } from "react";
import { FaBell, FaSearch, FaClipboardList } from "react-icons/fa";
import { useSwipeable } from "react-swipeable";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { businessCategories } from "../data/businessCategories";

/* ---------------- ICON MAP ---------------- */
const categoryIcons = {
  Fashion: { icon: "👕" },
  Tech: { icon: "📱" },
  Services: { icon: "🛠️" },
  Beauty: { icon: "💄" },
  Food: { icon: "🍔" },
  General: { icon: "📦" },
};

/* ---------------- REUSABLE UI ---------------- */
function CategoryHeader({ icon, title }) {
  return (
    <div className="mb-4 flex items-center gap-3 border-b border-white/10 pb-2">
      <div className="text-3xl">{icon}</div>
      <div className="text-lg font-semibold text-white">{title}</div>
    </div>
  );
}

function SubCategoryButton({ label, count, color, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`block w-full text-left p-3 rounded mb-2 ${color}`}
    >
      {label} ({count})
    </button>
  );
}

/* ---------------- HELPERS ---------------- */
const buildGrouped = () => {
  const grouped = {};

  Object.keys(businessCategories).forEach((main) => {
    grouped[main] = {};
    businessCategories[main].forEach((sub) => {
      grouped[main][sub] = [];
    });
  });

  grouped["General"] = {
    "Others": [],
    "General Workers": [],
  };

  return grouped;
};

/* ---------------- BOOKING ITEM ---------------- */
function BookingItem({ booking, onDelete }) {
  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => onDelete(booking.id),
  });

  const getStatusColor = (status) => {
    if (status === "accepted") return "bg-green-500/20 text-green-400";
    if (status === "rejected") return "bg-red-500/20 text-red-400";
    return "bg-yellow-500/20 text-yellow-400";
  };

  return (
    <div
      {...swipeHandlers}
      className="bg-black p-3 rounded mb-2 flex justify-between"
    >
      <div>
        <p>{booking.job_description}</p>
        <p className="text-sm text-gray-400">{booking.location}</p>
      </div>

      <span className={getStatusColor(booking.status)}>
        {booking.status}
      </span>
    </div>
  );
}

/* ---------------- MAIN WORKSPACE ---------------- */
export default function BuyerWorkspace() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("products");

  const [bookings, setBookings] = useState([]);
  const [productsMap, setProductsMap] = useState({});
  const [workersMap, setWorkersMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!user) return;
    fetchAll();
  }, [user]);

  const fetchAll = async () => {
    await Promise.all([fetchBookings(), fetchProducts(), fetchWorkers()]);
    setLoading(false);
  };

  /* ---------------- PRODUCTS ---------------- */
  const fetchProducts = async () => {
    const { data } = await supabase
      .from("products")
      .select("id, business_category, sub_category");

    const grouped = buildGrouped();

    (data || []).forEach((p) => {
      const main = p.business_category;
      const sub = p.sub_category;

      if (!main || !sub) {
        grouped["General"]["Others"].push(p);
        return;
      }

      if (grouped[main]?.[sub]) {
        grouped[main][sub].push(p);
      }
    });

    setProductsMap(grouped);
  };

  /* ---------------- WORKERS ---------------- */
  const fetchWorkers = async () => {
    const { data } = await supabase
      .from("workers")
      .select("id, name, business_category, sub_category, is_live");

    const grouped = buildGrouped();

    (data || []).forEach((w) => {
      const main = w.business_category;
      const sub = w.sub_category;

      if (!w.is_live) return;

      if (!main || !sub) {
        grouped["General"]["General Workers"].push(w);
        return;
      }

      if (grouped[main]?.[sub]) {
        grouped[main][sub].push(w);
      }
    });

    setWorkersMap(grouped);
  };

  /* ---------------- BOOKINGS ---------------- */
  const fetchBookings = async () => {
    const { data: { user: currentUser } } =
      await supabase.auth.getUser();

    if (!currentUser) return;

    const { data } = await supabase
      .from("hire_requests")
      .select("id, status, job_description, location")
      .eq("client_id", currentUser.id)
      .order("created_at", { ascending: false });

    setBookings(data || []);
  };

  const handleDeleteBooking = async (id) => {
    await supabase.from("hire_requests").delete().eq("id", id);
    fetchBookings();
  };

  /* ---------------- SEARCH ---------------- */
  const searchLower = search.toLowerCase();

  const filteredProductsMap = useMemo(() => {
    const result = JSON.parse(JSON.stringify(productsMap));

    Object.entries(result).forEach(([main, subs]) => {
      Object.entries(subs).forEach(([sub, items]) => {
        result[main][sub] = items.filter(() =>
          `${main} ${sub}`.toLowerCase().includes(searchLower)
        );
      });
    });

    return result;
  }, [productsMap, search]);

  const filteredWorkersMap = useMemo(() => {
    const result = JSON.parse(JSON.stringify(workersMap));

    Object.entries(result).forEach(([main, subs]) => {
      Object.entries(subs).forEach(([sub, items]) => {
        result[main][sub] = items.filter(() =>
          `${main} ${sub}`.toLowerCase().includes(searchLower)
        );
      });
    });

    return result;
  }, [workersMap, search]);

  const filteredBookings = useMemo(() => {
    return bookings.filter((b) =>
      `${b.job_description} ${b.location}`
        .toLowerCase()
        .includes(searchLower)
    );
  }, [bookings, search]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-4 pb-24">

      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <FaClipboardList onClick={() => navigate("/productorder")} />
        <h1 className="text-lg font-semibold">Workspace</h1>
        <FaBell />
      </div>

      {/* SEARCH */}
      <div className="flex bg-white/10 p-2 rounded mb-4">
        <FaSearch />
        <input
          className="bg-transparent ml-2 w-full outline-none"
          placeholder="Search workspace..."
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* TABS */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab("products")}
          className={`flex-1 p-2 rounded ${
            activeTab === "products" ? "bg-yellow-500 text-black" : "bg-white/10"
          }`}
        >
          🛒 Products
        </button>

        <button
          onClick={() => setActiveTab("workers")}
          className={`flex-1 p-2 rounded ${
            activeTab === "workers" ? "bg-green-500 text-black" : "bg-white/10"
          }`}
        >
          🔴 Workers
        </button>

        <button
          onClick={() => setActiveTab("bookings")}
          className={`flex-1 p-2 rounded ${
            activeTab === "bookings" ? "bg-blue-500 text-black" : "bg-white/10"
          }`}
        >
          📄 Bookings
        </button>
      </div>

      {/* 🛒 PRODUCTS TAB */}
      {activeTab === "products" && (
        <div>
          {Object.entries(filteredProductsMap).map(([main, subs]) => (
            <div key={main} className="mb-6">

              <CategoryHeader
                icon={categoryIcons[main]?.icon || "📦"}
                title={main}
              />

              {Object.entries(subs).map(([sub, items]) => {
                if (!items.length) return null;

                return (
                  <SubCategoryButton
                    key={sub}
                    label={sub}
                    count={items.length}
                    color="bg-yellow-500/10"
                    onClick={() => navigate(`/shop/${main}/${sub}`)}
                  />
                );
              })}

            </div>
          ))}
        </div>
      )}

      {/* 🔴 WORKERS TAB */}
      {activeTab === "workers" && (
        <div>
          {Object.entries(filteredWorkersMap).map(([main, subs]) => (
            <div key={main} className="mb-6">

              <CategoryHeader
                icon={categoryIcons[main]?.icon || "📦"}
                title={main}
              />

              {Object.entries(subs).map(([sub, workers]) => {
                if (!workers.length) return null;

                return (
                  <div key={sub}>
                    <SubCategoryButton
                      label={sub}
                      count={workers.length}
                      color="bg-green-500/10"
                      onClick={() => navigate(`/live/${main}/${sub}`)}
                    />

                    {main === "General" &&
                      sub === "General Workers" &&
                      workers.map((w) => (
                        <div
                          key={w.id}
                          className="flex justify-between items-center bg-black p-2 mb-2 rounded"
                        >
                          <span>{w.name || "General Worker"}</span>

                          <button
                            onClick={() => navigate(`/hire/${w.id}`)}
                            className="bg-blue-500 px-3 py-1 rounded"
                          >
                            Hire
                          </button>
                        </div>
                      ))}
                  </div>
                );
              })}

            </div>
          ))}
        </div>
      )}

      {/* 📄 BOOKINGS TAB */}
      {activeTab === "bookings" && (
        <div className="bg-white/10 p-4 rounded">
          {filteredBookings.map((b) => (
            <BookingItem
              key={b.id}
              booking={b}
              onDelete={handleDeleteBooking}
            />
          ))}
        </div>
      )}

    </div>
  );
}
