import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import logo from "../assets/ws-logo.png";

export default function LandingPage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ workers: 0, clients: 0, jobs: 0 });
  const [menuOpen, setMenuOpen] = useState(false);
  const [animatedStats, setAnimatedStats] = useState({ workers: 0, clients: 0, jobs: 0 });

  useEffect(() => {
    fetchStats();
  }, []);

  // Animate numbers counting up
  useEffect(() => {
    const duration = 2000;
    const steps = 60;
    const interval = duration / steps;

    const timer = setInterval(() => {
      setAnimatedStats(prev => ({
        workers: prev.workers < stats.workers ? Math.min(prev.workers + Math.ceil(stats.workers / steps), stats.workers) : stats.workers,
        clients: prev.clients < stats.clients ? Math.min(prev.clients + Math.ceil(stats.clients / steps), stats.clients) : stats.clients,
        jobs: prev.jobs < stats.jobs ? Math.min(prev.jobs + Math.ceil(stats.jobs / steps), stats.jobs) : stats.jobs,
      }));
    }, interval);

    return () => clearInterval(timer);
  }, [stats]);

  const fetchStats = async () => {
    try {
      const [workersRes, clientsRes, jobsRes] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "worker"),
        supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "client"),
        supabase.from("hire_requests").select("id", { count: "exact", head: true }),
      ]);
      setStats({
        workers: workersRes.count || 0,
        clients: clientsRes.count || 0,
        jobs: jobsRes.count || 0,
      });
    } catch (err) {
      console.error("fetchStats error:", err.message);
    }
  };

  const features = [
    {
      icon: "🟢",
      title: "Go Live Instantly",
      desc: "Workers go live with one tap — clients nearby see you in real-time on a live map.",
    },
    {
      icon: "📍",
      title: "Real-Time Tracking",
      desc: "Workers share their location per job. Clients track arrival on a live map. Both can stop anytime for safety.",
    },
    {
      icon: "🛍️",
      title: "Sell Products Too",
      desc: "Workers list physical products alongside services. Clients order directly and track delivery status.",
    },
    {
      icon: "🎬",
      title: "Showcase via Reels",
      desc: "Post short videos of your work. Clients browse, like, comment, and book — all from the reel.",
    },
    {
      icon: "💬",
      title: "Built-in Messaging",
      desc: "Chat directly between client and worker. Real-time delivery receipts and seen status.",
    },
    {
      icon: "📦",
      title: "Order Management",
      desc: "Full order pipeline — pending, shipping, on the way, arriving, delivered — with live status updates.",
    },
    {
      icon: "⭐",
      title: "Ratings & Reviews",
      desc: "Clients rate workers after jobs. Build your reputation and stand out from the crowd.",
    },
    {
      icon: "🔒",
      title: "Safe & Private",
      desc: "Workers control who sees their location. Tracking requires consent. Auto logout keeps accounts secure.",
    },
  ];

  const howItWorksWorker = [
    { step: "1", title: "Sign Up as a Worker", desc: "Create your account, set your category and skills in minutes." },
    { step: "2", title: "Go Live", desc: "Tap Go Live to share your location — nearby clients can find and book you." },
    { step: "3", title: "Accept Jobs", desc: "Receive hire requests, accept or decline, and message clients directly." },
    { step: "4", title: "Get Paid & Grow", desc: "Complete jobs, earn ratings, post reels to build your client base." },
  ];

  const howItWorksClient = [
    { step: "1", title: "Sign Up as a Client", desc: "Create your account and browse available workers instantly." },
    { step: "2", title: "Find Workers Nearby", desc: "See live workers sorted by distance. Filter by category." },
    { step: "3", title: "Book & Track", desc: "Send a booking request. Track the worker live when they're on the way." },
    { step: "4", title: "Order Products", desc: "Browse worker product listings and order with real-time delivery tracking." },
  ];

  const categories = [
    { icon: "🛠️", name: "Handwork & Skilled" },
    { icon: "🍔", name: "Food & Restaurant" },
    { icon: "🚗", name: "Transport & Logistics" },
    { icon: "💄", name: "Beauty & Fashion" },
    { icon: "🏨", name: "Hotel & Accommodation" },
    { icon: "💊", name: "Health & Medical" },
    { icon: "🛍️", name: "Retail & Shops" },
    { icon: "🏗️", name: "Construction" },
    { icon: "🎥", name: "Media & Events" },
    { icon: "💻", name: "Technology & IT" },
    { icon: "🏠", name: "Home Services" },
    { icon: "🌾", name: "Agriculture" },
  ];

  const testimonials = [
    {
      name: "Adeola M.",
      role: "Electrician",
      city: "Lagos",
      text: "Since I joined Omoworkit I get 3–5 new clients every week just from being live. The reel feature changed everything for my business.",
      avatar: "A",
      color: "bg-green-600",
    },
    {
      name: "Chidi O.",
      role: "Client",
      city: "Abuja",
      text: "I found a plumber, tracked him live, and he fixed my pipe the same morning. This is the future of hiring in Nigeria.",
      avatar: "C",
      color: "bg-blue-600",
    },
    {
      name: "Fatima B.",
      role: "Hair Stylist",
      city: "Kano",
      text: "I post my work on reels and clients book me directly. My bookings doubled in the first month. Very easy to use.",
      avatar: "F",
      color: "bg-purple-600",
    },
  ];

  return (
    <div className="min-h-screen bg-[#0B0F19] text-white overflow-x-hidden">

      {/* ── NAVBAR ── */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#0B0F19]/90 backdrop-blur-md border-b border-white/5">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <img src={logo} alt="OmoDoit" className="w-9 h-9 rounded-xl" />
            <span className="text-xl font-bold tracking-tight">OmoDoit</span>
          </div>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-8 text-sm text-gray-400">
            <a href="#features" className="hover:text-white transition">Features</a>
            <a href="#how-it-works" className="hover:text-white transition">How it Works</a>
            <a href="#categories" className="hover:text-white transition">Categories</a>
            <a href="#testimonials" className="hover:text-white transition">Reviews</a>
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={() => navigate("/login")}
              className="px-5 py-2 border border-white/20 rounded-full text-sm hover:bg-white hover:text-black transition"
            >
              Login
            </button>
            <button
              onClick={() => navigate("/signup?role=client")}
              className="px-5 py-2 bg-green-600 hover:bg-green-500 rounded-full text-sm font-semibold transition"
            >
              Get Started
            </button>
          </div>

          {/* Mobile menu button */}
          <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden p-2">
            <div className="space-y-1.5">
              <span className={`block w-6 h-0.5 bg-white transition-all ${menuOpen ? "rotate-45 translate-y-2" : ""}`} />
              <span className={`block w-6 h-0.5 bg-white transition-all ${menuOpen ? "opacity-0" : ""}`} />
              <span className={`block w-6 h-0.5 bg-white transition-all ${menuOpen ? "-rotate-45 -translate-y-2" : ""}`} />
            </div>
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden bg-[#0B0F19] border-t border-white/5 px-6 py-4 space-y-4">
            {["features", "how-it-works", "categories", "testimonials"].map(id => (
              <a key={id} href={`#${id}`} onClick={() => setMenuOpen(false)}
                className="block text-gray-400 hover:text-white capitalize transition">
                {id.replace("-", " ")}
              </a>
            ))}
            <div className="flex gap-3 pt-2">
              <button onClick={() => navigate("/login")}
                className="flex-1 py-2.5 border border-white/20 rounded-xl text-sm hover:bg-white hover:text-black transition">
                Login
              </button>
              <button onClick={() => navigate("/signup?role=client")}
                className="flex-1 py-2.5 bg-green-600 hover:bg-green-500 rounded-xl text-sm font-semibold transition">
                Get Started
              </button>
            </div>
          </div>
        )}
      </header>

      {/* ── HERO ── */}
      <section className="pt-32 pb-20 px-6 text-center relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-green-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-40 left-1/4 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/20 text-green-400 px-4 py-1.5 rounded-full text-sm font-medium mb-6">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            Now Live in Nigeria 🇳🇬
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold leading-[1.1] mb-6 tracking-tight">
            Find Work.{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-300">
              Hire Fast.
            </span>
            <br />
            Track in Real-Time.
          </h1>

          <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            OmoDoit connects skilled workers and clients instantly.
            Go live, get booked, track jobs, sell products — all in one app.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <button
              onClick={() => navigate("/signup?role=worker")}
              className="px-8 py-4 bg-green-600 hover:bg-green-500 rounded-2xl font-bold text-lg transition active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-green-500/20"
            >
              🔨 Join as a Business
            </button>
            <button
              onClick={() => navigate("/signup?role=client")}
              className="px-8 py-4 bg-white text-black hover:bg-gray-100 rounded-2xl font-bold text-lg transition active:scale-95 flex items-center justify-center gap-2"
            >
              👥 Join as a Client
            </button>
          </div>

          <button
            onClick={() => navigate("/login")}
            className="text-gray-500 hover:text-gray-300 text-sm transition underline underline-offset-4"
          >
            Already have an account? Login →
          </button>
        </div>

        {/* Live stats */}
        <div className="relative max-w-2xl mx-auto mt-16 grid grid-cols-3 gap-4">
          {[
            { label: "Workers", value: animatedStats.workers, suffix: "+" },
            { label: "Clients", value: animatedStats.clients, suffix: "+" },
            { label: "Jobs Done", value: animatedStats.jobs, suffix: "+" },
          ].map(({ label, value, suffix }) => (
            <div key={label} className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center backdrop-blur">
              <p className="text-3xl font-extrabold text-green-400">
                {value > 0 ? value.toLocaleString() : "—"}{suffix}
              </p>
              <p className="text-xs text-gray-500 mt-1">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-green-400 text-sm font-semibold uppercase tracking-widest mb-3">Platform Features</p>
            <h2 className="text-4xl md:text-5xl font-bold">Everything you need to work smarter</h2>
            <p className="text-gray-400 mt-4 max-w-xl mx-auto">
              Built specifically for the Nigerian market — fast, mobile-first, and designed for real workers.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {features.map((f, i) => (
              <div
                key={i}
                className="bg-[#111827] border border-white/5 rounded-2xl p-5 hover:border-green-500/30 hover:bg-[#141e2d] transition-all group"
              >
                <div className="text-3xl mb-3">{f.icon}</div>
                <h3 className="font-bold text-base mb-2 group-hover:text-green-400 transition">{f.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" className="py-20 px-6 bg-[#080c14]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-green-400 text-sm font-semibold uppercase tracking-widest mb-3">How It Works</p>
            <h2 className="text-4xl md:text-5xl font-bold">Simple. Fast. Effective.</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-12">
            {/* Workers */}
            <div>
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center font-bold">🔨</div>
                <h3 className="text-xl font-bold">For Workers</h3>
              </div>
              <div className="space-y-6">
                {howItWorksWorker.map((item, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="w-9 h-9 bg-green-600/20 border border-green-500/30 rounded-full flex items-center justify-center text-green-400 font-bold text-sm flex-shrink-0">
                      {item.step}
                    </div>
                    <div>
                      <p className="font-semibold text-sm mb-1">{item.title}</p>
                      <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <button
                onClick={() => navigate("/signup?role=worker")}
                className="mt-8 w-full py-3.5 bg-green-600 hover:bg-green-500 rounded-2xl font-semibold transition active:scale-95"
              >
                Start Your Business Today → →
              </button>
            </div>

            {/* Clients */}
            <div>
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center font-bold">👥</div>
                <h3 className="text-xl font-bold">For Clients</h3>
              </div>
              <div className="space-y-6">
                {howItWorksClient.map((item, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="w-9 h-9 bg-blue-600/20 border border-blue-500/30 rounded-full flex items-center justify-center text-blue-400 font-bold text-sm flex-shrink-0">
                      {item.step}
                    </div>
                    <div>
                      <p className="font-semibold text-sm mb-1">{item.title}</p>
                      <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <button
                onClick={() => navigate("/signup?role=client")}
                className="mt-8 w-full py-3.5 bg-white text-black hover:bg-gray-100 rounded-2xl font-semibold transition active:scale-95"
              >
                Find a Worker Now →
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── CATEGORIES ── */}
      <section id="categories" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-green-400 text-sm font-semibold uppercase tracking-widest mb-3">Categories</p>
            <h2 className="text-4xl md:text-5xl font-bold">Every skill. Every service.</h2>
            <p className="text-gray-400 mt-4 max-w-xl mx-auto">
              From electricians to chefs, logistics to beauty — find or offer any skill on Omoworkit.
            </p>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3">
            {categories.map((cat, i) => (
              <div
                key={i}
                className="bg-[#111827] border border-white/5 rounded-2xl p-4 flex flex-col items-center gap-2 hover:border-green-500/30 hover:bg-[#141e2d] transition-all cursor-default group"
              >
                <span className="text-2xl">{cat.icon}</span>
                <p className="text-xs text-gray-400 text-center leading-tight group-hover:text-white transition">{cat.name}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-8">
            <p className="text-gray-500 text-sm">And many more categories available on the platform</p>
          </div>
        </div>
      </section>

      {/* ── SAFETY SECTION ── */}
      <section className="py-20 px-6 bg-[#080c14]">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-br from-green-500/10 to-blue-500/10 border border-white/10 rounded-3xl p-8 md:p-12 text-center">
            <div className="text-5xl mb-4">🔒</div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Your Safety Comes First</h2>
            <p className="text-gray-400 max-w-2xl mx-auto leading-relaxed mb-8">
              We designed every feature with safety in mind. Workers choose when to share their location
              and can stop at any time. Clients can also stop sharing their location instantly.
              Auto-logout protects inactive accounts. Your data stays private.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
              {[
                { icon: "📍", title: "Consent-Based Tracking", desc: "Workers start and stop location sharing per job" },
                { icon: "⏱️", title: "Auto Logout", desc: "Accounts auto-logout after 30 mins of inactivity" },
                { icon: "🛑", title: "Instant Stop", desc: "Both worker and client can end tracking anytime" },
              ].map((item, i) => (
                <div key={i} className="bg-white/5 rounded-2xl p-4 text-center">
                  <div className="text-2xl mb-2">{item.icon}</div>
                  <p className="font-semibold text-white text-xs mb-1">{item.title}</p>
                  <p className="text-gray-500 text-xs leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section id="testimonials" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-green-400 text-sm font-semibold uppercase tracking-widest mb-3">Reviews</p>
            <h2 className="text-4xl md:text-5xl font-bold">People love OmoDoit</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <div key={i} className="bg-[#111827] border border-white/5 rounded-2xl p-6 hover:border-green-500/20 transition-all">
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-11 h-11 ${t.color} rounded-full flex items-center justify-center font-bold text-lg flex-shrink-0`}>
                    {t.avatar}
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{t.name}</p>
                    <p className="text-xs text-gray-500">{t.role} · {t.city}</p>
                  </div>
                </div>
                <div className="flex gap-0.5 mb-3">
                  {[...Array(5)].map((_, j) => (
                    <span key={j} className="text-yellow-400 text-xs">★</span>
                  ))}
                </div>
                <p className="text-gray-400 text-sm leading-relaxed">"{t.text}"</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="py-24 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-green-500/5 to-transparent pointer-events-none" />
        <div className="relative max-w-3xl mx-auto text-center">
          <h2 className="text-4xl md:text-6xl font-extrabold mb-6 leading-tight">
            Ready to get started?
          </h2>
          <p className="text-gray-400 text-lg mb-10 max-w-xl mx-auto">
            Join thousands of workers and clients already using OmoDoit to connect, work, and grow.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate("/signup?role=worker")}
              className="px-10 py-4 bg-green-600 hover:bg-green-500 rounded-2xl font-bold text-lg transition active:scale-95 shadow-lg shadow-green-500/20 flex items-center justify-center gap-2"
            >
              🏢 I'm a Business            </button>
            <button
              onClick={() => navigate("/signup?role=client")}
              className="px-10 py-4 bg-white text-black hover:bg-gray-100 rounded-2xl font-bold text-lg transition active:scale-95 flex items-center justify-center gap-2"
            >
              👥 I'm a Client
            </button>
          </div>
          <p className="text-gray-600 text-sm mt-6">Free to join. No hidden fees.</p>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-white/5 py-12 px-6 bg-[#080c14]">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
            {/* Brand */}
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-3">
                <img src={logo} alt="OmoDoit" className="w-8 h-8 rounded-lg" />
                <span className="font-bold text-lg">OmoDoit</span>
              </div>
              <p className="text-gray-500 text-sm leading-relaxed">
                Connecting skilled workers and clients across Nigeria.
              </p>
            </div>

            {/* Platform */}
            <div>
              <p className="font-semibold text-sm mb-3 text-gray-300">Platform</p>
              <div className="space-y-2">
                {["Features", "How It Works", "Categories", "Reviews"].map(item => (
                  <a key={item} href={`#${item.toLowerCase().replace(" ", "-")}`}
                    className="block text-sm text-gray-500 hover:text-white transition">
                    {item}
                  </a>
                ))}
              </div>
            </div>

            {/* Join */}
            <div>
              <p className="font-semibold text-sm mb-3 text-gray-300">Join</p>
              <div className="space-y-2">
                <button onClick={() => navigate("/signup?role=worker")}
                  className="block text-sm text-gray-500 hover:text-white transition text-left">
                  Register Your Business
                </button>
                <button onClick={() => navigate("/signup?role=client")}
                  className="block text-sm text-gray-500 hover:text-white transition text-left">
                  Join as Client
                </button>
                <button onClick={() => navigate("/login")}
                  className="block text-sm text-gray-500 hover:text-white transition text-left">
                  Login
                </button>
              </div>
            </div>

            {/* Support */}
            <div>
              <p className="font-semibold text-sm mb-3 text-gray-300">Support</p>
              <div className="space-y-2">
                <p className="text-sm text-gray-500">Available 9am–6pm WAT</p>
                <p className="text-sm text-gray-500">Lagos, Nigeria 🇳🇬</p>
                <div className="flex gap-3 mt-3">
                  <div className="w-8 h-8 bg-white/5 hover:bg-white/10 rounded-full flex items-center justify-center text-sm cursor-pointer transition">𝕏</div>
                  <div className="w-8 h-8 bg-white/5 hover:bg-white/10 rounded-full flex items-center justify-center text-sm cursor-pointer transition">in</div>
                  <div className="w-8 h-8 bg-white/5 hover:bg-white/10 rounded-full flex items-center justify-center text-sm cursor-pointer transition">ig</div>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-white/5 pt-6 flex flex-col sm:flex-row justify-between items-center gap-3">
            <p className="text-gray-600 text-sm">© 2026 OmoD0it. All rights reserved.</p>
            <div className="flex gap-6 text-xs text-gray-600">
              <span className="hover:text-gray-400 cursor-pointer transition">Privacy Policy</span>
              <span className="hover:text-gray-400 cursor-pointer transition">Terms of Service</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}