import { useParams } from "react-router-dom";
import { Link, useNavigate } from "@/lib/router-compat";
import { useStore, formatINR } from "@/lib/store";
import { Layout } from "@/components/Layout";
import { ChevronLeft, HelpCircle, Star, Zap, Repeat, MapPin } from "lucide-react";
import { useEffect, useState } from "react";

export default function OrderDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { orders, getProduct, user } = useStore();
  
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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
        const res = await fetch("https://pantix-final-3.onrender.com/api/orders", {
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
            status: o.status,
            address: typeof o.address === "string" ? (() => { try { return JSON.parse(o.address); } catch { return o.address; } })() : o.address,
            items: typeof o.items === "string" ? (() => { try { return JSON.parse(o.items); } catch { return []; } })() : o.items || [],
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

  const firstItem = order.items?.[0];
  const product = firstItem ? getProduct(firstItem.id) : null;
  const imageSrc = firstItem?.image || product?.image;
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
          
          {/* Product Info Card */}
          <Link 
            to={firstItem?.id ? `/product/${firstItem.id}` : "#"} 
            className="block"
          >
            <div className="bg-card border border-gold/20 rounded-md p-4 flex gap-4 shadow-sm hover:border-gold/50 transition cursor-pointer group">
              {imageSrc ? (
                <div className="h-28 w-20 shrink-0 overflow-hidden rounded border border-gold/20">
                  <img src={imageSrc} alt={firstItem?.name || "Product"} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" />
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
                  {firstItem?.name || product?.name || "Premium Product"}
                </p>
                <p className="text-xs text-muted-foreground">
                  Size: {firstItem?.size || "M"} {firstItem?.qty ? `• Qty: ${firstItem.qty}` : ""}
                </p>
              </div>
              <div className="flex items-center">
                <ChevronLeft className="h-5 w-5 text-gold/40 rotate-180 group-hover:text-gold transition-colors" />
              </div>
            </div>
          </Link>


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
            
            {isDelivered && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3 rounded text-sm flex items-center gap-2">
                <Zap className="h-4 w-4 shrink-0" />
                <span>Yay! Your order was delivered in just 5 days.</span>
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
