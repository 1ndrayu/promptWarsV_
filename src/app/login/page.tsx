"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth, googleProvider } from "@/lib/firebase";
import { signInWithEmailAndPassword, signInWithPopup, onAuthStateChanged } from "firebase/auth";
import { ShieldCheck, Mail, Lock, Globe, ArrowRight } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) router.push("/dashboard");
    });
    return () => unsubscribe();
  }, [router]);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Nexus Demo Account Bypass
    const demoAccounts: Record<string, { pass: string, redirect: string, uid: string }> = {
      "vip@nexus.org": { pass: "vip123", redirect: "/dashboard", uid: "nexus-vip" },
      "guest@nexus.org": { pass: "guest123", redirect: "/dashboard", uid: "nexus-guest" },
      "lecturer@nexus.org": { pass: "lecturer123", redirect: "/dashboard", uid: "nexus-lecturer" },
      "staff@nexus.org": { pass: "staff123", redirect: "/dashboard", uid: "nexus-staff" }
    };

    if (demoAccounts[email] && demoAccounts[email].pass === password) {
       localStorage.setItem("nexus_demo_uid", demoAccounts[email].uid);
       router.push(demoAccounts[email].redirect);
       return;
    }

    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push("/dashboard");
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
      else setError("An unexpected error occurred");
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
      router.push("/dashboard");
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
      else setError("Google authentication failed");
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-6 font-sans">
      <section className="w-full max-w-xl bg-white rounded-[56px] p-12 md:p-16 border border-gray-100 shadow-2xl relative overflow-hidden">
        {/* Abstract Background Element */}
        <div className="absolute -top-24 -right-24 h-64 w-64 bg-blue-50 rounded-full blur-3xl opacity-50" aria-hidden="true"></div>
        
        <div className="relative z-10">
          <header className="flex items-center space-x-4 mb-16">
            <div className="h-14 w-14 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-blue-100" aria-hidden="true">
               <ShieldCheck size={32} />
            </div>
            <div>
              <h1 className="text-4xl font-black tracking-tighter text-gray-900 leading-none">NEXUS</h1>
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400 mt-2">SECURE GATEWAY</p>
            </div>
          </header>

          <h2 className="text-2xl font-bold text-gray-900 mb-8" id="login-heading">Sign in to your account</h2>

          <form onSubmit={handleEmailLogin} className="space-y-6" aria-labelledby="login-heading">
            <div className="space-y-2">
              <div className="relative">
                <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400" size={20} aria-hidden="true" />
                <input 
                  type="email" 
                  placeholder="Email Address" 
                  aria-label="Email Address"
                  className="w-full bg-gray-50 border border-transparent px-16 py-5 rounded-3xl focus:bg-white focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all font-bold"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="relative">
                <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400" size={20} aria-hidden="true" />
                <input 
                  type="password" 
                  placeholder="Password" 
                  aria-label="Password"
                  className="w-full bg-gray-50 border border-transparent px-16 py-5 rounded-3xl focus:bg-white focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all font-bold"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            {error && <p className="text-red-500 text-xs font-bold uppercase tracking-widest text-center" role="alert">{error}</p>}

            <button 
              type="submit" 
              disabled={loading}
              aria-label="Submit login"
              className="w-full bg-blue-600 text-white font-black py-6 rounded-3xl shadow-xl shadow-blue-200 hover:bg-blue-700 transition-all text-xl uppercase tracking-widest active:scale-95 disabled:opacity-50 focus:ring-4 focus:ring-blue-300"
            >
              {loading ? "Authorizing..." : "Enter Portal"}
            </button>
          </form>

          <div className="relative my-12 text-center">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100"></div></div>
            <span className="relative bg-white px-6 text-[10px] font-black text-gray-300 uppercase tracking-[0.3em]">Identity Providers</span>
          </div>

          <button 
            onClick={handleGoogleLogin}
            aria-label="Continue with Google"
            className="w-full bg-white border border-gray-100 text-gray-900 font-bold py-5 rounded-3xl shadow-sm hover:bg-gray-50 transition-all flex items-center justify-center space-x-4 active:scale-95 focus:ring-4 focus:ring-gray-200"
          >
            <Globe size={24} className="text-blue-600" aria-hidden="true" />
            <span className="uppercase tracking-widest text-xs">Continue with Google</span>
          </button>

          <nav className="mt-16 pt-8 border-t border-gray-50 flex flex-col items-center" aria-label="Developer Previews">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6" id="dev-preview-label">Developer Preview</p>
            <div className="flex gap-4 w-full" aria-labelledby="dev-preview-label">
              <button 
                onClick={() => {
                  localStorage.setItem("nexus_demo_uid", "nexus-vip");
                  router.push("/dashboard");
                }}
                aria-label="Preview Dashboard"
                className="flex-1 bg-gray-900 text-white p-4 rounded-2xl flex items-center justify-center space-x-3 hover:bg-black transition-all active:scale-95 focus:ring-4 focus:ring-gray-400"
              >
                <span className="text-[10px] font-black uppercase tracking-widest">Dashboard Preview</span>
                <ArrowRight size={16} aria-hidden="true" />
              </button>
              <button 
                onClick={() => router.push("/manager")}
                aria-label="Preview Manager Portal"
                className="flex-1 bg-gray-50 text-gray-900 border border-gray-100 p-4 rounded-2xl flex items-center justify-center space-x-3 hover:bg-gray-100 transition-all active:scale-95 focus:ring-4 focus:ring-gray-200"
              >
                <span className="text-[10px] font-black uppercase tracking-widest">Manager Preview</span>
                <ArrowRight size={16} aria-hidden="true" />
              </button>
            </div>
          </nav>
        </div>
      </section>
    </main>
  );
}
