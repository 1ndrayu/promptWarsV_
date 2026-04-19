"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { doc, onSnapshot, DocumentData } from "firebase/firestore";
import { onAuthStateChanged, User } from "firebase/auth";
import { generateHexCode, encryptQRPayload } from "@/lib/logic";
import QRCode from "react-qr-code";
import { Wifi, Coffee, Mic, Utensils, LayoutDashboard, Settings, User as UserIcon, ShieldCheck, MapPin, Clock } from "lucide-react";

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

  const hexCode = generateHexCode(user?.uid || "demo-user-123");

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row font-sans">
      {/* Sidebar Navigation */}
      <div className="w-full md:w-64 lg:w-72 bg-white border-r border-gray-200 p-6 flex flex-col shrink-0 z-10 shadow-sm md:shadow-none">
        <div className="flex items-center space-x-3 mb-10">
          <div className="h-10 w-10 bg-blue-600 text-white rounded-xl flex items-center justify-center">
             <NexusLogo />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-gray-900 leading-none">NEXUS</h1>
            <p className="text-xs font-medium text-gray-500 mt-1">Portal V2.1</p>
          </div>
        </div>

        <nav className="flex flex-row md:flex-col space-x-2 md:space-x-0 md:space-y-3 pb-4 md:pb-0">
          <NavButton active={activeTab === 'pass'} onClick={() => setActiveTab('pass')} icon={<ShieldCheck size={20} />} label="Access Pass" />
          <NavButton active={activeTab === 'resources'} onClick={() => setActiveTab('resources')} icon={<LayoutDashboard size={20} />} label="Resources" />
          <NavButton active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} icon={<Settings size={20} />} label="Settings" />
        </nav>

        {!user && (
          <div className="mt-8 p-4 bg-gray-50 rounded-xl border border-gray-200">
            <p className="text-xs font-medium text-gray-500 mb-3 text-center">Preview Identities</p>
            <div className="grid grid-cols-2 gap-2">
              {["nexus-vip", "nexus-guest", "nexus-lecturer", "nexus-staff"].map(id => (
                <button 
                  key={id}
                  onClick={() => setPreviewUid(id)}
                  className={`py-2 px-1 rounded-md text-xs font-medium transition-colors ${previewUid === id ? 'bg-blue-600 text-white shadow-sm' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}
                >
                  {id.split('-')[1]}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mt-auto pt-6 border-t border-gray-200">
          <div className="flex items-center space-x-3 p-3 bg-white rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors">
            <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
              <UserIcon size={20} />
            </div>
            <div className="overflow-hidden">
              <p className="font-medium text-sm text-gray-900 truncate">{activeData.name}</p>
              <p className="text-xs text-gray-500 mt-0.5">{activeData.tier}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          <div>
            {activeTab === "pass" && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white rounded-2xl p-10 border border-gray-200 shadow-sm flex flex-col items-center">
                  <div className="relative mb-8">
                    <div className="relative bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                      <QRCode 
                        value={encryptQRPayload(user?.uid || "demo", activeData.entitlements)} 
                        size={240}
                        level="H"
                        fgColor="#1f2937"
                      />
                    </div>
                  </div>
                  <div className="text-center space-y-1">
                    <p className="text-xs font-medium text-gray-500 uppercase">Identity Token</p>
                    <p className="text-3xl font-mono font-medium text-gray-900">{hexCode}</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
                    <h3 className="text-sm font-medium text-gray-700 mb-4">Active Entitlements</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <EntitlementCard active={activeData.entitlements?.wifi} icon={<Wifi size={18} />} label="WiFi" />
                      <EntitlementCard active={activeData.entitlements?.lounge} icon={<Coffee size={18} />} label="Lounge" />
                      <EntitlementCard active={activeData.entitlements?.backstage} icon={<Mic size={18} />} label="Stage" />
                      <EntitlementCard active={activeData.entitlements?.premiumDining} icon={<Utensils size={18} />} label="Dining" />
                    </div>
                  </div>

                  <div className="bg-blue-600 rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
                     <ShieldCheck className="mb-3 text-blue-200" size={28} />
                     <h3 className="text-base font-semibold mb-1">Security Verified</h3>
                     <p className="text-sm text-blue-100">Pass is cryptographic and rotation-synced.</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "resources" && (
              <div className="space-y-6">
                <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm">
                  <h2 className="text-2xl font-semibold text-gray-900 mb-6">Event Schedule</h2>
                  <div className="space-y-3">
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
              </div>
            )}

            {activeTab === "settings" && (
              <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm max-w-2xl">
                <h2 className="text-2xl font-semibold text-gray-900 mb-8">Profile Settings</h2>
                <div className="space-y-6">
                  <SettingRow label="Account Name" value={activeData.name} />
                  <SettingRow label="Email Address" value={activeData.email || "No email linked"} />
                  <SettingRow label="Notification Tier" value={activeData.tier} />
                  
                  <div className="pt-6 flex space-x-4">
                    <button className="flex-1 bg-blue-600 text-white font-medium py-3 rounded-xl hover:bg-blue-700 transition-colors">Save Changes</button>
                    <button onClick={async () => { await auth.signOut(); router.push("/"); }} className="flex-1 bg-white border border-gray-300 text-gray-700 font-medium py-3 rounded-xl hover:bg-gray-50 transition-colors">Sign Out</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function NavButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={`flex items-center space-x-3 px-4 py-3 rounded-xl font-medium text-sm transition-colors whitespace-nowrap ${active ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function EntitlementCard({ active, icon, label }: { active: boolean, icon: React.ReactNode, label: string }) {
  return (
    <div className={`p-3 rounded-xl border flex flex-col items-center justify-center text-center transition-colors ${active ? 'bg-white border-gray-200 text-gray-900' : 'bg-gray-50 border-gray-100 text-gray-400 grayscale opacity-60'}`}>
      <div className={`h-8 w-8 rounded-lg flex items-center justify-center mb-2 ${active ? 'bg-blue-50 text-blue-600' : 'bg-gray-200 text-gray-500'}`}>
        {icon}
      </div>
      <p className="text-xs font-medium">{label}</p>
    </div>
  );
}

function ScheduleItem({ time, title, location, active = false }: { time: string, title: string, location: string, active?: boolean }) {
  return (
    <div className={`flex items-center justify-between p-4 rounded-xl border ${active ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200 hover:bg-gray-50'}`}>
      <div className="flex items-center space-x-4">
        <p className="text-sm font-medium text-blue-700 w-20">{time}</p>
        <div>
          <p className="text-sm font-medium text-gray-900">{title}</p>
          <div className="flex items-center space-x-1 text-xs text-gray-500 mt-1">
            <MapPin size={12} />
            <span>{location}</span>
          </div>
        </div>
      </div>
      {active && <span className="bg-blue-100 text-blue-700 text-xs font-medium px-2 py-1 rounded-md">Live</span>}
    </div>
  );
}

function ResourceCard({ title, icon, description }: { title: string, icon: React.ReactNode, description: string }) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
       <div className="h-10 w-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 mb-4">
          {icon}
       </div>
       <h4 className="font-medium text-gray-900 mb-1">{title}</h4>
       <p className="text-sm text-gray-500">{description}</p>
    </div>
  );
}

function SettingRow({ label, value }: { label: string, value: string }) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-gray-500">{label}</label>
      <div className="w-full bg-white px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-900">{value}</div>
    </div>
  );
}
