import { Link, NavLink, useLocation } from "@/lib/router-compat";
import {
  Heart,
  Menu,
  Search,
  ShoppingBag,
  X,
  Instagram,
  MessageCircle,
  ChevronDown,
  ChevronRight,
  User,
  LogOut,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Logo } from "./Logo";
import { SearchOverlay } from "./SearchOverlay";
import { useStore } from "@/lib/store";
import { motion, AnimatePresence } from "framer-motion";

const NAV_LINKS = [
  { to: "/", label: "Home", end: true },
  { to: "/categories", label: "Categories", hasDropdown: true },
  { to: "/shop", label: "Shop" },
  { to: "/track", label: "Track Order" },
  { to: "/contact", label: "Contact" },
];

export function Navbar() {
  const { cartCount, wishlist, user, logout, categories } = useStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setMenuOpen(false);
    setDropdownOpen(false);
    setAccountOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const isHome = location.pathname === "/";
  const headerClass = !isHome || scrolled
    ? "glossy-header"
    : "bg-gradient-to-b from-emerald-deep/85 via-emerald-deep/45 to-transparent backdrop-blur-[2px] border-b border-transparent";

  return (
    <>
      <header className={`fixed top-0 inset-x-0 z-40 transition-all duration-500 ${headerClass}`}>
        <div className="relative mx-auto max-w-[1400px] px-3 sm:px-4 lg:px-8 h-20 lg:h-24 grid grid-cols-[1fr_auto_1fr] lg:grid-cols-[auto_1fr_auto] items-center gap-2 lg:gap-6">
          {/* Mobile menu (left) */}
          <button
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
            className="lg:hidden p-2 -ml-1 text-gold hover:text-primary-glow transition-colors justify-self-start"
          >
            <Menu className="h-6 w-6" />
          </button>

          {/* Logo — centered on mobile via grid, left on desktop */}
          <div className="lg:hidden justify-self-center">
            <Logo size="md" />
          </div>
          <div className="hidden lg:block justify-self-start">
            <Logo size="lg" />
          </div>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center justify-center gap-7 flex-1">
            {NAV_LINKS.map((item) =>
              item.hasDropdown ? (
                <div
                  key={item.to}
                  className="relative"
                  onMouseEnter={() => setDropdownOpen(true)}
                  onMouseLeave={() => setDropdownOpen(false)}
                >
                  <NavLink
                    to={item.to}
                    className={({ isActive }) =>
                      `nav-link !flex items-center gap-1 text-sm tracking-wide leading-none ${
                        isActive ? "active" : ""
                      }`
                    }
                  >
                    <span>{item.label}</span>
                    <ChevronDown className="h-3.5 w-3.5 shrink-0 relative top-px" />
                  </NavLink>
                  <AnimatePresence>
                    {dropdownOpen && <CategoriesDropdown categories={categories} />}
                  </AnimatePresence>
                </div>
              ) : (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `nav-link text-sm tracking-wide ${isActive ? "active" : ""}`
                  }
                >
                  {item.label}
                </NavLink>
              )
            )}
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-0.5 sm:gap-1 justify-self-end pr-1 sm:pr-2 lg:pr-0">
            <button
              onClick={() => setSearchOpen(true)}
              aria-label="Search"
              className="p-2 text-gold hover:text-primary-glow transition-colors"
            >
              <Search className="h-5 w-5" />
            </button>

            {/* Account */}
            <div
              className="relative hidden sm:block"
              onMouseEnter={() => setAccountOpen(true)}
              onMouseLeave={() => setAccountOpen(false)}
            >
              <Link
                to={user ? "/account" : "/login"}
                aria-label="Account"
                className="p-2 text-gold hover:text-primary-glow transition-colors flex items-center"
              >
                <User className="h-5 w-5" />
              </Link>
              <AnimatePresence>
                {accountOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    className="absolute right-0 top-full pt-2 w-56"
                  >
                    <div className="bg-gradient-dropdown border border-gold/30 rounded-md shadow-royal p-2">
                      {user ? (
                        <>
                          <div className="px-3 py-2 border-b border-gold/15 mb-1">
                            <p className="text-sm text-foreground font-medium truncate">
                              {user.name}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {user.email}
                            </p>
                          </div>
                          <Link
                            to="/account"
                            className="block px-3 py-2 text-sm text-foreground hover:bg-gold/10 hover:text-gold rounded"
                          >
                            My Account
                          </Link>
                          <Link
                            to="/wishlist"
                            className="block px-3 py-2 text-sm text-foreground hover:bg-gold/10 hover:text-gold rounded"
                          >
                            Wishlist
                          </Link>
                          <Link
                            to="/track"
                            className="block px-3 py-2 text-sm text-foreground hover:bg-gold/10 hover:text-gold rounded"
                          >
                            Orders
                          </Link>
                          <button
                            onClick={() => setShowLogoutConfirm(true)}
                            className="w-full text-left px-3 py-2 text-sm text-foreground hover:bg-gold/10 hover:text-gold rounded flex items-center gap-2"
                          >
                            <LogOut className="h-3.5 w-3.5" /> Logout
                          </button>
                        </>
                      ) : (
                        <>
                          <Link
                            to="/login"
                            className="block px-3 py-2 text-sm text-foreground hover:bg-gold/10 hover:text-gold rounded"
                          >
                            Sign In
                          </Link>
                          <Link
                            to="/register"
                            className="block px-3 py-2 text-sm text-foreground hover:bg-gold/10 hover:text-gold rounded"
                          >
                            Create Account
                          </Link>
                        </>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <Link
              to="/wishlist"
              aria-label="Wishlist"
              className="p-2 text-gold hover:text-primary-glow transition-colors relative"
            >
              <Heart className="h-5 w-5" />
              {wishlist.length > 0 && (
                <span className="absolute top-0.5 right-0.5 h-4 min-w-4 px-1 text-[10px] grid place-items-center rounded-full bg-gold text-primary-foreground font-semibold leading-none">
                  {wishlist.length}
                </span>
              )}
            </Link>
            <Link
              to="/cart"
              aria-label="Cart"
              className="p-2 text-gold hover:text-primary-glow transition-colors relative"
            >
              <ShoppingBag className="h-5 w-5" />
              {cartCount > 0 && (
                <span className="absolute top-0.5 right-0.5 h-4 min-w-4 px-1 text-[10px] grid place-items-center rounded-full bg-gold text-primary-foreground font-semibold leading-none">
                  {cartCount}
                </span>
              )}
            </Link>
          </div>
        </div>

      </header>

      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />

      {/* Mobile drawer */}
      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMenuOpen(false)}
              className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "tween", duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="fixed left-0 top-0 bottom-0 z-50 w-[86%] max-w-sm glossy-drawer overflow-y-auto scrollbar-gold"
            >
              {/* Drawer header */}
              <div className="relative flex items-center justify-center px-5 pt-5 pb-4">
                <Logo size="lg" />
                <button
                  onClick={() => setMenuOpen(false)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-gold hover:text-primary-glow transition-colors"
                  aria-label="Close menu"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Logged-in user card */}
              {user && (
                <div className="mx-5 mb-5 p-4 rounded-xl bg-gradient-to-br from-gold/15 via-gold/5 to-transparent border border-gold/30 shadow-gold backdrop-blur-md flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full grid place-items-center font-display text-xl font-semibold text-primary-foreground shadow-gold shrink-0"
                    style={{ background: "var(--gradient-gold)" }}
                  >
                    {user.name?.trim()?.charAt(0)?.toUpperCase() || "U"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-display text-lg leading-tight text-foreground truncate">
                      {user.name}
                    </p>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {user.email}
                    </p>
                  </div>
                </div>
              )}

              <div className="px-5 pb-8">
                {/* Primary nav */}
                <nav>
                  {NAV_LINKS.map((item) => (
                    <Link
                      key={item.to}
                      to={item.to}
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center justify-between py-2.5 text-sm tracking-wide text-white hover:text-gold border-b border-gold/45 transition-colors font-semibold"
                    >
                      <span>{item.label}</span>
                      <ChevronRight className="h-4 w-4 text-gold shrink-0" />
                    </Link>
                  ))}
                </nav>

                {/* Categories */}
                <div className="mt-7">
                  <p className="text-[11px] uppercase tracking-[0.28em] text-gold mb-3 font-semibold">
                    Shop by category
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {categories.map((c) => (
                      <Link
                        key={c.id}
                        to={`/category/${c.id}`}
                        onClick={() => setMenuOpen(false)}
                        className="text-sm font-medium py-2.5 px-3 rounded-md border border-gold/25 text-white hover:bg-gold/10 hover:border-gold/60 hover:text-gold transition"
                      >
                        {c.label}
                      </Link>
                    ))}
                  </div>
                </div>

                {/* Account section */}
                <div className="mt-7">
                  <p className="text-[11px] uppercase tracking-[0.28em] text-gold mb-3 font-semibold">
                    Account
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {user ? (
                      <>
                        <Link
                          to="/account"
                          onClick={() => setMenuOpen(false)}
                          className="text-sm font-semibold py-2.5 text-center rounded-md border border-gold/50 text-gold hover:bg-gold/10 transition"
                        >
                          My Account
                        </Link>
                        <button
                          onClick={() => setShowLogoutConfirm(true)}
                          className="text-sm font-semibold py-2.5 rounded-md border border-gold/50 text-gold hover:bg-gold/10 transition"
                        >
                          Logout
                        </button>
                      </>
                    ) : (
                      <>
                        <Link
                          to="/login"
                          onClick={() => setMenuOpen(false)}
                          className="text-sm font-semibold py-2.5 text-center rounded-md border border-gold/50 text-gold hover:bg-gold/10 transition"
                        >
                          Sign In
                        </Link>
                        <Link
                          to="/register"
                          onClick={() => setMenuOpen(false)}
                          className="text-sm font-semibold py-2.5 text-center rounded-md bg-gold text-primary-foreground hover:opacity-95 transition"
                        >
                          Register
                        </Link>
                      </>
                    )}
                  </div>
                </div>

                <div className="mt-7 flex gap-3">
                  <a
                    href="https://wa.me/919999999999"
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 text-sm font-semibold rounded-md border border-gold/50 text-white hover:text-gold hover:bg-gold/10 transition"
                  >
                    <MessageCircle className="h-4 w-4 text-gold" /> WhatsApp
                  </a>
                  <a
                    href="https://instagram.com"
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 text-sm font-semibold rounded-md border border-gold/50 text-white hover:text-gold hover:bg-gold/10 transition"
                  >
                    <Instagram className="h-4 w-4 text-gold" /> Instagram
                  </a>
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Sign Out Overlay Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setShowLogoutConfirm(false)}
          />
          <div className="relative z-10 w-full max-w-sm bg-card border border-gold/20 rounded-2xl shadow-2xl p-8 flex flex-col items-center text-center gap-5 animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-destructive/15 border border-destructive/30 flex items-center justify-center">
              <svg className="w-8 h-8 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
            </div>
            <div className="space-y-2">
              <h3 className="font-display text-2xl text-white font-bold">Sign Out</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Are you sure you want to sign out of Pantix?
              </p>
            </div>
            <div className="flex gap-3 w-full pt-1">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 py-3 bg-card border border-gold/30 hover:bg-gold/10 text-white font-semibold text-sm rounded-xl transition"
              >
                Cancel
              </button>
              <button
                onClick={() => { logout(); setShowLogoutConfirm(false); }}
                className="flex-1 py-3 bg-destructive hover:bg-destructive/90 text-white font-bold text-sm rounded-xl transition shadow-lg"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function CategoriesDropdown({ categories }: { categories: any[] }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2 }}
      className="absolute left-0 top-full pt-3 w-[260px] z-50"
    >
      <div className="bg-gradient-dropdown border border-gold/30 rounded-lg shadow-royal py-2">
        <ul className="flex flex-col">
          {categories.map((c) => (
            <li key={c.id}>
              <Link
                to={`/category/${c.id}`}
                className="block px-4 py-2.5 text-sm text-foreground hover:bg-gold/10 hover:text-gold transition-colors"
              >
                {c.label}
              </Link>
            </li>
          ))}
        </ul>
        <div className="gold-divider my-2 mx-4" />
        <Link
          to="/categories"
          className="block px-4 py-2 text-[11px] uppercase tracking-[0.25em] text-gold hover:text-primary-glow text-center"
        >
          View All →
        </Link>
      </div>
    </motion.div>
  );
}
