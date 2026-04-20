"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { doc, onSnapshot, DocumentData, getDoc } from "firebase/firestore";
import { onAuthStateChanged, User } from "firebase/auth";
import { generateHexCode, encryptQRPayload } from "@/lib/logic";
import QRCode from "react-qr-code";
import { 
  Wifi, Coffee, Mic, Utensils, LayoutDashboard, Settings, 
  User as UserIcon, ShieldCheck, MapPin, Clock, Calendar, 
  ChevronRight, Box, CreditCard, Sparkles, AlertCircle
} from "lucide-react";

const NexusLogo = ({ className = "h-6 w-6" }: { className?: string }) => (
  <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M25 80V20L75 80V20" stroke="currentColor" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<DocumentData | null>(null);
  const [activeEventId, setActiveEventId] = useState<string | null>(null);
  const [activeEventData, setActiveEventData] = useState<DocumentData | null>(null);
  const [activeTab, setActiveTab] = useState("pass");

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        // In production redirect to login
      }
    });
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!user) return;
    const unsubscribeDb = onSnapshot(doc(db, "users", user.uid), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setUserData(data);
        // Default to first event if none selected
        if (!activeEventId && data.registrations) {
          const firstEventId = Object.keys(data.registrations)[0];
          if (firstEventId) setActiveEventId(firstEventId);
        }
      }
    });
    return () => unsubscribeDb();
  }, [user]);

  useEffect(() => {
    if (!activeEventId) return;
    const fetchEvent = async () => {
      const eventSnap = await getDoc(doc(db, "events", activeEventId));
      if (eventSnap.exists()) {
        setActiveEventData(eventSnap.data());
      }
    };
    fetchEvent();
  }, [activeEventId]);

  const activeRegistration = userData?.registrations?.[activeEventId || ""] || null;
  const hexCode = generateHexCode(user?.uid || "demo-user-123");

  const eventList = userData?.registrations ? Object.keys(userData.registrations) : [];

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-blue-600 text-white p-4 rounded-xl shadow-md mb-8">
           <NexusLogo className="h-10 w-10" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Participant Access Required</h1>
        <p className="text-gray-500 mb-8 max-w-sm">Please sign in to access your event passes and resources.</p>
        <button onClick={() => router.push("/login")} className="bg-blue-600 text-white font-medium px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors">
          Go to Login
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row font-sans">
      {/* Sidebar Navigation */}
      <div className="w-full md:w-72 lg:w-80 bg-white border-r border-gray-200 p-6 flex flex-col shrink-0 z-10 shadow-sm md:shadow-none">
        <div className="flex items-center space-x-3 mb-10">
          <div className="h-10 w-10 bg-blue-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-blue-100">
             <NexusLogo />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 leading-none tracking-tight">NEXUS</h1>
            <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mt-1">Universal Portal</p>
          </div>
        </div>

        <nav className="flex flex-row md:flex-col space-x-2 md:space-x-0 md:space-y-2 pb-4 md:pb-0 overflow-x-auto no-scrollbar">
          <NavButton active={activeTab === 'pass'} onClick={() => setActiveTab('pass')} icon={<CreditCard size={18} />} label="Access Pass" />
          <NavButton active={activeTab === 'events'} onClick={() => setActiveTab('events')} icon={<Calendar size={18} />} label="My Events" />
          <NavButton active={activeTab === 'resources'} onClick={() => setActiveTab('resources')} icon={<LayoutDashboard size={18} />} label="Resources" />
          <NavButton active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} icon={<Settings size={18} />} label="Settings" />
        </nav>

        <div className="mt-8 hidden md:block">
           <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4 px-2">Active Environment</h2>
           <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-4">
              {activeEventData ? (
                <div>
                   <p className="font-bold text-gray-900 text-sm truncate">{activeEventData.name}</p>
                   <p className="text-xs text-blue-600 font-medium mt-1 uppercase tracking-wider">{activeRegistration?.tier || "Attendee"}</p>
                </div>
              ) : (
                <p className="text-xs text-gray-400 italic">No event selected</p>
              )}
           </div>
        </div>

        <div className="mt-auto pt-6 border-t border-gray-100">
          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-2xl border border-transparent hover:border-gray-200 transition-all cursor-pointer">
            <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center text-blue-600 shadow-sm border border-gray-100">
              <UserIcon size={20} />
            </div>
            <div className="overflow-hidden">
              <p className="font-bold text-sm text-gray-900 truncate">{userData?.name || "Participant"}</p>
              <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wider mt-0.5">{userData?.email || user.email}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 p-6 md:p-10 lg:p-16 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          {activeTab === "pass" && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="mb-10">
                <h1 className="text-4xl font-bold text-gray-900 mb-2">Your Access Pass</h1>
                <p className="text-gray-500">Scan this code at checkpoints to verify your identity and entitlements.</p>
              </div>

              {activeRegistration ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                  <div className="lg:col-span-2 space-y-8">
                    <div className="bg-white rounded-[2.5rem] p-12 border border-gray-200 shadow-2xl shadow-gray-200/50 flex flex-col items-center relative overflow-hidden group">
                      <div className="absolute top-0 left-0 w-full h-2 bg-blue-600" />
                      
                      <div className="relative mb-10 p-6 bg-white rounded-3xl border border-gray-100 shadow-sm group-hover:scale-[1.02] transition-transform duration-500">
                        <QRCode 
                          value={encryptQRPayload(user.uid, activeRegistration.entitlements, activeEventId!)} 
                          size={280}
                          level="H"
                          fgColor="#0f172a"
                        />
                      </div>
                      
                      <div className="text-center">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-3">Identity Signature</p>
                        <p className="text-4xl font-mono font-bold text-gray-900 tracking-tighter">{hexCode}</p>
                        <div className="flex items-center justify-center space-x-2 mt-4 text-green-600 bg-green-50 px-4 py-1.5 rounded-full">
                           <ShieldCheck size={16} />
                           <span className="text-xs font-bold uppercase tracking-wider">Live & Authenticated</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
                      <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6">Environment Access</h3>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {Object.entries(activeRegistration.entitlements).map(([key, active]) => (
                          <EntitlementCard key={key} active={active as boolean} label={key} />
                        ))}
                      </div>
                      {Object.keys(activeRegistration.entitlements).length === 0 && (
                        <p className="text-sm text-gray-400 italic text-center py-4">No entitlements configured for this event.</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="bg-gray-900 rounded-[2rem] p-8 text-white shadow-xl relative overflow-hidden">
                       <Sparkles className="absolute top-4 right-4 text-blue-400 opacity-50" size={32} />
                       <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-2">Access Level</p>
                       <h3 className="text-2xl font-bold mb-4">{activeRegistration.tier}</h3>
                       <p className="text-sm text-gray-400 leading-relaxed">Your tier grants you specific access zones within the {activeEventData?.name || "event"} area.</p>
                       <div className="mt-8 flex items-center space-x-3 text-xs font-bold text-white bg-white/10 w-fit px-4 py-2 rounded-full border border-white/10">
                          <Box size={14} />
                          <span>NFT TICKET LINKED</span>
                       </div>
                    </div>

                    <div className="bg-blue-600 rounded-[2rem] p-8 text-white shadow-xl">
                       <h3 className="text-lg font-bold mb-2">Instant Sync</h3>
                       <p className="text-sm text-blue-100 leading-relaxed">Permissions update automatically when modified by event management.</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-[2.5rem] p-16 border border-dashed border-gray-300 flex flex-col items-center text-center">
                   <div className="h-20 w-20 bg-gray-50 text-gray-300 rounded-full flex items-center justify-center mb-6">
                      <AlertCircle size={40} />
                   </div>
                   <h3 className="text-2xl font-bold text-gray-900 mb-2">Environment Not Initialized</h3>
                   <p className="text-gray-500 max-w-sm mb-8">You are not currently registered for any active events. Check your email or contact management.</p>
                   <button onClick={() => setActiveTab('events')} className="bg-blue-600 text-white font-bold px-8 py-3 rounded-xl hover:bg-blue-700 transition-all">
                      Browse My Events
                   </button>
                </div>
              )}
            </div>
          )}

          {activeTab === "events" && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
               <div className="mb-10">
                <h1 className="text-4xl font-bold text-gray-900 mb-2">My Event Portfolio</h1>
                <p className="text-gray-500">Manage your registrations across different modular environments.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {eventList.map(evId => (
                  <EventSelectorCard 
                    key={evId}
                    eventId={evId}
                    active={activeEventId === evId}
                    onClick={() => { setActiveEventId(evId); setActiveTab("pass"); }}
                  />
                ))}
                {eventList.length === 0 && (
                  <div className="col-span-full py-20 text-center">
                    <p className="text-gray-400 italic">No registered events found.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "resources" && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="mb-10">
                <h1 className="text-4xl font-bold text-gray-900 mb-2">Event Resources</h1>
                <p className="text-gray-500">Dynamic content pulled from the Nexus Registry.</p>
              </div>

              <div className="space-y-6">
                <div className="bg-white rounded-3xl p-10 border border-gray-100 shadow-sm">
                  <h2 className="text-2xl font-bold text-gray-900 mb-8">Live Schedule</h2>
                  <div className="space-y-4">
                    <ScheduleItem time="10:00 AM" title="Nexus Modular Architecture" location="Main Stage" active />
                    <ScheduleItem time="11:30 AM" title="Identity Token Cryptography" location="Tech Lab" />
                    <ScheduleItem time="01:00 PM" title="Networking Buffet" location="VIP Lounge" />
                    <ScheduleItem time="02:30 PM" title="Closing Keynote" location="Main Stage" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <ResourceCard title="Spatial Zone Map" icon={<MapPin size={24} />} description="Interactive floor plans and points of interest." />
                  <ResourceCard title="Identity Vault" icon={<ShieldCheck size={24} />} description="Manage your biometric and crypto credentials." />
                </div>
              </div>
            </div>
          )}

          {activeTab === "settings" && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="mb-10">
                <h1 className="text-4xl font-bold text-gray-900 mb-2">Portal Settings</h1>
                <p className="text-gray-500">Customize your nexus experience and security profile.</p>
              </div>

              <div className="bg-white rounded-3xl p-10 border border-gray-100 shadow-sm max-w-2xl">
                <div className="space-y-8">
                  <SettingRow label="Global Identifier" value={user.uid} mono />
                  <SettingRow label="Registered Identity" value={userData?.name || "Not set"} />
                  <SettingRow label="Primary Email" value={user.email || "No email linked"} />
                  
                  <div className="pt-10 flex flex-col sm:flex-row gap-4">
                    <button className="flex-1 bg-blue-600 text-white font-bold py-4 rounded-2xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-100">Update Profile</button>
                    <button onClick={async () => { await auth.signOut(); router.push("/"); }} className="flex-1 bg-white border border-gray-200 text-gray-700 font-bold py-4 rounded-2xl hover:bg-gray-50 transition-all">Sign Out</button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function NavButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={`flex items-center space-x-4 px-5 py-4 rounded-2xl font-bold text-sm transition-all whitespace-nowrap ${active ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' : 'text-gray-500 hover:bg-gray-50'}`}
    >
      <span className={`${active ? 'text-white' : 'text-gray-400'}`}>{icon}</span>
      <span>{label}</span>
    </button>
  );
}

function EntitlementCard({ active, label }: { active: boolean, label: string }) {
  const Icon = label.toLowerCase().includes('wifi') ? Wifi : 
               label.toLowerCase().includes('lounge') ? Coffee :
               label.toLowerCase().includes('stage') || label.toLowerCase().includes('mic') ? Mic :
               label.toLowerCase().includes('dining') || label.toLowerCase().includes('food') ? Utensils : Box;

  return (
    <div className={`p-4 rounded-2xl border flex flex-col items-center justify-center text-center transition-all ${active ? 'bg-white border-blue-100 text-gray-900 shadow-sm' : 'bg-gray-50 border-gray-100 text-gray-300 grayscale'}`}>
      <div className={`h-10 w-10 rounded-xl flex items-center justify-center mb-3 ${active ? 'bg-blue-50 text-blue-600' : 'bg-gray-200 text-gray-400'}`}>
        <Icon size={20} />
      </div>
      <p className="text-[10px] font-bold uppercase tracking-wider truncate w-full px-1">{label}</p>
    </div>
  );
}

function EventSelectorCard({ eventId, active, onClick }: { eventId: string, active: boolean, onClick: () => void }) {
  const [eventData, setEventData] = useState<DocumentData | null>(null);

  useEffect(() => {
    const fetch = async () => {
      const snap = await getDoc(doc(db, "events", eventId));
      if (snap.exists()) setEventData(snap.data());
    };
    fetch();
  }, [eventId]);

  return (
    <div 
      onClick={onClick}
      className={`p-6 rounded-3xl border-2 transition-all cursor-pointer relative overflow-hidden group ${active ? 'border-blue-600 bg-white shadow-xl shadow-blue-50' : 'border-gray-100 bg-white hover:border-blue-200'}`}
    >
      {active && <div className="absolute top-0 right-0 bg-blue-600 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl uppercase tracking-widest">Active</div>}
      <h3 className="font-bold text-gray-900 text-lg mb-2 group-hover:text-blue-600 transition-colors">{eventData?.name || "Loading Event..."}</h3>
      <p className="text-sm text-gray-500 line-clamp-2 mb-6">{eventData?.description || "..."}</p>
      <div className="flex items-center text-blue-600 text-xs font-bold uppercase tracking-widest group-hover:translate-x-2 transition-transform">
         <span>Select Pass</span>
         <ChevronRight size={14} className="ml-1" />
      </div>
    </div>
  );
}

function ScheduleItem({ time, title, location, active = false }: { time: string, title: string, location: string, active?: boolean }) {
  return (
    <div className={`flex items-center justify-between p-6 rounded-2xl border transition-all ${active ? 'bg-blue-50 border-blue-200 shadow-sm' : 'bg-white border-gray-100 hover:border-gray-200'}`}>
      <div className="flex items-center space-x-6">
        <p className="text-xs font-bold text-blue-600 w-16 uppercase tracking-widest">{time}</p>
        <div>
          <p className="font-bold text-gray-900">{title}</p>
          <div className="flex items-center space-x-2 text-xs text-gray-400 font-medium mt-1">
            <MapPin size={12} />
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
    <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer group">
       <div className="h-12 w-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 mb-6 group-hover:scale-110 transition-transform">
          {icon}
       </div>
       <h4 className="font-bold text-gray-900 text-lg mb-2">{title}</h4>
       <p className="text-sm text-gray-500 leading-relaxed">{description}</p>
    </div>
  );
}

function SettingRow({ label, value, mono = false }: { label: string, value: string, mono?: boolean }) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">{label}</label>
      <div className={`w-full bg-gray-50 px-5 py-4 rounded-2xl border border-gray-100 text-sm text-gray-900 ${mono ? 'font-mono' : 'font-medium'}`}>
        {value}
      </div>
    </div>
  );
}
