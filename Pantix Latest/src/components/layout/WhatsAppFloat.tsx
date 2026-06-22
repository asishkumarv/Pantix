import { MessageCircle } from "lucide-react";

export function WhatsAppFloat() {
  return (
    <a
      href="https://wa.me/919640369511?text=Hi%20Pantix%2C%20I%27d%20like%20to%20know%20more%20about%20your%20collection."
      target="_blank"
      rel="noreferrer"
      aria-label="Chat on WhatsApp"
      className="fixed bottom-20 md:bottom-6 right-4 z-30 h-14 w-14 grid place-items-center rounded-full bg-emerald-deep border-2 border-gold text-gold shadow-gold hover:scale-110 hover:bg-gold hover:text-emerald-deep transition-all"
    >
      <MessageCircle className="h-6 w-6" />
    </a>
  );
}
