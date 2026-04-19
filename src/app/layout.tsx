import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Nexus - Participant & Manager Portal",
  description: "Swiss Minimalist Experience",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased font-sans bg-white text-black">
        {children}
      </body>
    </html>
  );
}
