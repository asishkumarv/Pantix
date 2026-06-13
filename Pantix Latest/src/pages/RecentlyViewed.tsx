import { useEffect, useState } from "react";
import { Link } from "@/lib/router-compat";
import { Layout } from "@/components/Layout";
import { ProductCard } from "@/components/ProductCard";
import { useStore } from "@/lib/store";
import { Clock, Trash2 } from "lucide-react";

const KEY = "pantix:recentlyViewed";

const RecentlyViewed = () => {
  const { getProduct } = useStore();
  const [ids, setIds] = useState<string[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      setIds(raw ? JSON.parse(raw) : []);
    } catch {
      setIds([]);
    }
  }, []);

  const items = ids.map((id) => getProduct(id)).filter(Boolean) as ReturnType<typeof getProduct>[];

  const clear = () => {
    localStorage.removeItem(KEY);
    setIds([]);
  };

  return (
    <Layout>
      <section className="pt-4 pb-12 md:pt-6 md:pb-16">
        <div className="mx-auto max-w-[1400px] px-4 lg:px-8">
          <div className="flex items-end justify-between gap-4 flex-wrap">
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-gold/80 flex items-center gap-2">
                <Clock className="h-3.5 w-3.5" /> Your trail
              </p>
              <h1 className="mt-1 font-display text-4xl md:text-5xl gradient-text-gold inline-block">
                Recently Viewed
              </h1>
              <div className="gold-divider mt-3 w-24" />
            </div>
            {items.length > 0 && (
              <button
                onClick={clear}
                className="inline-flex items-center gap-2 px-4 py-2 border border-gold/40 text-gold rounded text-sm hover:bg-gold/10"
              >
                <Trash2 className="h-4 w-4" /> Clear
              </button>
            )}
          </div>

          {items.length === 0 ? (
            <div className="py-24 text-center">
              <p className="text-muted-foreground">
                You haven't viewed any products yet.
              </p>
              <Link to="/shop" className="mt-6 inline-block btn-gold">
                Start Shopping
              </Link>
            </div>
          ) : (
            <div className="mt-8 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 md:gap-x-6 gap-y-10">
              {items.map((p, i) => (
                <ProductCard key={p.id} product={p} index={i} />
              ))}
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default RecentlyViewed;
