import { API_URL } from "@/api";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "@/lib/router-compat";
import { useSearchParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Heart,
  Minus,
  Plus,
  ShieldCheck,
  Truck,
  RefreshCw,
  Star,
  Share2,
  Copy,
  Check,
  TrendingUp,
  Coins,
} from "lucide-react";
import { Layout } from "@/components/Layout";
import { ProductCard } from "@/components/ProductCard";
import { formatINR, useStore } from "@/lib/store";
import { toast } from "sonner";

// Distinct sub-view shots — same emerald/gold/royal style as covers,
// but visually different (close-up, back/side pose, flat-lay) per group.
import subDetail1 from "@/assets/sub-detail-1.jpg";
import subBack1 from "@/assets/sub-back-1.jpg";
import subFlatlay1 from "@/assets/sub-flatlay-1.jpg";
import subDetail2 from "@/assets/sub-detail-2.jpg";
import subSide2 from "@/assets/sub-side-2.jpg";
import subTassel2 from "@/assets/sub-tassel-2.jpg";
import subDetail3 from "@/assets/sub-detail-3.jpg";
import subPose3 from "@/assets/sub-pose-3.jpg";
import subAccessories3 from "@/assets/sub-accessories-3.jpg";
import subDetail4 from "@/assets/sub-detail-4.jpg";
import subTwirl4 from "@/assets/sub-twirl-4.jpg";
import subFabric4 from "@/assets/sub-fabric-4.jpg";

// Extra sub-views per group — same emerald/gold royal style as the cover,
// but visually distinct shots (close-up, model pose, flat-lay/accessories).
// The thumbnail's own cover image is used as sub-view #1 at runtime; these
// fill sub-views #2 and #3 for each group.
const SUB_VIEW_EXTRAS: string[][] = [
  [subDetail1, subFlatlay1, subBack1],
  [subDetail2, subTassel2, subSide2],
  [subDetail3, subAccessories3, subPose3],
  [subDetail4, subFabric4, subTwirl4],
];

type Review = {
  id: string;
  name: string;
  rating: number;
  text: string;
  date: string;
};

const REVIEWS_KEY = (id: string) => `pantix:reviews:${id}`;

const seedReviews = (productId: string): Review[] => [
  {
    id: "seed-1",
    name: "Aanya K.",
    rating: 5,
    text: "Absolutely regal. The fabric and embroidery are stunning.",
    date: "2024-12-12",
  },
  {
    id: "seed-2",
    name: "Riya S.",
    rating: 5,
    text: "Fits perfectly and looks even better in person. Worth every rupee.",
    date: "2025-01-08",
  },
];

const ProductPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const refId = searchParams.get("rscode") || searchParams.get("ref");

  const { addToCart, toggleWishlist, isWished, user, products, getProduct, isLoadingProducts, refreshProducts } = useStore();
  const product = useMemo(() => (id ? getProduct(id) : undefined), [id, getProduct]);
  const isMock = useMemo(() => {
    if (!product) return true;
    const imgs = product.images || [];
    return imgs.some(
      (img) =>
        !img.includes("uploads") &&
        !img.startsWith("http") &&
        !img.startsWith("/uploads")
    );
  }, [product]);

  const [activeThumb, setActiveThumb] = useState(0);
  const [viewIndex, setViewIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const [size, setSize] = useState("");
  const [color, setColor] = useState("");
  const [qty, setQty] = useState(1);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [reviewName, setReviewName] = useState(user?.name ?? "");
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [copied, setCopied] = useState(false);
  
  const currentStock = useMemo(() => {
    if (!product) return 0;
    if (color && product.colors) {
      const colorObj: any = product.colors.find((c: any) => c.name === color);
      if (colorObj && Array.isArray(colorObj.sizes) && colorObj.sizes.length > 0) {
        if (size) {
          const sizeObj = colorObj.sizes.find((s: any) => s.size === size);
          return sizeObj ? Number(sizeObj.stock) : 0;
        }
        return 0;
      }
    }
    return product.stock !== undefined ? product.stock : 0;
  }, [product, color, size]);

  const galleryImages = useMemo(() => {
    if (!product) return [];
    if (color && product.colors) {
      const colorObj: any = product.colors.find((c: any) => c.name === color);
      if (colorObj && Array.isArray(colorObj.images) && colorObj.images.length > 0) {
        return colorObj.images;
      }
    }
    return product.images || [];
  }, [product, color]);

  const isProductSoldOut = useMemo(() => {
    if (!product) return true;
    if (product.colors && product.colors.length > 0) {
      return product.colors.every((c: any) => 
        !c.sizes || c.sizes.every((sz: any) => Number(sz.stock) === 0)
      );
    }
    return product.stock !== undefined ? product.stock === 0 : !product.inStock;
  }, [product]);

  const availableSizesForSelectedColor = useMemo(() => {
    if (!product) return [];
    if (color && product.colors) {
      const colorObj = product.colors.find((col: any) => col.name === color);
      if (colorObj && Array.isArray(colorObj.sizes)) {
        return colorObj.sizes.map((s: any) => s.size);
      }
    }
    return product.sizes || [];
  }, [product, color]);

  const commissionRate = product?.commission_rate || 0;
  const commissionAmount = product ? (product.price * commissionRate) / 100 : 0;

  useEffect(() => {
    refreshProducts();

    const interval = setInterval(() => {
      refreshProducts();
    }, 10000);

    return () => clearInterval(interval);
  }, [id, refreshProducts]);

  // Sync size/color when product is loaded
  useEffect(() => {
    if (product) {
      const firstColor = product.colors?.[0];
      const defaultColor = firstColor?.name ?? "";
      setColor(defaultColor);
      
      if (firstColor && Array.isArray(firstColor.sizes) && firstColor.sizes.length > 0) {
        const firstAvailable = firstColor.sizes.find((s: any) => Number(s.stock) > 0);
        setSize(firstAvailable ? firstAvailable.size : firstColor.sizes[0].size);
      } else {
        setSize(product.sizes[0] ?? "");
      }
    }
  }, [product]);

  // Reset active thumb when color changes
  useEffect(() => {
    setActiveThumb(0);
    setViewIndex(0);
  }, [color]);

  useEffect(() => {
    if (!id) return;
    try {
      const key = "pantix:recentlyViewed";
      const raw = localStorage.getItem(key);
      const list: string[] = raw ? JSON.parse(raw) : [];
      const next = [id, ...list.filter((x) => x !== id)].slice(0, 24);
      localStorage.setItem(key, JSON.stringify(next));
    } catch {
      /* noop */
    }

    const fetchReviews = async () => {
      try {
        const res = await fetch(`${API_URL}/api/products/${id}/reviews`);
        if (!res.ok) throw new Error("Failed to fetch reviews");
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setReviews(data.map((r: any) => ({
            id: String(r.id),
            name: r.name,
            rating: Number(r.rating),
            text: r.text,
            date: r.date,
          })));
        } else {
          setReviews(seedReviews(id));
        }
      } catch (err) {
        console.error("Database fetch failed, using local/seeded reviews:", err);
        try {
          const raw = localStorage.getItem(REVIEWS_KEY(id));
          setReviews(raw ? JSON.parse(raw) : seedReviews(id));
        } catch {
          setReviews(seedReviews(id));
        }
      }
    };

    fetchReviews();
  }, [id]);

  // Handle Referral tracking
  useEffect(() => {
    if (refId && product) {
      // Save ref to cookie for 30 days
      document.cookie = `pantix_ref=${refId}; max-age=${30 * 24 * 60 * 60}; path=/`;
      
      const sessionKey = `tracked_${refId}_${product.id}`;
      if (!sessionStorage.getItem(sessionKey)) {
        sessionStorage.setItem(sessionKey, "1");
        // Track the click in backend
        fetch(`${API_URL}/api/resellers/click`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reseller_code: refId, product_id: product.id })
        }).catch(() => {});
      }
    }
  }, [refId, product]);

  if (isLoadingProducts) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-96">
          <div className="w-8 h-8 border-4 border-gold border-t-transparent rounded-full animate-spin"></div>
        </div>
      </Layout>
    );
  }

  if (!product) {
    return (
      <Layout>
        <div className="mx-auto max-w-3xl px-4 pt-8 pb-20 text-center">
          <h1 className="font-display text-4xl gradient-text-gold">
            Product not found
          </h1>
          <Link
            to="/categories"
            className="mt-6 inline-block text-gold underline"
          >
            Browse categories
          </Link>
        </div>
      </Layout>
    );
  }

  const wished = isWished(product.id);
  const finalPrice = product.price;
  const finalMrp = product.mrp;
  const total = finalPrice * qty;
  const related = products.filter((p) => p.id !== product.id).slice(0, 4);

  const stockText = isProductSoldOut
    ? "Sold Out"
    : currentStock === 0
      ? "Out of Stock"
      : currentStock <= 5
        ? `Only ${currentStock} Left`
        : "In Stock";
  const stockTone = isProductSoldOut || currentStock === 0
    ? "bg-destructive/15 text-destructive border-destructive/40"
    : currentStock <= 5
      ? "bg-gold/15 text-gold border-gold/50"
      : "bg-emerald-bright/30 text-primary-glow border-gold/40";

  const handleBuy = () => {
    const success = addToCart(product.id, size, color, qty, refId ?? undefined);
    if (success) {
      navigate("/checkout");
    }
  };

  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewName.trim() || !reviewText.trim()) return;

    try {
      const res = await fetch(`${API_URL}/api/products/${product.id}/reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: reviewName.trim(),
          rating: reviewRating,
          text: reviewText.trim(),
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        toast.error(errorData.error || "Failed to submit review");
        return;
      }

      toast.success("Review submitted!");
      setShowForm(false);
      setReviewText("");
      setReviewRating(5);
      
      const newReviews = await fetch(`${API_URL}/api/products/${product.id}/reviews`);
      if (newReviews.ok) {
        setReviews(await newReviews.json());
      }
    } catch (err) {
      toast.error("Network error");
    }
  };

  return (
    <Layout>
      <div className="mx-auto max-w-7xl px-4 py-8 md:py-12 pb-24">
        {/* Navigation & Breadcrumb */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            to="/categories"
            className="group flex items-center gap-2 text-sm text-muted-foreground hover:text-gold transition-colors"
          >
            <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            Back to Categories
          </Link>
          <div className="hidden md:flex gap-2 text-xs text-muted-foreground">
            <Link to="/" className="hover:text-gold transition-colors">Home</Link>
            <span>/</span>
            <Link to="/categories" className="hover:text-gold transition-colors">Categories</Link>
            <span>/</span>
            <span className="text-gold truncate max-w-[200px]">{product.name}</span>
          </div>
        </div>

        <div className="grid gap-10 lg:grid-cols-[1fr_1fr] lg:gap-16">
          {/* Gallery — vertical thumbs on left, each thumb owns its own 3-image group */}
          <Gallery
            images={galleryImages}
            name={product.name}
            activeThumb={activeThumb}
            viewIndex={viewIndex}
            direction={direction}
            onPrev={() => {
              setDirection(-1);
              if (isMock) {
                setViewIndex((v) => (v - 1 + 3) % 3);
              } else {
                const len = galleryImages.length || 1;
                setActiveThumb((v) => (v - 1 + len) % len);
              }
            }}
            onNext={() => {
              setDirection(1);
              if (isMock) {
                setViewIndex((v) => (v + 1) % 3);
              } else {
                const len = galleryImages.length || 1;
                setActiveThumb((v) => (v + 1) % len);
              }
            }}
            onThumbClick={(i) => {
              setDirection(i > activeThumb ? 1 : -1);
              setActiveThumb(i);
              setViewIndex(0);
            }}
            touchStartX={touchStartX}
          />

          {/* Details */}
          <div className="lg:pl-6">
            <p className="text-xs uppercase tracking-[0.3em] text-gold/90">
              {product.categoryLabel}
            </p>

            {refId && (
              <div className="mt-3 flex items-center gap-2 px-3 py-1.5 rounded-md border border-gold/30 bg-gold/10 text-gold text-xs font-semibold uppercase tracking-wider shadow-gold w-fit">
                <span>✨</span> Specially Curated Selection
              </div>
            )}

            <div className="mt-2 flex items-start justify-between gap-4">
              <h1 className="font-display text-3xl md:text-5xl text-foreground">
                {product.name}{color ? ` - ${color}` : ""}
              </h1>
              <div className="flex items-center gap-1 md:gap-2 mt-1 md:mt-2">
                <button
                  onClick={() => {
                    const cleanUrl = `${window.location.origin}${window.location.pathname}`;
                    if (navigator.share) {
                      navigator.share({
                        title: product.name,
                        text: `Check out this ${product.name} at Pantix`,
                        url: cleanUrl,
                      }).catch(() => {});
                    } else {
                      navigator.clipboard.writeText(cleanUrl);
                      toast.success("Link copied to clipboard! 🔗");
                    }
                  }}
                  aria-label="Share product"
                  className="p-2 text-gold hover:text-primary-glow transition-colors shrink-0"
                >
                  <Share2 className="h-5 w-5 md:h-7 md:w-7" />
                </button>
                <button
                  onClick={() => toggleWishlist(product.id)}
                  aria-label={wished ? "Remove from wishlist" : "Add to wishlist"}
                  className="p-2 text-gold hover:text-primary-glow transition-colors shrink-0"
                >
                  <Heart className={`h-6 w-6 md:h-8 md:w-8 ${wished ? "fill-current" : ""}`} />
                </button>
              </div>
            </div>
            <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className="h-3.5 w-3.5 fill-[hsl(var(--gold))] text-[hsl(var(--gold))]"
                />
              ))}
              <span>({reviews.length} reviews)</span>
            </div>

            <div className="mt-5 flex items-baseline gap-3 flex-wrap">
              <span className="price-display">{formatINR(finalPrice)}</span>
              <span className="text-base md:text-lg text-muted-foreground line-through">
                {formatINR(finalMrp)}
              </span>
              <span className="text-sm font-medium text-gold/90">
                {Math.round(
                  ((finalMrp - finalPrice) / finalMrp) * 100
                )}
                % off
              </span>
            </div>
            <p className="mt-1 text-xs text-gold/80">Inclusive of all taxes</p>

            {/* Stock status */}
            <div className="mt-4">
              <span
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-[0.18em] border ${stockTone}`}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-current" />
                {stockText}
              </span>
            </div>

            <p className="mt-6 text-sm leading-relaxed text-muted-foreground">
              {product.description}
            </p>

            {/* Reseller Earnings Console */}
            {user?.is_reseller && (
              <div className="mt-8 p-5 rounded-lg border-2 border-dashed border-gold/40 bg-gradient-to-br from-card/85 to-primary-dark/50 shadow-royal space-y-5">
                <div className="flex items-center justify-between border-b border-gold/15 pb-3">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-gold" />
                    <h3 className="font-display text-lg text-foreground tracking-wide">
                      Reseller Earnings Console
                    </h3>
                  </div>
                  <span className="flex items-center gap-1 px-2.5 py-1 rounded bg-gold/15 text-[10px] font-bold uppercase tracking-wider text-gold">
                    <Coins className="h-3 w-3" /> Active
                  </span>
                </div>

                <div className="space-y-4">
                  <div className="p-3.5 rounded bg-primary-dark/60 border border-gold/10 grid grid-cols-2 gap-2 text-center text-xs">
                    <div>
                      <p className="text-muted-foreground">Product Price</p>
                      <p className="font-bold text-foreground mt-1">{formatINR(product.price)}</p>
                    </div>
                    <div className="border-l border-gold/15">
                      <p className="text-gold">Your Commission ({commissionRate}%)</p>
                      <p className="font-bold text-gold mt-1">+{formatINR(commissionAmount)}</p>
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    <p className="text-[10px] uppercase tracking-widest text-gold/80 font-bold">
                      Share Custom Referral Link
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => {
                          const refCode = user.reseller_code || `RS${user.id}`;
                          const referralLink = `${window.location.origin}/product/${product.id}?rscode=${refCode}`;
                          const text = `Hey! Look at this gorgeous ${product.name} I curated for you at Pantix for just ${formatINR(product.price)}! ✨ Check it out here: ${referralLink}`;
                          window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, "_blank");
                        }}
                        className="flex items-center justify-center gap-2 px-3 py-2.5 rounded bg-[#25D366] hover:bg-[#20ba5a] text-white font-medium text-xs tracking-wide transition-colors"
                      >
                        <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.513 2.262 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.504-5.714-1.464L0 24zm6.535-3.238c1.644.975 3.511 1.489 5.414 1.491 5.462.002 9.907-4.441 9.911-9.908.002-2.65-1.03-5.14-2.903-7.01C17.14 3.468 14.65 2.437 12 2.436c-5.468 0-9.913 4.444-9.917 9.913-.001 1.84.48 3.636 1.393 5.222l-.993 3.626 3.712-.973zm11.393-7.374c-.3-.15-1.772-.875-2.046-.975-.276-.1-.476-.15-.676.15-.2.3-.775.975-.95 1.175-.175.2-.35.225-.65.075-.3-.15-1.265-.467-2.41-1.485-.89-.794-1.49-1.775-1.665-2.075-.175-.3-.019-.463.13-.612.135-.133.3-.35.45-.525.15-.175.2-.3.3-.5.1-.2.05-.375-.025-.525-.075-.15-.676-1.625-.926-2.225-.244-.589-.513-.509-.676-.517-.175-.008-.375-.01-.575-.01-.2 0-.525.075-.8 1.075-.275 1.05-.725 2.05-.785 2.175-.06.125-.112.2-.2.3-.6.675-1.125 1.25-1.925 1.85-.3.225-.375.3-.65.075s-1.85-1.05-2.4-1.55c-.275-.225-.5-.475-.675-.725-.2-.3-.025-.475.125-.625.325-.325.65-.675.8-1.075.075-.2.025-.375-.025-.525-.075-.15-.676-1.625-.925-2.225-.244-.59-.513-.509-.675-.517-.175-.008-.375-.01-.575-.01-.2 0-.525.075-.8 1.075-.275 1.05-.725 2.05-.785 2.175-.06.125-.112.2-.2.3-.6.675-1.125 1.25-1.925 1.85-.3.225-.375.3-.65.075s-1.85-1.05-2.4-1.55c-.275-.225-.5-.475-.675-.725-.2-.3-.025-.475.125-.625z" />
                        </svg>
                        WhatsApp
                      </button>

                      <button
                        onClick={() => {
                          const refCode = user.reseller_code || `RS${user.id}`;
                          const referralLink = `${window.location.origin}/product/${product.id}?rscode=${refCode}`;
                          navigator.clipboard.writeText(referralLink);
                          toast.info("Instagram sharing works via DMs! Direct link copied to your clipboard. 💖");
                        }}
                        className="flex items-center justify-center gap-2 px-3 py-2.5 rounded bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] text-white font-medium text-xs tracking-wide transition-all"
                      >
                        <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                        </svg>
                        Instagram
                      </button>

                      <button
                        onClick={() => {
                          const refCode = user.reseller_code || `RS${user.id}`;
                          const referralLink = `${window.location.origin}/product/${product.id}?rscode=${refCode}`;
                          const text = `Take a look at the gorgeous ${product.name} at Pantix for only ${formatINR(product.price)}!`;
                          window.open(`https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent(text)}`, "_blank");
                        }}
                        className="flex items-center justify-center gap-2 px-3 py-2.5 rounded bg-[#0088cc] hover:bg-[#0077b5] text-white font-medium text-xs tracking-wide transition-colors"
                      >
                        <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.19-.04-.27-.02-.11.02-1.93 1.23-5.46 3.62-.51.35-.98.53-1.4.51-.46-.01-1.35-.26-2.01-.48-.81-.27-1.46-.42-1.4-.88.03-.24.37-.49 1.03-.75 4.04-1.76 6.74-2.92 8.09-3.48 3.85-1.6 4.64-1.88 5.17-1.89.11 0 .37.03.54.17.14.12.18.28.2.45-.02.07-.02.13-.03.19z" />
                        </svg>
                        Telegram
                      </button>

                      <button
                        onClick={async () => {
                          const refCode = user.reseller_code || `RS${user.id}`;
                          const referralLink = `${window.location.origin}/product/${product.id}?rscode=${refCode}`;
                          try {
                            await navigator.clipboard.writeText(referralLink);
                            setCopied(true);
                            toast.success("Referral link copied to clipboard! 🔗✨");
                            setTimeout(() => setCopied(false), 2000);
                          } catch (err) {
                            toast.error("Could not copy link");
                          }
                        }}
                        className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded font-medium text-xs tracking-wide transition-all border ${
                          copied
                            ? "bg-emerald/20 border-emerald text-emerald-bright"
                            : "bg-gold/20 border-gold/40 text-gold hover:bg-gold/30"
                        }`}
                      >
                        {copied ? <Check className="h-4 w-4 animate-bounce" /> : <Copy className="h-4 w-4" />}
                        {copied ? "Copied!" : "Copy Link"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-6">
              <p className="text-[11px] uppercase tracking-[0.3em] text-gold/90 mb-2 font-semibold">
                Select size
              </p>
              <div className="flex flex-wrap gap-2">
                {availableSizesForSelectedColor.map((s) => {
                  const sizeStock = (() => {
                    if (color && product.colors) {
                      const colorObj: any = product.colors.find((col: any) => col.name === color);
                      if (colorObj && Array.isArray(colorObj.sizes) && colorObj.sizes.length > 0) {
                        const sizeObj = colorObj.sizes.find((sz: any) => sz.size === s);
                        return sizeObj ? Number(sizeObj.stock) : 0;
                      }
                    }
                    return product.stock || 0;
                  })();
                  const isOutOfStock = sizeStock === 0;

                  return (
                    <button
                      key={s}
                      onClick={() => setSize(s)}
                      disabled={isOutOfStock}
                      className={`min-w-12 px-4 py-2 text-sm border transition-all ${
                        size === s
                          ? "bg-gold text-primary-foreground border-gold"
                          : isOutOfStock
                            ? "border-dashed border-muted-foreground/30 text-muted-foreground/40 cursor-not-allowed opacity-50"
                            : "border-gold/30 text-foreground hover:border-gold"
                      }`}
                    >
                      {s} {isOutOfStock ? "(Out of Stock)" : ""}
                    </button>
                  );
                })}
              </div>
            </div>

            {product.colors && product.colors.length > 0 && (
              <div className="mt-6">
                <p className="text-[11px] uppercase tracking-[0.3em] text-gold/90 mb-2 font-semibold">
                  Select Color: <span className="text-foreground">{color}</span>
                </p>
                <div className="flex flex-wrap gap-3">
                  {product.colors.map((c: any) => {
                    const isColorOutOfStock = Array.isArray(c.sizes) && c.sizes.length > 0
                      ? c.sizes.every((sz: any) => Number(sz.stock) === 0)
                      : false;

                    return (
                      <button
                        key={c.name}
                        disabled={isColorOutOfStock}
                        onClick={() => {
                          setColor(c.name);

                          // Auto-select first in-stock size for the new color
                          if (Array.isArray((c as any).sizes) && (c as any).sizes.length > 0) {
                            const available = (c as any).sizes.find((sz: any) => Number(sz.stock) > 0);
                            if (available) {
                              setSize(available.size);
                            } else {
                              setSize((c as any).sizes[0].size);
                            }
                          }

                          if (!isMock && c.image && product.images) {
                            const idx = product.images.indexOf(c.image);
                            if (idx !== -1) {
                              setDirection(idx > activeThumb ? 1 : -1);
                              setActiveThumb(idx);
                              setViewIndex(0);
                            }
                          }
                        }}
                        title={c.name}
                        className={`h-9 w-9 rounded-full border-2 transition-all p-0.5 ${
                          color === c.name
                            ? "border-gold scale-110 shadow-gold"
                            : isColorOutOfStock
                              ? "opacity-35 cursor-not-allowed border-dashed border-muted-foreground bg-card/25"
                              : "border-transparent hover:border-gold/40"
                        }`}
                      >
                        <div
                          className="h-full w-full rounded-full shadow-inner"
                          style={{ backgroundColor: c.hex }}
                        />
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="mt-6 flex items-center gap-4 flex-wrap">
              <p className="text-[11px] uppercase tracking-[0.3em] text-gold/90 font-semibold">
                Qty
              </p>
              <div className="inline-flex items-center border border-gold/30">
                <button
                  onClick={() => setQty(Math.max(1, qty - 1))}
                  className="p-2 text-gold hover:bg-gold/10"
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <span className="w-10 text-center text-sm">{qty}</span>
                <button
                  onClick={() => setQty(qty + 1)}
                  className="p-2 text-gold hover:bg-gold/10"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
              <p className="text-sm text-muted-foreground">
                Total:{" "}
                <span className="text-gold font-semibold text-base">
                  {formatINR(total)}
                </span>
              </p>
            </div>

            <div className="p-4 grid grid-cols-[1fr_1.5fr] gap-3">
              <button
                onClick={() => addToCart(product.id, size, color, qty, refId ?? undefined)}
                disabled={isProductSoldOut || currentStock === 0}
                className="flex items-center justify-center gap-2 rounded-xl border-2 border-gold/40 bg-transparent py-3.5 text-sm font-bold text-gold uppercase tracking-wider hover:bg-gold/5 transition-colors disabled:opacity-50"
              >
                {isProductSoldOut || currentStock === 0 ? "Out of Stock" : "Add to Cart"}
              </button>
              <button
                onClick={handleBuy}
                disabled={!product.inStock || isProductSoldOut || currentStock === 0}
                className="px-6 py-3.5 bg-gold text-primary-foreground uppercase tracking-wide text-sm font-medium hover:bg-primary-glow disabled:opacity-50 transition-colors shadow-gold"
              >
                {isProductSoldOut || currentStock === 0 ? "Out of Stock" : "Buy Now"}
              </button>
            </div>


            <div className="mt-8 grid grid-cols-2 gap-3 text-xs">
              <Perk icon={Truck} label="Free shipping over ₹1000" />
              <Perk icon={ShieldCheck} label="Authenticity assured" />
            </div>
          </div>
        </div>

        {/* Reviews */}
        <section className="mt-20">
          <div className="flex items-end justify-between gap-4 flex-wrap">
            <div>
              <h2 className="font-display text-2xl md:text-3xl text-foreground">
                Customer Reviews
              </h2>
              <div className="gold-divider mt-3 w-16" />
            </div>
            <button
              onClick={() => setShowForm((s) => !s)}
              className="px-5 py-2.5 border border-gold/50 text-gold text-sm uppercase tracking-wide hover:bg-gold/10 rounded"
            >
              {showForm ? "Cancel" : "Add Review"}
            </button>
          </div>

          {showForm && (
            <form
              onSubmit={submitReview}
              className="mt-6 p-6 border border-gold/30 bg-card/60 rounded-sm space-y-4"
            >
              <div className="grid sm:grid-cols-2 gap-4">
                <label className="block">
                  <span className="text-[11px] uppercase tracking-[0.25em] text-gold font-semibold">
                    Your name
                  </span>
                  <input
                    value={reviewName}
                    onChange={(e) => setReviewName(e.target.value)}
                    required
                    className="mt-1 w-full bg-transparent border-b border-gold/30 py-2 text-foreground focus:outline-none focus:border-gold"
                  />
                </label>
                <label className="block">
                  <span className="text-[11px] uppercase tracking-[0.25em] text-gold font-semibold">
                    Rating
                  </span>
                  <div className="mt-2 flex gap-1">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setReviewRating(n)}
                        aria-label={`Rate ${n} stars`}
                      >
                        <Star
                          className={`h-6 w-6 ${
                            n <= reviewRating
                              ? "fill-[hsl(var(--gold))] text-[hsl(var(--gold))]"
                              : "text-gold/30"
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </label>
              </div>
              <label className="block">
                <span className="text-[11px] uppercase tracking-[0.25em] text-gold font-semibold">
                  Your review
                </span>
                <textarea
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  rows={4}
                  required
                  className="mt-1 w-full bg-transparent border border-gold/30 rounded p-3 text-foreground focus:outline-none focus:border-gold resize-none"
                />
              </label>
              <button
                type="submit"
                className="px-6 py-2.5 bg-gold text-primary-foreground uppercase text-sm tracking-wide hover:bg-primary-glow shadow-gold"
              >
                Submit Review
              </button>
            </form>
          )}

          <div className="mt-6 grid md:grid-cols-2 gap-6">
            {reviews.map((r) => (
              <div
                key={r.id}
                className="p-5 border border-gold/25 bg-card/60 rounded-sm"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1">
                    {Array.from({ length: r.rating }).map((_, i) => (
                      <Star
                        key={i}
                        className="h-3.5 w-3.5 fill-[hsl(var(--gold))] text-[hsl(var(--gold))]"
                      />
                    ))}
                  </div>
                  <span className="text-[11px] text-muted-foreground">
                    {new Date(r.date).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </div>
                <p className="mt-2 text-sm text-foreground">"{r.text}"</p>
                <p className="mt-2 text-xs text-gold/90 font-medium">
                  — {r.name}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Related */}
        <section className="mt-20">
          <h2 className="font-display text-2xl md:text-3xl text-foreground">
            You May Also Love
          </h2>
          <div className="gold-divider mt-3 w-16" />
          <div className="mt-8 grid grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-10">
            {related.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
        </section>
      </div>
    </Layout>
  );
};

function Gallery({
  images,
  name,
  activeThumb,
  viewIndex,
  direction,
  onThumbClick,
  onPrev,
  onNext,
  touchStartX,
}: {
  images: string[];
  name: string;
  activeThumb: number;
  viewIndex: number;
  direction: number;
  onThumbClick: (i: number) => void;
  onPrev: () => void;
  onNext: () => void;
  touchStartX: React.MutableRefObject<number | null>;
}) {
  const isMock = useMemo(() => {
    return images.some(
      (img) =>
        !img.includes("uploads") &&
        !img.startsWith("http") &&
        !img.startsWith("/uploads")
    );
  }, [images]);

  // Build isolated groups ONLY for mock items
  const groups = useMemo(() => {
    const len = images.length || 1;
    const groupCount = Math.min(4, Math.max(1, len));
    return Array.from({ length: groupCount }, (_, g) => {
      const cover = images[g % len];
      const extras = SUB_VIEW_EXTRAS[g % SUB_VIEW_EXTRAS.length];
      const sub = [cover, extras[0], extras[1]];
      return { cover, sub };
    });
  }, [images]);

  const safeThumb = Math.min(activeThumb, (isMock ? groups.length : images.length) - 1);
  const currentSrc = isMock
    ? groups[safeThumb].sub[Math.min(viewIndex, groups[safeThumb].sub.length - 1)]
    : images[safeThumb];

  const dotsCount = isMock ? 3 : images.length;
  const activeDotIndex = isMock ? viewIndex : safeThumb;
  const imageKey = isMock ? `${safeThumb}-${viewIndex}` : `${safeThumb}`;

  return (
    <div className="flex flex-col md:flex-row gap-3 md:gap-4 w-full max-w-[450px] md:max-w-[550px] mx-auto lg:mx-0">
      {/* Thumbnails */}
      <div className="flex flex-row md:flex-col gap-3 shrink-0 order-2 md:order-1 overflow-x-auto md:overflow-x-visible pb-2 md:pb-0 hide-scrollbar">
        {isMock
          ? groups.map((g, i) => (
              <button
                key={i}
                onClick={() => onThumbClick(i)}
                aria-label={`View group ${i + 1}`}
                className={`relative h-16 w-14 md:h-20 md:w-16 shrink-0 overflow-hidden rounded-sm border transition-all ${
                  i === safeThumb
                    ? "border-gold ring-2 ring-gold/40 shadow-gold"
                    : "border-gold/25 hover:border-gold/60"
                }`}
              >
                <img
                  src={g.cover}
                  alt=""
                  className="h-full w-full object-cover"
                />
              </button>
            ))
          : images.map((img, i) => (
              <button
                key={i}
                onClick={() => onThumbClick(i)}
                aria-label={`View image ${i + 1}`}
                className={`relative h-16 w-14 md:h-20 md:w-16 shrink-0 overflow-hidden rounded-sm border transition-all ${
                  i === safeThumb
                    ? "border-gold ring-2 ring-gold/40 shadow-gold"
                    : "border-gold/25 hover:border-gold/60"
                }`}
              >
                <img
                  src={img}
                  alt=""
                  className="h-full w-full object-cover"
                />
              </button>
            ))}
      </div>
 
      {/* Main Viewport */}
      <div
        className="relative flex-1 aspect-[3/4] overflow-hidden bg-card rounded-sm group select-none order-1 md:order-2"
        onTouchStart={(e) => {
          touchStartX.current = e.touches[0].clientX;
        }}
        onTouchEnd={(e) => {
          if (touchStartX.current === null) return;
          const dx = e.changedTouches[0].clientX - touchStartX.current;
          if (Math.abs(dx) > 40) {
            if (dx < 0) onNext();
            else onPrev();
          }
          touchStartX.current = null;
        }}
      >
        <AnimatePresence initial={false} custom={direction} mode="wait">
          <motion.img
            key={imageKey}
            src={currentSrc}
            alt={name}
            custom={direction}
            initial={{ opacity: 0, x: direction >= 0 ? 60 : -60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction >= 0 ? -60 : 60 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="absolute inset-0 h-full w-full object-cover"
          />
        </AnimatePresence>

        <button
          type="button"
          onClick={onPrev}
          aria-label="Previous image"
          className="absolute left-2 md:left-3 top-1/2 -translate-y-1/2 z-10 h-9 w-9 md:h-10 md:w-10 grid place-items-center rounded-full bg-background/70 backdrop-blur-sm border border-gold/40 text-gold hover:bg-gold hover:text-primary-foreground transition-colors shadow-gold"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={onNext}
          aria-label="Next image"
          className="absolute right-2 md:right-3 top-1/2 -translate-y-1/2 z-10 h-9 w-9 md:h-10 md:w-10 grid place-items-center rounded-full bg-background/70 backdrop-blur-sm border border-gold/40 text-gold hover:bg-gold hover:text-primary-foreground transition-colors shadow-gold"
        >
          <ChevronRight className="h-5 w-5" />
        </button>

        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 flex gap-1.5">
          {Array.from({ length: dotsCount }).map((_, i) => (
            <span
              key={i}
              className={`h-1.5 rounded-full transition-all ${
                i === activeDotIndex ? "w-5 bg-gold" : "w-1.5 bg-gold/40"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function Perk({
  icon: Icon,
  label,
}: {
  icon: typeof Truck;
  label: string;
}) {
  return (
    <div className="flex flex-col items-center text-center gap-1.5 p-3 border border-gold/15 rounded-sm">
      <Icon className="h-4 w-4 text-gold" />
      <span className="text-muted-foreground leading-tight">{label}</span>
    </div>
  );
}

export default ProductPage;
