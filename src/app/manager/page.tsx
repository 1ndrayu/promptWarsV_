"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { 
  collection, onSnapshot, doc, updateDoc, setDoc, getDoc, 
  query, where, DocumentData, deleteDoc, addDoc
} from "firebase/firestore";
import { onAuthStateChanged, User } from "firebase/auth";
import { generateHexCode, decryptQRPayload } from "@/lib/logic";
import { Html5Qrcode } from "html5-qrcode";
import { 
  X, Camera, User as UserIcon, Plus, 
  Upload, Search, CheckCircle2, AlertCircle, 
  ShieldCheck, LayoutDashboard, Settings, 
  Users, ChevronRight, ArrowLeft, Trash2, Calendar
} from "lucide-react";

interface Event extends DocumentData {
  id: string;
  name: string;
  description: string;
  managerId: string;
  config: {
    tiers: string[];
    entitlements: string[];
  };
  createdAt: number;
}

interface Attendee extends DocumentData {
  id: string;
  name?: string;
  email?: string;
  registrations: Record<string, {
    tier: string;
    entitlements: Record<string, boolean>;
    status: string;
  }>;
}

const NexusLogo = ({ className = "h-6 w-6" }: { className?: string }) => (
  <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M25 80V20L75 80V20" stroke="currentColor" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export default function ManagerPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [activeEventId, setActiveEventId] = useState<string | null>(null);
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  
  const [view, setView] = useState<"events" | "detail">("events");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAttendeeId, setSelectedAttendeeId] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isAddingAttendee, setIsAddingAttendee] = useState(false);
  const [isAddingEvent, setIsAddingEvent] = useState(false);
  const [scanResult, setScanResult] = useState<{ status: 'granted' | 'denied', message: string, data?: DocumentData } | null>(null);
  
  const [newEvent, setNewEvent] = useState({ name: "", description: "", tiers: "Guest, VIP", entitlements: "wifi, lounge" });
  const [newAttendee, setNewAttendee] = useState({ name: "", email: "", tier: "" });
  
  const scannerRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        // console.log("No active manager session");
      }
    });
    return () => unsubscribeAuth();
  }, []);

  // Fetch events managed by the user
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "events"), where("managerId", "==", user.uid));
    const unsubscribeEvents = onSnapshot(q, (snapshot) => {
      const eventsData: Event[] = [];
      snapshot.forEach((docSnap) => {
        eventsData.push({ id: docSnap.id, ...docSnap.data() } as Event);
      });
      setEvents(eventsData);
    });
    return () => unsubscribeEvents();
  }, [user]);

  // Fetch attendees for the active event
  useEffect(() => {
    if (!activeEventId) {
      setAttendees([]);
      return;
    }
    const q = collection(db, "users");
    const unsubscribeAttendees = onSnapshot(q, (snapshot) => {
      const attendeesData: Attendee[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        if (data.registrations && data.registrations[activeEventId]) {
          attendeesData.push({ id: docSnap.id, ...data } as Attendee);
        }
      });
      setAttendees(attendeesData);
    });
    return () => unsubscribeAttendees();
  }, [activeEventId]);

  const activeEvent = events.find(e => e.id === activeEventId);

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    const eventData = {
      name: newEvent.name,
      description: newEvent.description,
      managerId: user.uid,
      config: {
        tiers: newEvent.tiers.split(",").map(t => t.trim()).filter(t => t),
        entitlements: newEvent.entitlements.split(",").map(e => e.trim()).filter(e => e)
      },
      createdAt: Date.now()
    };
    
    await addDoc(collection(db, "events"), eventData);
    setIsAddingEvent(false);
    setNewEvent({ name: "", description: "", tiers: "Guest, VIP", entitlements: "wifi, lounge" });
  };

  const handleCreateAttendee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeEventId || !activeEvent) return;

    const defaultEntitlements: Record<string, boolean> = {};
    activeEvent.config.entitlements.forEach(ent => {
      defaultEntitlements[ent] = false;
    });

    const tempId = `user_${Date.now()}`;
    await setDoc(doc(db, "users", tempId), {
      name: newAttendee.name,
      email: newAttendee.email,
      registrations: {
        [activeEventId]: {
          tier: newAttendee.tier || activeEvent.config.tiers[0],
          entitlements: defaultEntitlements,
          status: "verified"
        }
      },
      createdAt: Date.now()
    });
    
    setIsAddingAttendee(false);
    setNewAttendee({ name: "", email: "", tier: "" });
  };

  const startScanner = async () => {
    setIsScanning(true);
    setScanResult(null);
    try {
      const html5QrCode = new Html5Qrcode("reader");
      scannerRef.current = html5QrCode;
      await html5QrCode.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        handleScanSuccess,
        () => {}
      );
    } catch (err: unknown) { 
       console.error("Scanner failed to start:", err); 
    }
  };

  const handleScanSuccess = async (decodedText: string) => {
    if (scannerRef.current) {
      try { await scannerRef.current.pause(); } catch(e){ console.error("Pause failed", e); }
    }
    const payload = decryptQRPayload(decodedText);
    if (!payload) {
      setScanResult({ status: 'denied', message: 'Invalid or Expired QR Code' });
      return;
    }
    
    if (activeEventId && payload.eventId !== activeEventId) {
      setScanResult({ status: 'denied', message: 'Incorrect Event Pass' });
      return;
    }

    const userDoc = await getDoc(doc(db, "users", payload.uid));
    if (userDoc.exists()) {
      const data = userDoc.data();
      const reg = data.registrations?.[activeEventId || ""];
      if (reg) {
        setScanResult({ 
          status: 'granted', 
          message: 'Identity Verified',
          data: { ...data, ...reg }
        });
      } else {
        setScanResult({ status: 'denied', message: 'Not registered for this event' });
      }
    } else {
      setScanResult({ status: 'denied', message: 'User not found' });
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const html5QrCode = new Html5Qrcode("file-reader");
    try {
      const result = await html5QrCode.scanFile(file, true);
      handleScanSuccess(result);
    } catch {
      setScanResult({ status: 'denied', message: 'No QR Code found in image' });
    }
  };

  const filteredAttendees = attendees.filter(a => 
    (a.name || "").toLowerCase().includes(searchQuery.toLowerCase()) || 
    (a.email || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedAttendee = attendees.find(a => a.id === selectedAttendeeId) || null;

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-blue-600 text-white p-4 rounded-xl shadow-md mb-8">
           <NexusLogo className="h-10 w-10" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Manager Access Required</h1>
        <p className="text-gray-500 mb-8 max-w-sm">Please sign in to manage your events and attendees.</p>
        <button onClick={() => router.push("/login")} className="bg-blue-600 text-white font-medium px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors">
          Go to Login
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      {/* Sidebar */}
      <div className="md:fixed left-0 top-0 h-auto md:h-full w-full md:w-72 lg:w-80 bg-white border-b md:border-b-0 md:border-r border-gray-200 flex flex-col z-30 shadow-sm md:shadow-none">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 bg-blue-600 text-white rounded-xl flex items-center justify-center">
               <NexusLogo />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900 leading-none">NEXUS</h1>
              <p className="text-xs font-medium text-gray-500 mt-1">Command Center</p>
            </div>
          </div>
          <button 
            onClick={() => {
              if (view === "events") setIsAddingEvent(true);
              else setIsAddingAttendee(true);
            }}
            className="h-10 w-10 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors flex items-center justify-center"
          >
            <Plus size={20} />
          </button>
        </div>

        {view === "detail" && activeEvent && (
          <>
            <div className="p-4 border-b border-gray-100">
               <button 
                 onClick={() => { setView("events"); setActiveEventId(null); }}
                 className="flex items-center space-x-2 text-sm font-medium text-gray-500 hover:text-blue-600 transition-colors"
               >
                 <ArrowLeft size={16} />
                 <span>Back to Events</span>
               </button>
               <h2 className="mt-3 text-lg font-semibold text-gray-900 truncate">{activeEvent.name}</h2>
            </div>
            
            <div className="p-6">
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                <input 
                  type="text" 
                  placeholder="Search attendees..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2.5 pl-11 pr-4 text-sm font-medium focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-2">
              {filteredAttendees.map(attendee => (
                <div 
                  key={attendee.id}
                  onClick={() => setSelectedAttendeeId(attendee.id)}
                  className={`p-3 rounded-lg cursor-pointer transition-colors flex items-center justify-between border ${selectedAttendeeId === attendee.id ? 'bg-blue-50 border-blue-200' : 'bg-white border-transparent hover:bg-gray-50 hover:border-gray-200'}`}
                >
                  <div className="flex items-center space-x-3 overflow-hidden">
                    <div className={`h-10 w-10 shrink-0 rounded-full flex items-center justify-center ${selectedAttendeeId === attendee.id ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>
                      <UserIcon size={18} />
                    </div>
                    <div className="overflow-hidden">
                      <p className="font-medium text-sm text-gray-900 leading-tight truncate">{attendee.name || attendee.email}</p>
                      <p className={`text-xs mt-0.5 ${selectedAttendeeId === attendee.id ? 'text-blue-600' : 'text-gray-500'}`}>{attendee.registrations[activeEventId!].tier}</p>
                    </div>
                  </div>
                </div>
              ))}
              {filteredAttendees.length === 0 && (
                <div className="text-center py-10 px-4">
                  <p className="text-sm text-gray-500">No attendees found.</p>
                </div>
              )}
            </div>
          </>
        )}

        {view === "events" && (
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            <h2 className="px-2 text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">My Events</h2>
            {events.map(event => (
              <div 
                key={event.id}
                onClick={() => { setActiveEventId(event.id); setView("detail"); }}
                className="p-4 bg-white border border-gray-100 rounded-xl hover:border-blue-200 hover:bg-blue-50 transition-all cursor-pointer group"
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">{event.name}</h3>
                  <Calendar size={16} className="text-gray-400" />
                </div>
                <p className="text-xs text-gray-500 line-clamp-2">{event.description}</p>
              </div>
            ))}
            {events.length === 0 && (
              <div className="text-center py-16 px-6">
                 <div className="h-16 w-16 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center mx-auto mb-4">
                   <LayoutDashboard size={32} />
                 </div>
                 <p className="text-sm text-gray-500">No events yet. Create your first one!</p>
              </div>
            )}
          </div>
        )}

        <div className="p-4 border-t border-gray-200">
           <button 
             onClick={async () => { await auth.signOut(); router.push("/"); }}
             className="w-full flex items-center justify-center space-x-2 bg-white border border-gray-300 text-gray-700 font-medium py-2.5 rounded-lg hover:bg-gray-50 transition-colors"
           >
              <X size={18} />
              <span className="text-sm">Exit Manager</span>
           </button>
        </div>
      </div>

      {/* Main Area */}
      <div className="md:ml-72 lg:ml-80 p-6 md:p-10 min-h-screen">
        <div className="max-w-4xl mx-auto">
          {view === "events" ? (
            <div className="space-y-8">
              <header>
                <h1 className="text-4xl font-bold text-gray-900 mb-2">Welcome, {user.displayName || "Manager"}</h1>
                <p className="text-gray-500">Select an event to manage or create a new one.</p>
              </header>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <button 
                  onClick={() => setIsAddingEvent(true)}
                  className="p-8 bg-blue-600 rounded-2xl text-white hover:bg-blue-700 transition-colors flex flex-col items-start text-left group shadow-lg shadow-blue-200"
                >
                  <div className="h-12 w-12 bg-white/20 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <Plus size={24} />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Create New Event</h3>
                  <p className="text-blue-100 text-sm">Deploy a new modular identity portal in seconds.</p>
                </button>
                
                <div className="p-8 bg-white border border-gray-200 rounded-2xl flex flex-col items-start text-left relative overflow-hidden">
                   <div className="h-12 w-12 bg-gray-100 text-gray-600 rounded-xl flex items-center justify-center mb-6">
                      <Users size={24} />
                   </div>
                   <h3 className="text-xl font-bold mb-2 text-gray-900">{events.length} Active Events</h3>
                   <p className="text-gray-500 text-sm">Managing all your deployed environments.</p>
                   <div className="absolute right-[-20px] bottom-[-20px] opacity-[0.03] rotate-12">
                      <NexusLogo className="h-40 w-40" />
                   </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Action Hub */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ScanCard 
                  onClick={startScanner} 
                  icon={<Camera size={24} />} 
                  title="Live Camera Scan" 
                  description="Scan attendee pass for this event"
                  color="bg-blue-600"
                />
                <label className="cursor-pointer group">
                  <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
                  <ScanCard 
                    asLabel
                    icon={<Upload size={24} />} 
                    title="Photo Upload Scan" 
                    description="Verify pass from an image"
                    color="bg-purple-600"
                  />
                </label>
              </div>

              {/* Verification Engine */}
              {scanResult && (
                <div className={`p-8 rounded-2xl border flex flex-col md:flex-row items-center gap-6 ${scanResult.status === 'granted' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                  <div className={`h-16 w-16 rounded-full flex items-center justify-center ${scanResult.status === 'granted' ? 'bg-green-600' : 'bg-red-600'} text-white shadow-sm`}>
                    {scanResult.status === 'granted' ? <CheckCircle2 size={32} /> : <AlertCircle size={32} />}
                  </div>
                  <div className="text-center md:text-left flex-1">
                    <h2 className={`text-2xl font-bold mb-1 ${scanResult.status === 'granted' ? 'text-green-900' : 'text-red-900'}`}>
                      {scanResult.status === 'granted' ? 'Access Granted' : 'Access Denied'}
                    </h2>
                    <p className="text-base font-medium opacity-80 mb-3">{scanResult.message}</p>
                    {scanResult.data && (
                      <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                        <span className="bg-white px-3 py-1 rounded-md text-xs font-medium border border-gray-200">{scanResult.data.name}</span>
                        <span className="bg-white px-3 py-1 rounded-md text-xs font-medium border border-green-200 text-green-700">{scanResult.data.tier}</span>
                      </div>
                    )}
                  </div>
                  <button onClick={() => setScanResult(null)} className="bg-white border border-gray-300 text-gray-700 px-6 py-2 rounded-lg font-medium hover:bg-gray-50">Clear</button>
                </div>
              )}

              {/* Detailed Attendee Profile */}
              {selectedAttendee ? (
                <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm relative animate-in fade-in slide-in-from-bottom-4">
                  <button onClick={() => setSelectedAttendeeId(null)} className="absolute top-6 right-6 h-10 w-10 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors text-gray-500">
                    <X size={20} />
                  </button>

                  <div className="flex flex-col md:flex-row items-center md:items-start gap-8 mb-10">
                    <div className="h-24 w-24 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center shadow-sm">
                      <UserIcon size={40} />
                    </div>
                    <div className="text-center md:text-left pt-2">
                      <h2 className="text-3xl font-semibold text-gray-900 mb-2">{selectedAttendee.name || "Attendee"}</h2>
                      <p className="text-base text-gray-500 mb-4">{selectedAttendee.email}</p>
                      <div className="flex justify-center md:justify-start gap-3">
                        <span className="px-4 py-1.5 bg-gray-100 text-gray-800 rounded-md text-sm font-medium">{selectedAttendee.registrations[activeEventId!].tier}</span>
                        <span className="px-4 py-1.5 bg-blue-50 text-blue-700 border border-blue-100 rounded-md text-sm font-mono">{generateHexCode(selectedAttendee.id)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-gray-200">
                    <div className="space-y-4">
                      <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Entitlements</h3>
                      {activeEvent?.config.entitlements.map(ent => {
                        const isActive = selectedAttendee.registrations[activeEventId!].entitlements[ent] || false;
                        return (
                          <div key={ent} className="flex justify-between items-center p-4 bg-gray-50 rounded-xl border border-gray-200 hover:border-gray-300 transition-colors">
                            <span className="font-medium text-sm text-gray-700 capitalize">{ent}</span>
                            <button 
                              onClick={async () => {
                                const newRegs = { ...selectedAttendee.registrations };
                                newRegs[activeEventId!].entitlements[ent] = !isActive;
                                await updateDoc(doc(db, "users", selectedAttendee.id), { registrations: newRegs });
                              }}
                              className={`w-12 h-6 rounded-full transition-colors relative ${isActive ? 'bg-blue-600' : 'bg-gray-300'}`}
                            >
                              <div className={`h-5 w-5 bg-white rounded-full absolute top-0.5 shadow-sm transition-transform ${isActive ? 'translate-x-6 left-0.5' : 'translate-x-0.5'}`} />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                    
                    <div className="space-y-6">
                       <div className="bg-blue-50 rounded-2xl p-8 flex flex-col items-center justify-center text-center space-y-4 border border-blue-100">
                          <div className="h-12 w-12 bg-white rounded-xl flex items-center justify-center text-blue-600 shadow-sm">
                             <ShieldCheck size={24} />
                          </div>
                          <p className="text-sm font-medium text-blue-800">Dynamic Permissions Active</p>
                          <p className="text-xs text-blue-600/70">Changes are synced to user pass in real-time.</p>
                       </div>
                       
                       <button 
                         onClick={async () => {
                           if (confirm("Remove attendee from this event?")) {
                             const newRegs = { ...selectedAttendee.registrations };
                             delete newRegs[activeEventId!];
                             await updateDoc(doc(db, "users", selectedAttendee.id), { registrations: newRegs });
                             setSelectedAttendeeId(null);
                           }
                         }}
                         className="w-full flex items-center justify-center space-x-2 text-red-500 hover:bg-red-50 py-3 rounded-xl transition-colors border border-transparent hover:border-red-100 font-medium"
                       >
                          <Trash2 size={18} />
                          <span>Remove from Event</span>
                       </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-16 flex flex-col items-center text-center">
                   <div className="h-20 w-20 bg-gray-50 text-gray-300 rounded-full flex items-center justify-center mb-6">
                      <UserIcon size={40} />
                   </div>
                   <h3 className="text-xl font-medium text-gray-900 mb-2">No Attendee Selected</h3>
                   <p className="text-gray-500 max-w-xs">Select an attendee from the sidebar or scan a pass to view and manage details.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Add Event Modal */}
      {isAddingEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => setIsAddingEvent(false)} />
          <div className="bg-white w-full max-w-lg rounded-2xl p-8 relative z-10 shadow-xl border border-gray-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">New Event</h2>
              <button onClick={() => setIsAddingEvent(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateEvent} className="space-y-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Event Name</label>
                <input type="text" className="w-full bg-white border border-gray-300 px-4 py-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" required value={newEvent.name} onChange={(e) => setNewEvent({...newEvent, name: e.target.value})} />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Description</label>
                <textarea className="w-full bg-white border border-gray-300 px-4 py-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none h-24" required value={newEvent.description} onChange={(e) => setNewEvent({...newEvent, description: e.target.value})} />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Tiers (comma separated)</label>
                <input type="text" className="w-full bg-white border border-gray-300 px-4 py-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Guest, VIP, Speaker" value={newEvent.tiers} onChange={(e) => setNewEvent({...newEvent, tiers: e.target.value})} />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Entitlements (comma separated)</label>
                <input type="text" className="w-full bg-white border border-gray-300 px-4 py-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="wifi, lounge, backstage" value={newEvent.entitlements} onChange={(e) => setNewEvent({...newEvent, entitlements: e.target.value})} />
              </div>
              <div className="pt-4">
                <button type="submit" className="w-full bg-blue-600 text-white font-medium py-3 rounded-lg hover:bg-blue-700 transition-colors">
                  Initialize Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Attendee Modal */}
      {isAddingAttendee && activeEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => setIsAddingAttendee(false)} />
          <div className="bg-white w-full max-w-lg rounded-2xl p-8 relative z-10 shadow-xl border border-gray-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Add to {activeEvent.name}</h2>
              <button onClick={() => setIsAddingAttendee(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateAttendee} className="space-y-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Full Name</label>
                <input type="text" className="w-full bg-white border border-gray-300 px-4 py-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" required value={newAttendee.name} onChange={(e) => setNewAttendee({...newAttendee, name: e.target.value})} />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Email Address</label>
                <input type="email" className="w-full bg-white border border-gray-300 px-4 py-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" required value={newAttendee.email} onChange={(e) => setNewAttendee({...newAttendee, email: e.target.value})} />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Access Tier</label>
                <select className="w-full bg-white border border-gray-300 px-4 py-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={newAttendee.tier} onChange={(e) => setNewAttendee({...newAttendee, tier: e.target.value})}>
                  <option value="">Select Tier</option>
                  {activeEvent.config.tiers.map(tier => (
                    <option key={tier} value={tier}>{tier}</option>
                  ))}
                </select>
              </div>
              <div className="pt-4">
                <button type="submit" className="w-full bg-blue-600 text-white font-medium py-3 rounded-lg hover:bg-blue-700 transition-colors">
                  Add Attendee
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Universal Scanner Overlay */}
      {isScanning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
           <div className="relative z-10 w-full max-w-lg flex flex-col items-center">
              <div className="mb-8 text-center">
                 <h2 className="text-white text-2xl font-semibold mb-2">Nexus Lens</h2>
                 <p className="text-white/70 text-sm">Awaiting Code</p>
              </div>
              <div id="reader" className="w-full rounded-2xl overflow-hidden bg-black aspect-square relative border border-white/20">
              </div>
              <div id="file-reader" className="hidden"></div>
              <button 
                onClick={async () => {
                  if (scannerRef.current) {
                    await scannerRef.current.stop();
                    scannerRef.current.clear();
                  }
                  setIsScanning(false);
                }}
                className="mt-8 bg-white text-gray-900 px-8 py-3 rounded-full font-medium hover:bg-gray-100 transition-colors"
              >
                Terminate Scan
              </button>
           </div>
        </div>
      )}
    </div>
  );
}

function ScanCard({ onClick, icon, title, description, color, asLabel = false }: { onClick?: () => void | Promise<void>, icon: React.ReactNode, title: string, description: string, color: string, asLabel?: boolean }) {
  const content = (
    <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow flex flex-col items-start text-left h-full group">
      <div className={`h-14 w-14 ${color} rounded-xl flex items-center justify-center text-white mb-6 group-hover:scale-110 transition-transform`}>
        {icon}
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-1">{title}</h3>
      <p className="text-sm text-gray-500 mb-6">{description}</p>
      <div className={`mt-auto flex items-center space-x-2 text-sm font-medium ${color.replace('bg-', 'text-')}`}>
        <span>Activate</span>
        <ShieldCheck size={16} />
      </div>
    </div>
  );

  if (asLabel) return <div className="h-full">{content}</div>;
  return <button onClick={onClick} className="h-full text-left w-full">{content}</button>;
}
