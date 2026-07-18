import { useEffect, useState } from "react";
import { Link } from "@/lib/router-compat";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Star } from "lucide-react";
import c1 from "@/assets/c1.jpeg";
import c2 from "@/assets/c2.jpeg";
import c3 from "@/assets/c3.jpeg";
import c4 from "@/assets/c4.jpeg";
import cm1 from "@/assets/cm1.png";
import cm2 from "@/assets/cm2.png";
import cm3 from "@/assets/cm3.png";
import cm4 from "@/assets/cm4.png";

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
    image: c1,
    mobileImage: cm1,
    position: "object-center",
    align: "left",
  },
  {
    id: "festive",
    eyebrow: "Festive Glamour Edit",
    image: c2,
    mobileImage: cm2,
    position: "object-center",
    align: "left",
  },
  {
    id: "modern",
    eyebrow: "New Arrivals For Queens",
    image: c3,
    mobileImage: cm3,
    position: "object-center",
    align: "left",
  },
  {
    id: "luxury",
    eyebrow: "Exclusive Luxury Couture",
    image: c4,
    mobileImage: cm4,
    position: "object-center",
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
    <section className="relative w-full overflow-hidden -mt-20 lg:-mt-24 aspect-[2/3] md:aspect-[16/9] h-auto bg-emerald-deep">
      {/* Background images — fade between slides without zoom */}
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
          <img
            src={slide.image}
            alt=""
            aria-hidden="true"
            className="hidden md:block absolute inset-0 h-full w-full object-cover object-center"
            loading={active === 0 ? "eager" : "lazy"}
            decoding="async"
          />
          {/* Mobile image */}
          <img
            src={slide.mobileImage ?? slide.image}
            alt=""
            aria-hidden="true"
            className="md:hidden absolute inset-0 h-full w-full object-cover object-center"
            loading={active === 0 ? "eager" : "lazy"}
            decoding="async"
          />
        </motion.div>
      </AnimatePresence>

      {/* Readability gradients */}
      <div
        className="absolute inset-0 pointer-events-none hidden md:block"
        style={{
          background:
            "linear-gradient(270deg, hsl(var(--emerald-deep)/0.7) 0%, hsl(var(--emerald-deep)/0.3) 30%, transparent 60%)",
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none md:hidden"
        style={{
          background:
            "linear-gradient(180deg, transparent 0%, hsl(var(--emerald-deep)/0.1) 40%, hsl(var(--emerald-deep)/0.7) 75%, hsl(var(--emerald-deep)/0.9) 100%)",
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

      {/* Content Overlay */}
      <div className="absolute inset-0 z-10">
        <div className="mx-auto max-w-[1280px] h-full px-4 sm:px-6 lg:px-12 flex items-end md:items-center justify-center md:justify-end pb-14 md:pb-0 pt-28 md:pt-20">
          <div className="w-full md:max-w-[520px] lg:max-w-[560px] flex flex-col items-center md:items-end text-center md:text-right px-2 sm:px-0">
            
            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.35 }}
              className="flex flex-row gap-2.5 justify-center md:justify-end w-full sm:w-auto"
            >
              <Link
                to="/shop"
                className="inline-flex items-center justify-center gap-1.5 px-3 md:px-7 py-2.5 md:py-3 rounded-md bg-gradient-gold text-emerald-deep font-bold md:font-semibold tracking-wider md:tracking-wide uppercase text-[11px] md:text-[13px] hover:brightness-110 transition flex-1 sm:flex-none"
              >
                Shop Now
                <ArrowRight className="h-3.5 w-3.5 md:h-4 md:w-4" />
              </Link>
              <Link
                to="/categories"
                className="inline-flex items-center justify-center px-3 md:px-7 py-2.5 md:py-3 rounded-md border border-gold/70 text-gold font-bold md:font-medium tracking-wider md:tracking-wide uppercase text-[11px] md:text-[13px] hover:bg-gold/10 transition flex-1 sm:flex-none"
              >
                Explore<span className="hidden sm:inline"> Collection</span>
              </Link>
            </motion.div>

            {/* Footer Trust Elements */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.6 }}
              className="mt-4 md:mt-6 w-full"
            >
              <p className="text-[8.5px] md:text-[10.5px] tracking-[0.18em] uppercase text-foreground/80 md:text-foreground/65 leading-relaxed">
                Free Shipping <span className="text-gold/50 mx-1 md:mx-2">|</span> Secure Checkout{" "}
                <span className="text-gold/50 mx-1 md:mx-2">|</span> Premium Quality
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
