"use client";

import { motion } from "framer-motion";

const NexusLogo = () => (
  <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-20 w-20">
    <path d="M25 80V20L75 80V20" stroke="currentColor" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export default function Loading() {
  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col items-center justify-center p-6 text-[#1F2937]">
      <div className="relative">
        <motion.div 
          animate={{ 
            scale: [1, 1.1, 1],
            opacity: [0.3, 0.6, 0.3]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute inset-0 bg-blue-600 blur-[80px] rounded-full"
        />
        
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="relative text-blue-600"
        >
          <NexusLogo />
        </motion.div>
      </div>

      <div className="mt-16 flex flex-col items-center space-y-4">
        <p className="text-[10px] font-black uppercase tracking-[0.8em] text-gray-400 ml-[0.8em]">Synchronizing</p>
        <div className="h-1 w-48 bg-gray-100 rounded-full overflow-hidden">
           <motion.div 
             animate={{ x: ["-100%", "100%"] }}
             transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
             className="h-full w-1/2 bg-blue-600 rounded-full"
           />
        </div>
      </div>
    </div>
  );
}
