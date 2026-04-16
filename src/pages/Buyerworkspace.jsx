import { useState, useEffect } from "react";
import { FaBell, FaSearch, FaClipboardList } from "react-icons/fa";
import { useSwipeable } from "react-swipeable";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { businessCategories } from "../data/businessCategories";

export default function BuyerWorkspace() {
  const { user } = useAuth();
  const navigate = useNavigate();

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
    await Promise.all([
      fetchBookings(),
      fetchProducts(),
      fetchWorkers(),
    ]);
    setLoading(false);
  };

  /* ---------------- PRODUCTS ---------------- */
  const fetchProducts = async () => {
    const { data } = await supabase
      .from("products")
      .select("id, business_category, sub_category");

    const grouped = {};

    Object.keys(businessCategories).forEach((main) => {
      grouped[main] = {};
      businessCategories[main].forEach((sub) => {
        grouped[main][sub] = [];
      });
    });

    (data || []).forEach((p) => {
      if (grouped[p.business_category]?.[p.sub_category]) {
        grouped[p.business_category][p.sub_category].push(p);
      }
    });

    setProductsMap(grouped);
  };

  /* ---------------- WORKERS ---------------- */
  const fetchWorkers = async () => {
    const { data } = await supabase
      .from("workers")
      .select("id, business_category, sub_category, is_live");

    const grouped = {};

    Object.keys(businessCategories).forEach((main) => {
      grouped[main] = {};
      businessCategories[main].forEach((sub) => {
        grouped[main][sub] = [];
      });
    });

    (data || []).forEach((w) => {
      if (
        w.is_live &&
        grouped[w.business_category]?.[w.sub_category]
      ) {
        grouped[w.business_category][w.sub_category].push(w);
      }
    });

    setWorkersMap(grouped);
  };

  /* ---------------- BOOKINGS ---------------- */
  const fetchBookings = async () => {
    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser();

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

  const getBookingColor = (status) => {
    if (status === "accepted") return "bg-green-500/20 text-green-400";
    if (status === "rejected") return "bg-red-500/20 text-red-400";
    return "bg-yellow-500/20 text-yellow-400";
  };

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
        <h1>Workspace</h1>
        <FaBell />
      </div>

      {/* SEARCH */}
      <div className="flex bg-white/10 p-2 rounded mb-6">
        <FaSearch />
        <input
          className="bg-transparent ml-2 w-full"
          placeholder="Search..."
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* ---------------- CATEGORY → SUB ---------------- */}
      <div className="mb-6">
        <h2>Explore Businesses</h2>

        {Object.entries(businessCategories).map(([main, subs]) => (
          <div key={main} className="mb-4">
            <p className="text-gray-400">{main}</p>

            <div className="flex gap-2 overflow-x-auto">
              {subs.map((sub) => (
                <button
                  key={sub}
                  onClick={() =>
                    navigate(`/category/${main}/${sub}`)
                  }
                  className="bg-white/10 px-3 py-2 rounded"
                >
                  {sub}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* ---------------- LIVE WORKERS ---------------- */}
      <div className="mb-6">
        <h2 className="text-green-400">🔴 Live Workers</h2>

        {Object.entries(workersMap).map(([main, subs]) =>
          Object.entries(subs).map(([sub, workers]) => {
            if (workers.length === 0) return null;

            return (
              <button
                key={sub}
                onClick={() =>
                  navigate(`/live/${main}/${sub}`)
                }
                className="block w-full text-left bg-green-500/10 p-3 rounded mb-2"
              >
                {sub} ({workers.length} live)
              </button>
            );
          })
        )}
      </div>

      {/* ---------------- BOOKINGS ---------------- */}
      <div className="bg-white/10 p-4 rounded mb-6">
        <h2>My Bookings</h2>

        {bookings.map((b) => {
          const swipeHandlers = useSwipeable({
            onSwipedLeft: () => handleDeleteBooking(b.id),
          });

          return (
            <div
              key={b.id}
              {...swipeHandlers}
              className="bg-black p-3 rounded mb-2 flex justify-between"
            >
              <div>
                <p>{b.job_description}</p>
                <p className="text-sm text-gray-400">{b.location}</p>
              </div>

              <span className={getBookingColor(b.status)}>
                {b.status}
              </span>
            </div>
          );
        })}
      </div>

      {/* ---------------- PRODUCT ORDERS ---------------- */}
      <div className="mb-6">
        <h2 className="text-yellow-400">🛒 Product Orders</h2>

        {Object.entries(productsMap).map(([main, subs]) =>
          Object.entries(subs).map(([sub, items]) => {
            if (items.length === 0) return null;

            return (
              <button
                key={sub}
                onClick={() =>
                  navigate(`/shop/${main}/${sub}`)
                }
                className="block w-full text-left bg-yellow-500/10 p-3 rounded mb-2"
              >
                {sub} ({items.length} items)
              </button>
            );
          })
        )}
      </div>

    </div>
  );
}
