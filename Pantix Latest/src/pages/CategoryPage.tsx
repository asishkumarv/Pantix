import { useMemo, useState } from "react";
import { Link, useParams } from "@/lib/router-compat";
import { Layout } from "@/components/Layout";
import { ProductCard } from "@/components/ProductCard";
import { ProductFilters } from "@/components/ProductFilters";
import { type Category } from "@/lib/products";
import { useStore } from "@/lib/store";
import { SlidersHorizontal, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type SortKey = "popular" | "price-asc" | "price-desc" | "newest";

const CategoryPage = () => {
  const { products, categories, isLoadingCategories } = useStore();
  const { category: param } = useParams<{ category: string }>();
  const cat = categories.find((c) => c.id === param);

  const [maxPrice, setMaxPrice] = useState<number>(100000);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sort, setSort] = useState<SortKey>("popular");
  const [drawerOpen, setDrawerOpen] = useState(false);

  const filtered = useMemo(() => {
    if (!cat) return [];
    let list = products.filter((p) => p.category === cat.id);
    list = list.filter((p) => p.price <= maxPrice);
    if (selectedSizes.length)
      list = list.filter((p) => p.sizes.some((s) => selectedSizes.includes(s)));
    if (inStockOnly) list = list.filter((p) => p.inStock);
    switch (sort) {
      case "price-asc":
        list = [...list].sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        list = [...list].sort((a, b) => b.price - a.price);
        break;
      default:
        list = [...list].sort((a, b) => b.price - a.price);
    }
    return list;
  }, [cat, maxPrice, selectedSizes, inStockOnly, sort, products]);

  const clearAll = () => {
    setSelectedSizes([]);
    setInStockOnly(false);
    setMaxPrice(100000);
  };

  const closeDrawerAndScroll = () => {
    setDrawerOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (isLoadingCategories) {
    return (
      <Layout>
        <div className="flex h-[400px] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gold border-t-transparent"></div>
        </div>
      </Layout>
    );
  }

  if (!cat) {
    return (
      <Layout>
        <div className="mx-auto max-w-3xl px-4 pt-8 pb-20 text-center">
          <h1 className="font-display text-4xl gradient-text-gold">
            Category not found
          </h1>
          <Link to="/categories" className="mt-6 inline-block text-gold underline">
            Browse categories
          </Link>
        </div>
      </Layout>
    );
  }

  const FiltersPanel = (
    <ProductFilters
      showCategories={false}
      maxPrice={maxPrice}
      setMaxPrice={setMaxPrice}
      selectedSizes={selectedSizes}
      setSelectedSizes={setSelectedSizes}
      inStockOnly={inStockOnly}
      setInStockOnly={setInStockOnly}
      onClearAll={clearAll}
    />
  );

  return (
    <Layout>
      <section className="pt-4 pb-10 md:pt-6 md:pb-14">
        <div className="mx-auto max-w-[1400px] px-4 lg:px-8">
          <div className="flex items-end justify-between gap-4 flex-wrap">
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-gold/80">
                Collection
              </p>
              <h1 className="mt-1 font-display text-4xl md:text-5xl gradient-text-gold inline-block">
                {cat.label}
              </h1>
              <div className="gold-divider mt-3 w-24" />
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
                  <option value="popular">Popularity</option>
                  <option value="newest">Newest</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                </select>
              </div>
            </div>
          </div>

          <div className="mt-8 grid lg:grid-cols-[260px_1fr] gap-8">
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
                <p className="py-24 text-center text-muted-foreground">
                  No products match your filters.
                </p>
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
                onClick={closeDrawerAndScroll}
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

export default CategoryPage;
