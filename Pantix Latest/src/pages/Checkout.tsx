import { API_URL } from "@/api";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "@/lib/router-compat";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check,
  CreditCard,
  Truck,
  MapPin,
  ChevronRight,
} from "lucide-react";
import { Layout } from "@/components/Layout";
import { useStore, formatINR } from "@/lib/store";
import { toast } from "sonner";

type Step = 1 | 2 | 3 | 4;

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

const Checkout = () => {
  const { cart, clearCart, getProduct, user, addresses, addAddress, refreshProducts } = useStore();
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>(cart.length > 0 ? 2 : 1);
  const [orderId, setOrderId] = useState<string>("");
  const [address, setAddress] = useState({
    name: "",
    phone: "",
    line: "",
    city: "",
    state: "",
    pin: "",
  });
  const [saveAddressToProfile, setSaveAddressToProfile] = useState(true);
  const [payment, setPayment] = useState<"online" | "cod">("online");
  const [processingState, setProcessingState] = useState<"idle" | "verifying" | "success">("idle");

  useEffect(() => {
    if (!user) {
      navigate("/login?redirect=/checkout");
    }
  }, [user, navigate]);

  const [locating, setLocating] = useState(false);

  const fetchIPLocation = async () => {
    setLocating(true);
    toast.info("Using approximate network location...");
    try {
      const res = await fetch(
        "https://api.bigdatacloud.net/data/reverse-geocode-client?localityLanguage=en"
      );
      if (!res.ok) throw new Error("IP Geolocation failed");
      const bdData = await res.json();
      if (bdData) {
        const addressLine = [
          bdData.locality,
          bdData.city,
          bdData.principalSubdivision
        ].filter(Boolean).join(", ");
        
        setAddress((prev) => ({
          ...prev,
          line: addressLine || bdData.locality || "",
          city: bdData.city || bdData.locality || "",
          state: bdData.principalSubdivision || "",
          pin: bdData.postcode || "",
        }));
        setSaveAddressToProfile(true);
        toast.success("Location filled using network IP");
      } else {
        toast.error("Could not determine network location");
      }
    } catch (err) {
      console.error(err);
      toast.error("Network location lookup failed");
    } finally {
      setLocating(false);
    }
  };

  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      fetchIPLocation();
      return;
    }

    setLocating(true);
    toast.info("Fetching your location...");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          let data = null;

          // Try OpenStreetMap Nominatim first
          try {
            const res = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
            );
            if (res.ok) {
              data = await res.json();
            }
          } catch (err) {
            console.warn("Nominatim fetch failed, trying BigDataCloud API fallback...", err);
          }

          if (data && data.address) {
            setAddress((prev) => ({
              ...prev,
              line: data.display_name || "",
              city:
                data.address.city ||
                data.address.town ||
                data.address.village ||
                data.address.county ||
                "",
              state: data.address.state || "",
              pin: data.address.postcode || "",
            }));
            setSaveAddressToProfile(true);
            toast.success("Location filled successfully");
          } else {
            // Fallback to BigDataCloud reverse geocoding client
            try {
              const res = await fetch(
                `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
              );
              if (!res.ok) throw new Error("BigDataCloud request failed");
              const bdData = await res.json();
              if (bdData) {
                const addressLine = [
                  bdData.locality,
                  bdData.city,
                  bdData.principalSubdivision
                ].filter(Boolean).join(", ");
                
                setAddress((prev) => ({
                  ...prev,
                  line: addressLine || bdData.locality || "",
                  city: bdData.city || bdData.locality || "",
                  state: bdData.principalSubdivision || "",
                  pin: bdData.postcode || "",
                }));
                setSaveAddressToProfile(true);
                toast.success("Location filled successfully");
                return;
              }
            } catch (bdErr) {
              console.error("BigDataCloud geocoder failed", bdErr);
            }
            toast.error("Could not determine address");
          }
        } catch (error) {
          toast.error("Failed to fetch address details");
        } finally {
          setLocating(false);
        }
      },
      (error) => {
        console.warn("GPS failed, falling back to IP Geolocation:", error);
        fetchIPLocation();
      }
    );
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
    }
  }, [step]);

  const items = cart
    .map((c) => {
      const product = getProduct(c.id);
      if (!product) return null;
      const margin = c.reseller_margin ? Number(c.reseller_margin) : 0;
      return {
        ...c,
        product: {
          ...product,
          price: product.price + margin,
        },
      };
    })
    .filter((i): i is typeof i & { product: NonNullable<typeof i["product"]> } => Boolean(i));
  const subtotal = items.reduce((s, i) => s + i.product.price * i.qty, 0);
  const shipping = 0;
  const total = subtotal + shipping;

  if (items.length === 0 && step !== 4) {
    return (
      <Layout>
        <div className="mx-auto max-w-2xl px-4 pt-6 pb-16 text-center">
          <h1 className="font-display text-4xl gradient-text-gold">
            Your cart is empty
          </h1>
          <Link
            to="/categories"
            className="mt-6 inline-block px-6 py-3 bg-gold text-primary-foreground uppercase text-sm"
          >
            Shop now
          </Link>
        </div>
      </Layout>
    );
  }

  const checkStockAvailability = async () => {
    toast.loading("Verifying stock levels...", { id: "checkout-stock-verify" });
    try {
      await refreshProducts();
      
      for (const item of items) {
        const freshProduct = getProduct(item.id);
        if (!freshProduct) {
          toast.error(`Product "${item.product.name}" not found.`, { id: "checkout-stock-verify" });
          return false;
        }

        const qty = item.qty;

        if (freshProduct.colors && freshProduct.colors.length > 0 && item.color && item.size) {
          const colorObj: any = freshProduct.colors.find((c: any) => c.name === item.color);
          if (colorObj && Array.isArray(colorObj.sizes)) {
            const sizeObj = colorObj.sizes.find((s: any) => s.size === item.size);
            if (!sizeObj || sizeObj.stock < qty) {
              toast.error(
                `"${item.product.name}" (Color: ${item.color}, Size: ${item.size}) is out of stock or has insufficient stock!`,
                { id: "checkout-stock-verify", duration: 5000 }
              );
              return false;
            }
          } else {
            if (freshProduct.stock !== undefined && freshProduct.stock < qty) {
              toast.error(`"${item.product.name}" is out of stock!`, { id: "checkout-stock-verify", duration: 5000 });
              return false;
            }
          }
        } else {
          if (freshProduct.stock !== undefined && freshProduct.stock < qty) {
            toast.error(`"${item.product.name}" is out of stock!`, { id: "checkout-stock-verify", duration: 5000 });
            return false;
          }
        }
      }
      
      toast.dismiss("checkout-stock-verify");
      return true;
    } catch (err) {
      toast.error("Failed to verify stock levels.", { id: "checkout-stock-verify" });
      return false;
    }
  };

  const handleContinueToPayment = async () => {
    const isAvailable = await checkStockAvailability();
    if (isAvailable) {
      setStep(3);
    }
  };

  const placeOrder = async () => {
    let txnId = "";
    try {
      const isAvailable = await checkStockAvailability();
      if (!isAvailable) return;

      const token = localStorage.getItem("pantix_token");
      if (!token) {
        toast.error("You must be logged in to place an order");
        navigate("/login?redirect=/checkout");
        return;
      }

      // Find the reseller ID and sum commission (if any from legacy logic)
      const getCookie = (name: string) => {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop()?.split(';').shift();
      };
      const resellerCode = getCookie('pantix_ref');
      const resellerCommission = items.reduce(
        (s, i) => s + (i.reseller_margin ? Number(i.reseller_margin) * i.qty : 0),
        0
      );

      // Convert items to database compatible array
      const orderItems = items.map((i) => ({
        id: i.id,
        name: i.product.name,
        image: i.product.image,
        price: i.product.price,
        qty: i.qty,
        size: i.size,
        color: i.color,
      }));

      let razorpayOrderId = "";
      if (payment === "online") {
        const rzpOrderRes = await fetch(`${API_URL}/api/payments/create`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ amount: total }),
        });

        if (!rzpOrderRes.ok) {
          const data = await rzpOrderRes.json().catch(() => ({}));
          throw new Error(data.error || "Failed to initiate online payment. Please try Cash on Delivery.");
        }

        const rzpOrderData = await rzpOrderRes.json();
        razorpayOrderId = rzpOrderData.id;

        const scriptLoaded = await loadRazorpayScript();
        if (!scriptLoaded) {
          throw new Error("Razorpay payment gateway failed to load. Please check your internet connection.");
        }

        const paymentResponse = await new Promise<any>((resolve, reject) => {
          const options = {
            key: import.meta.env.VITE_RAZORPAY_KEY_ID || "rzp_test_your_key_id",
            amount: Math.round(total * 100),
            currency: "INR",
            name: "Pantix Store",
            description: "Online Payment for Order",
            order_id: razorpayOrderId,
            handler: function (response: any) {
              resolve(response);
            },
            prefill: {
              name: address.name || user?.name || "",
              contact: address.phone || user?.phone || "",
              email: user?.email || "",
            },
            theme: {
              color: "#D4AF37",
            },
            modal: {
              ondismiss: function () {
                reject(new Error("Payment window closed by user."));
              },
            },
          };

          const rzp = new (window as any).Razorpay(options);
          rzp.on("payment.failed", function (response: any) {
            reject(new Error(response.error.description || "Payment failed."));
          });
          rzp.open();
        });

        txnId = paymentResponse?.razorpay_payment_id || "";

        setProcessingState("verifying");

        const verifyRes = await fetch(`${API_URL}/api/payments/verify`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            razorpay_order_id: paymentResponse.razorpay_order_id,
            razorpay_payment_id: paymentResponse.razorpay_payment_id,
            razorpay_signature: paymentResponse.razorpay_signature,
          }),
        });

        if (!verifyRes.ok) {
          const data = await verifyRes.json().catch(() => ({}));
          throw new Error(data.error || "Payment verification failed.");
        }
      }

      const res = await fetch(`${API_URL}/api/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          items: orderItems,
          total,
          payment: payment === "online" ? "Paid" : "COD",
          address: payment === "online" && txnId ? { ...address, transaction_id: txnId } : address,
          reseller_code: resellerCode || null,
          reseller_commission: resellerCommission || 0,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to place order");
      }

      const orderData = await res.json();
      setOrderId(orderData.id);

      if (typeof window !== "undefined") {
        localStorage.setItem(
          "pantix:lastOrder",
          JSON.stringify({
            id: orderData.id,
            total,
            address: payment === "online" && txnId ? { ...address, transaction_id: txnId } : address,
            payment,
            items: orderItems,
            at: Date.now(),
          })
        );
      }

      if (saveAddressToProfile) {
        const addressExists = (addresses || []).some(
          (a) =>
            a.line1?.trim().toLowerCase() === address.line?.trim().toLowerCase() &&
            a.city?.trim().toLowerCase() === address.city?.trim().toLowerCase() &&
            a.state?.trim().toLowerCase() === address.state?.trim().toLowerCase() &&
            a.pincode?.trim() === address.pin?.trim() &&
            a.phone?.trim() === address.phone?.trim()
        );

        if (!addressExists) {
          addAddress({
            label: address.name || user?.name || "Customer",
            line1: address.line,
            city: address.city,
            state: address.state,
            pincode: address.pin,
            phone: address.phone
          });
        }
      }

      if (payment === "online") {
        setProcessingState("success");
        setTimeout(() => {
          setStep(4);
          clearCart();
          refreshProducts();
          setProcessingState("idle");
          toast.success("Order placed successfully! 💖");
        }, 3500);
      } else {
        clearCart();
        refreshProducts();
        setStep(4);
        toast.success("Order placed successfully! 💖");
      }
    } catch (err: any) {
      console.error(err);
      setProcessingState("idle");
      toast.error(err.message || "Error placing order");
    }
  };

  return (
    <Layout>
      <div className="w-full px-4 md:px-8 lg:px-14 pt-4 md:pt-6 pb-12">
        <h1 className="font-display text-4xl md:text-5xl gradient-text-gold">
          Checkout
        </h1>
        <Stepper step={step} />

        <div
          className={`mt-10 grid gap-8 lg:gap-12 ${
            step === 4 ? "grid-cols-1" : "lg:grid-cols-[1fr_380px] xl:grid-cols-[1fr_420px]"
          }`}
        >
          <div>
            {step === 2 && (
              <Card title="Shipping Address" icon={MapPin}>
                <div className="grid sm:grid-cols-2 gap-4">
                  {addresses && addresses.length > 0 && (
                    <div className="mb-2 p-4 border border-gold/20 rounded-md bg-gold/5 space-y-3 sm:col-span-2">
                      <p className="text-xs uppercase tracking-wider text-gold font-medium">
                        Use Saved Address
                      </p>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {addresses.map((a) => (
                          <button
                            key={a.id}
                            type="button"
                            onClick={() => {
                              setAddress({
                                name: user?.name || "",
                                phone: a.phone || "",
                                line: a.line1 || "",
                                city: a.city || "",
                                state: a.state || "",
                                pin: a.pincode || "",
                              });
                              setSaveAddressToProfile(false);
                            }}
                            className="text-left p-3 rounded border border-gold/20 hover:border-gold hover:bg-gold/10 transition text-xs space-y-1"
                          >
                            <div className="flex justify-between font-medium text-gold">
                              <span>{a.label}</span>
                              <span>{a.phone}</span>
                            </div>
                            <p className="text-muted-foreground line-clamp-1">{a.line1}</p>
                            <p className="text-muted-foreground">
                              {a.city}, {a.state} - {a.pincode}
                            </p>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <Field
                    label="Full name"
                    value={address.name}
                    onChange={(v) => {
                      setAddress({ ...address, name: v });
                      setSaveAddressToProfile(true);
                    }}
                  />
                  <Field
                    label="Phone number"
                    value={address.phone}
                    onChange={(v) => {
                      setAddress({ ...address, phone: v });
                      setSaveAddressToProfile(true);
                    }}
                  />
                  <div className="sm:col-span-2 relative">
                    <button
                      type="button"
                      onClick={handleLocateMe}
                      disabled={locating}
                      className="absolute right-0 top-0 flex items-center gap-1 text-xs text-gold hover:text-primary-glow disabled:opacity-50"
                    >
                      <MapPin className="h-3 w-3" />
                      {locating ? "Locating..." : "Locate Me"}
                    </button>
                    <Field
                      label="Address"
                      value={address.line}
                      onChange={(v) => {
                        setAddress({ ...address, line: v });
                        setSaveAddressToProfile(true);
                      }}
                    />
                  </div>
                  <Field
                    label="City"
                    value={address.city}
                    onChange={(v) => {
                      setAddress({ ...address, city: v });
                      setSaveAddressToProfile(true);
                    }}
                  />
                  <Field
                    label="State"
                    value={address.state}
                    onChange={(v) => {
                      setAddress({ ...address, state: v });
                      setSaveAddressToProfile(true);
                    }}
                  />
                  <Field
                    label="Pincode"
                    value={address.pin}
                    onChange={(v) => {
                      setAddress({ ...address, pin: v });
                      setSaveAddressToProfile(true);
                    }}
                  />
                </div>
                
                <div className="mt-4 flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="saveAddress"
                    checked={saveAddressToProfile}
                    onChange={(e) => setSaveAddressToProfile(e.target.checked)}
                    className="accent-gold h-4 w-4 rounded border-gold/30 bg-card"
                  />
                  <label htmlFor="saveAddress" className="text-sm text-foreground/80 cursor-pointer select-none">
                    Save this address to my profile
                  </label>
                </div>

                <button
                  onClick={handleContinueToPayment}
                  disabled={
                    !address.name ||
                    !address.phone ||
                    !address.line ||
                    !address.city ||
                    !address.pin
                  }
                  className="mt-6 w-full sm:w-auto px-7 py-3 bg-gold text-primary-foreground uppercase text-sm tracking-wide hover:bg-primary-glow disabled:opacity-50"
                >
                  Continue to Payment
                </button>
              </Card>
            )}

            {step === 3 && (
              <Card title="Payment" icon={CreditCard}>
                <div className="space-y-3">
                  <PayOption
                    active={payment === "online"}
                    onClick={() => setPayment("online")}
                    title="Online Payment"
                    desc="UPI · Cards · Net Banking · Wallets"
                  />
                  <PayOption
                    active={payment === "cod"}
                    onClick={() => setPayment("cod")}
                    title="Cash on Delivery"
                    desc="Pay when you receive your order"
                  />
                </div>
                <div className="mt-6 flex gap-3">
                  <button
                    onClick={() => setStep(2)}
                    className="px-6 py-3 border border-gold/40 text-gold uppercase text-sm tracking-wide hover:bg-gold/10"
                  >
                    Back
                  </button>
                  <button
                    onClick={placeOrder}
                    className="flex-1 px-7 py-3 bg-gold text-primary-foreground uppercase text-sm tracking-wide hover:bg-primary-glow shadow-gold"
                  >
                    Place Order · {formatINR(total)}
                  </button>
                </div>
              </Card>
            )}

            {step === 4 && (
              <Card title="Order Confirmed">
                <div className="text-center py-8">
                  <div className="mx-auto h-16 w-16 rounded-full bg-gold/20 grid place-items-center mb-4 border border-gold/40">
                    <Check className="h-8 w-8 text-gold" />
                  </div>
                  <h2 className="font-display text-3xl gradient-text-gold">
                    Thank you!
                  </h2>
                  <p className="mt-2 text-muted-foreground">
                    Your order has been placed.
                  </p>
                  <p className="mt-4 text-sm text-foreground">Order ID</p>
                  <p className="font-display text-xl text-gold">{orderId}</p>
                  <div className="mt-8 flex justify-center gap-3 flex-wrap">
                    <button
                      onClick={() => navigate(`/track?id=${orderId}`)}
                      className="px-6 py-3 bg-gold text-primary-foreground uppercase text-sm tracking-wide hover:bg-primary-glow"
                    >
                      Track Order
                    </button>
                    <Link
                      to="/"
                      className="px-6 py-3 border border-gold/40 text-gold uppercase text-sm tracking-wide hover:bg-gold/10"
                    >
                      Back to Home
                    </Link>
                  </div>
                </div>
              </Card>
            )}
          </div>

          {step !== 4 && (
            <aside className="h-fit p-6 md:p-7 border border-gold/25 bg-card/60 rounded-lg shadow-royal">
              <h3 className="font-display text-xl text-foreground">Summary</h3>
              <div className="gold-divider mt-2 w-12" />
              <ul className="mt-4 space-y-3 max-h-64 overflow-auto">
                {items.map((i) => {
                  let displayImage = i.product.image;
                  if (i.color && i.product.colors) {
                    const colorObj = i.product.colors.find((col: any) => col.name === i.color);
                    if (colorObj?.image) {
                      displayImage = colorObj.image;
                    }
                  }

                  return (
                    <li
                      key={`${i.id}-${i.size}-${i.color || ""}`}
                      className="flex gap-3 text-sm"
                    >
                      <img
                        src={displayImage}
                        alt=""
                        className="h-14 w-12 object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-foreground line-clamp-1">
                          {i.product.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {i.size} {i.color ? `· Color: ${i.color}` : ""} · Qty {i.qty}
                        </p>
                      </div>
                      <p className="text-gold whitespace-nowrap">
                        {formatINR(i.product.price * i.qty)}
                      </p>
                    </li>
                  );
                })}
              </ul>
              <div className="mt-5 pt-4 border-t border-gold/15 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatINR(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Shipping</span>
                  <span>{shipping === 0 ? "Free" : formatINR(shipping)}</span>
                </div>
                <div className="flex justify-between text-base pt-2 border-t border-gold/15">
                  <span className="text-foreground font-medium">Total</span>
                  <span className="text-gold font-medium">
                    {formatINR(total)}
                  </span>
                </div>
              </div>
            </aside>
          )}
        </div>
      </div>

      {/* Readability/Processing overlay */}
      <AnimatePresence>
        {processingState !== "idle" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-emerald-deep/95 backdrop-blur-md text-center p-6 select-none"
          >
            <div className="max-w-md w-full flex flex-col items-center">
              
              {/* Verification/Loading State */}
              {processingState === "verifying" && (
                <div className="space-y-6">
                  <div className="relative w-20 h-20 mx-auto">
                    {/* Outer spinning gold ring */}
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                      className="absolute inset-0 rounded-full border-4 border-gold/20 border-t-gold"
                    />
                    {/* Inner pulsing gold dot */}
                    <motion.div
                      animate={{ scale: [0.8, 1.2, 0.8] }}
                      transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                      className="absolute inset-4 rounded-full bg-gold/5 opacity-80 grid place-items-center"
                    >
                      <div className="w-2.5 h-2.5 rounded-full bg-gold" />
                    </motion.div>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="font-display text-2xl text-gold tracking-wide">
                      Verifying Payment
                    </h3>
                    <p className="text-sm text-foreground/75 max-w-xs mx-auto">
                      Please do not refresh the page or close the window while we confirm your order...
                    </p>
                  </div>
                </div>
              )}

              {/* Payment Success State */}
              {processingState === "success" && (
                <div className="space-y-6">
                  <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
                    {/* Expanding gold circle ring pulse */}
                    <motion.div
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut" }}
                      className="absolute inset-0 rounded-full border-2 border-gold/60"
                    />
                    
                    {/* Main circular background with zoom-in checkmark */}
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 100, damping: 10 }}
                      className="w-20 h-20 rounded-full bg-gradient-gold text-emerald-deep grid place-items-center border border-gold/40 shadow-royal"
                    >
                      {/* Animated Checkmark path SVG */}
                      <svg
                        className="w-10 h-10 stroke-current text-emerald-deep"
                        viewBox="0 0 24 24"
                        fill="none"
                        strokeWidth="3.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <motion.path
                          initial={{ pathLength: 0 }}
                          animate={{ pathLength: 1 }}
                          transition={{ delay: 0.2, duration: 0.6, ease: "easeOut" }}
                          d="M20 6L9 17L4 12"
                        />
                      </svg>
                    </motion.div>
                  </div>

                  <div className="space-y-2">
                    <motion.h3
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="font-display text-3xl text-gold font-bold tracking-wide"
                    >
                      Payment Successful!
                    </motion.h3>
                    <motion.p
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                      className="text-sm text-foreground/80 max-w-xs mx-auto"
                    >
                      Your order is confirmed. Directing to receipt page...
                    </motion.p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Layout>
  );
};

function Stepper({ step }: { step: Step }) {
  const steps = [
    { n: 1, label: "Cart" },
    { n: 2, label: "Shipping" },
    { n: 3, label: "Payment" },
    { n: 4, label: "Confirmation" },
  ];
  return (
    <div className="mt-6 w-full p-4 md:p-5 rounded-md border border-gold/25 bg-card/40">
      <div className="flex items-center justify-between gap-2 md:gap-4 flex-wrap text-[10px] md:text-xs uppercase tracking-[0.2em]">
        {steps.map((s, idx) => (
          <div key={s.n} className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
            <span
              className={`h-7 w-7 md:h-8 md:w-8 grid place-items-center rounded-full border-2 text-xs font-semibold shrink-0 ${
                step >= s.n
                  ? "bg-gold text-primary-foreground border-gold shadow-gold"
                  : "border-gold/30 text-muted-foreground"
              }`}
            >
              {idx + 1}
            </span>
            <span
              className={`truncate font-medium ${
                step >= s.n ? "text-gold" : "text-muted-foreground"
              }`}
            >
              {s.label}
            </span>
            {idx < steps.length - 1 && (
              <div
                className={`hidden sm:block flex-1 h-px ${
                  step > s.n ? "bg-gold" : "bg-gold/15"
                }`}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function Card({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon?: typeof Truck;
  children: React.ReactNode;
}) {
  return (
    <div className="p-6 md:p-8 border border-gold/25 bg-card/60 rounded-lg shadow-royal">
      <div className="flex items-center gap-2 mb-6">
        {Icon && <Icon className="h-4 w-4 text-gold" />}
        <h2 className="font-display text-2xl text-foreground">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-[11px] uppercase tracking-[0.25em] text-gold/90 font-medium">
        {label}
      </span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1.5 w-full bg-background/50 border border-gold/25 rounded-md px-3 py-2.5 text-foreground focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold/40 transition-colors"
      />
    </label>
  );
}

function PayOption({
  active,
  onClick,
  title,
  desc,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  desc: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-4 border transition-colors ${
        active ? "border-gold bg-gold/5" : "border-gold/20 hover:border-gold/50"
      }`}
    >
      <div className="flex items-center gap-3">
        <span
          className={`h-4 w-4 rounded-full border-2 ${
            active ? "border-gold bg-gold" : "border-gold/40"
          }`}
        />
        <div>
          <p className="text-foreground font-medium">{title}</p>
          <p className="text-xs text-muted-foreground">{desc}</p>
        </div>
      </div>
    </button>
  );
}

export default Checkout;
