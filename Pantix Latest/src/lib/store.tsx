import { API_URL } from "@/api";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import { products as staticProducts, categories as staticCategories, imageByName, type Product } from "./products";

export type CartItem = {
  id: string;
  size: string;
  color?: string;
  qty: number;
  reseller_id?: string | number;
  reseller_margin?: string | number;
};

export type Address = {
  id: string;
  label: string;
  line1: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
};

export type Order = {
  id: string;
  date: string;
  total: number;
  status: "Processing" | "Shipped" | "Delivered" | "Cancelled";
  items: { id: string; name: string; qty: number; price: number }[];
};

export type User = {
  id: number;
  email: string;
  name: string;
  phone?: string;
  is_reseller?: boolean;
  reseller_code?: string;
  wallet_balance?: string | number;
};

export type StoreCategory = {
  id: string;
  label: string;
  image: string;
};

type StoreCtx = {
  cart: CartItem[];
  wishlist: string[];
  user: User | null;
  addresses: Address[];
  orders: Order[];
  products: Product[];
  isLoadingProducts: boolean;
  categories: StoreCategory[];
  isLoadingCategories: boolean;
  getProduct: (id: string) => Product | undefined;
  addToCart: (id: string, size: string, color: string, qty?: number, reseller_id?: string | number, reseller_margin?: string | number) => void;
  updateQty: (id: string, size: string, color: string, qty: number) => void;
  removeFromCart: (id: string, size: string, color: string) => void;
  clearCart: () => void;
  toggleWishlist: (id: string) => void;
  isWished: (id: string) => boolean;
  cartCount: number;
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  register: (
    name: string,
    email: string,
    password: string
  ) => Promise<{ ok: boolean; error?: string }>;
  logout: () => void;
  updateProfile: (patch: Partial<User>) => void;
  addAddress: (a: Omit<Address, "id">) => void;
  removeAddress: (id: string) => void;
  enableReseller: () => Promise<boolean>;
  refreshUser: () => Promise<void>;
};

const Ctx = createContext<StoreCtx | null>(null);
const isBrowser = typeof window !== "undefined";

function load<T>(key: string, fallback: T): T {
  if (!isBrowser) return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>(() =>
    load<CartItem[]>("pantix:cart", [])
  );
  const [wishlist, setWishlist] = useState<string[]>(() =>
    load<string[]>("pantix:wishlist", [])
  );
  const [user, setUser] = useState<User | null>(() =>
    load<User | null>("pantix:user", null)
  );
  const [addresses, setAddresses] = useState<Address[]>(() =>
    load<Address[]>("pantix:addresses", [])
  );
  const [orders] = useState<Order[]>(() =>
    load<Order[]>("pantix:orders", [])
  );

  const refreshUser = useCallback(async () => {
    const token = localStorage.getItem("pantix_token");
    if (!token) return;
    try {
      const response = await fetch(`${API_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setUser(data);
        if (data.addresses) {
          let parsed = data.addresses;
          if (typeof parsed === 'string') {
            try { parsed = JSON.parse(parsed); } catch {}
          }
          if (Array.isArray(parsed)) {
            setAddresses(parsed);
          }
        }
      }
    } catch (err) {
      console.error("Failed to refresh user profile", err);
    }
  }, []);

  const enableReseller = useCallback(async () => {
    const token = localStorage.getItem("pantix_token");
    if (!token) return false;
    try {
      const response = await fetch(`${API_URL}/api/auth/reseller/enable`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setUser(data.user);
          toast.success("Reseller mode enabled! 🚀");
          return true;
        }
      }
      return false;
    } catch (err) {
      console.error("Failed to enable reseller mode", err);
      return false;
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const [products, setProducts] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [categories, setCategories] = useState<StoreCategory[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);

  useEffect(() => {
    let active = true;
    const API_BASE_URL = `${API_URL}`;

    const fetchAll = async () => {
      let rawProducts: any[] = [];
      let rawCategories: any[] = [];
      
      try {
        const prodRes = await fetch(`${API_BASE_URL}/api/products`);
        if (prodRes.ok) {
          rawProducts = await prodRes.json();
        } else {
          console.warn("Failed to fetch products from backend, falling back to static");
          rawProducts = staticProducts;
        }
      } catch (err) {
        console.error("Error fetching products from backend, falling back to static", err);
        rawProducts = staticProducts;
      }

      try {
        const catRes = await fetch(`${API_BASE_URL}/api/categories`);
        if (catRes.ok) {
          rawCategories = await catRes.json();
        } else {
          console.warn("Failed to fetch categories from backend, falling back to static");
          rawCategories = staticCategories.map(c => ({ id: c.id, slug: c.id, name: c.label, image: c.image }));
        }
      } catch (err) {
        console.error("Error fetching categories from backend, falling back to static", err);
        rawCategories = staticCategories.map(c => ({ id: c.id, slug: c.id, name: c.label, image: c.image }));
      }

      if (!active) return;

      const resolveImage = (img: string | null | undefined) => {
        if (!img) return "";
        if (img.startsWith("http")) return img;
        if (img.startsWith("/uploads/")) return `${API_BASE_URL}${img}`;
        if (img.startsWith("uploads/")) return `${API_BASE_URL}/${img}`;
        
        const filename = img.replace(/^\/+/, "");
        if (imageByName[filename]) return imageByName[filename];
        return `/images/${filename}`;
      };

      // 1. Process and map Categories first
      const mappedCats = rawCategories.map((c: any) => {
        const imgPath = c.image;
        const finalImage =
          resolveImage(imgPath) ||
          staticCategories.find((fc) => fc.id === c.slug)?.image ||
          staticCategories[0]?.image ||
          "";

        return {
          id: c.slug,
          label: c.name,
          image: finalImage,
        };
      });

      // 2. Process and map Products
      const mappedProds = rawProducts.map((p: any): Product => {
        let parsedColors = p.colors;
        if (typeof p.colors === "string") {
          try {
            parsedColors = JSON.parse(p.colors);
          } catch (e) {
            parsedColors = null;
          }
        }

        // Lookup category by id/slug in backend response to resolve to its slug
        const dbCategory = rawCategories.find(
          (c: any) => c.id === p.category || c.slug === p.category
        );
        const frontendCategorySlug = dbCategory ? dbCategory.slug : p.category;

        return {
          id: p.id,
          name: p.name,
          price: Number(p.price),
          mrp: Number(p.mrp),
          category: frontendCategorySlug,
          categoryLabel: p.category_label || (dbCategory ? dbCategory.name : p.category || ""),
          image: resolveImage(p.image),
          images: Array.isArray(p.images) ? p.images.map(resolveImage) : [resolveImage(p.image)],
          sizes: Array.isArray(p.sizes) ? p.sizes : [],
          description: p.description || "",
          inStock: p.in_stock !== undefined ? p.in_stock : true,
          stock: p.stock !== undefined ? Number(p.stock) : undefined,
          badge: p.badge || undefined,
          colors: parsedColors || undefined,
          isBudget: p.is_budget === true || p.is_budget === "true",
          isPopular: p.is_popular === true || p.is_popular === "true",
          commission_rate: Number(p.commission_rate) || 0,
        };
      });

      setCategories(mappedCats);
      setIsLoadingCategories(false);
      setProducts(mappedProds);
      setIsLoadingProducts(false);
    };

    fetchAll();

    return () => {
      active = false;
    };
  }, []);

  const getProduct = useCallback(
    (id: string) => products.find((p) => p.id === id),
    [products]
  );

  useEffect(() => {
    if (isBrowser) localStorage.setItem("pantix:cart", JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    if (isBrowser)
      localStorage.setItem("pantix:wishlist", JSON.stringify(wishlist));
  }, [wishlist]);

  useEffect(() => {
    if (isBrowser) localStorage.setItem("pantix:user", JSON.stringify(user));
  }, [user]);

  useEffect(() => {
    if (isBrowser)
      localStorage.setItem("pantix:addresses", JSON.stringify(addresses));
  }, [addresses]);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (!response.ok) {
        return { ok: false, error: data.error || "Login failed" };
      }
      if (isBrowser) localStorage.setItem("pantix_token", data.token);
      setUser(data.user);
      return { ok: true };
    } catch (err) {
      return { ok: false, error: "Network error" };
    }
  }, []);

  const register = useCallback(
    async (name: string, email: string, password: string) => {
      try {
        const response = await fetch(`${API_URL}/api/auth/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password }),
        });
        const data = await response.json();
        if (!response.ok) {
          return { ok: false, error: data.error || "Registration failed" };
        }
        if (isBrowser) localStorage.setItem("pantix_token", data.token);
        setUser(data.user);
        return { ok: true };
      } catch (err) {
        return { ok: false, error: "Network error" };
      }
    },
    []
  );

  const value = useMemo<StoreCtx>(
    () => ({
      cart,
      wishlist,
      user,
      addresses,
      orders,
      products,
      isLoadingProducts,
      categories,
      isLoadingCategories,
      getProduct,
      cartCount: cart.reduce((s, i) => s + i.qty, 0),
      addToCart: (id, size, color, qty = 1, reseller_id, reseller_margin) => {
        const product = getProduct(id);
        setCart((prev) => {
          const idx = prev.findIndex(
            (p) => p.id === id && p.size === size && p.color === color
          );
          if (idx >= 0) {
            const next = [...prev];
            next[idx] = { ...next[idx], qty: next[idx].qty + qty };
            return next;
          }
          return [...prev, { id, size, color, qty, reseller_id, reseller_margin }];
        });
        toast.success(product ? `${product.name} added` : "Added to cart", {
          description: `Size: ${size}${color ? `, Color: ${color}` : ""}`,
        });
      },
      updateQty: (id, size, color, qty) =>
        setCart((prev) =>
          prev
            .map((p) =>
              p.id === id && p.size === size && p.color === color
                ? { ...p, qty: Math.max(0, qty) }
                : p
            )
            .filter((p) => p.qty > 0)
        ),
      removeFromCart: (id, size, color) =>
        setCart((prev) =>
          prev.filter(
            (p) => !(p.id === id && p.size === size && p.color === color)
          )
        ),
      clearCart: () => {
        setCart([]);
        toast.info("Cart cleared");
      },
      toggleWishlist: (id) => {
        const product = getProduct(id);
        setWishlist((prev) => {
          const exists = prev.includes(id);
          if (exists) {
            toast.info("Removed from wishlist");
            return prev.filter((x) => x !== id);
          } else {
            toast.success(product ? `${product.name} saved` : "Saved to wishlist");
            return [...prev, id];
          }
        });
      },
      isWished: (id) => wishlist.includes(id),
      login,
      register,
      logout: () => {
        if (isBrowser) localStorage.removeItem("pantix_token");
        setUser(null);
      },
      updateProfile: (patch) =>
        setUser((u) => (u ? { ...u, ...patch } : u)),
      addAddress: async (a) => {
        const id = Math.random().toString(36).slice(2, 9);
        const newAddress = { ...a, id };
        setAddresses((prev) => [...prev, newAddress]);
        
        const token = localStorage.getItem("pantix_token");
        if (token) {
          try {
            await fetch(`${API_URL}/api/auth/addresses`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({ address: newAddress }),
            });
          } catch (e) {
            console.error("Failed to sync address", e);
          }
        }
      },
      removeAddress: async (id) => {
        setAddresses((prev) => prev.filter((a) => a.id !== id));
        
        const token = localStorage.getItem("pantix_token");
        if (token) {
          try {
            await fetch(`${API_URL}/api/auth/addresses/${id}`, {
              method: "DELETE",
              headers: {
                Authorization: `Bearer ${token}`,
              },
            });
          } catch (e) {
            console.error("Failed to sync address removal", e);
          }
        }
      },
      enableReseller,
      refreshUser,
    }),
    [cart, wishlist, user, addresses, orders, login, register, products, getProduct, categories, isLoadingCategories, enableReseller, refreshUser]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}

export const formatINR = (n: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);
