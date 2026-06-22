import { Link } from "@/lib/router-compat";
import { Heart, ShoppingBag, Trash2 } from "lucide-react";
import type { Product } from "@/lib/products";
import { formatINR, useStore } from "@/lib/store";
import { motion } from "framer-motion";
import { useState } from "react";

export function ProductCard({
  product,
  index = 0,
  isWishlist = false,
}: {
  product: Product;
  index?: number;
  isWishlist?: boolean;
}) {
  const { isWished, toggleWishlist, addToCart } = useStore();
  const wished = isWished(product.id);
  const discount = Math.round(
    ((product.mrp - product.price) / product.mrp) * 100
  );
  const [showConfirm, setShowConfirm] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, delay: Math.min(index * 0.05, 0.3) }}
      className="group relative"
    >
      {showConfirm && (
        <div className="absolute top-0 left-0 right-0 z-20 flex flex-col items-center justify-center p-4 text-center rounded-md bg-emerald-deep/95 aspect-[3/4]">
          <p className="text-gold text-sm mb-4 font-medium">Remove from wishlist?</p>
          <div className="flex gap-3">
            <button 
              onClick={(e) => {
                e.preventDefault();
                setShowConfirm(false);
              }} 
              className="px-4 py-1.5 rounded-full border border-gold/40 text-gold text-xs hover:bg-gold/10 transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={(e) => {
                e.preventDefault();
                toggleWishlist(product.id);
                setShowConfirm(false);
              }} 
              className="px-4 py-1.5 rounded-full bg-gold text-primary-foreground text-xs font-semibold hover:bg-gold/90 transition-colors"
            >
              Remove
            </button>
          </div>
        </div>
      )}
      <Link
        to={`/product/${product.id}`}
        className="block relative overflow-hidden rounded-md bg-card aspect-[3/4] shadow-card hover:shadow-gold transition-shadow duration-500"
      >
        <img
          src={product.image}
          alt={product.name}
          loading="lazy"
          width={800}
          height={1024}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-emerald-deep/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        {product.badge && (
          <span className="absolute top-3 left-3 px-2.5 py-1 text-[10px] uppercase tracking-widest bg-gradient-gold text-primary-foreground font-semibold rounded shadow-gold">
            {product.badge}
          </span>
        )}
        {!product.inStock && (
          <div className="absolute inset-0 bg-emerald-deep/75 grid place-items-center">
            <span className="text-gold text-xs uppercase tracking-[0.3em] border border-gold/40 px-3 py-1">
              Sold out
            </span>
          </div>
        )}
      </Link>
      <button
        onClick={(e) => {
          e.preventDefault();
          if (isWishlist) {
            toggleWishlist(product.id);
          } else if (wished) {
            setShowConfirm(true);
          } else {
            toggleWishlist(product.id);
          }
        }}
        aria-label={isWishlist ? "Remove from wishlist" : "Wishlist"}
        className="absolute top-3 right-3 z-10 h-8 w-8 grid place-items-center rounded-full bg-emerald-deep/70 backdrop-blur border border-gold/30 text-gold hover:bg-gold hover:text-primary-foreground transition-colors"
      >
        {isWishlist ? (
          <Trash2 className="h-4 w-4" />
        ) : (
          <Heart className={`h-4 w-4 ${wished ? "fill-current" : ""}`} />
        )}
      </button>


      <div className="pt-3">
        <h3 className="font-display text-base text-foreground line-clamp-1">
          {product.name}
        </h3>
        <p className="text-[11px] uppercase tracking-[0.2em] text-gold/70 mt-0.5">
          {product.categoryLabel}
        </p>
        <div className="mt-1.5 flex items-center justify-between gap-2">
          <div className="flex items-baseline gap-x-2 gap-y-0.5 flex-wrap min-w-0">
            <span className="text-gold font-medium text-sm md:text-base">
              {formatINR(product.price)}
            </span>
            {discount > 0 && (
              <>
                <span className="text-[11px] md:text-xs text-muted-foreground line-through">
                  {formatINR(product.mrp)}
                </span>
                <span className="text-[11px] md:text-xs text-gold/80 whitespace-nowrap">
                  {discount}% off
                </span>
              </>
            )}
          </div>
          {product.inStock && (
            <button
              onClick={() => addToCart(product.id, product.sizes[0], product.colors?.[0]?.name ?? "Default")}
              aria-label="Add to cart"
              className="h-8 w-8 grid place-items-center rounded-full border border-gold/40 text-gold hover:bg-gold hover:text-primary-foreground transition-colors"
            >
              <ShoppingBag className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
