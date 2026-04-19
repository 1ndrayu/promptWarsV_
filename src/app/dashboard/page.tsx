"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { doc, onSnapshot, DocumentData } from "firebase/firestore";
import { onAuthStateChanged, User } from "firebase/auth";
import { generateHexCode, encryptQRPayload } from "@/lib/logic";
import QRCode from "react-qr-code";
import { Wifi, Coffee, Mic, Utensils, LayoutDashboard, Settings, User as UserIcon, ShieldCheck, MapPin, Clock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const TIER_THEMES: Record<string, { color: string, glow: string }> = {
  VIP: { color: "#F59E0B", glow: "rgba(245, 158, 11, 0.2)" },
  Lecturer: { color: "#EF4444", glow: "rgba(239, 68, 68, 0.2)" },
  Guest: { color: "#3B82F6", glow: "rgba(59, 130, 246, 0.2)" },
};

const NexusLogo = ({ className = "h-6 w-6" }: { className?: string }) => (
  <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M25 80V20L75 80V20" stroke="currentColor" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<DocumentData | null>(null);
  const [activeTab, setActiveTab] = useState("pass");
  const [previewUid, setPreviewUid] = useState("nexus-vip");

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => setUser(currentUser));
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    const activeUid = user?.uid || localStorage.getItem("nexus_demo_uid") || previewUid;
    const unsubscribeDb = onSnapshot(doc(db, "users", activeUid), (docSnap) => {
      if (docSnap.exists()) setUserData(docSnap.data());
    });
    return () => unsubscribeDb();
  }, [user, previewUid]);

  const activeData = userData || {
    name: "Nexus Attendee",
    tier: "VIP",
    status: "verified",
    entitlements: { wifi: true, lounge: true, backstage: false, premiumDining: true }
  };

  const theme = TIER_THEMES[activeData.tier] || TIER_THEMES.Guest;
  const hexCode = generateHexCode(user?.uid || "demo-user-123");

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row font-sans">
      {/* Sidebar Navigation */}
      <div className="w-full md:w-72 lg:w-80 bg-white border-r border-gray-200 p-8 flex flex-col shrink-0 z-10 shadow-lg md:shadow-none">
        <div className="flex items-center space-x-3 mb-12">
          <div className="h-10 w-10 bg-blue-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-blue-100">
             <NexusLogo />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tighter text-gray-900 leading-none">NEXUS</h1>
            <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-gray-400 mt-1">PORTAL V2.1</p>
          </div>
        </div>

        <nav className="flex flex-row md:flex-col space-x-2 md:space-x-0 md:space-y-3 pb-4 md:pb-0">
          <NavButton active={activeTab === 'pass'} onClick={() => setActiveTab('pass')} icon={<ShieldCheck size={20} />} label="Access Pass" />
          <NavButton active={activeTab === 'resources'} onClick={() => setActiveTab('resources')} icon={<LayoutDashboard size={20} />} label="Resources" />
          <NavButton active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} icon={<Settings size={20} />} label="Settings" />
        </nav>

        {!user && (
          <div className="mt-8 p-4 bg-blue-50 rounded-2xl border border-blue-100">
            <p className="text-[9px] font-black uppercase tracking-widest text-blue-600 mb-4 text-center">Preview Identities</p>
            <div className="grid grid-cols-2 gap-2">
              {["nexus-vip", "nexus-guest", "nexus-lecturer", "nexus-staff"].map(id => (
                <button 
                  key={id}
                  onClick={() => setPreviewUid(id)}
                  className={`py-2 px-1 rounded-xl text-[8px] font-bold uppercase tracking-tighter transition-all ${previewUid === id ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-gray-400 hover:bg-gray-100'}`}
                >
                  {id.split('-')[1]}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mt-auto pt-8 border-t border-gray-100">
          <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
            <div className="h-10 w-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-blue-600 shadow-sm">
              <UserIcon size={20} />
            </div>
            <div className="overflow-hidden">
              <p className="font-bold text-sm truncate">{activeData.name}</p>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mt-1">{activeData.tier}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 p-6 md:p-12 lg:p-16 overflow-y-auto">
        <div className="max-w-5xl mx-auto">
          <AnimatePresence mode="wait">
            {activeTab === "pass" && (
              <motion.div 
                key="pass" 
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }} 
                exit={{ opacity: 0, y: -20 }}
                className="grid grid-cols-1 lg:grid-cols-3 gap-8"
              >
                <div className="lg:col-span-2 bg-white rounded-[48px] p-12 border border-gray-100 shadow-xl flex flex-col items-center">
                  <div className="relative mb-12">
                    <div className="absolute inset-0 blur-3xl opacity-20 animate-pulse" style={{ backgroundColor: theme.color }}></div>
                    <div className="relative bg-white p-6 rounded-[40px] border-8 border-gray-50 shadow-inner">
                      <QRCode 
                        value={encryptQRPayload(user?.uid || "demo", activeData.entitlements)} 
                        size={280}
                        level="H"
                        fgColor="#111827"
                      />
                    </div>
                  </div>
                  <div className="text-center space-y-2">
                    <p className="text-[10px] font-black uppercase tracking-[0.5em] text-gray-300">Identity Token</p>
                    <p className="text-5xl font-mono font-black tracking-[0.2em] uppercase">{hexCode}</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="bg-white rounded-[40px] p-8 border border-gray-100 shadow-md">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 mb-8">Active Entitlements</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <EntitlementCard active={activeData.entitlements?.wifi} icon={<Wifi size={20} />} label="WiFi" />
                      <EntitlementCard active={activeData.entitlements?.lounge} icon={<Coffee size={20} />} label="Lounge" />
                      <EntitlementCard active={activeData.entitlements?.backstage} icon={<Mic size={20} />} label="Stage" />
                      <EntitlementCard active={activeData.entitlements?.premiumDining} icon={<Utensils size={20} />} label="Dining" />
                    </div>
                  </div>

                  <div className="bg-blue-600 rounded-[40px] p-8 text-white shadow-xl shadow-blue-100 relative overflow-hidden group">
                     <div className="absolute -right-8 -top-8 h-32 w-32 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform"></div>
                     <ShieldCheck className="mb-4 text-blue-200" size={32} />
                     <h3 className="text-lg font-bold leading-tight mb-2">Security Verified</h3>
                     <p className="text-xs text-blue-100 leading-relaxed opacity-80">This pass is cryptographic and rotation-synced with the event servers.</p>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === "resources" && (
              <motion.div 
                key="res" 
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }} 
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
                <div className="bg-white rounded-[48px] p-10 border border-gray-100 shadow-xl">
                  <h2 className="text-3xl font-black tracking-tight mb-8">Event Schedule</h2>
                  <div className="space-y-4">
                    <ScheduleItem time="10:00 AM" title="Keynote: Future of Nexus" location="Main Hall" active />
                    <ScheduleItem time="11:30 AM" title="Entitlement Logic Deep Dive" location="Room 402" />
                    <ScheduleItem time="01:00 PM" title="Networking Lunch" location="Executive Lounge" />
                    <ScheduleItem time="02:30 PM" title="Closing Ceremony" location="Main Hall" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <ResourceCard title="Venue Map" icon={<MapPin size={24} />} description="Explore the event floors and zones" />
                  <ResourceCard title="Live Stream" icon={<Clock size={24} />} description="Join remote sessions via high-speed link" />
                </div>
              </motion.div>
            )}

            {activeTab === "settings" && (
              <motion.div 
                key="set" 
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }} 
                exit={{ opacity: 0, y: -20 }}
                className="bg-white rounded-[48px] p-12 border border-gray-100 shadow-xl max-w-2xl"
              >
                <h2 className="text-3xl font-black tracking-tight mb-12">Profile Settings</h2>
                <div className="space-y-6">
                  <SettingRow label="Account Name" value={activeData.name} />
                  <SettingRow label="Email Address" value={activeData.email || "No email linked"} />
                  <SettingRow label="Notification Tier" value={activeData.tier} />
                  
                  <div className="pt-8 flex space-x-4">
                    <button className="flex-1 bg-blue-600 text-white font-bold py-4 rounded-2xl shadow-lg hover:bg-blue-700 transition-all">Save Changes</button>
                    <button onClick={async () => { await auth.signOut(); router.push("/"); }} className="flex-1 bg-red-50 text-red-600 font-bold py-4 rounded-2xl hover:bg-red-100 transition-all">Sign Out</button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

function NavButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={`flex items-center space-x-4 px-6 py-4 rounded-2xl font-bold text-sm transition-all whitespace-nowrap ${active ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' : 'text-gray-500 hover:bg-gray-100'}`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function EntitlementCard({ active, icon, label }: { active: boolean, icon: React.ReactNode, label: string }) {
  return (
    <div className={`p-4 rounded-2xl border-2 flex flex-col items-center justify-center text-center transition-all ${active ? 'bg-white border-blue-100 shadow-sm' : 'bg-gray-50 border-transparent opacity-30 grayscale'}`}>
      <div className={`h-10 w-10 rounded-xl flex items-center justify-center mb-3 ${active ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-400'}`}>
        {icon}
      </div>
      <p className="text-[9px] font-black uppercase tracking-widest leading-tight">{label}</p>
    </div>
  );
}

function ScheduleItem({ time, title, location, active = false }: { time: string, title: string, location: string, active?: boolean }) {
  return (
    <div className={`flex items-center justify-between p-6 rounded-3xl border ${active ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-100'}`}>
      <div className="flex items-center space-x-6">
        <p className="text-sm font-black text-blue-600 w-20">{time}</p>
        <div>
          <p className="font-bold text-gray-900">{title}</p>
          <div className="flex items-center space-x-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">
            <MapPin size={10} />
            <span>{location}</span>
          </div>
        </div>
      </div>
      {active && <span className="bg-blue-600 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest animate-pulse">Live Now</span>}
    </div>
  );
}

function ResourceCard({ title, icon, description }: { title: string, icon: React.ReactNode, description: string }) {
  return (
    <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer group">
       <div className="h-12 w-12 bg-gray-50 rounded-2xl flex items-center justify-center text-blue-600 mb-6 group-hover:bg-blue-600 group-hover:text-white transition-all">
          {icon}
       </div>
       <h4 className="font-bold text-xl mb-2">{title}</h4>
       <p className="text-sm text-gray-400 leading-relaxed">{description}</p>
    </div>
  );
}

function SettingRow({ label, value }: { label: string, value: string }) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">{label}</label>
      <div className="w-full bg-gray-50 p-4 rounded-2xl border border-gray-100 font-bold text-gray-900">{value}</div>
    </div>
  );
}
