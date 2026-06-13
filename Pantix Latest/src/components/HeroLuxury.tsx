import { useEffect, useState } from "react";
import { Link } from "@/lib/router-compat";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Star } from "lucide-react";
import heroBridal from "@/assets/hero-editorial-bridal.jpg";
import heroFestive from "@/assets/hero-editorial-festive.jpg";
import heroModern from "@/assets/hero-editorial-modern.jpg";
import heroMobile from "@/assets/hero-mobile-bridal.jpg";

type Slide = {
  id: string;
  eyebrow: string;
  image: string;
  mobileImage?: string;
  /** tailwind object-position class for desktop framing */
  position?: string;
  /** which side text sits — controls overlay gradient direction */
  align?: "left" | "center";
};

const SLIDES: Slide[] = [
  {
    id: "bridal",
    eyebrow: "Bridal Royal Collection",
    image: heroBridal,
    mobileImage: heroMobile,
    position: "object-center",
    align: "left",
  },
  {
    id: "festive",
    eyebrow: "Festive Glamour Edit",
    image: heroFestive,
    position: "object-center",
    align: "left",
  },
  {
    id: "modern",
    eyebrow: "New Arrivals For Queens",
    image: heroModern,
    position: "object-right",
    align: "left",
  },
];

const HEADING_PRE = "Wrap Yourself In";
const HEADING_HIGHLIGHT = "Royal Elegance";
const SUBHEADING =
  "Discover exclusive sarees, lehengas, festive wear, bridal collections, and timeless ethnic fashion crafted for modern queens.";

export function HeroLuxury() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setActive((p) => (p + 1) % SLIDES.length), 5000);
    return () => clearInterval(id);
  }, []);

  const slide = SLIDES[active];

  return (
    <section className="relative w-full overflow-hidden -mt-20 lg:-mt-24 h-[100svh] min-h-[640px] max-h-[900px] md:h-[88vh] md:min-h-[620px] md:max-h-[760px] bg-emerald-deep">
      {/* Background images — fade between slides with very slow zoom */}
      <AnimatePresence mode="sync">
        <motion.div
          key={slide.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.6, ease: [0.4, 0, 0.2, 1] }}
          className="absolute inset-0"
        >
          {/* Desktop image */}
          <motion.img
            src={slide.image}
            alt=""
            aria-hidden="true"
            initial={{ scale: 1.06 }}
            animate={{ scale: 1 }}
            transition={{ duration: 8, ease: "easeOut" }}
            className={`hidden md:block absolute inset-0 h-full w-full object-cover ${slide.position ?? "object-center"}`}
            loading={active === 0 ? "eager" : "lazy"}
            decoding="async"
          />
          {/* Mobile image (uses dedicated mobile shot for slide 0; otherwise reuse) */}
          <motion.img
            src={slide.mobileImage ?? slide.image}
            alt=""
            aria-hidden="true"
            initial={{ scale: 1.06 }}
            animate={{ scale: 1 }}
            transition={{ duration: 8, ease: "easeOut" }}
            className="md:hidden absolute inset-0 h-full w-full object-cover object-center"
            loading={active === 0 ? "eager" : "lazy"}
            decoding="async"
          />
        </motion.div>
      </AnimatePresence>

      {/* Emerald readability gradient — left strong on desktop, bottom strong on mobile */}
      <div
        className="absolute inset-0 pointer-events-none hidden md:block"
        style={{
          background:
            "linear-gradient(90deg, hsl(var(--emerald-deep)/0.92) 0%, hsl(var(--emerald-deep)/0.75) 28%, hsl(var(--emerald-deep)/0.35) 55%, transparent 80%)",
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none md:hidden"
        style={{
          background:
            "linear-gradient(180deg, hsl(var(--emerald-deep)/0.55) 0%, hsl(var(--emerald-deep)/0.2) 35%, hsl(var(--emerald-deep)/0.85) 75%, hsl(var(--emerald-deep)/0.96) 100%)",
        }}
      />
      {/* Subtle vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(120% 80% at 50% 50%, transparent 55%, hsl(var(--emerald-deep)/0.55) 100%)",
        }}
      />

      {/* Content */}
      <div className="relative z-10 h-full">
        <div className="mx-auto max-w-[1280px] h-full px-6 lg:px-12 flex items-end md:items-center pb-16 md:pb-0 pt-28 md:pt-20">
          <div className="w-full md:max-w-[520px] lg:max-w-[560px] text-center md:text-left">
            <AnimatePresence mode="wait">
              <motion.div
                key={slide.id + "-text"}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
              >
                <p className="text-[10px] md:text-[11px] tracking-[0.42em] uppercase text-gold/90 font-medium">
                  {slide.eyebrow}
                </p>
              </motion.div>
            </AnimatePresence>

            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            >
              <p className="mt-2 md:mt-2.5 text-[11px] md:text-[10px] tracking-[0.5em] uppercase text-foreground/70">
                New Luxury Collection 2026
              </p>
              <h1 className="mt-4 md:mt-4 font-display leading-[0.95] md:leading-[1.02] tracking-[-0.01em] text-foreground text-[2.6rem] sm:text-5xl md:text-[3.25rem] lg:text-[3.75rem] xl:text-[4.25rem]">
                {HEADING_PRE}
                <span className="block italic font-semibold gradient-text-gold mt-0.5 md:mt-1">
                  {HEADING_HIGHLIGHT}
                </span>
              </h1>
              <div className="gold-divider mt-5 md:mt-4 mx-auto md:mx-0 w-16" />
              <p className="mt-5 md:mt-4 max-w-lg md:max-w-[480px] mx-auto md:mx-0 text-[15px] md:text-[14.5px] lg:text-[15px] text-foreground/85 leading-relaxed md:leading-[1.65]">
                {SUBHEADING}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.35 }}
              className="mt-8 md:mt-6 flex flex-col sm:flex-row gap-3 sm:gap-3.5 justify-center md:justify-start"
            >
              <Link
                to="/shop"
                className="inline-flex items-center justify-center gap-2 px-7 md:px-7 py-3.5 md:py-3 rounded-md bg-gradient-gold text-emerald-deep font-semibold tracking-wide uppercase text-sm md:text-[13px] hover:brightness-110 transition w-full sm:w-auto"
              >
                Shop Now
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/categories"
                className="inline-flex items-center justify-center px-7 md:px-7 py-3.5 md:py-3 rounded-md border border-gold/70 text-gold font-medium tracking-wide uppercase text-sm md:text-[13px] hover:bg-gold/10 transition w-full sm:w-auto"
              >
                Explore Collection
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.6 }}
              className="mt-8 md:mt-6 space-y-2 md:space-y-1.5"
            >
              <div className="flex items-center justify-center md:justify-start gap-2.5">
                <div className="flex">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <Star key={i} className="h-3.5 w-3.5 md:h-3 md:w-3 fill-gold text-gold" />
                  ))}
                </div>
                <span className="text-xs md:text-[12px] text-foreground/85">
                  Trusted by <span className="text-gold font-semibold">10,000+</span> Customers
                </span>
              </div>
              <p className="text-[11px] md:text-[10.5px] tracking-[0.18em] uppercase text-foreground/65">
                Free Shipping <span className="text-gold/50 mx-2">|</span> Secure Checkout{" "}
                <span className="text-gold/50 mx-2">|</span> Premium Quality
              </p>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Slide indicators */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3">
        {SLIDES.map((s, i) => (
          <button
            key={s.id}
            onClick={() => setActive(i)}
            aria-label={`Go to slide ${i + 1}`}
            className="relative h-[2px] overflow-hidden bg-foreground/25 transition-all"
            style={{ width: i === active ? 48 : 20 }}
          >
            {i === active && (
              <motion.span
                key={`bar-${active}`}
                initial={{ width: 0 }}
                animate={{ width: "100%" }}
                transition={{ duration: 5, ease: "linear" }}
                className="absolute inset-y-0 left-0 bg-gold"
              />
            )}
          </button>
        ))}
      </div>
    </section>
  );
}
