import { Link } from "@/lib/router-compat";
import { Instagram, MessageCircle, Mail, MapPin } from "lucide-react";
import { Logo } from "./Logo";

export function Footer() {
  return (
    <footer className="mt-10 border-t border-gold/20 bg-emerald-deep">
      <div className="mx-auto max-w-7xl px-4 py-12 grid gap-10 md:grid-cols-4">
        <div>
          <Logo />
          <p className="mt-4 text-sm text-muted-foreground max-w-xs">
            Luxury women's fashion crafted for the modern queen. Heritage
            silhouettes, contemporary soul.
          </p>
        </div>
        <div>
          <h4 className="text-gold text-sm uppercase tracking-[0.25em] mb-4">
            Shop
          </h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>
              <Link to="/categories" className="hover:text-gold">
                All Categories
              </Link>
            </li>
            <li>
              <Link
                to="/category/three-piece"
                className="hover:text-gold"
              >
                3 Piece Kurta Sets
              </Link>
            </li>
            <li>
              <Link to="/category/frocks" className="hover:text-gold">
                Frocks
              </Link>
            </li>
            <li>
              <Link to="/budget" className="hover:text-gold">
                Budget Friendly
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h4 className="text-gold text-sm uppercase tracking-[0.25em] mb-4">
            Help
          </h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>
              <Link to="/track" className="hover:text-gold">
                Track Order
              </Link>
            </li>
            <li>
              <Link to="/contact" className="hover:text-gold">
                Contact Us
              </Link>
            </li>
            <li>
              <Link to="/policies" className="hover:text-gold">
                Privacy & Refund
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h4 className="text-gold text-sm uppercase tracking-[0.25em] mb-4">
            Reach Us
          </h4>
          <ul className="space-y-3 text-sm text-muted-foreground">
            <li className="flex gap-2"><Mail className="h-4 w-4 text-gold mt-0.5" /><span>info@pantix.in</span></li>
            <li className="flex gap-2"><MessageCircle className="h-4 w-4 text-gold mt-0.5" /><span>+91 9640369511</span></li>
            <li className="flex gap-3 pt-1">
              <a
                href="https://wa.me/919640369511"
                className="text-gold hover:text-primary-glow"
                aria-label="WhatsApp"
              >
              </a>
              {/* <a
                href="https://instagram.com"
                className="text-gold hover:text-primary-glow"
                aria-label="Instagram"
              >
                <Instagram className="h-4 w-4" />
              </a> */}
            </li>
          </ul>
        </div>
      </div>
      <div className="gold-divider" />
      <div className="mx-auto max-w-7xl px-4 py-5 text-xs text-muted-foreground flex flex-col md:flex-row justify-between gap-2">
        <p>© {new Date().getFullYear()} Pantix. All rights reserved.</p>
        <p className="tracking-[0.3em] uppercase text-gold/70">
          The queen's world
        </p>
      </div>
    </footer>
  );
}
