import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";
import { FaArrowLeft, FaTimes, FaChevronLeft, FaChevronRight } from "react-icons/fa";

export default function NewArrivalsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const workerParam = searchParams.get("worker");
  const categoryParam = searchParams.get("category"); // ← get subcategory from URL

  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [storyWorker, setStoryWorker] = useState(null);
  const [storyProducts, setStoryProducts] = useState([]);
  const [storyIndex, setStoryIndex] = useState(0);
  const [storyLoading, setStoryLoading] = useState(false);
  const progressTimerRef = useRef(null);

  useEffect(() => {
    fetchAllWorkers();
  }, [categoryParam]);

  useEffect(() => {
    if (workerParam && workers.length > 0) {
      const found = workers.find(w => w.worker_id === workerParam);
      if (found) openStory(found);
    }
  }, [workerParam, workers]);

  const recordViews = async (products, viewerId) => {
    if (!products?.length || !viewerId) return;
    for (const product of products) {
      await supabase
        .from("product_views")
        .upsert({ product_id: product.id, viewer_id: viewerId });
    }
  };

  const fetchAllWorkers = async () => {
    setLoading(true);
    try {
      const since = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();

      let query = supabase
        .from("products")
        .select("id, title, image_url, created_at, worker_id, category, price, profiles(full_name, avatar_url)")
        .gte("created_at", since)
        .order("created_at", { ascending: false });

      // Filter by subcategory if provided
      if (categoryParam) {
        query = query.eq("category", categoryParam);
      }

      const { data, error } = await query;
      if (error) throw error;

      // If category filter — also check workers table category
      // because product.category might not always match worker.category
      let finalData = data || [];

      if (categoryParam) {
        // Get worker IDs whose registered category matches
        const workerIds = [...new Set(finalData.map(p => p.worker_id).filter(Boolean))];

        if (workerIds.length > 0) {
          const { data: workersData } = await supabase
            .from("workers")
            .select("id, category")
            .in("id", workerIds);

          const matchingWorkerIds = new Set(
            (workersData || [])
              .filter(w => w.category?.toLowerCase() === categoryParam.toLowerCase())
              .map(w => w.id)
          );

          // Include product if its worker matches OR product.category matches
          finalData = finalData.filter(p =>
            matchingWorkerIds.has(p.worker_id) ||
            p.category?.toLowerCase() === categoryParam.toLowerCase()
          );
        }
      }

      // Group by worker
      const workerMap = {};
      finalData.forEach(product => {
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
      const since = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();

      const { data, error } = await supabase
        .from("products")
        .select("id, title, description, image_url, price, created_at, category")
        .eq("worker_id", worker.worker_id)
        .gte("created_at", since)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setStoryProducts(data || []);

      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (currentUser && data?.length > 0) {
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
    if (storyIndex < storyProducts.length - 1) setStoryIndex(p => p + 1);
    else closeStory();
  };

  const prevStory = () => {
    if (storyIndex > 0) setStoryIndex(p => p - 1);
  };

  if (loading) return (
    <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center text-white">
      <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="h-full overflow-y-auto text-white pb-20">

      {/* HEADER */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10 sticky top-0 bg-black/80 backdrop-blur-md z-20">
        <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-white/10">
          <FaArrowLeft className="text-gray-300" />
        </button>
        <div>
          <h1 className="font-semibold text-base">
            {categoryParam ? categoryParam : "New Arrivals"}
          </h1>
          <p className="text-xs text-gray-400">
            {categoryParam ? "Last 48 hours · filtered" : "Last 48 hours"}
          </p>
        </div>
      </div>

      {/* WORKERS GRID */}
      {workers.length === 0 ? (
        <div className="flex flex-col items-center justify-center mt-20 gap-3 text-gray-400">
          <p className="text-4xl">📦</p>
          <p className="text-sm">
            {categoryParam
              ? `No new products in "${categoryParam}" in the last 48h`
              : "No new products in the last 48 hours"}
          </p>
          {categoryParam && (
            <button
              onClick={() => navigate("/new-arrivals")}
              className="mt-2 text-green-400 text-sm underline"
            >
              View all categories
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 p-4">
          {workers.map((w) => (
            <button
              key={w.worker_id}
              onClick={() => openStory(w)}
              className="bg-[#1a1a1a] rounded-2xl overflow-hidden hover:bg-[#242424] transition active:scale-95 text-left"
            >
              <div className="w-full h-36 bg-gray-800 relative">
                {w.latest_image ? (
                  <img src={w.latest_image} alt={w.full_name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-4xl">📦</div>
                )}
                {w.product_count > 1 && (
                  <div className="absolute top-2 right-2 bg-green-600 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                    +{w.product_count}
                  </div>
                )}
              </div>
              <div className="p-3 flex items-center gap-2">
                <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-700 flex items-center justify-center flex-shrink-0">
                  {w.avatar_url ? (
                    <img src={w.avatar_url} alt={w.full_name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xs font-bold text-white">{w.full_name[0]}</span>
                  )}
                </div>
                <div className="min-w-0">
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
          <div className="flex gap-1 p-3 pt-10">
            {storyProducts.map((_, idx) => (
              <div key={idx} className="flex-1 h-0.5 rounded-full overflow-hidden bg-white/30">
                <div className={`h-full bg-white ${idx <= storyIndex ? "w-full" : "w-0"}`} />
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
            <button onClick={closeStory} className="text-white/70 p-2"><FaTimes /></button>
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
              <div className="absolute inset-0">
                {storyProducts[storyIndex]?.image_url ? (
                  <img
                    src={storyProducts[storyIndex].image_url}
                    alt={storyProducts[storyIndex].title}
                    className="w-full h-full object-contain bg-black"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-8xl bg-[#1a1a1a]">📦</div>
                )}
              </div>

              {/* Tap zones */}
              <div className="absolute inset-0 flex z-10">
                <div className="w-1/3 h-full cursor-pointer" onClick={prevStory} />
                <div className="flex-1" />
                <div className="w-1/3 h-full cursor-pointer" onClick={nextStory} />
              </div>

              {storyIndex > 0 && (
                <button onClick={prevStory} className="absolute left-3 top-1/2 -translate-y-1/2 z-20 bg-black/40 p-2 rounded-full">
                  <FaChevronLeft className="text-white" />
                </button>
              )}
              {storyIndex < storyProducts.length - 1 && (
                <button onClick={nextStory} className="absolute right-3 top-1/2 -translate-y-1/2 z-20 bg-black/40 p-2 rounded-full">
                  <FaChevronRight className="text-white" />
                </button>
              )}

              {/* Product info */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/80 to-transparent p-5 pb-18 z-10">
                <p className="font-semibold text-base text-white leading-tight line-clamp-1">
                  {storyProducts[storyIndex]?.title}
                </p>
                {storyProducts[storyIndex]?.description && (
                  <p className="text-xs text-gray-300 mt-1 line-clamp-2">
                    {storyProducts[storyIndex]?.description}
                  </p>
                )}
                <div className="flex items-center justify-between mt-4">
                  {storyProducts[storyIndex]?.price ? (
                    <p className="text-green-400 font-bold text-xl">
                      ₦{Number(storyProducts[storyIndex].price).toLocaleString()}
                    </p>
                  ) : (
                    <p className="text-gray-400 text-sm">Price on request</p>
                  )}
                  <div className="flex gap-2">
                    <button
                      onClick={() => navigate(`/seller-profile/${storyWorker.worker_id}`)}
                      className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-full text-xs font-medium transition"
                    >
                      View Profile
                    </button>
                    <button
                      onClick={() => navigate(`/product/${storyProducts[storyIndex]?.id}`)}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-full text-xs font-medium transition"
                    >
                      Order Now
                    </button>
                  </div>
                </div>
                <p className="text-[10px] text-white/40 text-center mt-3">
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