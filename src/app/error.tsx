"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { RefreshCw, AlertTriangle } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col items-center justify-center p-6 text-[#1F2937]">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-12 md:p-16 rounded-[56px] border border-red-100 shadow-2xl max-w-xl w-full text-center"
      >
        <div className="h-24 w-24 bg-red-50 text-red-600 rounded-[32px] flex items-center justify-center mx-auto mb-10">
           <AlertTriangle size={48} />
        </div>

        <h1 className="text-4xl font-black tracking-tighter uppercase mb-2">System Breach</h1>
        <p className="text-xs font-bold uppercase tracking-[0.4em] text-red-500 mb-8">Unexpected Exception Detected</p>

        <div className="bg-gray-50 p-6 rounded-3xl text-left mb-12 border border-gray-100 overflow-hidden">
           <p className="text-[10px] font-mono text-gray-400 uppercase tracking-widest mb-2">Error Log</p>
           <p className="text-sm font-bold text-gray-600 truncate">{error.message || "An unhandled exception has occurred in the core protocol."}</p>
        </div>

        <button 
          onClick={() => reset()}
          className="w-full bg-gray-900 text-white font-black py-6 rounded-3xl shadow-xl hover:bg-black transition-all flex items-center justify-center space-x-4 active:scale-95"
        >
           <RefreshCw size={24} />
           <span className="uppercase tracking-widest text-sm">Initiate Reset Protocol</span>
        </button>
      </motion.div>
    </div>
  );
}
