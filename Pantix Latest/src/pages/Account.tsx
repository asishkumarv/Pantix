import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "@/lib/router-compat";
import {
  User as UserIcon,
  Heart,
  Package,
  MapPin,
  LogOut,
  Pencil,
  ChevronRight,
  ArrowLeft,
  type LucideIcon,
  Coins,
  TrendingUp,
  Wallet,
  ArrowUpRight
} from "lucide-react";
import { Layout } from "@/components/Layout";
import { useStore } from "@/lib/store";

import { toast } from "sonner";
import {
  ProfileTab,
  OrdersTab,
  AddressesTab,
} from "@/components/account/AccountTabs";

type TabKey = "menu" | "profile" | "orders" | "addresses" | "reseller";

const Account = () => {
  const {
    user,
    logout,
    updateProfile,
    addresses,
    addAddress,
    removeAddress,
  } = useStore();
  const [orders, setOrders] = useState<{ id: string; date: string; total: number; status: string; items?: any[] }[]>([]);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const navigate = useNavigate();
  const { pathname } = useLocation();

  // Derive active section from URL
  const active: TabKey = useMemo(() => {
    if (pathname.startsWith("/account/profile")) return "profile";
    if (pathname.startsWith("/account/orders")) return "orders";
    if (pathname.startsWith("/account/addresses")) return "addresses";
    if (pathname.startsWith("/account/reseller")) return "reseller";
    return "menu";
  }, [pathname]);

  useEffect(() => {
    const fetchOrders = async () => {
      if (!user) {
        setOrders([]);
        return;
      }

      try {
        const token = localStorage.getItem("pantix_token");
        const res = await fetch("https://pantix-final-3.onrender.com/api/orders", {
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });

        if (!res.ok) {
          setOrders([]);
          return;
        }

        const data = await res.json();
        setOrders(
          (data || []).map((o: any) => ({
            id: o.id,
            date: o.date,
            total: Number(o.total || 0),
            status: o.status,
            items: typeof o.items === "string" ? (() => { try { return JSON.parse(o.items); } catch { return []; } })() : o.items || [],
          }))
        );
      } catch {
        setOrders([]);
      }
    };

    fetchOrders();
  }, [user]);

  if (!user) {
    return (
      <Layout>
        <div className="mx-auto max-w-md px-4 pt-8 pb-20 text-center">
          <div className="mx-auto h-16 w-16 grid place-items-center rounded-full border border-gold/30 text-gold mb-4">
            <UserIcon className="h-6 w-6" />
          </div>
          <h1 className="font-display text-4xl gradient-text-gold inline-block">
            Welcome, Queen
          </h1>
          <p className="mt-3 text-muted-foreground">
            Sign in to manage your orders, addresses & saved pieces.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Link to="/login" className="btn-gold">
              Sign In
            </Link>
            <Link to="/register" className="btn-outline-gold">
              Register
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  const menuItems: {
    key: string;
    to: string;
    icon: LucideIcon;
    title: string;
    sub: string;
  }[] = [
    {
      key: "orders",
      to: "/account/orders",
      icon: Package,
      title: "My Orders",
      sub: "Track and manage your orders",
    },
    {
      key: "reseller",
      to: "/account/reseller",
      icon: Coins,
      title: "Resell & Earn",
      sub: "Manage earnings & margins",
    },
    {
      key: "wishlist",
      to: "/wishlist",
      icon: Heart,
      title: "Wishlist",
      sub: "Your saved items",
    },
    {
      key: "addresses",
      to: "/account/addresses",
      icon: MapPin,
      title: "Saved Addresses",
      sub: "Manage delivery addresses",
    },
    {
      key: "profile",
      to: "/account/profile",
      icon: UserIcon,
      title: "Edit Profile",
      sub: "Update your details",
    },
  ];

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = () => {
    logout();
    toast.success("You've been signed out. See you soon! 👋");
    navigate("/");
  };

  // Renders the chosen section content (used in mobile sub-page + desktop right panel)
  const renderSection = () => {
    if (active === "profile")
      return <ProfileTab user={user} onUpdate={updateProfile} />;
    if (active === "orders") return <OrdersTab orders={orders} />;
    if (active === "addresses")
      return (
        <AddressesTab
          addresses={addresses}
          addAddress={addAddress}
          removeAddress={removeAddress}
        />
      );
    if (active === "reseller")
      return <ResellerTab />;
    return null;
  };

  return (
    <Layout>
      <section className="pt-4 pb-24 md:pt-6 md:pb-14">
        <div className="mx-auto max-w-6xl px-4 lg:px-8">
          {/* ───────────── MOBILE: sub-page view ───────────── */}
          {active !== "menu" && (
            <div className="lg:hidden">
              <button
                onClick={() => navigate("/account")}
                className="inline-flex items-center gap-2 text-sm text-gold mb-4 hover:text-primary-glow"
              >
                <ArrowLeft className="h-4 w-4" /> Back to account
              </button>
              <div className="bg-card border border-gold/20 rounded-xl p-5 shadow-card">
                {renderSection()}
              </div>
            </div>
          )}

          {/* ───────────── MOBILE: menu view ───────────── */}
          {active === "menu" && (
            <div className="lg:hidden space-y-4">
              <ProfileHeaderCard
                user={user}
                onEdit={() => navigate("/account/profile")}
              />
              {menuItems.map((m) => (
                <MenuCard
                  key={m.key}
                  to={m.to}
                  icon={m.icon}
                  title={m.title}
                  sub={m.sub}
                />
              ))}
              {/* Inline logout — mobile */}
              <button
                onClick={handleLogout}
                className="w-full mt-2 inline-flex items-center justify-center gap-2 px-4 py-3 border border-gold/40 text-gold rounded-xl hover:bg-gold/10 transition"
              >
                <LogOut className="h-4 w-4" /> Logout
              </button>
            </div>
          )}

          {/* ───────────── DESKTOP: 2-column layout ───────────── */}
          <div className="hidden lg:grid lg:grid-cols-[380px_1fr] gap-8">
            <aside className="space-y-4">
              <ProfileHeaderCard
                user={user}
                onEdit={() => navigate("/account/profile")}
              />
              {menuItems.map((m) => (
                <MenuCard
                  key={m.key}
                  to={m.to}
                  icon={m.icon}
                  title={m.title}
                  sub={m.sub}
                  active={active === m.key}
                />
              ))}
              {/* Logout — desktop */}
              <button
                onClick={handleLogout}
                className="w-full mt-2 inline-flex items-center justify-center gap-2 px-4 py-3 border border-gold/40 text-gold rounded-xl hover:bg-gold/10 transition"
              >
                <LogOut className="h-4 w-4" /> Logout
              </button>
            </aside>

            <div className="bg-card border border-gold/20 rounded-xl p-8 shadow-card min-h-[420px]">
              {active === "menu" ? (
                <DesktopWelcome name={user.name} />
              ) : (
                renderSection()
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Sign Out Overlay Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
          {/* Dark backdrop */}
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setShowLogoutConfirm(false)}
          />
          {/* Modal card */}
          <div className="relative z-10 w-full max-w-sm bg-card border border-gold/20 rounded-2xl shadow-2xl p-8 flex flex-col items-center text-center gap-5 animate-fade-in">
            {/* Warning icon */}
            <div className="w-16 h-16 rounded-full bg-destructive/15 border border-destructive/30 flex items-center justify-center">
              <svg className="w-8 h-8 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
            </div>
            {/* Text */}
            <div className="space-y-2">
              <h3 className="font-display text-2xl text-white font-bold">Sign Out</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Are you sure you want to sign out of Pantix?
              </p>
            </div>
            {/* Actions */}
            <div className="flex gap-3 w-full pt-1">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 py-3 bg-card border border-gold/30 hover:bg-gold/10 text-white font-semibold text-sm rounded-xl transition"
              >
                Cancel
              </button>
              <button
                onClick={confirmLogout}
                className="flex-1 py-3 bg-destructive hover:bg-destructive/90 text-white font-bold text-sm rounded-xl transition shadow-lg"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

/* ───────────── Sub-components ───────────── */

function ProfileHeaderCard({
  user,
  onEdit,
}: {
  user: { name: string; email: string; phone?: string };
  onEdit: () => void;
}) {
  return (
    <div className="relative bg-card/60 border border-gold/30 rounded-xl p-4 md:p-5 shadow-card">
      <div className="flex items-center gap-4">
        <div className="h-14 w-14 md:h-16 md:w-16 shrink-0 grid place-items-center rounded-full bg-gradient-gold text-primary-foreground font-display text-2xl md:text-3xl shadow-gold">
          {user.name.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0 pr-8">
          <h2 className="font-display text-xl md:text-2xl text-foreground truncate leading-tight">
            {user.name}
          </h2>
          <p className="text-xs md:text-sm text-foreground/80 truncate">
            {user.email}
          </p>
          {user.phone && (
            <p className="text-xs md:text-sm text-foreground/70 mt-0.5">
              {user.phone}
            </p>
          )}
        </div>
        <button
          onClick={onEdit}
          aria-label="Edit profile"
          className="absolute top-4 right-4 text-gold hover:text-primary-glow transition-colors"
        >
          <Pencil className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}

function MenuCard({
  to,
  icon: Icon,
  title,
  sub,
  active,
}: {
  to: string;
  icon: LucideIcon;
  title: string;
  sub: string;
  active?: boolean;
}) {
  return (
    <Link
      to={to}
      className={`group flex items-center gap-4 p-4 md:p-5 rounded-xl border transition-all ${
        active
          ? "border-gold bg-gold/10 shadow-gold"
          : "border-gold/25 bg-card/40 hover:border-gold/60 hover:bg-card/70"
      }`}
    >
      <div
        className={`h-12 w-12 md:h-14 md:w-14 shrink-0 grid place-items-center rounded-xl border transition-colors ${
          active
            ? "border-gold/60 bg-emerald-deep text-gold"
            : "border-gold/30 bg-emerald-deep/60 text-gold group-hover:border-gold/60"
        }`}
      >
        <Icon className="h-5 w-5 md:h-6 md:w-6" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-display text-lg md:text-xl text-foreground leading-tight">
          {title}
        </p>
        <p className="text-xs md:text-sm text-foreground/65 mt-0.5">{sub}</p>
      </div>
      <ChevronRight className="h-5 w-5 text-gold shrink-0" />
    </Link>
  );
}

function DesktopWelcome({ name }: { name: string }) {
  return (
    <div className="h-full flex flex-col items-center justify-center text-center py-16">
      <p className="text-xs uppercase tracking-[0.4em] text-gold/80 mb-3">
        Your Royal Dashboard
      </p>
      <h1 className="font-display text-4xl gradient-text-gold inline-block">
        Welcome back, {name.split(" ")[0]}
      </h1>
      <p className="mt-4 max-w-md text-muted-foreground">
        Select an option from the left to manage your orders, wishlist,
        addresses, or update your profile details.
      </p>
      <div className="gold-divider w-32 mt-8" />
    </div>
  );
}

function ResellerTab() {
  const { user, enableReseller, refreshUser } = useStore();
  const [loading, setLoading] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);

  // Form states
  const [bankName, setBankName] = useState("");
  const [bankPhone, setBankPhone] = useState("");
  const [bankAccount, setBankAccount] = useState("");
  const [bankIFSC, setBankIFSC] = useState("");
  const [bankAmount, setBankAmount] = useState("");
  const [submittingWithdrawal, setSubmittingWithdrawal] = useState(false);

  // Data states
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [referrals, setReferrals] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [resellerStats, setResellerStats] = useState<{
    tier: string;
    nextTier: string | null;
    nextTierThreshold: number | null;
    progress: number;
    totalEarnings: number;
    totalReferrals: number;
    monthlyEarnings: number;
    monthlyReferrals: number;
  } | null>(null);

  const fetchHistory = useCallback(async () => {
    const token = localStorage.getItem("pantix_token");
    if (!token) return;
    setLoadingHistory(true);
    try {
      // Fetch withdrawals
      const wRes = await fetch("https://pantix-final-3.onrender.com/api/resellers/withdrawals", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (wRes.ok) {
        const wData = await wRes.json();
        setWithdrawals(wData);
      }

      // Fetch referrals
      const rRes = await fetch("https://pantix-final-3.onrender.com/api/resellers/referrals", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (rRes.ok) {
        const rData = await rRes.json();
        setReferrals(rData);
      }

      // Fetch live tier stats
      const sRes = await fetch("https://pantix-final-3.onrender.com/api/resellers/stats", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (sRes.ok) {
        const sData = await sRes.json();
        setResellerStats(sData);
      }
    } catch (err) {
      console.error("Failed to fetch reseller history:", err);
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
    if (user?.is_reseller) {
      fetchHistory();
    }
  }, [refreshUser, user?.is_reseller, fetchHistory]);

  const handleActivate = async () => {
    setLoading(true);
    const success = await enableReseller();
    if (success) {
      fetchHistory();
    }
    setLoading(false);
  };

  const handleWithdrawSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem("pantix_token");
    if (!token) {
      toast.error("Please login to request withdrawals");
      return;
    }

    const amount = Number(bankAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid amount greater than 0");
      return;
    }

    if (amount > Number(user?.wallet_balance || 0)) {
      toast.error("Requested amount exceeds your wallet balance!");
      return;
    }

    setSubmittingWithdrawal(true);
    try {
      const res = await fetch("https://pantix-final-3.onrender.com/api/resellers/withdrawals", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: bankName,
          phone: bankPhone,
          account_number: bankAccount,
          ifsc_code: bankIFSC,
          amount
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Withdrawal request failed");
      }

      toast.success("Bank withdrawal requested successfully! 💰");
      setShowWithdrawModal(false);
      // Reset form
      setBankName("");
      setBankPhone("");
      setBankAccount("");
      setBankIFSC("");
      setBankAmount("");
      // Refresh balance and list
      await refreshUser();
      await fetchHistory();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Could not request withdrawal");
    } finally {
      setSubmittingWithdrawal(false);
    }
  };

  if (!user?.is_reseller) {
    return (
      <div className="space-y-6 animate-fade-in py-4">
        <div className="text-center max-w-md mx-auto space-y-4">
          <div className="w-16 h-16 rounded-full bg-gold/10 mx-auto flex items-center justify-center text-gold border border-gold/30">
            <Coins className="w-8 h-8" />
          </div>
          <h2 className="font-display text-3xl text-gold">Unlock Reseller Mode</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Empower your network and start earning passive income today! No separate registration required. Just enable reseller mode and start sharing products with custom profit margins.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3 max-w-xl mx-auto pt-4">
          {[
            { t: "1. Share", d: "Choose any product and add your desired profit margin." },
            { t: "2. Refer", d: "Generate your unique link and share it on social media." },
            { t: "3. Earn", d: "When someone orders, profit commission goes straight to your wallet." }
          ].map((step, idx) => (
            <div key={idx} className="p-4 border border-gold/15 bg-card/40 rounded-xl space-y-1">
              <p className="text-xs font-semibold text-gold uppercase tracking-wider">{step.t}</p>
              <p className="text-[11px] text-muted-foreground leading-normal">{step.d}</p>
            </div>
          ))}
        </div>

        <div className="text-center pt-4">
          <button
            onClick={handleActivate}
            disabled={loading}
            className="btn-gold min-w-[200px]"
          >
            {loading ? "Activating..." : "Activate Reseller Mode 🚀"}
          </button>
        </div>
      </div>
    );
  }

  // Tier config
  const tierConfig: Record<string, { color: string; bg: string; border: string; icon: string }> = {
    Bronze: { color: "text-yellow-600", bg: "bg-yellow-800/20", border: "border-yellow-700/30", icon: "🥉" },
    Silver: { color: "text-slate-300", bg: "bg-slate-500/20", border: "border-slate-400/30", icon: "🥈" },
    Gold: { color: "text-gold", bg: "bg-gold/15", border: "border-gold/40", icon: "🥇" },
    Platinum: { color: "text-emerald-bright", bg: "bg-emerald-500/15", border: "border-emerald-500/40", icon: "💎" },
  };
  const currentTier = resellerStats?.tier || "Bronze";
  const tc = tierConfig[currentTier] || tierConfig.Bronze;

  return (
    <div className="space-y-6 animate-fade-in py-2">
      {/* Header with live tier badge */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="font-display text-3xl text-gold">Reseller Console</h2>
          <p className="text-xs text-muted-foreground">Manage your profit margins & referred orders</p>
        </div>
        <div className={`px-3 py-1.5 ${tc.bg} ${tc.border} border rounded-full text-xs font-semibold ${tc.color} tracking-wider uppercase flex items-center gap-1.5`}>
          <span>{tc.icon}</span>
          {currentTier} Reseller
        </div>
      </div>

      {/* Tier Progress Bar */}
      {resellerStats && (
        <div className="p-4 border border-gold/15 bg-card/30 rounded-2xl space-y-2">
          <div className="flex justify-between items-center text-[11px]">
            <span className={`font-semibold ${tc.color} uppercase tracking-wider`}>{currentTier}</span>
            {resellerStats.nextTier ? (
              <span className="text-muted-foreground">
                ₹{resellerStats.totalEarnings.toLocaleString("en-IN")} / ₹{resellerStats.nextTierThreshold?.toLocaleString("en-IN")} to {resellerStats.nextTier}
              </span>
            ) : (
              <span className="text-emerald-bright font-semibold">🏆 Max Tier Reached!</span>
            )}
          </div>
          <div className="w-full bg-background/50 rounded-full h-2 overflow-hidden border border-gold/10">
            <div
              className="h-full bg-gradient-to-r from-gold to-primary-glow rounded-full transition-all duration-700"
              style={{ width: `${resellerStats.progress}%` }}
            />
          </div>
          <p className="text-[10px] text-muted-foreground">
            Tier is based on your total lifetime commission earnings from referred orders.
          </p>
        </div>
      )}

      {/* Wallet Card */}
      <div className="grid md:grid-cols-[1fr_240px] gap-4">
        <div className="p-6 border border-gold/25 bg-gradient-to-br from-gold/10 via-emerald-deep/20 to-transparent rounded-2xl shadow-royal flex flex-col justify-between min-h-[160px]">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-widest text-gold/80 font-semibold">Wallet Balance</p>
              <h3 className="font-display text-4xl text-white font-bold">
                ₹{Number(user.wallet_balance || 0).toLocaleString("en-IN")}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center text-gold border border-gold/20">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          
          <div className="flex gap-3 pt-4">
            <button
              onClick={() => setShowWithdrawModal(true)}
              className="px-4 py-2 bg-gold hover:bg-primary-glow text-primary-foreground font-semibold text-xs rounded-xl uppercase tracking-wider transition shadow-gold"
            >
              Withdraw to Bank
            </button>
            <button
              onClick={() => setShowGuideModal(true)}
              className="px-4 py-2 border border-gold/30 hover:bg-gold/10 text-gold font-semibold text-xs rounded-xl uppercase tracking-wider transition"
            >
              Commissions Guide
            </button>
          </div>
        </div>

        {/* Mini stats — live from backend */}
        <div className="grid gap-3">
          <div className="p-4 border border-gold/15 bg-card/50 rounded-2xl flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gold/10 flex items-center justify-center text-gold">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Total Referrals</p>
              <p className="text-base font-bold text-white">{resellerStats?.totalReferrals ?? referrals.length} Orders</p>
            </div>
          </div>
          <div className="p-4 border border-gold/15 bg-card/50 rounded-2xl flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gold/10 flex items-center justify-center text-gold">
              <ArrowUpRight className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Earnings This Month</p>
              <p className="text-base font-bold text-white">₹{(resellerStats?.monthlyEarnings ?? 0).toLocaleString("en-IN")}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Referrals ledger */}
      <div className="space-y-3">
        <h3 className="font-display text-xl text-gold">Recent Referrals</h3>
        {referrals.length === 0 ? (
          <div className="p-6 border border-gold/10 rounded-2xl bg-card/20 text-center text-xs text-muted-foreground">
            No referred purchases yet. Share your curated product links to start earning! ✨
          </div>
        ) : (
          <div className="border border-gold/15 bg-card/30 rounded-2xl overflow-hidden text-xs">
            <div className="grid grid-cols-[1fr_80px_100px] p-3 bg-gold/5 font-semibold text-gold/80 border-b border-gold/15 uppercase tracking-wider text-[10px]">
              <span>Ref Details</span>
              <span>Commission</span>
              <span className="text-right">Status</span>
            </div>
            {referrals.map((ref, i) => (
              <div key={i} className="grid grid-cols-[1fr_80px_100px] p-3 border-b border-gold/10 items-center hover:bg-gold/5 transition">
                <div className="space-y-0.5">
                  <p className="font-semibold text-white">Order #{ref.id.slice(0, 8)} · Curated purchase</p>
                  <p className="text-[10px] text-muted-foreground">
                    {new Date(ref.date).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric"
                    })}
                  </p>
                </div>
                <p className="font-bold text-gold">+₹{Number(ref.reseller_commission)}</p>
                <span className={`text-right text-[10px] uppercase font-semibold tracking-wider ${
                  ref.status === "Delivered" ? "text-emerald-bright" : "text-gold"
                }`}>
                  {ref.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Withdrawals ledger */}
      <div className="space-y-3">
        <h3 className="font-display text-xl text-gold">Withdrawal Requests</h3>
        {withdrawals.length === 0 ? (
          <div className="p-6 border border-gold/10 rounded-2xl bg-card/20 text-center text-xs text-muted-foreground">
            No bank withdrawal requests placed yet.
          </div>
        ) : (
          <div className="border border-gold/15 bg-card/30 rounded-2xl overflow-hidden text-xs">
            <div className="grid grid-cols-[1.5fr_1fr_100px] p-3 bg-gold/5 font-semibold text-gold/80 border-b border-gold/15 uppercase tracking-wider text-[10px]">
              <span>Withdrawal Details</span>
              <span>Amount</span>
              <span className="text-right">Status</span>
            </div>
            {withdrawals.map((w, i) => (
              <div key={i} className="grid grid-cols-[1.5fr_1fr_100px] p-3 border-b border-gold/10 items-center hover:bg-gold/5 transition">
                <div className="space-y-0.5">
                  <p className="font-semibold text-white">Bank: {w.account_number.slice(0, 2)}***{w.account_number.slice(-4)}</p>
                  <p className="text-[10px] text-muted-foreground">
                    IFSC: {w.ifsc_code} · {new Date(w.created_at).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric"
                    })}
                  </p>
                </div>
                <p className="font-bold text-destructive/90">-₹{Number(w.amount)}</p>
                <span className={`text-right text-[10px] uppercase font-semibold tracking-wider ${
                  w.status === "Approved"
                    ? "text-emerald-bright"
                    : w.status === "Rejected"
                      ? "text-destructive"
                      : "text-gold"
                }`}>
                  {w.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Withdrawal Form Modal */}
      {showWithdrawModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/75 backdrop-blur-sm"
            onClick={() => setShowWithdrawModal(false)}
          />

          {/* Form */}
          <div className="relative z-10 w-full max-w-md border border-gold/30 bg-card rounded-2xl shadow-2xl p-6 space-y-4 text-left">
            <div className="flex items-center justify-between border-b border-gold/10 pb-3">
              <h3 className="font-display text-lg text-gold">Withdrawal Request</h3>
              <button
                onClick={() => setShowWithdrawModal(false)}
                className="p-1 rounded hover:bg-gold/10 text-gold/60 hover:text-gold"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleWithdrawSubmit} className="space-y-3.5 text-sm">
              <label className="block space-y-1">
                <span className="text-[10px] uppercase tracking-widest text-gold font-semibold">Account Holder Name</span>
                <input
                  required
                  type="text"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  placeholder="Bhargav Kumar"
                  className="w-full bg-background border border-gold/25 rounded px-3 py-2 text-white focus:outline-none focus:border-gold"
                />
              </label>

              <label className="block space-y-1">
                <span className="text-[10px] uppercase tracking-widest text-gold font-semibold">Contact Phone Number</span>
                <input
                  required
                  type="text"
                  value={bankPhone}
                  onChange={(e) => setBankPhone(e.target.value)}
                  placeholder="9876543210"
                  className="w-full bg-background border border-gold/25 rounded px-3 py-2 text-white focus:outline-none focus:border-gold"
                />
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="block space-y-1">
                  <span className="text-[10px] uppercase tracking-widest text-gold font-semibold">Account Number</span>
                  <input
                    required
                    type="text"
                    value={bankAccount}
                    onChange={(e) => setBankAccount(e.target.value)}
                    placeholder="123456789012"
                    className="w-full bg-background border border-gold/25 rounded px-3 py-2 text-white focus:outline-none focus:border-gold"
                  />
                </label>

                <label className="block space-y-1">
                  <span className="text-[10px] uppercase tracking-widest text-gold font-semibold">IFSC Code</span>
                  <input
                    required
                    type="text"
                    value={bankIFSC}
                    onChange={(e) => setBankIFSC(e.target.value)}
                    placeholder="SBIN0001234"
                    className="w-full bg-background border border-gold/25 rounded px-3 py-2 text-white focus:outline-none focus:border-gold"
                  />
                </label>
              </div>

              <label className="block space-y-1">
                <span className="text-[10px] uppercase tracking-widest text-gold font-semibold">Amount to Withdraw (Max: ₹{Number(user.wallet_balance || 0).toLocaleString("en-IN")})</span>
                <input
                  required
                  type="number"
                  min="1"
                  max={Number(user.wallet_balance || 0)}
                  value={bankAmount}
                  onChange={(e) => setBankAmount(e.target.value)}
                  placeholder="500"
                  className={`w-full bg-background border rounded px-3 py-2 text-white focus:outline-none transition ${
                    bankAmount && Number(bankAmount) > Number(user.wallet_balance || 0)
                      ? "border-red-500 focus:border-red-500"
                      : "border-gold/25 focus:border-gold"
                  }`}
                />
                {bankAmount && Number(bankAmount) > Number(user.wallet_balance || 0) && (
                  <p className="text-[11px] text-red-400 font-medium mt-1">
                    ⚠️ Insufficient balance! Your available wallet balance is ₹{Number(user.wallet_balance || 0).toLocaleString("en-IN")}.
                  </p>
                )}
                {bankAmount && Number(bankAmount) > 0 && Number(bankAmount) <= Number(user.wallet_balance || 0) && (
                  <p className="text-[11px] text-emerald-400 font-medium mt-1">
                    ✓ Amount is available for withdrawal.
                  </p>
                )}
              </label>

              <button
                type="submit"
                disabled={submittingWithdrawal || !bankAmount || Number(bankAmount) <= 0 || Number(bankAmount) > Number(user.wallet_balance || 0)}
                className="mt-2 w-full py-2.5 bg-gold hover:bg-primary-glow text-primary-foreground font-semibold uppercase tracking-wider text-xs rounded shadow-gold transition disabled:opacity-50"
              >
                {submittingWithdrawal ? "Submitting..." : "Submit Payout Request"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Commissions Guide Modal */}
      {showGuideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setShowGuideModal(false)}
          />

          {/* Guide Card */}
          <div className="relative z-10 w-full max-w-2xl border border-gold/30 bg-card rounded-2xl shadow-2xl p-6 space-y-6 text-left max-h-[90vh] overflow-y-auto hide-scrollbar">
            <div className="flex items-center justify-between border-b border-gold/20 pb-4">
              <div className="flex items-center gap-2">
                <Coins className="w-6 h-6 text-gold animate-bounce-slow" />
                <h3 className="font-display text-xl text-gold font-bold uppercase tracking-wider">
                  Commissions Guide & Rules
                </h3>
              </div>
              <button
                onClick={() => setShowGuideModal(false)}
                className="px-3 py-1 bg-gold/10 hover:bg-gold/20 text-gold rounded-full text-xs font-semibold uppercase tracking-wider transition border border-gold/20"
              >
                Close
              </button>
            </div>

            {/* Introduction */}
            <p className="text-xs text-muted-foreground leading-relaxed">
              Welcome to the <strong className="text-gold">Pantix Royal Reseller Program</strong>! Here, you can earn passive income by curating your catalog and sharing products with custom profit margins. Below is the complete overview of the rules, processing workflow, and performance tiers.
            </p>

            {/* Step-by-Step Process */}
            <div className="space-y-3">
              <h4 className="font-display text-sm text-gold uppercase tracking-wider border-b border-gold/10 pb-1">
                1. The Reselling Workflow
              </h4>
              <div className="grid gap-3">
                <div className="p-3 border border-gold/15 bg-background/40 rounded-xl space-y-1">
                  <div className="flex items-center gap-2 text-xs font-semibold text-gold">
                    <span className="w-5 h-5 rounded-full bg-gold/15 border border-gold/30 flex items-center justify-center text-[10px]">1</span>
                    Select Product & Set Margin
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed pl-7">
                    Browse the premium collection. On any eligible product, specify a custom profit margin. If a product's base price is <strong className="text-white">₹799</strong>, and you add a <strong className="text-gold">₹150</strong> margin, the product will sell for <strong className="text-white">₹949</strong>.
                  </p>
                </div>

                <div className="p-3 border border-gold/15 bg-background/40 rounded-xl space-y-1">
                  <div className="flex items-center gap-2 text-xs font-semibold text-gold">
                    <span className="w-5 h-5 rounded-full bg-gold/15 border border-gold/30 flex items-center justify-center text-[10px]">2</span>
                    Share Custom Curated Links
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed pl-7">
                    Generate your custom link and share it directly on <strong className="text-white">WhatsApp, Instagram, Telegram, or Facebook</strong>. The link automatically embeds the curated retail price and tags the buyer with your Reseller ID.
                  </p>
                </div>

                <div className="p-3 border border-gold/15 bg-background/40 rounded-xl space-y-1">
                  <div className="flex items-center gap-2 text-xs font-semibold text-gold">
                    <span className="w-5 h-5 rounded-full bg-gold/15 border border-gold/30 flex items-center justify-center text-[10px]">3</span>
                    Order Processing & Validation
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed pl-7">
                    When someone orders through your shared links, the transaction is tagged to you. Once the order status is marked as <strong className="text-emerald-bright">Delivered</strong>, your profit margin commission is instantly credited to your wallet balance.
                  </p>
                </div>
              </div>
            </div>

            {/* Withdrawal Rules & Process */}
            <div className="space-y-3">
              <h4 className="font-display text-sm text-gold uppercase tracking-wider border-b border-gold/10 pb-1">
                2. Manual Bank Payout Process
              </h4>
              <div className="p-4 border border-gold/20 bg-emerald-deep/10 rounded-xl space-y-3 text-xs leading-relaxed text-muted-foreground">
                <p>
                  To receive your accumulated wallet earnings directly in your bank account, follow our manual payout process:
                </p>
                <ul className="list-disc pl-4 space-y-2 text-[11px]">
                  <li>
                    <strong className="text-white">Provide Valid Details:</strong> You must supply your full name, bank account number, contact phone, and active IFSC code.
                  </li>
                  <li>
                    <strong className="text-white">Balance Check:</strong> The system validates your request in real-time. Payout requests for amounts higher than your current wallet balance will be locked out.
                  </li>
                  <li>
                    <strong className="text-white">Admin Audit & Verification:</strong> All requested payouts are sent directly to the Admin Panel. The Pantix accounts team will audit and transfer the money manually to your bank.
                  </li>
                  <li>
                    <strong className="text-white">Status Tracking:</strong> Keep track of your request status in the <strong className="text-gold">Withdrawal Requests</strong> ledger.
                    <ul className="pl-4 mt-1 list-circle space-y-1">
                      <li><span className="text-gold font-semibold">Pending:</span> Request received and awaiting admin verification.</li>
                      <li><span className="text-emerald-bright font-semibold">Approved:</span> Processed and funds successfully disbursed to your bank.</li>
                      <li><span className="text-destructive font-semibold">Rejected:</span> Cancelled by admin (funds automatically refunded to your reseller wallet).</li>
                    </ul>
                  </li>
                </ul>
              </div>
            </div>

            {/* Performance & Reseller Tiers */}
            <div className="space-y-3">
              <h4 className="font-display text-sm text-gold uppercase tracking-wider border-b border-gold/10 pb-1">
                3. Royal Performance Tiers
              </h4>
              <p className="text-[11px] text-muted-foreground leading-normal">
                Your tier is based on your <strong className="text-white">total lifetime commissions</strong> earned from referred orders. Higher tiers unlock bonus overrides and priority payout processing:
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                <div className={`p-3 border rounded-xl flex items-center justify-between ${
                  currentTier === "Bronze" ? "border-yellow-600/40 bg-yellow-800/10 ring-1 ring-yellow-600/20" : "border-gold/10 bg-card"
                }`}>
                  <div>
                    <p className="text-xs font-semibold text-yellow-500 flex items-center gap-1">🥉 Bronze {currentTier === "Bronze" && <span className="text-[9px] bg-yellow-700/30 text-yellow-400 px-1.5 py-0.5 rounded-full">YOU ARE HERE</span>}</p>
                    <p className="text-[10px] text-muted-foreground">₹0 – ₹199 total earnings</p>
                  </div>
                  <span className="px-2 py-0.5 bg-yellow-800/20 text-yellow-500 rounded text-[9px] uppercase border border-yellow-700/20 font-bold">
                    Base Margin
                  </span>
                </div>

                <div className={`p-3 border rounded-xl flex items-center justify-between ${
                  currentTier === "Silver" ? "border-slate-400/40 bg-slate-500/10 ring-1 ring-slate-400/20" : "border-gold/15 bg-card"
                }`}>
                  <div>
                    <p className="text-xs font-semibold text-slate-300 flex items-center gap-1">🥈 Silver {currentTier === "Silver" && <span className="text-[9px] bg-slate-600/30 text-slate-300 px-1.5 py-0.5 rounded-full">YOU ARE HERE</span>}</p>
                    <p className="text-[10px] text-muted-foreground">₹200 – ₹499 total earnings</p>
                  </div>
                  <span className="px-2 py-0.5 bg-slate-500/20 text-slate-300 rounded text-[9px] uppercase border border-slate-400/30 font-bold">
                    +2% Bonus
                  </span>
                </div>

                <div className={`p-3 border rounded-xl flex items-center justify-between ${
                  currentTier === "Gold" ? "border-gold/40 bg-gold/10 ring-1 ring-gold/20" : "border-gold/15 bg-card"
                }`}>
                  <div>
                    <p className="text-xs font-semibold text-gold flex items-center gap-1">🥇 Gold {currentTier === "Gold" && <span className="text-[9px] bg-gold/20 text-gold px-1.5 py-0.5 rounded-full">YOU ARE HERE</span>}</p>
                    <p className="text-[10px] text-muted-foreground">₹500 – ₹999 total earnings</p>
                  </div>
                  <span className="px-2 py-0.5 bg-gold/15 text-gold rounded text-[9px] uppercase border border-gold/30 font-bold">
                    +5% Bonus
                  </span>
                </div>

                <div className={`p-3 border rounded-xl flex items-center justify-between ${
                  currentTier === "Platinum" ? "border-emerald-500/40 bg-emerald-500/10 ring-1 ring-emerald-500/20" : "border-gold/15 bg-card"
                }`}>
                  <div>
                    <p className="text-xs font-semibold text-emerald-bright flex items-center gap-1">💎 Platinum {currentTier === "Platinum" && <span className="text-[9px] bg-emerald-500/20 text-emerald-bright px-1.5 py-0.5 rounded-full">YOU ARE HERE</span>}</p>
                    <p className="text-[10px] text-muted-foreground">₹1000+ total earnings</p>
                  </div>
                  <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-bright rounded text-[9px] uppercase border border-emerald-500/20 font-bold shadow-gold">
                    +8% & Priority Payouts
                  </span>
                </div>
              </div>
            </div>

            {/* General Policy Notes */}
            <div className="p-3 border border-red-500/20 bg-red-950/15 rounded-xl space-y-1">
              <h5 className="text-xs font-semibold text-destructive flex items-center gap-1.5">
                ⚠️ Strict Platform Regulations & Policy
              </h5>
              <p className="text-[10px] text-muted-foreground leading-relaxed">
                Self-purchasing using own reseller links to claim discounts, placing fake cash-on-delivery orders, or gaming the referral scheme violates Pantix's Fair Play guidelines. All referred orders are systematically audited. Detected fraud results in immediate reseller account suspension and complete forfeiture of unpaid wallet balances.
              </p>
            </div>

            {/* Footer action */}
            <div className="flex justify-end pt-2 border-t border-gold/15">
              <button
                onClick={() => setShowGuideModal(false)}
                className="px-5 py-2 bg-gold hover:bg-primary-glow text-primary-foreground font-semibold text-xs rounded-xl uppercase tracking-wider transition shadow-gold"
              >
                I Understand & Acknowledge
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Account;
