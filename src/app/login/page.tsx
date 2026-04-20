"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth, googleProvider } from "@/lib/firebase";
import { signInWithEmailAndPassword, signInWithPopup, onAuthStateChanged } from "firebase/auth";
import { ShieldCheck, Mail, Lock, Globe, ArrowRight, Shield } from "lucide-react";

const NexusLogo = ({ className = "h-8 w-8" }: { className?: string }) => (
  <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M25 80V20L75 80V20" stroke="currentColor" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

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
    <main className="min-h-screen bg-white flex items-center justify-center p-6 font-sans relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] bg-blue-50 rounded-full blur-[120px] opacity-50"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-50 rounded-full blur-[100px] opacity-40"></div>

      <section className="w-full max-w-lg bg-white rounded-[2.5rem] p-12 border border-gray-100 shadow-2xl relative z-10 animate-in fade-in zoom-in-95 duration-700">
        <header className="flex flex-col items-center mb-12">
          <div className="h-16 w-16 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-xl shadow-blue-100 mb-6 group hover:scale-105 transition-transform">
             <NexusLogo className="h-8 w-8" />
          </div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tighter uppercase">Nexus</h1>
          <p className="text-xs font-bold text-blue-600 uppercase tracking-[0.2em] mt-2">Modular Registry Access</p>
        </header>

        <form onSubmit={handleEmailLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Email Address</label>
            <div className="relative group">
              <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600 transition-colors" size={18} />
              <input 
                type="email" 
                placeholder="identity@nexus.io" 
                className="w-full bg-gray-50 border border-gray-100 px-14 py-4 rounded-2xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 outline-none transition-all text-gray-900 font-medium"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Passphrase</label>
            <div className="relative group">
              <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600 transition-colors" size={18} />
              <input 
                type="password" 
                placeholder="••••••••" 
                className="w-full bg-gray-50 border border-gray-100 px-14 py-4 rounded-2xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 outline-none transition-all text-gray-900 font-medium"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-100 p-4 rounded-xl flex items-center space-x-3 text-red-600 animate-in shake-in">
               <Shield className="shrink-0" size={18} />
               <p className="text-xs font-bold uppercase tracking-tight">{error}</p>
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-gray-900 text-white font-bold py-4 rounded-2xl hover:bg-blue-600 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center space-x-3 shadow-xl hover:shadow-blue-200"
          >
            <span className="uppercase tracking-widest text-sm">{loading ? "Authenticating..." : "Establish Link"}</span>
            <ArrowRight size={18} />
          </button>
        </form>

        <div className="relative my-10 text-center">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100"></div></div>
          <span className="relative bg-white px-6 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Protocol Sync</span>
        </div>

        <button 
          onClick={handleGoogleLogin}
          className="w-full bg-white border border-gray-200 text-gray-900 font-bold py-4 rounded-2xl hover:border-blue-400 hover:bg-blue-50/30 transition-all flex items-center justify-center space-x-3"
        >
          <Globe size={18} className="text-blue-600" />
          <span className="uppercase tracking-widest text-xs">Continue with Global ID</span>
        </button>

        <footer className="mt-10 text-center">
           <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-relaxed">
             Nexus Protocol // End-to-End Encryption Enabled<br/>
             Authorized Personnel Only
           </p>
        </footer>
      </section>
    </main>
  );
}
