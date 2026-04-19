"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth, googleProvider } from "@/lib/firebase";
import { signInWithEmailAndPassword, signInWithPopup, onAuthStateChanged } from "firebase/auth";
import { ShieldCheck, Mail, Lock, Globe } from "lucide-react";

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
      <section className="w-full max-w-md bg-white rounded-2xl p-10 border border-gray-200 shadow-sm relative overflow-hidden">
        
        <div className="relative z-10">
          <header className="flex flex-col items-center mb-8">
            <div className="h-12 w-12 bg-blue-600 rounded-xl flex items-center justify-center text-white mb-4" aria-hidden="true">
               <ShieldCheck size={24} />
            </div>
            <h1 className="text-2xl font-medium text-gray-900 leading-none">NEXUS</h1>
            <p className="text-sm font-medium text-gray-500 mt-2">Secure Gateway</p>
          </header>

          <h2 className="text-xl font-medium text-gray-800 mb-6 text-center" id="login-heading">Sign in</h2>

          <form onSubmit={handleEmailLogin} className="space-y-4" aria-labelledby="login-heading">
            <div className="space-y-2">
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} aria-hidden="true" />
                <input 
                  type="email" 
                  placeholder="Email Address" 
                  aria-label="Email Address"
                  className="w-full bg-white border border-gray-300 px-12 py-3 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all text-gray-900"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} aria-hidden="true" />
                <input 
                  type="password" 
                  placeholder="Password" 
                  aria-label="Password"
                  className="w-full bg-white border border-gray-300 px-12 py-3 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all text-gray-900"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            {error && <p className="text-red-500 text-sm font-medium text-center" role="alert">{error}</p>}

            <button 
              type="submit" 
              disabled={loading}
              aria-label="Submit login"
              className="w-full bg-blue-600 text-white font-medium py-3 rounded-md hover:bg-blue-700 transition-colors active:bg-blue-800 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {loading ? "Authorizing..." : "Next"}
            </button>
          </form>

          <div className="relative my-8 text-center">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200"></div></div>
            <span className="relative bg-white px-4 text-sm font-medium text-gray-500">or</span>
          </div>

          <button 
            onClick={handleGoogleLogin}
            aria-label="Continue with Google"
            className="w-full bg-white border border-gray-300 text-gray-700 font-medium py-3 rounded-md hover:bg-gray-50 transition-colors flex items-center justify-center space-x-3 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-200"
          >
            <Globe size={20} className="text-blue-600" aria-hidden="true" />
            <span>Continue with Google</span>
          </button>

          <nav className="mt-8 pt-6 border-t border-gray-100 flex flex-col items-center" aria-label="Developer Previews">
            <p className="text-xs font-medium text-gray-500 mb-4" id="dev-preview-label">Developer Preview</p>
            <div className="flex gap-3 w-full" aria-labelledby="dev-preview-label">
              <button 
                onClick={() => {
                  localStorage.setItem("nexus_demo_uid", "nexus-vip");
                  router.push("/dashboard");
                }}
                aria-label="Preview Dashboard"
                className="flex-1 bg-gray-100 text-gray-700 p-3 rounded-md flex items-center justify-center space-x-2 hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300"
              >
                <span className="text-xs font-medium">Dashboard</span>
              </button>
              <button 
                onClick={() => router.push("/manager")}
                aria-label="Preview Manager Portal"
                className="flex-1 bg-gray-100 text-gray-700 p-3 rounded-md flex items-center justify-center space-x-2 hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300"
              >
                <span className="text-xs font-medium">Manager</span>
              </button>
            </div>
          </nav>
        </div>
      </section>
    </main>
  );
}
