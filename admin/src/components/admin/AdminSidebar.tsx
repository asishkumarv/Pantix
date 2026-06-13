import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard, ShoppingCart, Package, PlusSquare, Tags,
  Users as UsersIcon, Network, BarChart3, Settings, LogOut, Sparkles, X
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import { ConfirmationModal } from "@/components/ui/ConfirmationModal";

const items = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/orders", label: "Orders", icon: ShoppingCart },
  { to: "/products", label: "Products", icon: Package },
  { to: "/products/new", label: "Add Product", icon: PlusSquare },
  { to: "/categories", label: "Categories", icon: Tags },
  { to: "/users", label: "Users", icon: UsersIcon },
  { to: "/resellers", label: "Resellers", icon: Network },
  { to: "/reports", label: "Reports", icon: BarChart3 },
  { to: "/settings", label: "Settings", icon: Settings },
];

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function AdminSidebar({ open, onClose }: Props) {
  const { logout, user } = useAuth();
  const location = useLocation();
  const [confirmLogoutOpen, setConfirmLogoutOpen] = useState(false);

  return (
    <>
      {/* Mobile overlay */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden transition-opacity",
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />

      <aside
        className={cn(
          "fixed lg:sticky top-0 left-0 z-50 h-screen w-[240px] shrink-0",
          "bg-sidebar-gradient text-sidebar-foreground border-r border-sidebar-border",
          "flex flex-col transition-transform duration-300",
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Logo */}
        <div className="h-[70px] flex items-center justify-between px-6 border-b border-sidebar-border">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary-gradient grid place-items-center shadow-glow">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white">Pantix</span>
          </div>
          <button onClick={onClose} className="lg:hidden text-sidebar-foreground hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto scrollbar-sidebar py-5 px-3">
          <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/50">
            Main Menu
          </p>
          <ul className="space-y-1">
            {items.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    end={item.end}
                    onClick={onClose}
                    className={({ isActive }) =>
                      cn(
                        "group relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-smooth",
                        "hover:bg-sidebar-accent hover:text-white",
                        isActive
                          ? "bg-sidebar-accent text-white shadow-glow before:absolute before:left-0 before:top-1.5 before:bottom-1.5 before:w-1 before:rounded-r-full before:bg-primary"
                          : "text-sidebar-foreground"
                      )
                    }
                  >
                    <Icon className="w-[18px] h-[18px]" />
                    <span>{item.label}</span>
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User + logout */}
        <div className="p-3 border-t border-sidebar-border">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-sidebar-accent/50">
            <div className="w-9 h-9 rounded-full bg-primary-gradient grid place-items-center text-white font-semibold text-sm">
              {user?.name?.[0] ?? "A"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.name}</p>
              <p className="text-[11px] text-sidebar-foreground/60 truncate">{user?.role}</p>
            </div>
          </div>
          <button
            onClick={() => setConfirmLogoutOpen(true)}
            className="mt-2 w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-sidebar-foreground hover:bg-destructive/20 hover:text-destructive transition-smooth"
          >
            <LogOut className="w-[18px] h-[18px]" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      <ConfirmationModal
        open={confirmLogoutOpen}
        onOpenChange={setConfirmLogoutOpen}
        title="Sign Out"
        description="Are you sure you want to sign out of the Pantix admin panel?"
        confirmText="Sign out"
        isDestructive={true}
        onConfirm={logout}
      />
    </>
  );
}
