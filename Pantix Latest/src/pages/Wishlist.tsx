import { Link } from "@/lib/router-compat";
import { Heart } from "lucide-react";
import { Layout } from "@/components/Layout";
import { ProductCard } from "@/components/ProductCard";
import { useStore } from "@/lib/store";

const Wishlist = () => {
  const { wishlist, getProduct } = useStore();
  const items = wishlist.map(getProduct).filter(Boolean);

  return (
    <Layout>
      <div className="mx-auto max-w-7xl px-4 pt-4 pb-12">
        <h1 className="font-display text-4xl md:text-5xl gradient-text-gold">
          Your Wishlist
        </h1>
        <div className="gold-divider mt-3 w-24" />
        {items.length === 0 ? (
          <div className="mt-16 text-center">
            <Heart className="mx-auto h-10 w-10 text-gold mb-4" />
            <p className="text-muted-foreground">
              No favourites yet. Tap the heart on any piece.
            </p>
            <Link
              to="/categories"
              className="mt-6 inline-block px-6 py-3 bg-gold text-primary-foreground uppercase text-sm"
            >
              Discover
            </Link>
          </div>
        ) : (
          <div className="mt-10 grid grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-10">
            {items.map((p, i) => p && <ProductCard key={p.id} product={p} index={i} />)}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Wishlist;
