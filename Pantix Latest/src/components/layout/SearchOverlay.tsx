import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X } from "lucide-react";
import { Link } from "@/lib/router-compat";
import { formatINR, useStore } from "@/lib/store";

export function SearchOverlay({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { products, categories } = useStore();
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      setQuery("");
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return products
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.categoryLabel.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q)
      )
      .slice(0, 8);
  }, [query, products]);

  const matchedCats = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return categories.filter((c) => c.label.toLowerCase().includes(q)).slice(0, 5);
  }, [query, categories]);

  const suggestions = ["Saree", "Lehenga", "Kurta Set", "Party Wear", "Frock", "Bridal"];

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-md"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-x-0 top-0 z-[61] max-h-[100dvh] overflow-y-auto bg-emerald-deep border-b border-gold/30 shadow-royal"
          >
            <div className="mx-auto max-w-3xl px-4 sm:px-6 py-5">
              <div className="flex items-center gap-3 border-b border-gold/40 pb-3">
                <Search className="h-5 w-5 text-gold shrink-0" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search sarees, lehengas, kurta sets…"
                  className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground text-base sm:text-lg focus:outline-none"
                />
                <button
                  onClick={onClose}
                  aria-label="Close search"
                  className="p-1.5 text-gold hover:text-primary-glow transition-colors shrink-0"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="py-5">
                {!query.trim() ? (
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.28em] text-gold/80 mb-3">
                      Popular searches
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {suggestions.map((s) => (
                        <button
                          key={s}
                          onClick={() => setQuery(s)}
                          className="px-3 py-1.5 text-sm rounded-full border border-gold/30 text-foreground hover:bg-gold/10 hover:text-gold hover:border-gold/60 transition"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : results.length === 0 && matchedCats.length === 0 ? (
                  <div className="py-10 text-center">
                    <p className="text-foreground">
                      No results for{" "}
                      <span className="text-gold">"{query}"</span>
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Try searching for sarees, lehengas, or kurta sets.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-5">
                    {matchedCats.length > 0 && (
                      <div>
                        <p className="text-[11px] uppercase tracking-[0.28em] text-gold/80 mb-2">
                          Categories
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {matchedCats.map((c) => (
                            <Link
                              key={c.id}
                              to={`/category/${c.id}`}
                              onClick={onClose}
                              className="px-3 py-1.5 text-sm rounded-full border border-gold/30 text-foreground hover:bg-gold/10 hover:text-gold hover:border-gold/60 transition"
                            >
                              {c.label}
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}

                    {results.length > 0 && (
                      <div>
                        <p className="text-[11px] uppercase tracking-[0.28em] text-gold/80 mb-3">
                          Products
                        </p>
                        <ul className="divide-y divide-gold/15">
                          {results.map((p) => (
                            <li key={p.id}>
                              <Link
                                to={`/product/${p.id}`}
                                onClick={onClose}
                                className="flex items-center gap-3 py-2.5 hover:bg-gold/5 rounded-md px-2 -mx-2 transition"
                              >
                                <img
                                  src={p.image}
                                  alt={p.name}
                                  className="h-14 w-14 rounded object-cover border border-gold/20 shrink-0"
                                  loading="lazy"
                                />
                                <div className="min-w-0 flex-1">
                                  <p className="text-sm text-foreground truncate">
                                    {p.name}
                                  </p>
                                  <p className="text-[11px] uppercase tracking-[0.2em] text-gold/70 truncate">
                                    {p.categoryLabel}
                                  </p>
                                </div>
                                <span className="text-sm text-gold font-medium shrink-0">
                                  {formatINR(p.price)}
                                </span>
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
