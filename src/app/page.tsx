"use client";

import Link from "next/link";
import { User, Shield, ArrowRight, Globe, Layers, Zap, ShieldCheck, Box } from "lucide-react";

const NexusLogo = ({ className = "h-8 w-8" }: { className?: string }) => (
  <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M25 80V20L75 80V20" stroke="currentColor" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export default function Home() {
  return (
    <main className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-gray-900 font-sans selection:bg-blue-100 overflow-hidden relative">
      {/* Abstract Background Decor */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-50 rounded-full blur-[120px] opacity-60"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-50 rounded-full blur-[120px] opacity-60"></div>

      <header className="text-center mb-16 relative z-10 flex flex-col items-center animate-in fade-in slide-in-from-top-8 duration-1000">
        <div className="bg-blue-600 text-white p-5 rounded-[2rem] shadow-2xl shadow-blue-200 mb-10 inline-block relative group transition-transform hover:scale-105">
           <NexusLogo className="h-12 w-12" />
           <div className="absolute -inset-1 bg-blue-600 rounded-[2rem] blur opacity-20 group-hover:opacity-40 transition-opacity"></div>
        </div>
        
        <div className="flex flex-col items-center space-y-4">
          <div className="bg-gray-900 text-white px-5 py-2 rounded-full flex items-center space-x-3 shadow-xl border border-white/10">
             <div className="h-2 w-2 bg-blue-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(96,165,250,0.8)]"></div>
             <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Nexus Protocol v3.0 // Modular Registry</span>
          </div>
          
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-gray-900 leading-[0.9]">
            Nexus
          </h1>
          
          <p className="text-lg text-gray-500 max-w-lg mx-auto font-medium leading-relaxed">
            The next-generation modular identity engine for dynamic environments, entitlement syncing, and cryptographic access.
          </p>
        </div>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-5xl relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
        <PortalCard 
          title="Participant Portal" 
          description="Access your secure passes, real-time entitlements, and dynamic event resources across any registered environment." 
          icon={<User size={32} />}
          href="/dashboard"
          theme="blue"
        />
        <PortalCard 
          title="Manager Command" 
          description="Total freedom to create events, manage granular access tiers, and verify identities with the Nexus Lens scanner." 
          icon={<Shield size={32} />}
          href="/manager"
          theme="dark"
        />
      </section>

      <footer className="mt-20 flex flex-col items-center space-y-8 relative z-10 animate-in fade-in duration-1000 delay-500">
        <div className="flex items-center space-x-8 opacity-40 grayscale hover:grayscale-0 transition-all duration-700">
          <div className="flex items-center space-x-2 font-bold text-sm tracking-widest"><Layers size={18} /><span>MODULAR</span></div>
          <div className="flex items-center space-x-2 font-bold text-sm tracking-widest"><Zap size={18} /><span>INSTANT</span></div>
          <div className="flex items-center space-x-2 font-bold text-sm tracking-widest"><ShieldCheck size={18} /><span>SECURE</span></div>
        </div>

        <Link href="/login">
          <button className="group relative bg-white border border-gray-200 px-8 py-4 rounded-2xl flex items-center space-x-3 hover:border-blue-400 transition-all shadow-sm hover:shadow-xl hover:shadow-blue-50">
             <div className="bg-blue-50 text-blue-600 p-2 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <Globe size={20} />
             </div>
             <span className="text-sm font-bold text-gray-900 uppercase tracking-widest">Establish Secure Connection</span>
          </button>
        </Link>
      </footer>

      {/* Decorative Floating Elements */}
      <div className="absolute top-20 right-20 animate-bounce duration-[4000ms] opacity-10">
         <Box size={80} className="text-blue-600" />
      </div>
      <div className="absolute bottom-20 left-20 animate-bounce duration-[3000ms] opacity-10">
         <Box size={60} className="text-purple-600" />
      </div>
    </main>
  );
}

function PortalCard({ title, description, icon, href, theme }: { title: string, description: string, icon: React.ReactNode, href: string, theme: 'blue' | 'dark' }) {
  return (
    <Link href={href} className="block group h-full">
      <div className={`relative p-10 rounded-[2.5rem] border transition-all duration-500 h-full flex flex-col ${
        theme === 'blue' 
        ? 'bg-blue-50/50 border-blue-100 hover:border-blue-300 hover:bg-white hover:shadow-2xl hover:shadow-blue-100' 
        : 'bg-gray-50 border-gray-100 hover:border-gray-900 hover:bg-gray-900 hover:text-white hover:shadow-2xl hover:shadow-gray-200'
      }`}>
        <div className={`h-16 w-16 rounded-2xl flex items-center justify-center mb-10 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3 ${
          theme === 'blue' ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-gray-900 text-white shadow-lg group-hover:bg-blue-600'
        }`}>
          {icon}
        </div>
        
        <div className="flex-1">
          <h2 className="text-3xl font-bold mb-4 tracking-tight">{title}</h2>
          <p className={`text-base mb-10 leading-relaxed font-medium ${theme === 'blue' ? 'text-gray-500' : 'text-gray-500 group-hover:text-gray-400'}`}>
            {description}
          </p>
        </div>

        <div className={`flex items-center space-x-3 text-sm font-bold uppercase tracking-widest transition-all duration-300 group-hover:translate-x-3 ${
          theme === 'blue' ? 'text-blue-600' : 'text-gray-900 group-hover:text-blue-400'
        }`}>
          <span>Establish Link</span>
          <ArrowRight size={20} />
        </div>

        {/* Inner Decor */}
        <div className="absolute bottom-6 right-8 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity pointer-events-none">
           <NexusLogo className="h-32 w-32" />
        </div>
      </div>
    </Link>
  );
}
