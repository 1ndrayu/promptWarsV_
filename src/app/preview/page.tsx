"use client";

import { useState } from "react";
import { Wifi, Coffee, Mic, Utensils, Shield, Camera, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import QRCode from "react-qr-code";

export default function PreviewPage() {
  const [view, setView] = useState<"participant" | "manager">("participant");
  
  return (
    <div className="min-h-screen bg-white text-black p-4 md:p-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-12 border-b-4 border-black pb-8">
        <div>
          <h1 className="text-6xl font-black uppercase tracking-tighter">Nexus</h1>
          <p className="font-bold uppercase tracking-[0.4em] text-gray-400 text-xs">Developer Preview Mode</p>
        </div>
        
        <div className="flex space-x-4 mt-8 md:mt-0">
          <button 
            onClick={() => setView("participant")}
            className={`px-6 py-3 font-bold uppercase tracking-widest border-4 border-black transition-all ${view === 'participant' ? 'bg-black text-white shadow-none translate-x-1 translate-y-1' : 'bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]'}`}
          >
            Participant View
          </button>
          <button 
            onClick={() => setView("manager")}
            className={`px-6 py-3 font-bold uppercase tracking-widest border-4 border-black transition-all ${view === 'manager' ? 'bg-black text-white shadow-none translate-x-1 translate-y-1' : 'bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]'}`}
          >
            Manager View
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {view === "participant" ? (
          <motion.div 
            key="p"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="flex flex-col items-center"
          >
            <div className="w-full max-w-2xl bg-white border-4 border-black p-12 shadow-[16px_16px_0px_0px_rgba(0,0,0,1)]">
              <h2 className="text-sm font-bold tracking-[0.3em] uppercase mb-12 border-b-4 border-black pb-2 w-full text-center">Your Access Pass</h2>
              <div className="flex flex-col items-center">
                <div className="border-8 border-black p-4 mb-8 bg-white">
                  <QRCode value="DEMO_PAYLOAD" size={200} />
                </div>
                <p className="text-4xl font-mono font-black tracking-[0.5em] mb-12 uppercase">NEXUS-7X9B</p>
                <div className="w-full">
                  <h3 className="text-sm font-bold tracking-[0.2em] uppercase mb-6 border-b-2 border-black pb-2 text-left">Active Entitlements</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <MockIcon icon={<Wifi size={24} />} label="WiFi" active />
                    <MockIcon icon={<Coffee size={24} />} label="Lounge" active />
                    <MockIcon icon={<Mic size={24} />} label="Backstage" />
                    <MockIcon icon={<Utensils size={24} />} label="Dining" />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="m"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-8"
          >
            {/* Scanner Mock */}
            <div className="lg:col-span-1 border-4 border-black p-8 bg-black text-white shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
              <div className="flex items-center space-x-3 mb-8">
                <Camera size={24} />
                <h3 className="text-xl font-black uppercase tracking-widest">Scanner Active</h3>
              </div>
              <div className="aspect-square bg-gray-900 border-2 border-dashed border-gray-600 flex items-center justify-center relative overflow-hidden mb-8">
                 <div className="absolute inset-0 bg-green-500 opacity-10 animate-pulse"></div>
                 <p className="text-xs font-bold uppercase tracking-widest text-gray-500 z-10">Camera Stream Active</p>
                 <div className="absolute h-[2px] w-full bg-green-500 shadow-[0_0_15px_green] top-1/2 animate-bounce"></div>
              </div>
              <div className="bg-green-600 p-4 border-2 border-white flex items-center space-x-4">
                <Check size={32} />
                <div>
                  <p className="font-black uppercase text-xs">Access Granted</p>
                  <p className="font-bold text-[10px] opacity-80">Indrayu - Guest Tier</p>
                </div>
              </div>
            </div>

            {/* Directory Mock */}
            <div className="lg:col-span-2 border-4 border-black p-8 bg-white shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
              <h3 className="text-2xl font-black uppercase tracking-tighter mb-8 border-b-4 border-black pb-4">Attendee Directory</h3>
              <div className="space-y-4">
                <MockAttendee name="Alex Johnson" tier="VIP" status="Verified" />
                <MockAttendee name="Sarah Parker" tier="Guest" status="Verified" active />
                <MockAttendee name="James Miller" tier="Staff" status="Pending" />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function MockIcon({ icon, label, active = false }: { icon: React.ReactNode, label: string, active?: boolean }) {
  return (
    <div className={`flex flex-col items-center justify-center p-4 border-2 border-black transition-all ${active ? 'bg-black text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]' : 'bg-gray-50 text-gray-300'}`}>
      {icon}
      <span className="mt-2 text-[8px] font-bold uppercase tracking-widest">{label}</span>
    </div>
  );
}

function MockAttendee({ name, tier, status, active = false }: { name: string, tier: string, status: string, active?: boolean }) {
  return (
    <div className={`flex items-center justify-between p-6 border-4 border-black transition-all ${active ? 'bg-black text-white translate-x-1' : 'bg-white hover:bg-gray-50'}`}>
      <div className="flex items-center space-x-4">
        <div className="h-10 w-10 bg-gray-200 border-2 border-black"></div>
        <div>
          <p className="font-black uppercase tracking-tight">{name}</p>
          <p className="text-[10px] font-bold tracking-widest opacity-60">{tier}</p>
        </div>
      </div>
      <div className="flex items-center space-x-4">
        <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 border-2 border-black ${status === 'Verified' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
          {status}
        </span>
        <div className="h-8 w-8 border-2 border-black flex items-center justify-center">
          <Shield size={16} />
        </div>
      </div>
    </div>
  );
}
