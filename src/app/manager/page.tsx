"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { collection, onSnapshot, doc, updateDoc, setDoc, getDoc, DocumentData } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { generateHexCode, decryptQRPayload } from "@/lib/logic";
import { Html5Qrcode } from "html5-qrcode";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, Camera, User as UserIcon, Plus, 
  Upload, Search, CheckCircle2, AlertCircle, ShieldCheck
} from "lucide-react";

interface Attendee extends DocumentData {
  id: string;
  name?: string;
  email?: string;
  tier?: string;
  status?: string;
  entitlements?: Record<string, boolean>;
}

const NexusLogo = ({ className = "h-6 w-6" }: { className?: string }) => (
  <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M25 80V20L75 80V20" stroke="currentColor" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export default function ManagerPage() {
  const router = useRouter();
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAttendeeId, setSelectedAttendeeId] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [scanResult, setScanResult] = useState<{ status: 'granted' | 'denied', message: string, data?: DocumentData } | null>(null);
  const [newAttendee, setNewAttendee] = useState({ name: "", email: "", tier: "Guest" });
  
  const scannerRef = useRef<Html5Qrcode | null>(null);

  const seedData = async () => {
    try {
      const categories = [
        { id: "nexus-vip", name: "Sarah Jenkins", email: "vip@nexus.org", tier: "VIP", entitlements: { wifi: true, lounge: true, backstage: true, premiumDining: true } },
        { id: "nexus-guest", name: "Michael Chen", email: "guest@nexus.org", tier: "Guest", entitlements: { wifi: true, lounge: false, backstage: false, premiumDining: false } },
        { id: "nexus-lecturer", name: "Dr. Elena Rossi", email: "lecturer@nexus.org", tier: "Lecturer", entitlements: { wifi: true, lounge: true, backstage: true, premiumDining: false } },
        { id: "nexus-staff", name: "Alex Rivera", email: "staff@nexus.org", tier: "Staff", entitlements: { wifi: true, lounge: false, backstage: true, premiumDining: true } }
      ];

      for (const cat of categories) {
        await setDoc(doc(db, "users", cat.id), { ...cat, status: "verified", updatedAt: Date.now() }, { merge: true });
      }
      console.log("Database Seeded Successfully");
    } catch (err: unknown) {
      console.error("Seeding Failed:", err);
    }
  };

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
       if (!user) {
          // In production, we might want to redirect, but for demo we keep it open
          console.log("No active manager session");
       }
    });
    seedData();
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    const unsubscribeDb = onSnapshot(collection(db, "users"), (snapshot) => {
      const usersData: Attendee[] = [];
      snapshot.forEach((docSnap) => {
        usersData.push({ id: docSnap.id, ...docSnap.data() } as Attendee);
      });
      setAttendees(usersData);
    });
    return () => unsubscribeDb();
  }, []);

  const handleCreateAttendee = async (e: React.FormEvent) => {
    e.preventDefault();
    const tempId = `temp_${Date.now()}`;
    await setDoc(doc(db, "users", tempId), {
      ...newAttendee,
      status: "verified",
      entitlements: { wifi: true, lounge: false, backstage: false, premiumDining: false },
      createdAt: Date.now()
    });
    setIsAdding(false);
    setNewAttendee({ name: "", email: "", tier: "Guest" });
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
    const userDoc = await getDoc(doc(db, "users", payload.uid));
    if (userDoc.exists()) {
      setScanResult({ 
        status: 'granted', 
        message: 'Identity Verified',
        data: userDoc.data()
      });
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

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      {/* Sidebar - Shared Design with Dashboard */}
      <div className="md:fixed left-0 top-0 h-auto md:h-full w-full md:w-80 lg:w-96 bg-white border-b md:border-b-0 md:border-r border-gray-200 flex flex-col z-30 shadow-xl md:shadow-none">
        <div className="p-8 border-b border-gray-50 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 bg-blue-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-blue-100">
               <NexusLogo />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tighter text-gray-900 leading-none">NEXUS</h1>
              <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-gray-400 mt-1">MANAGER COMMAND</p>
            </div>
          </div>
          <button 
            onClick={() => setIsAdding(true)}
            className="h-10 w-10 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-all flex items-center justify-center active:scale-95"
          >
            <Plus size={20} />
          </button>
        </div>

        <div className="p-6">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="Search attendees..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-50 border border-transparent rounded-2xl py-3 pl-12 pr-4 text-sm font-medium focus:bg-white focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-8 space-y-2 max-h-[300px] md:max-h-full">
          {filteredAttendees.map(attendee => (
            <motion.div 
              key={attendee.id}
              whileHover={{ x: 4 }}
              onClick={() => setSelectedAttendeeId(attendee.id)}
              className={`p-4 rounded-2xl cursor-pointer transition-all flex items-center justify-between border-2 ${selectedAttendeeId === attendee.id ? 'bg-blue-600 border-blue-600 text-white shadow-lg' : 'bg-white border-transparent hover:border-blue-100'}`}
            >
              <div className="flex items-center space-x-4">
                <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${selectedAttendeeId === attendee.id ? 'bg-white/20' : 'bg-blue-50 text-blue-600'}`}>
                  <UserIcon size={18} />
                </div>
                <div className="overflow-hidden">
                  <p className="font-bold text-sm leading-tight truncate">{attendee.name || attendee.email}</p>
                  <p className={`text-[10px] font-bold uppercase tracking-widest leading-none mt-1 ${selectedAttendeeId === attendee.id ? 'text-white/70' : 'text-gray-400'}`}>{attendee.tier}</p>
                </div>
              </div>
              <p className={`font-mono text-[10px] font-bold ${selectedAttendeeId === attendee.id ? 'text-white/50' : 'text-gray-300'}`}>{generateHexCode(attendee.id)}</p>
            </motion.div>
          ))}
          {filteredAttendees.length === 0 && (
            <div className="text-center py-20 px-8">
              <div className="h-24 w-24 bg-blue-50 text-blue-600 rounded-[32px] flex items-center justify-center mx-auto mb-8 shadow-inner animate-pulse">
                <ShieldCheck size={48} />
              </div>
              <h3 className="text-2xl font-black uppercase tracking-tighter text-gray-900 mb-2">No Attendees Found</h3>
              <p className="text-sm font-medium text-gray-400 mb-12 max-w-[240px] mx-auto leading-relaxed">The database is currently empty or not yet synchronized.</p>
              <button 
                onClick={seedData}
                className="bg-blue-600 text-white font-black px-10 py-4 rounded-2xl shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all active:scale-95 uppercase tracking-widest text-xs"
              >
                Initialize Nexus Data
              </button>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-50">
           <button 
             onClick={async () => { await auth.signOut(); router.push("/"); }}
             className="w-full flex items-center justify-center space-x-3 bg-red-50 text-red-600 font-bold py-4 rounded-2xl hover:bg-red-100 transition-all active:scale-95"
           >
              <X size={18} />
              <span className="text-xs uppercase tracking-widest">Exit Command Portal</span>
           </button>
        </div>
      </div>

      {/* Main Area */}
      <div className="md:ml-80 lg:ml-96 p-6 md:p-12 lg:p-16 min-h-screen">
        <div className="max-w-4xl mx-auto space-y-12">
          
          {/* Action Hub */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ScanCard 
              onClick={startScanner} 
              icon={<Camera size={32} />} 
              title="Live Camera Scan" 
              description="Open universal identity lens"
              color="bg-blue-600"
            />
            <label className="cursor-pointer group">
              <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
              <ScanCard 
                asLabel
                icon={<Upload size={32} />} 
                title="Photo Upload Scan" 
                description="Process saved QR images"
                color="bg-purple-600"
              />
            </label>
          </div>

          {/* Verification Engine */}
          <AnimatePresence>
            {scanResult && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`p-10 rounded-[48px] border-4 flex flex-col md:flex-row items-center gap-8 ${scanResult.status === 'granted' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}
              >
                <div className={`h-24 w-24 rounded-[32px] flex items-center justify-center ${scanResult.status === 'granted' ? 'bg-green-600' : 'bg-red-600'} text-white shadow-xl`}>
                  {scanResult.status === 'granted' ? <CheckCircle2 size={48} /> : <AlertCircle size={48} />}
                </div>
                <div className="text-center md:text-left flex-1">
                  <h2 className={`text-5xl font-black uppercase tracking-tighter leading-none mb-2 ${scanResult.status === 'granted' ? 'text-green-900' : 'text-red-900'}`}>
                    {scanResult.status === 'granted' ? 'Verified' : 'Rejected'}
                  </h2>
                  <p className="text-lg font-bold opacity-70 mb-4 tracking-tight">{scanResult.message}</p>
                  {scanResult.data && (
                    <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                      <span className="bg-white px-4 py-1 rounded-full text-[10px] font-bold uppercase border border-gray-100">{scanResult.data.name}</span>
                      <span className="bg-white px-4 py-1 rounded-full text-[10px] font-bold uppercase border border-green-200 text-green-700">{scanResult.data.tier}</span>
                    </div>
                  )}
                </div>
                <button 
                  onClick={() => setScanResult(null)}
                  className="bg-white text-gray-900 px-10 py-4 rounded-2xl font-bold uppercase tracking-widest shadow-sm hover:shadow-md transition-all active:scale-95"
                >
                  Clear
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Detailed Attendee Profile */}
          <AnimatePresence>
            {selectedAttendee && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-[56px] border border-gray-100 p-12 shadow-2xl relative"
              >
                <button onClick={() => setSelectedAttendeeId(null)} className="absolute top-8 right-8 h-12 w-12 rounded-full hover:bg-gray-50 flex items-center justify-center transition-colors">
                  <X size={24} />
                </button>

                <div className="flex flex-col md:flex-row items-center md:items-start gap-12 mb-16">
                  <div className="h-32 w-32 bg-blue-50 text-blue-600 rounded-[40px] flex items-center justify-center shadow-inner">
                    <UserIcon size={64} />
                  </div>
                  <div className="text-center md:text-left pt-4">
                    <h2 className="text-6xl font-black tracking-tighter leading-none mb-4">{selectedAttendee.name || "Attendee"}</h2>
                    <p className="text-xl font-medium text-gray-400 mb-8 tracking-tight">{selectedAttendee.email}</p>
                    <div className="flex justify-center md:justify-start gap-4">
                      <span className="px-8 py-3 bg-gray-900 text-white rounded-full text-xs font-bold uppercase tracking-[0.2em]">{selectedAttendee.tier}</span>
                      <span className="px-8 py-3 bg-blue-50 text-blue-600 border border-blue-100 rounded-full text-xs font-mono font-bold tracking-[0.2em]">{generateHexCode(selectedAttendee.id)}</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 pt-12 border-t border-gray-50">
                  <div className="space-y-6">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400 mb-8">Access Control</h3>
                    {['wifi', 'lounge', 'backstage', 'premiumDining'].map(key => {
                      const isActive = selectedAttendee.entitlements?.[key] || false;
                      return (
                        <div key={key} className="flex justify-between items-center p-5 bg-gray-50 rounded-3xl border border-gray-100 group hover:border-blue-200 transition-colors">
                          <span className="font-bold uppercase tracking-widest text-xs text-gray-500">{key} Access</span>
                          <button 
                            onClick={async () => {
                              await updateDoc(doc(db, "users", selectedAttendee.id), { [`entitlements.${key}`]: !isActive });
                            }}
                            className={`w-16 h-9 rounded-full transition-all relative ${isActive ? 'bg-blue-600' : 'bg-gray-300'}`}
                          >
                            <motion.div 
                              animate={{ x: isActive ? 28 : 0 }}
                              className="h-7 w-7 bg-white rounded-full absolute top-1 left-1 shadow-md"
                            />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                  
                  <div className="bg-gray-50 rounded-[48px] p-10 flex flex-col items-center justify-center text-center space-y-6 border-4 border-dashed border-gray-200">
                     <div className="h-16 w-16 bg-white rounded-2xl flex items-center justify-center text-blue-600 shadow-sm">
                        <ShieldCheck size={32} />
                     </div>
                     <p className="text-xs font-bold uppercase tracking-widest text-gray-400 max-w-[200px]">Live Real-Time Verification Active</p>
                     <div className="h-1 w-12 bg-blue-200 rounded-full"></div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Register Attendee Modal */}
      <AnimatePresence>
        {isAdding && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-gray-900/60 backdrop-blur-md" onClick={() => setIsAdding(false)} />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white w-full max-w-lg rounded-[56px] p-12 relative z-10 shadow-2xl"
            >
              <h2 className="text-4xl font-black uppercase tracking-tighter mb-12">New Attendee</h2>
              <form onSubmit={handleCreateAttendee} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">Full Name</label>
                  <input type="text" className="w-full bg-gray-50 px-8 py-5 rounded-3xl border-none focus:ring-4 focus:ring-blue-100 outline-none font-bold" required value={newAttendee.name} onChange={(e) => setNewAttendee({...newAttendee, name: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">Email Address</label>
                  <input type="email" className="w-full bg-gray-50 px-8 py-5 rounded-3xl border-none focus:ring-4 focus:ring-blue-100 outline-none font-bold" required value={newAttendee.email} onChange={(e) => setNewAttendee({...newAttendee, email: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">Access Tier</label>
                  <select className="w-full bg-gray-50 px-8 py-5 rounded-3xl border-none focus:ring-4 focus:ring-blue-100 outline-none font-bold appearance-none" value={newAttendee.tier} onChange={(e) => setNewAttendee({...newAttendee, tier: e.target.value})}>
                    <option value="Guest">Guest</option>
                    <option value="VIP">VIP</option>
                    <option value="Lecturer">Lecturer</option>
                    <option value="Staff">Staff</option>
                  </select>
                </div>
                <button type="submit" className="w-full bg-blue-600 text-white font-black py-6 rounded-3xl shadow-xl shadow-blue-200 hover:bg-blue-700 transition-all text-xl uppercase tracking-widest active:scale-95">
                  Confirm Registration
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Universal Scanner Overlay */}
      <AnimatePresence>
        {isScanning && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 bg-black/95 backdrop-blur-2xl" />
             <div className="relative z-10 w-full max-w-2xl flex flex-col items-center">
                <div className="mb-12 text-center">
                   <h2 className="text-white text-4xl font-black uppercase tracking-tighter mb-2">Nexus Lens</h2>
                   <p className="text-white/40 font-bold uppercase tracking-widest text-xs">Awaiting Cryptographic Token</p>
                </div>
                <div id="reader" className="w-full rounded-[64px] overflow-hidden border-[12px] border-white/10 bg-black aspect-square shadow-2xl relative">
                   <div className="absolute inset-0 border-4 border-blue-500/50 rounded-[52px] animate-pulse z-10 pointer-events-none"></div>
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
                  className="mt-16 bg-white text-black px-16 py-5 rounded-full font-black uppercase tracking-[0.2em] shadow-2xl active:scale-95 transition-all"
                >
                  Terminate Scan
                </button>
             </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ScanCard({ onClick, icon, title, description, color, asLabel = false }: { onClick?: () => void | Promise<void>, icon: React.ReactNode, title: string, description: string, color: string, asLabel?: boolean }) {
  const content = (
    <div className="bg-white p-10 rounded-[56px] border border-gray-100 shadow-sm hover:shadow-xl transition-all group flex flex-col items-start text-left h-full">
      <div className={`h-20 w-20 ${color} rounded-[32px] flex items-center justify-center text-white shadow-lg mb-10 group-hover:scale-110 transition-transform`}>
        {icon}
      </div>
      <h3 className="text-3xl font-black tracking-tight mb-2 uppercase">{title}</h3>
      <p className="text-sm font-medium text-gray-400 mb-8">{description}</p>
      <div className={`mt-auto flex items-center space-x-2 font-bold uppercase tracking-widest text-[10px] ${color.replace('bg-', 'text-')}`}>
        <span>Activate Unit</span>
        <ShieldCheck size={14} />
      </div>
    </div>
  );

  if (asLabel) return <div className="h-full">{content}</div>;
  return <button onClick={onClick} className="h-full active:scale-[0.98] transition-transform">{content}</button>;
}
