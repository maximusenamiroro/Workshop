import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";
import { FaEye, FaEyeSlash, FaArrowLeft, FaArrowRight, FaCheck } from "react-icons/fa";
import { businessCategories } from "../data/bussinesscategorie";
import { useToast } from "../../hooks/useToast";
import logo from "../../assets/ws-logo.png";

const COUNTRIES = [
  "Nigeria", "Ghana", "Kenya", "South Africa",
  "United States", "United Kingdom", "Canada",
  "India", "Germany", "France",
];

const STEPS = [
  { id: 1, label: "Account" },
  { id: 2, label: "Business" },
  { id: 3, label: "Password" },
];

export default function Signup() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { showToast, ToastUI } = useToast();

  const roleFromUrl = searchParams.get("role");

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    country: "",
    accountType: roleFromUrl === "worker" ? "worker" : "client",
    category_group: "",
    category: "",
    otherCategory: "",
    location: "",
    password: "",
    confirmPassword: "",
  });

  useEffect(() => {
    if (roleFromUrl === "worker" || roleFromUrl === "client") {
      setForm(prev => ({ ...prev, accountType: roleFromUrl }));
    }
  }, [roleFromUrl]);

  const set = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setError("");
  };

  const handleAccountType = (type) => {
    setForm(prev => ({
      ...prev,
      accountType: type,
      category_group: "",
      category: "",
      otherCategory: "",
      location: "",
    }));
  };

  const isWorker = form.accountType === "worker";

  // ── Step validation ────────────────────────────────────────
  const validateStep1 = () => {
    if (!form.name.trim()) { setError("Please enter your name"); return false; }
    if (!form.email.trim() || !form.email.includes("@")) { setError("Please enter a valid email"); return false; }
    if (!form.country) { setError("Please select your country"); return false; }
    return true;
  };

  const validateStep3 = () => {
    if (!form.password) { setError("Please enter a password"); return false; }
    if (form.password.length < 6) { setError("Password must be at least 6 characters"); return false; }
    if (form.password !== form.confirmPassword) { setError("Passwords do not match"); return false; }
    return true;
  };

  const goNext = () => {
    setError("");
    if (step === 1 && !validateStep1()) return;
    if (step === 3) return; // submit handles this
    setStep(prev => prev + 1);
  };

  const goBack = () => {
    setError("");
    setStep(prev => Math.max(1, prev - 1));
  };

  // Step 2 is skippable for workers — clients skip straight to step 3
  const skipStep2 = () => {
    setForm(prev => ({
      ...prev,
      category_group: "",
      category: "",
      otherCategory: "",
      location: "",
    }));
    setStep(3);
  };

  const handleSubmit = async () => {
    if (!validateStep3()) return;
    setLoading(true);
    setError("");

    try {
      // Step A — Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: form.email.trim().toLowerCase(),
        password: form.password,
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("Account creation failed. Please try again.");

      const userId = authData.user.id;

      // Step B — Create profile
      const { error: profileError } = await supabase.from("profiles").insert({
        id: userId,
        full_name: form.name.trim(),
        phone: form.phone?.trim() || null,
        role: form.accountType,
        country: form.country || null,
      });
      if (profileError) throw new Error("Profile creation failed: " + profileError.message);

      // Step C — Create worker row if business account
      if (isWorker) {
        const workerCategory =
          form.category === "Other Business"
            ? form.otherCategory.trim()
            : form.category?.trim() || null;

        const { error: workerError } = await supabase.from("workers").insert({
          id: userId,
          category_group: form.category_group?.trim() || null,
          category: workerCategory,
          hand_skill: form.category_group === "Handwork & Skilled Workers",
          location: form.location?.trim() || null,
        });
        if (workerError) throw new Error("Business profile failed: " + workerError.message);
      }

      showToast(isWorker
        ? "✅ Business account created!"
        : "✅ Account created successfully!"
      );
      setTimeout(() => navigate("/reels"), 800);
    } catch (err) {
      const msg = err.message?.includes("already registered")
        ? "This email is already registered. Login instead."
        : err.message || "Failed to create account. Please try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // ── Progress indicator ─────────────────────────────────────
  const StepIndicator = () => (
    <div className="flex items-center justify-center gap-2 mb-8">
      {STEPS.map((s, i) => (
        <React.Fragment key={s.id}>
          <div className="flex flex-col items-center gap-1">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
              step > s.id
                ? "bg-green-600 text-white"
                : step === s.id
                  ? isWorker ? "bg-green-600 text-white ring-4 ring-green-500/30" : "bg-white text-black ring-4 ring-white/30"
                  : "bg-white/10 text-gray-500"
            }`}>
              {step > s.id ? <FaCheck size={10} /> : s.id}
            </div>
            <span className={`text-[10px] ${step === s.id ? "text-white" : "text-gray-600"}`}>
              {s.label}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div className={`h-0.5 w-10 mb-4 transition-all ${
              step > s.id ? "bg-green-600" : "bg-white/10"
            }`} />
          )}
        </React.Fragment>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0B0F19] text-white flex flex-col">
      <ToastUI />

      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
        <button onClick={() => navigate("/")} className="flex items-center gap-2 hover:opacity-80 transition">
          <img src={logo} alt="Omoworkit" className="w-8 h-8 rounded-lg" />
          <span className="font-bold text-base">omoworkit</span>
        </button>
        <button onClick={() => navigate("/login")} className="text-sm text-gray-400 hover:text-white transition">
          Login →
        </button>
      </div>

      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">

          <StepIndicator />

          {/* Error */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-2xl mb-5 text-sm">
              ⚠️ {error}
            </div>
          )}

          {/* ════════════════════════════════ STEP 1 ══ */}
          {step === 1 && (
            <div>
              <div className="text-center mb-6">
                <h1 className="text-2xl font-bold">Create Your Account</h1>
                <p className="text-gray-400 mt-1 text-sm">Let's start with the basics</p>
              </div>

              {/* Account type toggle */}
              <div className="flex gap-2 mb-5 bg-white/5 p-1 rounded-2xl">
                <button
                  onClick={() => handleAccountType("client")}
                  className={`flex-1 py-3 rounded-xl font-semibold text-sm transition ${
                    !isWorker ? "bg-white text-black shadow" : "text-gray-400 hover:text-white"
                  }`}
                >
                  👥 I'm a Client
                </button>
                <button
                  onClick={() => handleAccountType("worker")}
                  className={`flex-1 py-3 rounded-xl font-semibold text-sm transition ${
                    isWorker ? "bg-green-600 text-white shadow" : "text-gray-400 hover:text-white"
                  }`}
                >
                  🏢 I'm a Business
                </button>
              </div>

              {/* What you get */}
              <div className={`rounded-2xl p-3 text-xs border mb-5 ${
                isWorker
                  ? "bg-green-500/5 border-green-500/20 text-green-400"
                  : "bg-blue-500/5 border-blue-500/20 text-blue-400"
              }`}>
                {isWorker
                  ? "✓ Go live · ✓ Get booked · ✓ Post reels · ✓ Sell products"
                  : "✓ Find workers nearby · ✓ Track in real-time · ✓ Order products"
                }
              </div>

              <div className="space-y-4">
                <input
                  type="text"
                  placeholder={isWorker ? "Business / Full Name *" : "Full Name *"}
                  value={form.name}
                  onChange={e => set("name", e.target.value)}
                  className="w-full p-4 bg-[#121826] rounded-2xl text-white placeholder-gray-500 outline-none border border-white/5 focus:border-green-500/50 transition"
                />
                <input
                  type="email"
                  placeholder="Email Address *"
                  value={form.email}
                  onChange={e => set("email", e.target.value)}
                  className="w-full p-4 bg-[#121826] rounded-2xl text-white placeholder-gray-500 outline-none border border-white/5 focus:border-green-500/50 transition"
                />
                <input
                  type="tel"
                  placeholder="Phone Number (optional)"
                  value={form.phone}
                  onChange={e => set("phone", e.target.value)}
                  className="w-full p-4 bg-[#121826] rounded-2xl text-white placeholder-gray-500 outline-none border border-white/5 focus:border-green-500/50 transition"
                />
                <select
                  value={form.country}
                  onChange={e => set("country", e.target.value)}
                  className="w-full p-4 bg-[#121826] rounded-2xl text-white outline-none border border-white/5 focus:border-green-500/50 transition"
                >
                  <option value="">Select Country *</option>
                  {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <button
                onClick={goNext}
                className={`w-full mt-6 py-4 rounded-2xl font-bold text-base transition active:scale-[0.98] flex items-center justify-center gap-2 ${
                  isWorker
                    ? "bg-green-600 hover:bg-green-500 shadow-lg shadow-green-500/20"
                    : "bg-white text-black hover:bg-gray-100"
                }`}
              >
                Continue <FaArrowRight size={14} />
              </button>

              <p className="text-center text-gray-400 text-sm mt-4">
                Already have an account?{" "}
                <span onClick={() => navigate("/login")}
                  className="text-green-400 cursor-pointer hover:underline font-medium">
                  Login here
                </span>
              </p>
            </div>
          )}

          {/* ════════════════════════════════ STEP 2 ══ */}
          {step === 2 && (
            <div>
              <div className="text-center mb-6">
                <h1 className="text-2xl font-bold">
                  {isWorker ? "Business Details" : "Almost Done!"}
                </h1>
                <p className="text-gray-400 mt-1 text-sm">
                  {isWorker
                    ? "Help clients find your business (optional)"
                    : "You can skip this step"
                  }
                </p>
              </div>

              {isWorker ? (
                <div className="space-y-4">
                  <div className="bg-green-500/5 border border-green-500/20 rounded-2xl p-3">
                    <p className="text-xs text-green-400">
                      💡 Picking a category helps clients discover your business.
                      If you skip, you'll appear under General Workers.
                    </p>
                  </div>

                  {/* Business group */}
                  <select
                    value={form.category_group}
                    onChange={e => setForm(prev => ({ ...prev, category_group: e.target.value, category: "" }))}
                    className="w-full p-4 bg-[#121826] rounded-2xl text-white outline-none border border-white/5 focus:border-green-500/50 transition"
                  >
                    <option value="">Select Business Group (optional)</option>
                    {Object.keys(businessCategories).map(group => (
                      <option key={group} value={group}>{group}</option>
                    ))}
                  </select>

                  {/* Subcategory */}
                  {form.category_group && (
                    <select
                      value={form.category}
                      onChange={e => set("category", e.target.value)}
                      className="w-full p-4 bg-[#121826] rounded-2xl text-white outline-none border border-white/5 focus:border-green-500/50 transition"
                    >
                      <option value="">Select Specific Category (optional)</option>
                      {businessCategories[form.category_group].map(item => (
                        <option key={item} value={item}>{item}</option>
                      ))}
                    </select>
                  )}

                  {/* Other */}
                  {form.category === "Other Business" && (
                    <input
                      type="text"
                      placeholder="Describe your business *"
                      value={form.otherCategory}
                      onChange={e => set("otherCategory", e.target.value)}
                      className="w-full p-4 bg-[#121826] rounded-2xl text-white placeholder-gray-500 outline-none border border-white/5 focus:border-green-500/50 transition"
                    />
                  )}

                  {/* Location */}
                  <input
                    type="text"
                    placeholder="Business Location e.g. Ikeja, Lagos (optional)"
                    value={form.location}
                    onChange={e => set("location", e.target.value)}
                    className="w-full p-4 bg-[#121826] rounded-2xl text-white placeholder-gray-500 outline-none border border-white/5 focus:border-green-500/50 transition"
                  />

                  <div className="flex gap-3 mt-6">
                    <button
                      onClick={goBack}
                      className="flex items-center justify-center gap-2 flex-1 py-4 rounded-2xl font-semibold text-sm bg-white/10 hover:bg-white/15 transition active:scale-95"
                    >
                      <FaArrowLeft size={12} /> Back
                    </button>
                    <button
                      onClick={goNext}
                      className="flex items-center justify-center gap-2 flex-1 py-4 rounded-2xl font-bold text-sm bg-green-600 hover:bg-green-500 transition active:scale-95"
                    >
                      Continue <FaArrowRight size={12} />
                    </button>
                  </div>

                  {/* Skip option */}
                  <button
                    onClick={skipStep2}
                    className="w-full py-3 text-sm text-gray-500 hover:text-gray-300 transition"
                  >
                    Skip — I'll set this up later →
                  </button>
                </div>
              ) : (
                // Clients don't have a step 2 — show a transition screen
                <div className="text-center space-y-6">
                  <div className="bg-blue-500/5 border border-blue-500/20 rounded-2xl p-6">
                    <p className="text-4xl mb-3">👥</p>
                    <p className="text-sm text-blue-400 font-medium">Client Account</p>
                    <p className="text-xs text-gray-500 mt-1">
                      As a client you can find workers, book services,
                      order products, and track deliveries in real-time.
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={goBack}
                      className="flex items-center justify-center gap-2 flex-1 py-4 rounded-2xl font-semibold text-sm bg-white/10 hover:bg-white/15 transition">
                      <FaArrowLeft size={12} /> Back
                    </button>
                    <button onClick={goNext}
                      className="flex items-center justify-center gap-2 flex-1 py-4 rounded-2xl font-bold text-sm bg-white text-black hover:bg-gray-100 transition">
                      Continue <FaArrowRight size={12} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ════════════════════════════════ STEP 3 ══ */}
          {step === 3 && (
            <div>
              <div className="text-center mb-6">
                <h1 className="text-2xl font-bold">Create Password</h1>
                <p className="text-gray-400 mt-1 text-sm">
                  Almost there — secure your account
                </p>
              </div>

              {/* Summary card */}
              <div className={`rounded-2xl p-4 border mb-6 ${
                isWorker
                  ? "bg-green-500/5 border-green-500/20"
                  : "bg-white/5 border-white/10"
              }`}>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg flex-shrink-0 ${
                    isWorker ? "bg-green-600/20" : "bg-white/10"
                  }`}>
                    {isWorker ? "🏢" : "👥"}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm truncate">{form.name}</p>
                    <p className="text-xs text-gray-500 truncate">{form.email}</p>
                    {isWorker && form.category && (
                      <p className="text-xs text-green-400 mt-0.5">{form.category}</p>
                    )}
                    {isWorker && !form.category && (
                      <p className="text-xs text-gray-600 mt-0.5">General Worker</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {/* Password */}
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Password * (min. 6 characters)"
                    value={form.password}
                    onChange={e => set("password", e.target.value)}
                    minLength={6}
                    className="w-full p-4 bg-[#121826] rounded-2xl pr-12 text-white placeholder-gray-500 outline-none border border-white/5 focus:border-green-500/50 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute top-1/2 right-4 -translate-y-1/2 text-gray-400 hover:text-white transition"
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>

                {/* Password strength indicator */}
                {form.password.length > 0 && (
                  <div className="flex gap-1.5 px-1">
                    {[1, 2, 3, 4].map(i => (
                      <div key={i}
                        className={`flex-1 h-1 rounded-full transition-all ${
                          form.password.length >= i * 3
                            ? form.password.length >= 10 ? "bg-green-500"
                              : form.password.length >= 6 ? "bg-yellow-500"
                              : "bg-red-500"
                            : "bg-white/10"
                        }`}
                      />
                    ))}
                    <span className="text-[10px] text-gray-500 ml-1">
                      {form.password.length < 6 ? "Too short"
                        : form.password.length < 10 ? "OK"
                        : "Strong"}
                    </span>
                  </div>
                )}

                {/* Confirm password */}
                <div className="relative">
                  <input
                    type={showConfirm ? "text" : "password"}
                    placeholder="Confirm Password *"
                    value={form.confirmPassword}
                    onChange={e => set("confirmPassword", e.target.value)}
                    className="w-full p-4 bg-[#121826] rounded-2xl pr-12 text-white placeholder-gray-500 outline-none border border-white/5 focus:border-green-500/50 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute top-1/2 right-4 -translate-y-1/2 text-gray-400 hover:text-white transition"
                  >
                    {showConfirm ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>

                {/* Match indicator */}
                {form.confirmPassword.length > 0 && (
                  <p className={`text-xs px-1 ${
                    form.password === form.confirmPassword
                      ? "text-green-400"
                      : "text-red-400"
                  }`}>
                    {form.password === form.confirmPassword
                      ? "✓ Passwords match"
                      : "✗ Passwords do not match"}
                  </p>
                )}
              </div>

              {/* Terms notice */}
              <p className="text-xs text-gray-600 mt-4 text-center">
                By creating an account you agree to our{" "}
                <span onClick={() => navigate("/terms")}
                  className="text-gray-400 hover:text-white cursor-pointer underline">
                  Terms of Use
                </span>{" "}
                and{" "}
                <span onClick={() => navigate("/privacy")}
                  className="text-gray-400 hover:text-white cursor-pointer underline">
                  Privacy Policy
                </span>
              </p>

              <div className="flex gap-3 mt-5">
                <button
                  onClick={goBack}
                  className="flex items-center justify-center gap-2 py-4 px-5 rounded-2xl font-semibold text-sm bg-white/10 hover:bg-white/15 transition active:scale-95"
                >
                  <FaArrowLeft size={12} />
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading || !form.password || form.password !== form.confirmPassword}
                  className={`flex-1 py-4 rounded-2xl font-bold text-base transition active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed ${
                    isWorker
                      ? "bg-green-600 hover:bg-green-500 shadow-lg shadow-green-500/20"
                      : "bg-white text-black hover:bg-gray-100"
                  }`}
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      Creating Account...
                    </span>
                  ) : isWorker ? "🏢 Create Business Account" : "👥 Create Account"}
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}