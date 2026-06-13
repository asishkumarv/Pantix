import logo from "@/assets/pantix-round-logo.png";
import { Link } from "@/lib/router-compat";

export function Logo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const dim = size === "sm" ? "h-14" : size === "lg" ? "h-20" : "h-16";
  return (
    <Link
      to="/"
      aria-label="Pantix — The Queen's World"
      className="flex items-center select-none group"
    >
      <img
        src={logo}
        alt="Pantix"
        className={`${dim} w-auto rounded-full object-contain shadow-gold ring-2 ring-gold/50 group-hover:ring-gold transition`}
      />
    </Link>
  );
}
