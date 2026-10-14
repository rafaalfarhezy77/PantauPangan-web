import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Lora } from "next/font/google";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const lora = Lora({
  variable: "--font-serif",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "PantauPangan v2.0 | Sistem Informasi Harga Komoditas Pangan Nasional",
  description: "Platform agregasi dan pemantauan harga pangan strategis nasional real-time terintegrasi API Indonesia.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={`${plusJakartaSans.variable} ${lora.variable}`}>
      <body className="min-h-screen bg-background font-sans text-foreground antialiased selection:bg-mint-200 selection:text-forest-900">
        <TooltipProvider>
          {children}
          <Toaster richColors position="top-right" closeButton />
        </TooltipProvider>
      </body>
    </html>
  );
}
