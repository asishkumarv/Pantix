import { useEffect, useMemo, useRef } from "react";
import { Link } from "@/lib/router-compat";
import { ArrowRight } from "lucide-react";
import { Layout } from "@/components/Layout";
import { ProductCard } from "@/components/ProductCard";
import { HeroLuxury } from "@/components/HeroLuxury";
import { useStore } from "@/lib/store";

const Index = () => {
  const { products, categories } = useStore();
  const latest = useMemo(() => products.slice(0, 8), [products]);
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const singleSetWidthRef = useRef(0);
  const loop = useMemo(() => [...categories, ...categories, ...categories], [categories]);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el || categories.length === 0) return;

    let raf = 0;
    let last = performance.now();
    let isInteracting = false;
    let isHovering = false;
    let resumeTimeout: number | null = null;

    const setMetrics = () => {
      singleSetWidthRef.current = el.scrollWidth / 3;
      if (singleSetWidthRef.current > 0 && el.scrollLeft === 0) {
        el.scrollLeft = singleSetWidthRef.current;
      }
    };

    const normalizeScroll = () => {
      const singleSetWidth = singleSetWidthRef.current;
      if (!singleSetWidth) return;

      if (el.scrollLeft >= singleSetWidth * 2) {
        el.scrollLeft -= singleSetWidth;
      } else if (el.scrollLeft <= 0) {
        el.scrollLeft += singleSetWidth;
      }
    };

    const tick = (now: number) => {
      const delta = now - last;
      last = now;

      if (!isHovering && !isInteracting) {
        el.scrollLeft += delta * 0.035;
        normalizeScroll();
      }

      raf = window.requestAnimationFrame(tick);
    };

    const handleScroll = () => {
      normalizeScroll();
    };

    const handleTouchStart = () => {
      isInteracting = true;
      if (resumeTimeout) clearTimeout(resumeTimeout);
    };

    const handleTouchEnd = () => {
      if (resumeTimeout) clearTimeout(resumeTimeout);
      resumeTimeout = window.setTimeout(() => {
        isInteracting = false;
        last = performance.now();
      }, 1500);
    };

    const handleMouseEnter = () => {
      if (window.matchMedia("(hover: hover)").matches) {
        isHovering = true;
      }
    };

    const handleMouseLeave = () => {
      isHovering = false;
    };

    setMetrics();
    raf = window.requestAnimationFrame(tick);

    window.addEventListener("resize", setMetrics);
    el.addEventListener("scroll", handleScroll);
    el.addEventListener("touchstart", handleTouchStart, { passive: true });
    el.addEventListener("touchend", handleTouchEnd, { passive: true });
    el.addEventListener("touchcancel", handleTouchEnd, { passive: true });
    el.addEventListener("mouseenter", handleMouseEnter);
    el.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      window.cancelAnimationFrame(raf);
      window.removeEventListener("resize", setMetrics);
      if (resumeTimeout) clearTimeout(resumeTimeout);

      el.removeEventListener("scroll", handleScroll);
      el.removeEventListener("touchstart", handleTouchStart);
      el.removeEventListener("touchend", handleTouchEnd);
      el.removeEventListener("touchcancel", handleTouchEnd);
      el.removeEventListener("mouseenter", handleMouseEnter);
      el.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [categories]);

  return (
    <Layout>
      <HeroLuxury />

      {/* Categories — infinite marquee */}
      <section className="py-10 md:py-16">
        <div className="mx-auto max-w-[1400px] px-4 lg:px-8">
          <SectionHeader eyebrow="Explore" title="Shop by Category" />
        </div>
        <div
          ref={scrollerRef}
          className="category-scroller hide-scrollbar mt-10 overflow-x-auto overflow-y-hidden"
        >
          <div className="flex w-max gap-4 md:gap-6 lg:gap-8 px-1">
            {loop.map((c, i) => (
              <Link
                key={`${c.id}-${i}`}
                to={`/category/${c.id}`}
                className="category-arch-card group shrink-0 w-[168px] sm:w-[188px] md:w-[220px] lg:w-[240px]"
                onDragStart={(event) => event.preventDefault()}
              >
                <div className="category-arch-frame relative aspect-[0.82] overflow-hidden">
                  <img
                    src={c.image}
                    alt={c.label}
                    loading="lazy"
                    draggable={false}
                    className="h-full w-full object-cover object-top brightness-110 contrast-105 saturate-110 transition-transform duration-700 group-hover:scale-[1.04]"
                  />
                </div>
                <div className="mt-4 px-2 text-center">
                  <p className="font-display text-[1.45rem] leading-none text-foreground md:text-[1.7rem] lg:text-[1.85rem]">
                    {c.label}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Latest arrivals */}
      <section className="py-12 pb-20">
        <div className="mx-auto max-w-[1400px] px-4 lg:px-8">
          <SectionHeader eyebrow="Just dropped" title="Latest Arrivals" />
          <div className="mt-10 grid grid-cols-2 lg:grid-cols-4 gap-x-4 md:gap-x-6 gap-y-10">
            {latest.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
          <div className="mt-12 flex justify-center">
            <Link to="/shop" className="btn-gold group">
              View More
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>
    </Layout>
  );
};

function SectionHeader({
  eyebrow,
  title,
}: {
  eyebrow: string;
  title: string;
}) {
  return (
    <div className="text-center">
      <p className="text-xs uppercase tracking-[0.4em] text-gold/80">
        {eyebrow}
      </p>
      <h2 className="mt-2 font-display text-4xl md:text-5xl gradient-text-gold inline-block">
        {title}
      </h2>
      <div className="gold-divider mt-4 mx-auto w-24" />
    </div>
  );
}

export default Index;
