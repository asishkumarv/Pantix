import { Bell, RefreshCw, ChevronDown, Menu, Search } from "lucide-react";
import { useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/apiFetch";
import { API_URL } from "@/api";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { ConfirmationModal } from "@/components/ui/ConfirmationModal";

const titles: Record<string, string> = {
  "/": "Dashboard Overview",
  "/orders": "Orders",
  "/products": "Products",
  "/products/new": "Add Product",
  "/categories": "Categories",
  "/users": "Users",
  "/resellers": "Resellers",
  "/reports": "Reports",
  "/settings": "Settings",
};

export default function AdminHeader({ onMenu }: { onMenu: () => void }) {
  const { user, logout } = useAuth();
  const { pathname } = useLocation();
  const title = titles[pathname] ?? "Pantix";
  const [spinning, setSpinning] = useState(false);
  const [confirmLogoutOpen, setConfirmLogoutOpen] = useState(false);

  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const formatRelativeTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    if (diffMs < 0) return "just now";
    const diffSecs = Math.floor(diffMs / 1000);
    if (diffSecs < 60) return "just now";
    const diffMins = Math.floor(diffSecs / 60);
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  const fetchNotifications = async () => {
    try {
      const res = await apiFetch(`${API_URL}/api/dashboard/notifications`);
      if (!res.ok) throw new Error("Failed to fetch notifications");
      const data = await res.json();
      
      setNotifications((prev) => {
        if (prev.length > 0 && data.length > 0) {
          const prevLatestTime = new Date(prev[0].time).getTime();
          const newLatestTime = new Date(data[0].time).getTime();
          if (newLatestTime > prevLatestTime) {
            const newItems = data.filter(
              (item: any) => new Date(item.time).getTime() > prevLatestTime
            );
            setUnreadCount((c) => c + newItems.length);
          }
        } else if (prev.length === 0 && data.length > 0) {
          setUnreadCount(data.length);
        }
        return data;
      });
    } catch (err) {
      console.error("Notifications fetch error:", err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleDropdownOpenChange = (open: boolean) => {
    if (open) {
      setUnreadCount(0);
    }
  };

  const refresh = async () => {
    setSpinning(true);
    await fetchNotifications();
    toast.success("Data synced", { description: "Latest notifications and metrics loaded" });
    setSpinning(false);
  };

  return (
    <header className="sticky top-0 z-30 h-[70px] bg-card/80 backdrop-blur-md border-b border-border shadow-card print:hidden">
      <div className="h-full flex items-center justify-between px-4 lg:px-8 gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onMenu}
            className="lg:hidden p-2 rounded-lg hover:bg-muted transition-smooth"
          >
            <Menu className="w-5 h-5" />
          </button>
          <h1 className="text-lg lg:text-xl font-semibold tracking-tight truncate">{title}</h1>
        </div>

        <div className="hidden md:flex flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search orders, products, users…" className="pl-9 bg-muted/50 border-0 h-10" />
          </div>
        </div>

        <div className="flex items-center gap-1.5 lg:gap-2">
          <button
            onClick={refresh}
            title="Sync"
            className="p-2.5 rounded-lg hover:bg-muted transition-smooth"
          >
            <RefreshCw className={`w-[18px] h-[18px] text-muted-foreground ${spinning ? "animate-spin" : ""}`} />
          </button>

          <DropdownMenu onOpenChange={handleDropdownOpenChange}>
            <DropdownMenuTrigger asChild>
              <button className="relative p-2.5 rounded-lg hover:bg-muted transition-smooth">
                <Bell className="w-[18px] h-[18px] text-muted-foreground" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-destructive ring-2 ring-card" />
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-72 max-h-96 overflow-y-auto">
              <DropdownMenuLabel className="flex justify-between items-center">
                <span>Notifications</span>
                {unreadCount > 0 && (
                  <span className="text-[10px] bg-destructive/15 text-destructive px-1.5 py-0.5 rounded-full font-medium">
                    {unreadCount} new
                  </span>
                )}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {notifications.length === 0 ? (
                <div className="py-6 text-center text-xs text-muted-foreground">
                  No new notifications
                </div>
              ) : (
                notifications.map((n) => (
                  <DropdownMenuItem key={n.id} className="flex-col items-start gap-0.5 py-2">
                    <span className="text-sm font-medium">{n.title}</span>
                    <span className="text-xs text-muted-foreground">{n.description}</span>
                    <span className="text-[10px] text-muted-foreground/75 mt-0.5">
                      {formatRelativeTime(n.time)}
                    </span>
                  </DropdownMenuItem>
                ))
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 pl-2 pr-2.5 py-1.5 rounded-lg hover:bg-muted transition-smooth">
                <div className="w-8 h-8 rounded-full bg-primary-gradient grid place-items-center text-white text-sm font-semibold">
                  {user?.name?.[0] ?? "A"}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-medium leading-tight">{user?.name}</p>
                  <p className="text-[10px] text-muted-foreground leading-tight">{user?.role}</p>
                </div>
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>{user?.email}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Profile</DropdownMenuItem>
              <DropdownMenuItem>Settings</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setConfirmLogoutOpen(true)} className="text-destructive focus:text-destructive">
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <ConfirmationModal
        open={confirmLogoutOpen}
        onOpenChange={setConfirmLogoutOpen}
        title="Sign Out"
        description="Are you sure you want to sign out of the Pantix admin panel?"
        confirmText="Sign out"
        isDestructive={true}
        onConfirm={logout}
      />
    </header>
  );
}
