import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";
import { FaArrowLeft, FaTimes, FaChevronLeft, FaChevronRight } from "react-icons/fa";

export default function NewArrivalsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const workerParam = searchParams.get("worker");

  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Story viewer state
  const [storyWorker, setStoryWorker] = useState(null);
  const [storyProducts, setStoryProducts] = useState([]);
  const [storyIndex, setStoryIndex] = useState(0);
  const [storyLoading, setStoryLoading] = useState(false);
  const progressRef = useRef(null);
  const progressTimerRef = useRef(null);

  useEffect(() => {
    fetchAllWorkers();
  }, []);

  // Auto open story if worker param is in URL
  useEffect(() => {
    if (workerParam && workers.length > 0) {
      const found = workers.find(w => w.worker_id === workerParam);
      if (found) openStory(found);
    }
  }, [workerParam, workers]);

  // Helper function to record views
  const recordViews = async (products, viewerId) => {
    if (!products || products.length === 0 || !viewerId) return;

    for (const product of products) {
      await supabase
        .from("product_views")
        .upsert({
          product_id: product.id,
          viewer_id: viewerId,
        })
        .select();
    }
  };

  const fetchAllWorkers = async () => {
    try {
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

      const { data, error } = await supabase
        .from("products")
        .select("id, title, image_url, created_at, worker_id, category, profiles(full_name, avatar_url)")
        .gte("created_at", since)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Group by worker — keep most recent product image
      const workerMap = {};
      (data || []).forEach(product => {
        const wid = product.worker_id;
        if (!workerMap[wid]) {
          workerMap[wid] = {
            worker_id: wid,
            full_name: product.profiles?.full_name || "Seller",
            avatar_url: product.profiles?.avatar_url || null,
            latest_image: product.image_url,
            category: product.category,
            product_count: 0,
          };
        }
        workerMap[wid].product_count += 1;
      });

      setWorkers(Object.values(workerMap));
    } catch (err) {
      console.error("fetchAllWorkers error:", err.message);
    } finally {
      setLoading(false);
    }
  };

  const openStory = async (worker) => {
    setStoryWorker(worker);
    setStoryIndex(0);
    setStoryLoading(true);

    try {
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

      const { data, error } = await supabase
        .from("products")
        .select("id, title, description, image_url, price, created_at, category")
        .eq("worker_id", worker.worker_id)
        .gte("created_at", since)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setStoryProducts(data || []);

      // Record views for all products in this worker's story
      const { data: { user: currentUser } } = await supabase.auth.getUser();

      if (currentUser && data && data.length > 0) {
        await recordViews(data, currentUser.id);
      }
    } catch (err) {
      console.error("openStory error:", err.message);
    } finally {
      setStoryLoading(false);
    }
  };

  const closeStory = () => {
    setStoryWorker(null);
    setStoryProducts([]);
    setStoryIndex(0);
    if (progressTimerRef.current) clearInterval(progressTimerRef.current);
  };

  const nextStory = () => {
    if (storyIndex < storyProducts.length - 1) {
      setStoryIndex(prev => prev + 1);
    } else {
      closeStory();
    }
  };

  const prevStory = () => {
    if (storyIndex > 0) {
      setStoryIndex(prev => prev - 1);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center text-white">
      <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white pb-24">

      {/* HEADER */}
      <div className="flex items-center gap-3 p-4 border-b border-white/10">
        <button onClick={() => navigate(-1)}>
          <FaArrowLeft className="text-gray-400" />
        </button>
        <div>
          <h1 className="font-bold text-lg">New Arrivals</h1>
          <p className="text-xs text-gray-400">Products posted in last 24 hours</p>
        </div>
      </div>

      {/* WORKERS GRID */}
      {workers.length === 0 ? (
        <div className="flex flex-col items-center justify-center mt-20 gap-3 text-gray-400">
          <p className="text-4xl">📦</p>
          <p>No new products in the last 24 hours</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 p-4">
          {workers.map((w) => (
            <button
              key={w.worker_id}
              onClick={() => openStory(w)}
              className="bg-[#1a1a1a] rounded-2xl overflow-hidden hover:bg-[#242424] transition active:scale-95"
            >
              {/* Product image */}
              <div className="w-full h-40 bg-gray-800 relative">
                {w.latest_image ? (
                  <img
                    src={w.latest_image}
                    alt={w.full_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-4xl">
                    📦
                  </div>
                )}
                {/* Product count badge */}
                {w.product_count > 1 && (
                  <div className="absolute top-2 right-2 bg-green-600 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                    +{w.product_count}
                  </div>
                )}
              </div>

              {/* Worker info */}
              <div className="p-3 flex items-center gap-2">
                <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-700 flex items-center justify-center flex-shrink-0">
                  {w.avatar_url ? (
                    <img src={w.avatar_url} alt={w.full_name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xs font-bold text-white">{w.full_name[0]}</span>
                  )}
                </div>
                <div className="text-left min-w-0">
                  <p className="text-sm font-semibold truncate">{w.full_name}</p>
                  <p className="text-xs text-green-400 truncate">{w.category || "Seller"}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* STORY VIEWER */}
      {storyWorker && (
        <div className="fixed inset-0 bg-black z-50 flex flex-col">

          {/* Progress bars */}
          <div className="flex gap-1 p-3 pt-4">
            {storyProducts.map((_, idx) => (
              <div
                key={idx}
                className="flex-1 h-0.5 rounded-full overflow-hidden bg-white/30"
              >
                <div
                  className={`h-full bg-white transition-none ${
                    idx < storyIndex ? "w-full" :
                    idx === storyIndex ? "w-full" : "w-0"
                  }`}
                />
              </div>
            ))}
          </div>

          {/* Story header */}
          <div className="flex items-center gap-3 px-4 pb-3">
            <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-700 border-2 border-green-500 flex items-center justify-center">
              {storyWorker.avatar_url ? (
                <img src={storyWorker.avatar_url} alt={storyWorker.full_name} className="w-full h-full object-cover" />
              ) : (
                <span className="font-bold text-white">{storyWorker.full_name[0]}</span>
              )}
            </div>
            <div className="flex-1">
              <p className="font-semibold text-white text-sm">{storyWorker.full_name}</p>
              <p className="text-xs text-green-400">{storyWorker.category || "Seller"}</p>
            </div>
            <button onClick={closeStory} className="text-white/70 p-2">
              <FaTimes />
            </button>
          </div>

          {/* Story content */}
          {storyLoading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : storyProducts.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-gray-400">
              <p>No products available</p>
            </div>
          ) : (
            <div className="flex-1 relative overflow-hidden">

              {/* Product image */}
              <div className="absolute inset-0">
                {storyProducts[storyIndex]?.image_url ? (
                  <img
                    src={storyProducts[storyIndex].image_url}
                    alt={storyProducts[storyIndex].title}
                    className="w-full h-full object-contain bg-black"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-8xl bg-[#1a1a1a]">
                    📦
                  </div>
                )}
              </div>

              {/* Tap zones — LEFT to go back, RIGHT to go forward */}
              <div className="absolute inset-0 flex">
                <div
                  className="w-1/3 h-full cursor-pointer z-10"
                  onClick={prevStory}
                />
                <div className="flex-1" />
                <div
                  className="w-1/3 h-full cursor-pointer z-10"
                  onClick={nextStory}
                />
              </div>

              {/* Navigation arrows */}
              {storyIndex > 0 && (
                <button
                  onClick={prevStory}
                  className="absolute left-3 top-1/2 -translate-y-1/2 z-20 bg-black/40 p-2 rounded-full"
                >
                  <FaChevronLeft className="text-white" />
                </button>
              )}
              {storyIndex < storyProducts.length - 1 && (
                <button
                  onClick={nextStory}
                  className="absolute right-3 top-1/2 -translate-y-1/2 z-20 bg-black/40 p-2 rounded-full"
                >
                  <FaChevronRight className="text-white" />
                </button>
              )}

              {/* Product info overlay at bottom */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/60 to-transparent p-5 z-10">
                <p className="font-bold text-lg text-white">
                  {storyProducts[storyIndex]?.title}
                </p>
                {storyProducts[storyIndex]?.description && (
                  <p className="text-sm text-gray-300 mt-1 line-clamp-2">
                    {storyProducts[storyIndex]?.description}
                  </p>
                )}
                <div className="flex items-center justify-between mt-3">
                  <p className="text-green-400 font-bold text-lg">
                    ₦{Number(storyProducts[storyIndex]?.price || 0).toLocaleString()}
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => navigate(`/seller-profile/${storyWorker.worker_id}`)}
                      className="bg-white/20 text-white px-4 py-2 rounded-full text-sm font-semibold"
                    >
                      View Profile
                    </button>
                    <button
                      onClick={() => navigate(`/product/${storyProducts[storyIndex]?.id}`)}
                      className="bg-green-600 text-white px-4 py-2 rounded-full text-sm font-semibold"
                    >
                      Order Now
                    </button>
                  </div>
                </div>

                {/* Story counter */}
                <p className="text-xs text-white/50 text-center mt-3">
                  {storyIndex + 1} of {storyProducts.length}
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}