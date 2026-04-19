"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";

const NexusLogo = () => (
  <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-16 w-16">
    <path d="M25 80V20L75 80V20" stroke="currentColor" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col items-center justify-center p-6 text-[#1F2937]">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center"
      >
        <div className="bg-gray-900 text-white p-6 rounded-[40px] shadow-2xl mb-12 inline-block relative overflow-hidden group">
           <div className="absolute inset-0 bg-blue-600 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
           <div className="relative z-10"><NexusLogo /></div>
        </div>
        
        <h1 className="text-8xl font-black tracking-tighter uppercase leading-none mb-4">404</h1>
        <p className="text-xs font-bold uppercase tracking-[0.6em] text-blue-600 mb-8">Path Obfuscated</p>
        
        <p className="text-gray-400 font-medium max-w-xs mx-auto mb-12">
          The requested identity node does not exist within the Nexus directory.
        </p>

        <Link href="/">
          <button className="bg-white border border-gray-100 text-gray-900 font-bold px-12 py-5 rounded-[24px] shadow-md hover:shadow-xl transition-all active:scale-95 flex items-center space-x-4 mx-auto">
             <ArrowLeft size={20} />
             <span className="uppercase tracking-widest text-xs">Return to Gateway</span>
          </button>
        </Link>
      </motion.div>
      
      <div className="mt-24 h-1 w-12 bg-gray-200 rounded-full opacity-50"></div>
    </div>
  );
}
