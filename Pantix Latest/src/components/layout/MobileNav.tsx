import { NavLink } from "@/lib/router-compat";
import { Home, LayoutGrid, Clock, Package, User } from "lucide-react";

type Item = {
  to: string;
  label: string;
  icon: typeof Home;
  end?: boolean;
};

const items: Item[] = [
  { to: "/", label: "Home", icon: Home, end: true },
  { to: "/shop", label: "Shop", icon: LayoutGrid },
  { to: "/recently-viewed", label: "Recent", icon: Clock },
  { to: "/account/orders", label: "Orders", icon: Package },
  { to: "/account", label: "Account", icon: User, end: true },
];

export function MobileNav() {
  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-30 glass-nav">
      <ul className="grid grid-cols-5">
        {items.map(({ to, label, icon: Icon, end }) => (
          <li key={to}>
            <NavLink
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-1.5 py-3 min-h-[56px] transition-colors ${
                  isActive ? "text-gold" : "text-foreground hover:text-gold"
                }`
              }
            >
              <Icon className="h-[20px] w-[20px]" />
              <span className="text-[11px] uppercase tracking-wider font-semibold">
                {label}
              </span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
