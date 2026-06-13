import { useMemo, useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Package, Truck, Check, ClipboardList, Loader2 } from "lucide-react";
import { Layout } from "@/components/Layout";

type TrackOrder = {
  id: string;
  status: "Pending" | "Processing" | "Shipped" | "Delivered" | "Cancelled";
  total: number;
  date: string;
};

const stepOrder = ["Pending", "Processing", "Shipped", "Delivered"] as const;

const Track = () => {
  const [searchParams] = useSearchParams();
  const idParam = searchParams.get("id");

  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<TrackOrder | null>(null);

  const currentStepIndex = useMemo(() => {
    if (!order) return -1;
    const idx = stepOrder.indexOf(order.status as (typeof stepOrder)[number]);
    return idx >= 0 ? idx : -1;
  }, [order]);

  const fetchOrderStatus = async (orderId: string) => {
    if (!orderId) return;

    setLoading(true);
    setError(null);
    setOrder(null);

    try {
      const token = localStorage.getItem("pantix_token");
      const res = await fetch(`https://pantix-final-3.onrender.com/api/orders/${orderId}`, {
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Unable to fetch this order");
      }

      const data = await res.json();
      setOrder({
        id: data.id,
        status: data.status,
        total: Number(data.total || 0),
        date: data.date,
      });
    } catch (err: any) {
      setError(err.message || "Unable to fetch this order");
    } finally {
      setLoading(false);
    }
  };

  const trackOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    const orderId = query.trim().toUpperCase();
    if (!orderId) return;
    fetchOrderStatus(orderId);
  };

  useEffect(() => {
    if (idParam) {
      setQuery(idParam);
      fetchOrderStatus(idParam.trim().toUpperCase());
    }
  }, [idParam]);

  return (
    <Layout>
      <div className="mx-auto max-w-3xl px-4 pt-6 pb-16">
        <h1 className="font-display text-4xl md:text-5xl gradient-text-gold text-center">
          Track Your Order
        </h1>
        <div className="gold-divider mt-3 mx-auto w-24" />
        <p className="mt-4 text-center text-muted-foreground">
          Enter your Order ID to check latest live status.
        </p>

        <form onSubmit={trackOrder} className="mt-10 flex gap-2 max-w-md mx-auto">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="PNX-1042"
            className="flex-1 bg-transparent border border-gold/30 px-4 py-3 text-foreground focus:outline-none focus:border-gold"
          />
          <button
            className="px-6 py-3 bg-gold text-primary-foreground uppercase text-sm tracking-wide hover:bg-primary-glow disabled:opacity-70"
            disabled={loading}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Track"}
          </button>
        </form>

        {error && (
          <div className="mt-6 text-center text-destructive text-sm">{error}</div>
        )}

        {order && (
          <div className="mt-12 p-6 border border-gold/20 bg-card/50 rounded-sm">
            <p className="text-sm text-muted-foreground">Order ID</p>
            <p className="font-display text-2xl text-gold">{order.id}</p>

            <div className="mt-8 grid grid-cols-4 gap-2 relative">
              <div className="absolute top-5 left-[12.5%] right-[12.5%] h-px bg-gold/20" />
              <div
                className="absolute top-5 left-[12.5%] h-px bg-gold"
                style={{ width: `${Math.max(0, (currentStepIndex / 3) * 75)}%` }}
              />
              {[
                { icon: ClipboardList, label: "Pending" },
                { icon: Package, label: "Processing" },
                { icon: Truck, label: "Shipped" },
                { icon: Check, label: "Delivered" },
              ].map((s, idx) => {
                const done = currentStepIndex >= idx;
                return (
                  <div key={s.label} className="relative flex flex-col items-center">
                    <div
                      className={`h-10 w-10 rounded-full grid place-items-center border-2 ${
                        done
                          ? "bg-gold border-gold text-primary-foreground"
                          : "bg-card border-gold/30 text-muted-foreground"
                      }`}
                    >
                      <s.icon className="h-4 w-4" />
                    </div>
                    <p className={`mt-2 text-xs ${done ? "text-gold" : "text-muted-foreground"}`}>
                      {s.label}
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="mt-8 text-sm text-foreground">
              <p>
                Current status: <span className="text-gold">{order.status}</span>
              </p>
              <p className="mt-1 text-muted-foreground">
                Last updated on {new Date(order.date).toLocaleString()}.
              </p>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Track;
