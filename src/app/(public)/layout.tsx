import React from "react";
import { Navbar } from "@/components/layout/Navbar";
import { PriceTicker } from "@/components/layout/PriceTicker";
import { Footer } from "@/components/layout/Footer";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen bg-cream-50 font-sans text-slate-800">
      <Navbar />
      <PriceTicker />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
