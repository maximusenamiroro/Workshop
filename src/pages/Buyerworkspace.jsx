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

/* ---------------- UI COMPONENTS ---------------- */
function CategoryHeader({ icon, title }) {
  return (
    <div className="mb-4 flex items-center gap-3 border-b border-white/10 pb-2">
      <div className="text-3xl">{icon}</div>
      <div className="text-lg font-semibold">{title}</div>
    </div>
  );
}

function SubCategoryButton({ label, count, color, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-3 rounded mb-2 ${color}`}
    >
      {label} ({count})
    </button>
  );
}

/* ---------------- GROUP BUILDER ---------------- */
const buildGrouped = () => {
  const grouped = {};

  Object.keys(businessCategories).forEach((main) => {
    grouped[main] = {};
    businessCategories[main].forEach((sub) => {
      grouped[main][sub] = [];
    });
  });

  grouped["General"] = {
    "General Market": [],
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
    if (status === "accepted") return "text-green-400";
    if (status === "rejected") return "text-red-400";
    return "text-yellow-400";
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

  const [activeTab, setActiveTab] = useState("product_orders");

  const [bookings, setBookings] = useState([]);
  const [productsMap, setProductsMap] = useState({});
  const [workersMap, setWorkersMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (user) fetchAll();
  }, [user]);

  const fetchAll = async () => {
    await Promise.all([fetchBookings(), fetchProducts(), fetchWorkers()]);
    setLoading(false);
  };

  /* ---------------- PRODUCTS ---------------- */
  const fetchProducts = async () => {
    const { data } = await supabase
      .from("products")
      .select("id, name, business_category, sub_category");

    const grouped = buildGrouped();

    (data || []).forEach((p) => {
      const main = p.business_category;
      const sub = p.sub_category;

      if (grouped[main]?.[sub]) {
        grouped[main][sub].push(p);
      } else {
        grouped["General"]["General Market"].push(p);
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
      if (!w.is_live) return;

      const main = w.business_category;
      const sub = w.sub_category;

      if (grouped[main]?.[sub]) {
        grouped[main][sub].push(w);
      } else {
        grouped["General"]["General Workers"].push(w);
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

  const filterMap = (map) => {
    return Object.fromEntries(
      Object.entries(map).map(([main, subs]) => [
        main,
        Object.fromEntries(
          Object.entries(subs).map(([sub, items]) => [
            sub,
            items.filter((item) => {
              const text = `${main} ${sub} ${item.name || ""}`.toLowerCase();
              return text.includes(searchLower);
            }),
          ])
        ),
      ])
    );
  };

  const filteredProductsMap = useMemo(
    () => filterMap(productsMap),
    [productsMap, search]
  );

  const filteredWorkersMap = useMemo(
    () => filterMap(workersMap),
    [workersMap, search]
  );

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
        <FaClipboardList />
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
        {[
          ["product_orders", "🛒 Product Orders"],
          ["live_businesses", "🔴 Live Businesses"],
          ["my_bookings", "📄 My Bookings"],
        ].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex-1 p-2 rounded ${
              activeTab === key ? "bg-white text-black" : "bg-white/10"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* 🛒 PRODUCT ORDERS */}
      {activeTab === "product_orders" &&
        Object.entries(filteredProductsMap).map(([main, subs]) => (
          <div key={main} className="mb-6">
            <CategoryHeader
              icon={categoryIcons[main]?.icon || "📦"}
              title={main}
            />

            {Object.entries(subs).map(([sub, items]) =>
              items.length ? (
                <SubCategoryButton
                  key={sub}
                  label={sub}
                  count={items.length}
                  color="bg-yellow-500/10"
                  onClick={() => navigate(`/shop/${main}/${sub}`)}
                />
              ) : null
            )}
          </div>
        ))}

      {/* 🔴 LIVE BUSINESSES */}
      {activeTab === "live_businesses" &&
        Object.entries(filteredWorkersMap).map(([main, subs]) => (
          <div key={main} className="mb-6">
            <CategoryHeader
              icon={categoryIcons[main]?.icon || "📦"}
              title={main}
            />

            {Object.entries(subs).map(([sub, workers]) => (
              <div key={sub}>
                <SubCategoryButton
                  label={sub}
                  count={workers.length}
                  color="bg-green-500/10"
                  onClick={() => navigate(`/live/${main}/${sub}`)}
                />

                {workers.map((w) => (
                  <div
                    key={w.id}
                    className="flex justify-between bg-black p-2 mb-2 rounded"
                  >
                    <span>{w.name}</span>
                    <button
                      onClick={() => navigate(`/hire/${w.id}`)}
                      className="bg-blue-500 px-3 py-1 rounded"
                    >
                      Hire
                    </button>
                  </div>
                ))}
              </div>
            ))}
          </div>
        ))}

      {/* 📄 MY BOOKINGS */}
      {activeTab === "my_bookings" && (
        <div className="bg-white/10 p-4 rounded">
          {filteredBookings.length ? (
            filteredBookings.map((b) => (
              <BookingItem
                key={b.id}
                booking={b}
                onDelete={handleDeleteBooking}
              />
            ))
          ) : (
            <p className="text-gray-400">No bookings found</p>
          )}
        </div>
      )}
    </div>
  );
}
