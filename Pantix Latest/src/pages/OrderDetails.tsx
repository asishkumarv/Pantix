import { API_URL } from "@/api";
import { useParams } from "react-router-dom";
import { Link, useNavigate } from "@/lib/router-compat";
import { useStore, formatINR } from "@/lib/store";
import { Layout } from "@/components/Layout";
import { ChevronLeft, HelpCircle, Star, Zap, Repeat, MapPin, ClipboardList, Package, Truck, Check } from "lucide-react";
import { useEffect, useState, useMemo } from "react";

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

const stepOrder = ["Ordered", "Shipped", "Out for Delivery", "Delivered"] as const;

export default function OrderDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { orders, getProduct, user } = useStore();
  
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const currentStepIndex = useMemo(() => {
    if (!order) return -1;
    const idx = stepOrder.indexOf(order.status as (typeof stepOrder)[number]);
    return idx >= 0 ? idx : -1;
  }, [order]);

  const getDeliveryDays = () => {
    if (!order) return 5;
    const dates = getStatusDates(order.date, order.status_dates, order.status);
    const orderedTime = new Date(dates.Ordered).getTime();
    const deliveredTime = dates.Delivered ? new Date(dates.Delivered).getTime() : new Date().getTime();
    const diffMs = deliveredTime - orderedTime;
    const diffDays = Math.max(1, Math.round(diffMs / (1000 * 60 * 60 * 24)));
    return diffDays;
  };

  useEffect(() => {
    const normalizedSearchId = id?.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
    
    // First try finding in local store (for immediate load if available)
    let found = orders.find((o) => String(o.id).replace(/[^a-zA-Z0-9]/g, "").toLowerCase() === normalizedSearchId);
    
    if (found) {
      setOrder(found);
      setLoading(false);
      return;
    }

    // If not found in local store, fetch from backend API
    const fetchOrder = async () => {
      try {
        const token = localStorage.getItem("pantix_token");
        const res = await fetch(`${API_URL}/api/orders`, {
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });

        if (res.ok) {
          const data = await res.json();
          const apiOrders = (data || []).map((o: any) => ({
            id: o.id,
            date: o.date,
            total: Number(o.total || 0),
            shipping_charge: Number(o.shipping_charge || 0),
            status: o.status,
            address: typeof o.address === "string" ? (() => { try { return JSON.parse(o.address); } catch { return o.address; } })() : o.address,
            items: typeof o.items === "string" ? (() => { try { return JSON.parse(o.items); } catch { return []; } })() : o.items || [],
            status_dates: typeof o.status_dates === "string" ? (() => { try { return JSON.parse(o.status_dates); } catch { return {}; } })() : o.status_dates || {},
          }));
          
          found = apiOrders.find((o: any) => String(o.id).replace(/[^a-zA-Z0-9]/g, "").toLowerCase() === normalizedSearchId);
          setOrder(found || null);
        } else {
          setOrder(null);
        }
      } catch (err) {
        console.error("Failed to fetch order details", err);
        setOrder(null);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [id, orders]);

  if (loading) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
          <div className="h-8 w-8 rounded-full border-4 border-gold/30 border-t-gold animate-spin mb-4" />
          <p className="text-muted-foreground text-sm uppercase tracking-widest">Loading order...</p>
        </div>
      </Layout>
    );
  }

  if (!order) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
          <p className="text-muted-foreground text-lg mb-4">Order not found.</p>
          <Link to="/account/orders" className="btn-gold">Back to Orders</Link>
        </div>
      </Layout>
    );
  }

  const isDelivered = order.status.toLowerCase() === "delivered";
  
  // Extract real address
  const addr = order.address || {};
  const addrLine = addr.line || addr.line1;
  const addrPin = addr.pin || addr.pincode;
  const addrString = addrLine ? `${addrLine}, ${addr.city || ''}, ${addr.state || ''} ${addrPin || ''}` : "No address provided";
  const addrName = addr.name || addr.label || user?.name || "Customer";
  const addrPhone = addr.phone || user?.phone || "";

  return (
    <Layout>
      <div className="min-h-screen bg-background text-foreground pb-20 md:pb-10">
        {/* Mobile Top Nav */}
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-gold/15 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="text-gold hover:text-gold/80 transition p-1 -ml-1">
              <ChevronLeft className="h-6 w-6" />
            </button>
            <h1 className="font-display tracking-widest text-lg uppercase text-gold">Order Details</h1>
          </div>
          <button className="flex items-center gap-1.5 text-gold text-sm font-medium hover:text-primary-glow transition">
            <HelpCircle className="h-4 w-4" />
            <span>HELP</span>
          </button>
        </div>

        <div className="max-w-3xl mx-auto p-4 space-y-4">
          
          {/* Products List Info Cards */}
          {order.items?.map((item: any) => {
            const prod = getProduct(item.id);
            const img = item.image || prod?.image;
            return (
              <Link 
                key={`${item.id}-${item.size}-${item.color || ""}`}
                to={item.id ? `/product/${item.id}` : "#"} 
                className="block"
              >
                <div className="bg-card border border-gold/20 rounded-md p-4 flex gap-4 shadow-sm hover:border-gold/50 transition cursor-pointer group">
                  {img ? (
                    <div className="h-28 w-20 shrink-0 overflow-hidden rounded border border-gold/20">
                      <img src={img} alt={item.name || "Product"} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    </div>
                  ) : (
                    <div className="h-28 w-20 shrink-0 grid place-items-center rounded border border-gold/20 text-[10px] text-muted-foreground">
                      No Image
                    </div>
                  )}
                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <p className="font-medium text-foreground text-sm uppercase tracking-widest mb-1.5">
                      Order #{order.id}
                    </p>
                    <p className="text-base text-foreground/90 truncate mb-1">
                      {item.name || "Premium Product"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Size: {item.size || "M"} {item.color ? `• Color: ${item.color}` : ""} {item.qty ? `• Qty: ${item.qty}` : ""}
                    </p>
                    <p className="text-xs text-gold/85 mt-1 font-medium">
                      Price: {formatINR(Number(item.price || 0) * (item.qty || item.quantity || 1))}
                    </p>
                  </div>
                  <div className="flex items-center">
                    <ChevronLeft className="h-5 w-5 text-gold/40 rotate-180 group-hover:text-gold transition-colors" />
                  </div>
                </div>
              </Link>
            );
          })}

          {/* Order Summary Card */}
          <div className="bg-card border border-gold/20 rounded-md p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4 text-foreground border-b border-gold/15 pb-2">
              <ClipboardList className="h-5 w-5 text-gold" />
              <h3 className="font-medium">Order Summary</h3>
            </div>
            <div className="space-y-2 text-sm pl-7">
              {order.items?.map((item: { id: string; name?: string; qty?: number; quantity?: number; price?: number; size?: string; color?: string }) => (
                <div key={`${item.id}-${item.size}-${item.color || ""}`} className="flex justify-between text-muted-foreground">
                  <span>{item.name || "Product"} (x{item.qty || item.quantity || 1})</span>
                  <span>{formatINR(Number(item.price || 0) * (item.qty || item.quantity || 1))}</span>
                </div>
              ))}
              
              <div className="border-t border-gold/15 pt-2 flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span>{formatINR(order.items?.reduce((acc: number, item: any) => acc + Number(item.price || 0) * (item.qty || item.quantity || 1), 0) || 0)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Shipping Charges</span>
                <span className={order.shipping_charge === 0 ? "text-emerald-500 font-medium" : ""}>
                  {order.shipping_charge === 0 ? "Free" : formatINR(order.shipping_charge || 0)}
                </span>
              </div>
              <div className="border-t border-gold/15 pt-2 flex justify-between font-semibold text-base text-gold mt-2">
                <span>Total Order Price</span>
                <span>{formatINR(order.total)}</span>
              </div>
            </div>
          </div>

          {/* Status Card */}
          <div className="bg-card border border-gold/20 rounded-md p-5 shadow-sm">
            <div className="flex items-start gap-4 mb-4">
              <div className={`h-10 w-10 shrink-0 rounded-full flex items-center justify-center ${isDelivered ? 'bg-emerald-500/20 text-emerald-500' : 'bg-gold/20 text-gold'}`}>
                {isDelivered ? <Zap className="h-5 w-5" /> : <div className="h-3 w-3 rounded-full bg-current animate-pulse" />}
              </div>
              <div>
                <p className="font-medium text-lg">{isDelivered ? "Delivered Early" : order.status}</p>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {new Date(order.date).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                </p>
              </div>
            </div>

            {/* Timeline of Status Updates */}
            <div className="border-t border-gold/15 pt-5 mt-4">
              <div className="grid grid-cols-4 gap-2 relative">
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
            </div>
            
            {order.address?.transaction_id && (
              <div className="border-t border-gold/15 pt-3 mt-3 text-xs text-muted-foreground space-y-1">
                <p>Payment: <span className="text-gold font-medium">Paid Online</span></p>
                <p>Transaction ID: <span className="font-mono text-foreground font-semibold">{order.address.transaction_id}</span></p>
              </div>
            )}
            
            {isDelivered && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3 rounded text-sm flex items-center gap-2 mt-4">
                <Zap className="h-4 w-4 shrink-0" />
                <span>
                  Yay! Your order was delivered in just {getDeliveryDays()} {getDeliveryDays() === 1 ? 'day' : 'days'}.
                </span>
              </div>
            )}
          </div>

          {/* Returns Card */}
          <div className="bg-card border border-gold/20 rounded-md p-4 flex items-center shadow-sm">
            <div className="flex items-center gap-3">
              <Repeat className="h-5 w-5 text-gold/70" />
              <span className="text-sm text-foreground/80">No Return - Exchange available</span>
            </div>
          </div>

          {/* Address Card */}
          <div className="bg-card border border-gold/20 rounded-md p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-3 text-foreground">
              <MapPin className="h-5 w-5 text-gold" />
              <h3 className="font-medium">Delivery Address</h3>
            </div>
            <div className="pl-7">
              <p className="text-sm font-medium mb-1">{addrName}</p>
              <p className="text-sm text-muted-foreground leading-relaxed mb-2">
                {addrString}
              </p>
              <p className="text-sm text-foreground/80">{addrPhone}</p>
            </div>
          </div>


        </div>
      </div>
    </Layout>
  );
}
