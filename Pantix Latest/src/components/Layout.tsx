import type { ReactNode } from "react";
import { Navbar } from "./layout/Navbar";
import { Footer } from "./layout/Footer";
import { MobileNav } from "./layout/MobileNav";
import { WhatsAppFloat } from "./layout/WhatsAppFloat";

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 pt-20 lg:pt-24">{children}</main>
      <Footer />
      <WhatsAppFloat />
      <MobileNav />
    </div>
  );
}
