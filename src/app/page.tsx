"use client";

import Link from "next/link";
import { User, Shield, ArrowRight, Globe } from "lucide-react";

const NexusLogo = ({ className = "h-8 w-8" }: { className?: string }) => (
  <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M25 80V20L75 80V20" stroke="currentColor" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-gray-800 font-sans">
      <header className="text-center mb-12 relative z-10 flex flex-col items-center">
        <div className="bg-blue-600 text-white p-4 rounded-xl shadow-md mb-8 inline-block">
           <NexusLogo className="h-10 w-10" />
        </div>
        
        <div className="flex flex-col items-center space-y-3">
          <div className="bg-white border border-gray-200 px-4 py-1.5 rounded-full flex items-center space-x-2 shadow-sm">
             <div className="h-2 w-2 bg-green-500 rounded-full"></div>
             <span className="text-xs font-medium uppercase tracking-wide text-gray-600">Global Registry Online</span>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-medium tracking-tight text-gray-900">
            Nexus
          </h1>
          
          <p className="text-base text-gray-500 max-w-md mx-auto">
            Identity verification and entitlement synchronization for high-density environments.
          </p>
        </div>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl relative z-10">
        <PortalCard 
          title="Participant" 
          description="Access pass, resources and live schedule" 
          icon={<User size={24} />}
          href="/dashboard"
        />
        <PortalCard 
          title="Manager" 
          description="Universal command and identity control" 
          icon={<Shield size={24} />}
          href="/manager"
        />
      </section>

      <nav className="mt-16 flex flex-col items-center relative z-10">
        <Link href="/login">
          <button className="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors flex items-center space-x-2 px-4 py-2 rounded-md hover:bg-blue-50">
             <Globe size={18} />
             <span>Secure Access Login</span>
          </button>
        </Link>
      </nav>
    </main>
  );
}

function PortalCard({ title, description, icon, href }: { title: string, description: string, icon: React.ReactNode, href: string }) {
  return (
    <Link href={href}>
      <div className="group p-8 rounded-2xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow cursor-pointer flex flex-col items-start h-full">
        <div className="h-12 w-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-6">
          {icon}
        </div>
        
        <div className="flex-1">
          <h2 className="text-xl font-medium text-gray-900 mb-2">{title}</h2>
          <p className="text-sm text-gray-500 mb-8">
            {description}
          </p>
        </div>

        <div className="flex items-center space-x-2 text-sm font-medium text-blue-600 group-hover:text-blue-800 transition-colors mt-auto">
          <span>Establish Connection</span>
          <ArrowRight size={16} />
        </div>
      </div>
    </Link>
  );
}
