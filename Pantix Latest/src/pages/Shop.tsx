import { useMemo, useState } from "react";
import { Layout } from "@/components/Layout";
import { ProductCard } from "@/components/ProductCard";
import { type Category } from "@/lib/products";
import { useStore } from "@/lib/store";
import { SlidersHorizontal, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type SortKey = "newest" | "price-asc" | "price-desc" | "popular";

const BUDGETS = [
  { id: "u999", label: "Under ₹999", max: 999, min: 0 },
  { id: "1k2k", label: "₹1000 – ₹1999", min: 1000, max: 1999 },
  { id: "2k3k", label: "₹2000 – ₹2999", min: 2000, max: 2999 },
  { id: "3kp", label: "₹3000+", min: 3000, max: Infinity },
];

const ALL_SIZES = ["XS", "S", "M", "L", "XL", "XXL", "3XL", "4XL", "5XL", "6XL", "Free Size"];

const Shop = () => {
  const { products, categories } = useStore();
  const [selectedCats, setSelectedCats] = useState<string[]>([]);
  const [selectedBudgets, setSelectedBudgets] = useState<string[]>([]);
  const [maxPrice, setMaxPrice] = useState<number>(100000);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sort, setSort] = useState<SortKey>("newest");
  const [drawerOpen, setDrawerOpen] = useState(false);

  const toggle = <T,>(arr: T[], v: T, set: (n: T[]) => void) =>
    set(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

  const filtered = useMemo(() => {
    let list = products.filter((p) => {
      if (selectedCats.length && !selectedCats.includes(p.category)) return false;
      if (p.price > maxPrice) return false;
      if (inStockOnly && !p.inStock) return false;
      if (selectedSizes.length && !p.sizes.some((s) => selectedSizes.includes(s)))
        return false;
      if (selectedBudgets.length) {
        const ok = selectedBudgets.some((bid) => {
          const b = BUDGETS.find((x) => x.id === bid)!;
          return p.price >= b.min && p.price <= b.max;
        });
        if (!ok) return false;
      }
      return true;
    });
    list = [...list];
    switch (sort) {
      case "price-asc":
        list.sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        list.sort((a, b) => b.price - a.price);
        break;
      case "popular":
        list.sort((a, b) => (b.badge ? 1 : 0) - (a.badge ? 1 : 0));
        break;
    }
    return list;
  }, [selectedCats, selectedBudgets, maxPrice, selectedSizes, inStockOnly, sort, products]);

  const clearAll = () => {
    setSelectedCats([]);
    setSelectedBudgets([]);
    setSelectedSizes([]);
    setInStockOnly(false);
    setMaxPrice(100000);
  };

  const FiltersPanel = (
    <div className="space-y-7">
      <FilterSection title="Categories">
        <div className="space-y-2">
          {categories.map((c) => (
            <label
              key={c.id}
              className="flex items-center gap-2 text-sm cursor-pointer text-foreground/85 hover:text-gold"
            >
              <input
                type="checkbox"
                checked={selectedCats.includes(c.id)}
                onChange={() => toggle(selectedCats, c.id, setSelectedCats)}
                className="accent-[hsl(var(--gold))]"
              />
              {c.label}
            </label>
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Budget">
        <div className="space-y-2">
          {BUDGETS.map((b) => (
            <label
              key={b.id}
              className="flex items-center gap-2 text-sm cursor-pointer text-foreground/85 hover:text-gold"
            >
              <input
                type="checkbox"
                checked={selectedBudgets.includes(b.id)}
                onChange={() =>
                  toggle(selectedBudgets, b.id, setSelectedBudgets)
                }
                className="accent-[hsl(var(--gold))]"
              />
              {b.label}
            </label>
          ))}
        </div>
      </FilterSection>

      <FilterSection title={`Max Price: ₹${maxPrice.toLocaleString("en-IN")}`}>
        <input
          type="range"
          min={500}
          max={100000}
          step={500}
          value={maxPrice}
          onChange={(e) => setMaxPrice(Number(e.target.value))}
          className="w-full accent-[hsl(var(--gold))]"
        />
      </FilterSection>

      <FilterSection title="Sizes">
        <div className="flex flex-wrap gap-2">
          {ALL_SIZES.map((s) => {
            const active = selectedSizes.includes(s);
            return (
              <button
                key={s}
                onClick={() => toggle(selectedSizes, s, setSelectedSizes)}
                className={`text-xs px-3 py-1.5 rounded-full border transition ${
                  active
                    ? "bg-gold text-primary-foreground border-gold"
                    : "border-gold/30 text-foreground/85 hover:border-gold hover:text-gold"
                }`}
              >
                {s}
              </button>
            );
          })}
        </div>
      </FilterSection>

      <FilterSection title="Availability">
        <label className="flex items-center gap-2 text-sm cursor-pointer text-foreground/85 hover:text-gold">
          <input
            type="checkbox"
            checked={inStockOnly}
            onChange={(e) => setInStockOnly(e.target.checked)}
            className="accent-[hsl(var(--gold))]"
          />
          In stock only
        </label>
      </FilterSection>

      <button
        onClick={clearAll}
        className="w-full text-xs uppercase tracking-[0.25em] py-2.5 border border-gold/40 text-gold hover:bg-gold/10 rounded"
      >
        Clear filters
      </button>
    </div>
  );

  return (
    <Layout>
      <section className="pt-4 pb-10 md:pt-6 md:pb-14">
        <div className="mx-auto max-w-[1400px] px-4 lg:px-8">
          <div className="flex items-end justify-between gap-4 flex-wrap">
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-gold/80">
                Browse
              </p>
              <h1 className="mt-1 font-display text-4xl md:text-5xl gradient-text-gold inline-block">
                Shop All
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setDrawerOpen(true)}
                className="lg:hidden inline-flex items-center gap-2 px-4 py-2 border border-gold/40 text-gold rounded text-sm"
              >
                <SlidersHorizontal className="h-4 w-4" /> Filters
              </button>
              <div className="flex items-center gap-2">
                <span className="hidden sm:inline text-xs uppercase tracking-[0.2em] font-semibold text-gold">
                  Sort By
                </span>
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value as SortKey)}
                  className="bg-card border border-gold/40 text-foreground px-3 py-2 rounded text-sm focus:outline-none focus:border-gold font-medium"
                >
                  <option value="newest">Newest</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                  <option value="popular">Popularity</option>
                </select>
              </div>
            </div>
          </div>

          <div className="mt-8 grid lg:grid-cols-[260px_1fr] gap-8">
            {/* Sticky desktop sidebar */}
            <aside className="hidden lg:block">
              <div className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto pr-2">
                {FiltersPanel}
              </div>
            </aside>

            <div>
              <p className="text-sm text-muted-foreground mb-4">
                {filtered.length} {filtered.length === 1 ? "piece" : "pieces"}
              </p>
              {filtered.length === 0 ? (
                <div className="py-24 text-center text-muted-foreground">
                  No products match your filters.
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 md:gap-x-6 gap-y-10">
                  {filtered.map((p, i) => (
                    <ProductCard key={p.id} product={p} index={i} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Mobile drawer */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDrawerOpen(false)}
              className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm lg:hidden"
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "tween", duration: 0.35 }}
              className="fixed left-0 top-0 bottom-0 z-50 w-[85%] max-w-sm bg-gradient-dropdown border-r border-gold/30 p-6 overflow-y-auto lg:hidden"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="font-display text-2xl text-gold">Filters</h2>
                <button
                  onClick={() => setDrawerOpen(false)}
                  className="p-2 text-gold"
                  aria-label="Close filters"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              {FiltersPanel}
              <button
                onClick={() => setDrawerOpen(false)}
                className="mt-6 w-full btn-gold"
              >
                Show Results
              </button>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </Layout>
  );
};

function FilterSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h3 className="filter-heading">{title}</h3>
      {children}
    </div>
  );
}

export default Shop;
