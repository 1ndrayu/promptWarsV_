"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { User, Shield, ArrowRight, Globe } from "lucide-react";

const NexusLogo = ({ className = "h-12 w-12" }: { className?: string }) => (
  <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M25 80V20L75 80V20" stroke="currentColor" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export default function Home() {
  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col items-center justify-center p-6 text-[#1F2937] overflow-hidden relative">
      {/* Dynamic Background Auras */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            x: [0, 50, 0],
            y: [0, 30, 0]
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] bg-blue-50 rounded-full blur-[120px] opacity-60"
        />
        <motion.div 
          animate={{ 
            scale: [1, 1.3, 1],
            x: [0, -40, 0],
            y: [0, -50, 0]
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute -bottom-[20%] -right-[10%] w-[50%] h-[50%] bg-blue-100 rounded-full blur-[100px] opacity-40"
        />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-16 relative z-10"
      >
        <motion.div 
          whileHover={{ scale: 1.05, rotate: [0, -5, 5, 0] }}
          className="bg-gray-900 text-white p-6 rounded-[40px] shadow-2xl mb-12 inline-block cursor-pointer group"
        >
           <NexusLogo className="h-16 w-16 group-hover:text-blue-400 transition-colors" />
        </motion.div>
        
        <div className="flex flex-col items-center space-y-4">
          <div className="bg-white/50 backdrop-blur-sm border border-gray-200 px-6 py-2 rounded-full flex items-center space-x-3 shadow-sm">
             <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
             <span className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-500">Global Registry Online</span>
          </div>
          
          <h1 className="text-8xl md:text-9xl font-black tracking-tighter uppercase leading-none text-transparent bg-clip-text bg-gradient-to-b from-gray-900 to-gray-600">
            Nexus
          </h1>
          
          <p className="text-lg font-medium text-gray-400 max-w-md mx-auto leading-relaxed">
            Identity verification and entitlement synchronization for high-density environments.
          </p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-5xl relative z-10">
        <PortalCard 
          title="Participant" 
          description="Access pass, resources and live schedule" 
          icon={<User size={32} />}
          href="/dashboard"
          theme="light"
        />
        <PortalCard 
          title="Manager" 
          description="Universal command and identity control" 
          icon={<Shield size={32} />}
          href="/manager"
          theme="dark"
        />
      </div>

      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="mt-20 flex flex-col items-center relative z-10"
      >
        <Link href="/login">
          <button className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 hover:text-blue-600 transition-colors flex items-center space-x-3">
             <Globe size={14} />
             <span>Secure Access Login</span>
          </button>
        </Link>
        <div className="h-1 w-12 bg-gray-200 rounded-full mt-6 opacity-30"></div>
      </motion.div>
    </div>
  );
}

function PortalCard({ title, description, icon, href, theme }: { title: string, description: string, icon: React.ReactNode, href: string, theme: 'light' | 'dark' }) {
  return (
    <Link href={href}>
      <motion.div 
        whileHover={{ y: -12, scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={`group p-12 rounded-[56px] border h-full flex flex-col items-start justify-between transition-all cursor-pointer relative overflow-hidden ${theme === 'dark' ? 'bg-gray-900 border-gray-800 text-white shadow-2xl' : 'bg-white border-gray-100 text-gray-900 shadow-xl'}`}
      >
        {/* Card Aura */}
        <div className={`absolute -right-20 -bottom-20 h-64 w-64 rounded-full blur-[80px] opacity-20 transition-transform group-hover:scale-150 ${theme === 'dark' ? 'bg-blue-600' : 'bg-blue-400'}`}></div>

        <div className={`h-20 w-20 rounded-[32px] flex items-center justify-center mb-16 shadow-lg transition-transform group-hover:scale-110 ${theme === 'dark' ? 'bg-white/10 text-white' : 'bg-blue-600 text-white shadow-blue-100'}`}>
          {icon}
        </div>
        
        <div className="relative z-10">
          <h2 className="text-4xl font-black uppercase tracking-tight mb-4 leading-none">{title}</h2>
          <p className={`text-sm font-medium leading-relaxed mb-12 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
            {description}
          </p>
        </div>

        <div className={`flex items-center space-x-3 font-black uppercase tracking-[0.2em] text-[10px] group-hover:translate-x-3 transition-transform ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}>
          <span>Establish Connection</span>
          <ArrowRight size={14} />
        </div>
      </motion.div>
    </Link>
  );
}
