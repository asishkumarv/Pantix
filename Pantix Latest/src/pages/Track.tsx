import { API_URL } from "@/api";
import { useMemo, useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Package, Truck, Check, ClipboardList, Loader2 } from "lucide-react";
import { Layout } from "@/components/Layout";
import { formatINR } from "@/lib/store";

type TrackOrder = {
  id: string;
  status: "Ordered" | "Shipped" | "Out for Delivery" | "Delivered" | "Cancelled";
  total: number;
  date: string;
  items: any[];
  status_dates?: Record<string, string>;
};

const stepOrder = ["Ordered", "Shipped", "Out for Delivery", "Delivered"] as const;

const getStatusDates = (orderDateStr: string, statusDates?: Record<string, string>, currentStatus?: string) => {
  const dates: Record<string, string> = { ...statusDates };
  const orderDate = new Date(orderDateStr);
  
  if (!dates.Ordered) {
    dates.Ordered = orderDate.toISOString();
  }
  
  const addDays = (date: Date, days: number) => {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d.toISOString();
  };

  const normStatus = (currentStatus || "").toLowerCase();

  if (!dates.Shipped && (statusDates?.Shipped || ["shipped", "out for delivery", "delivered"].includes(normStatus))) {
    dates.Shipped = addDays(orderDate, 1);
  }

  if (!dates["Out for Delivery"] && (statusDates?.["Out for Delivery"] || ["out for delivery", "delivered"].includes(normStatus))) {
    dates["Out for Delivery"] = addDays(orderDate, 2);
  }

  if (!dates.Delivered && (statusDates?.Delivered || normStatus === "delivered")) {
    dates.Delivered = addDays(orderDate, 5);
  }
  
  return dates;
};

const formatStatusDate = (dateStr?: string) => {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  return {
    date: d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }),
    time: d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }),
  };
};

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
      const res = await fetch(`${API_URL}/api/orders/${orderId}`, {
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
      let mappedStatus = data.status;
      if (mappedStatus === "Pending") mappedStatus = "Ordered";
      else if (mappedStatus === "Processing") mappedStatus = "Shipped";

      setOrder({
        id: data.id,
        status: mappedStatus as TrackOrder["status"],
        total: Number(data.total || 0),
        date: data.date,
        items: typeof data.items === "string" ? (() => { try { return JSON.parse(data.items); } catch { return []; } })() : data.items || [],
        status_dates: typeof data.status_dates === "string" ? (() => { try { return JSON.parse(data.status_dates); } catch { return {}; } })() : data.status_dates || {},
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
                { icon: ClipboardList, label: "Ordered" },
                { icon: Package, label: "Shipped" },
                { icon: Truck, label: "Out for Delivery" },
                { icon: Check, label: "Delivered" },
              ].map((s, idx) => {
                const done = currentStepIndex >= idx;
                const dates = getStatusDates(order.date, order.status_dates, order.status);
                const stepDateInfo = done ? formatStatusDate(dates[s.label]) : null;
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
                    <p className={`mt-2 text-xs font-semibold text-center ${done ? "text-gold" : "text-muted-foreground"}`}>
                      {s.label}
                    </p>
                    {stepDateInfo ? (
                      <div className="mt-1 flex flex-col items-center">
                        <span className="text-[10px] text-muted-foreground text-center leading-tight">
                          {stepDateInfo.date}
                        </span>
                        <span className="text-[9px] text-muted-foreground/70 text-center leading-none mt-0.5">
                          {stepDateInfo.time}
                        </span>
                      </div>
                    ) : (
                      <span className="text-[10px] text-muted-foreground/30 text-center leading-tight mt-1">
                        —
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Items Ordered Card */}
            <div className="mt-10 space-y-4">
              <h3 className="font-display text-lg text-foreground border-b border-gold/25 pb-2">
                Items Ordered
              </h3>
              <div className="space-y-3">
                {order.items?.map((item: any) => {
                  const qty = item.qty || item.quantity || 1;
                  const unitPrice = Number(item.price || 0);
                  const itemTotal = unitPrice * qty;
                  return (
                    <div 
                      key={`${item.id}-${item.size}-${item.color || ""}`}
                      className="flex gap-4 p-4 border border-gold/15 bg-card/45 rounded-sm"
                    >
                      {item.image ? (
                        <img 
                          src={item.image} 
                          alt={item.name} 
                          className="h-20 w-16 object-cover rounded-sm border border-gold/10 shrink-0" 
                        />
                      ) : (
                        <div className="h-20 w-16 shrink-0 grid place-items-center bg-muted/20 border border-gold/10 text-[9px] text-muted-foreground">
                          No Image
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-foreground/90 truncate">
                          {item.name || "Premium Product"}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Size: {item.size || "M"} {item.color ? `• Color: ${item.color}` : ""}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Price: {formatINR(unitPrice)} x {qty}
                        </p>
                      </div>
                      <p className="text-gold font-medium whitespace-nowrap self-center">
                        {formatINR(itemTotal)}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Pricing Summary Card */}
            <div className="mt-6 p-5 border border-gold/15 bg-card/65 rounded-sm space-y-2 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span className="text-foreground font-medium">
                  {formatINR(order.items?.reduce((acc: number, item: any) => acc + Number(item.price || 0) * (item.qty || item.quantity || 1), 0) || 0)}
                </span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Shipping Charge</span>
                <span className="text-foreground font-medium">
                  {order.total >= 1000 ? "Free" : "₹150"}
                </span>
              </div>
              <div className="flex justify-between border-t border-gold/15 pt-2 text-base font-semibold">
                <span className="text-foreground">Total Price</span>
                <span className="text-gold">
                  {formatINR(order.total)}
                </span>
              </div>
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
