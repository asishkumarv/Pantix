import { API_URL } from "@/api";
import { Link } from "@/lib/router-compat";
import { Layout } from "@/components/Layout";
import { useStore } from "@/lib/store";

type ApiCategory = {
  id: string;
  name: string;
  slug: string;
  image: string | null;
};

const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, "") ||
  `${API_URL}`;

const resolveImage = (image: string | null | undefined, fallback: string) => {
  if (!image) return fallback;
  if (image.startsWith("http")) return image;
  if (image.startsWith("/uploads/")) return `${API_BASE_URL}${image}`;
  if (image.startsWith("uploads/")) return `${API_BASE_URL}/${image}`;
  // If backend returns a bare filename that matches our imported assets, use it
  const filename = image.replace(/^\/+/, "");
  if (imageByName[filename]) return imageByName[filename];
  if (image.startsWith("/images/") || image.startsWith("images/")) {
    return image.startsWith("/") ? image : `/${image}`;
  }
  if (image.startsWith("/")) return image;
  return `/images/${filename}`;
};

const Categories = () => {
  const { categories: renderedCategories, isLoadingCategories } = useStore();

  if (isLoadingCategories) {
    return (
      <Layout>
        <div className="flex h-[400px] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gold border-t-transparent"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mx-auto max-w-7xl px-4 pt-6 pb-16">
        <p className="text-xs uppercase tracking-[0.4em] text-gold/80 text-center">
          Pantix
        </p>
        <h1 className="mt-2 text-center font-display text-4xl md:text-6xl gradient-text-gold">
          All Categories
        </h1>
        <div className="gold-divider mt-4 mx-auto w-24" />

        <div className="mt-12 grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
          {renderedCategories.map((c) => (
            <Link
              key={c.id}
              to={`/category/${c.id}`}
              className="group relative aspect-[4/5] overflow-hidden rounded-sm border border-gold/20 hover:border-gold/60 transition-colors"
            >
              <img
                src={c.image}
                alt={c.label}
                loading="lazy"
                className="absolute inset-0 h-full w-full object-cover brightness-110 contrast-105 saturate-110 group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-emerald-deep/85 via-emerald-deep/20 to-transparent" />
              <div className="absolute bottom-0 inset-x-0 p-5">
                <p className="text-[10px] uppercase tracking-[0.3em] text-gold/80">
                  Shop
                </p>
                <h2 className="font-display text-2xl md:text-3xl text-foreground group-hover:text-gold transition-colors">
                  {c.label}
                </h2>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default Categories;
