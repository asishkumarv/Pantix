import { API_URL } from "@/api";
import { useState } from "react";
import { Link, useNavigate } from "@/lib/router-compat";
import { Package, Heart, Plus, Trash2, MapPin, Eye, EyeOff, Lock } from "lucide-react";
import { useStore, formatINR } from "@/lib/store";
import { type Product } from "@/lib/products";
import { toast } from "sonner";

export function Field({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string;
  value: string;
  onChange?: (v: string) => void;
  disabled?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-xs uppercase tracking-[0.2em] text-gold/80">
        {label}
      </span>
      <input
        value={value}
        disabled={disabled}
        onChange={(e) => onChange?.(e.target.value)}
        className="mt-1 w-full bg-background/50 border border-gold/30 px-3 py-2 rounded text-foreground focus:outline-none focus:border-gold disabled:opacity-60"
      />
    </label>
  );
}

export function ProfileTab({
  user,
  onUpdate,
}: {
  user: { name: string; email: string; phone?: string };
  onUpdate: (p: Partial<{ name: string; email: string; phone?: string }>) => void;
}) {
  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState(user.phone ?? "");

  // Change password states
  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [showCurrentPwd, setShowCurrentPwd] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);
  const [changingPwd, setChangingPwd] = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPwd.length < 6) {
      toast.error("New password must be at least 6 characters");
      return;
    }
    if (newPwd !== confirmPwd) {
      toast.error("New passwords do not match");
      return;
    }
    const token = localStorage.getItem("pantix_token");
    if (!token) {
      toast.error("Please log in again");
      return;
    }
    setChangingPwd(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/change-password`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ currentPassword: currentPwd, newPassword: newPwd }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Password change failed");
      toast.success("Password changed successfully! 🔐");
      setCurrentPwd("");
      setNewPwd("");
      setConfirmPwd("");
    } catch (err: any) {
      toast.error(err.message || "Could not change password");
    } finally {
      setChangingPwd(false);
    }
  };

  const PwdField = ({
    label, value, onChange, show, onToggle
  }: { label: string; value: string; onChange: (v: string) => void; show: boolean; onToggle: () => void }) => (
    <label className="block">
      <span className="text-xs uppercase tracking-[0.2em] text-gold/80">{label}</span>
      <div className="relative mt-1">
        <input
          type={show ? "text" : "password"}
          value={value}
          required
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-background/50 border border-gold/30 px-3 py-2 pr-10 rounded text-foreground focus:outline-none focus:border-gold"
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gold/50 hover:text-gold transition"
        >
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </label>
  );

  return (
    <div className="space-y-8 max-w-md">
      {/* Profile Info */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onUpdate({ name, phone });
          toast.success("Profile updated");
        }}
        className="space-y-4"
      >
        <h2 className="font-display text-2xl text-gold">Profile</h2>
        <Field label="Name" value={name} onChange={setName} />
        <Field label="Email" value={user.email} disabled />
        <Field label="Phone" value={phone} onChange={setPhone} />
        <button className="btn-gold">Save Changes</button>
      </form>

      {/* Divider */}
      <div className="border-t border-gold/15" />

      {/* Change Password */}
      <form onSubmit={handleChangePassword} className="space-y-4">
        <div className="flex items-center gap-2">
          <Lock className="w-5 h-5 text-gold" />
          <h2 className="font-display text-2xl text-gold">Change Password</h2>
        </div>
        <p className="text-xs text-muted-foreground">
          Enter your current password and choose a new one to update your credentials.
        </p>
        <PwdField
          label="Current Password"
          value={currentPwd}
          onChange={setCurrentPwd}
          show={showCurrentPwd}
          onToggle={() => setShowCurrentPwd(!showCurrentPwd)}
        />
        <PwdField
          label="New Password"
          value={newPwd}
          onChange={setNewPwd}
          show={showNewPwd}
          onToggle={() => setShowNewPwd(!showNewPwd)}
        />
        <PwdField
          label="Confirm New Password"
          value={confirmPwd}
          onChange={setConfirmPwd}
          show={showConfirmPwd}
          onToggle={() => setShowConfirmPwd(!showConfirmPwd)}
        />
        {/* Live match indicator */}
        {newPwd && confirmPwd && (
          <p className={`text-[11px] font-medium ${newPwd === confirmPwd ? "text-emerald-400" : "text-destructive"}`}>
            {newPwd === confirmPwd ? "✓ Passwords match" : "⚠ Passwords do not match"}
          </p>
        )}
        <button
          type="submit"
          disabled={changingPwd || !currentPwd || !newPwd || !confirmPwd || newPwd !== confirmPwd}
          className="btn-gold disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {changingPwd ? "Updating..." : "Update Password 🔐"}
        </button>
      </form>
    </div>
  );
}

export function OrdersTab({
  orders,
}: {
  orders: { id: string; date: string; total: number; status: string; items?: any[] }[];
}) {
  const { user, enableReseller, getProduct } = useStore();
  const navigate = useNavigate();

  const handleStartReselling = async (orderId: string) => {
    if (!user?.is_reseller) {
      const ok = await enableReseller();
      if (!ok) {
        toast.error("Could not activate reseller mode");
        return;
      }
    }
    toast.success("Reseller mode active! 🚀", {
      description: "Select any product in the shop to set your custom margins and share referrals."
    });
    // Redirect to shop page
    window.location.href = "/shop";
  };

  return (
    <div>
      <h2 className="font-display text-2xl text-gold mb-4">Orders</h2>
      {orders.length === 0 ? (
        <div className="text-center py-12">
          <Package className="h-10 w-10 text-gold/50 mx-auto mb-3" />
          <p className="text-muted-foreground">No orders yet.</p>
          <Link to="/shop" className="mt-4 inline-block text-gold underline">
            Start shopping
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((o) => {
            // Try to show the first product image from the order items
            const firstItem = (o.items && o.items.length > 0) ? o.items[0] : undefined;
            // If item has an id, prefer linking to that product; otherwise, fallback to name-based search
            const productLink = firstItem ? `/product/${firstItem.id}` : undefined;
            // Resolve image: item.image (from order) or getProduct lookup
            const imageSrc = firstItem?.image || (firstItem?.id ? (getProduct(firstItem.id)?.image) : undefined);

            return (
              <div 
                key={o.id} 
                onClick={() => navigate(`/order/${o.id}`)}
                className="border border-gold/20 rounded p-4 relative hover:bg-gold/5 transition cursor-pointer"
              >
                <div className="flex gap-4">
                  {/* Image Section */}
                  {imageSrc ? (
                    productLink ? (
                      <Link to={productLink} className="h-24 w-20 shrink-0 block overflow-hidden rounded-sm border border-gold/20">
                        <img src={imageSrc} alt={firstItem?.name || "product"} className="h-full w-full object-cover" />
                      </Link>
                    ) : (
                      <div className="h-24 w-20 shrink-0 overflow-hidden rounded-sm border border-gold/20">
                        <img src={imageSrc} alt={firstItem?.name || "product"} className="h-full w-full object-cover" />
                      </div>
                    )
                  ) : (
                    <div className="h-24 w-20 shrink-0 grid place-items-center rounded-sm border border-gold/20 text-[10px] text-muted-foreground text-center p-2">No image</div>
                  )}

                  {/* Details Section */}
                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <div className="flex justify-between items-start mb-1">
                      <p className="font-medium text-foreground text-base truncate pr-2">
                        Order #{o.id}
                      </p>
                      <p className="text-gold font-medium whitespace-nowrap">
                        {formatINR(o.total)}
                      </p>
                    </div>

                    {firstItem && (
                      <p className="text-sm text-foreground/80 truncate mb-1">
                        {firstItem.name || getProduct(firstItem.id)?.name || "Product"}
                      </p>
                    )}

                    <p className="text-[11px] text-muted-foreground mb-1">
                      {firstItem && (
                        <span>
                          Size: {firstItem.size || "Free"} • Qty: {firstItem.quantity || 1}
                          {o.items && o.items.length > 1 && ` • +${o.items.length - 1} more`}
                        </span>
                      )}
                    </p>

                    <div className="flex justify-between items-center mt-auto">
                      <p className={`text-xs uppercase font-bold tracking-wider ${o.status.toLowerCase() === 'delivered' ? 'text-emerald-500' : 'text-gold'}`}>
                        {o.status}
                      </p>
                    </div>
                  </div>
                  
                  {/* Chevron Icon */}
                  <div className="flex items-center text-gold/40">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                  </div>
                </div>

                {o.status.toLowerCase() === "delivered" && (
                  <div className="mt-4 pt-3 border-t border-gold/15 flex justify-end">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStartReselling(o.id);
                      }}
                      className="px-4 py-2 bg-gold text-primary-foreground text-xs uppercase font-bold tracking-wider rounded-sm hover:bg-gold/90 transition"
                    >
                      Start Reselling
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function AddressesTab({
  addresses,
  addAddress,
  removeAddress,
}: {
  addresses: any[];
  addAddress: (a: any) => void;
  removeAddress: (id: string) => void;
}) {
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({
    label: "Home",
    line1: "",
    city: "",
    state: "",
    pincode: "",
    phone: "",
  });
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
        
        setForm((prev) => ({
          ...prev,
          line1: addressLine || bdData.locality || "",
          city: bdData.city || bdData.locality || "",
          state: bdData.principalSubdivision || "",
          pincode: bdData.postcode || "",
        }));
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
            setForm((prev) => ({
              ...prev,
              line1: data.display_name || "",
              city:
                data.address.city ||
                data.address.town ||
                data.address.village ||
                data.address.county ||
                "",
              state: data.address.state || "",
              pincode: data.address.postcode || "",
            }));
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
                
                setForm((prev) => ({
                  ...prev,
                  line1: addressLine || bdData.locality || "",
                  city: bdData.city || bdData.locality || "",
                  state: bdData.principalSubdivision || "",
                  pincode: bdData.postcode || "",
                }));
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

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-display text-2xl text-gold">Saved Addresses</h2>
        {!adding && (
          <button
            onClick={() => setAdding(true)}
            className="inline-flex items-center gap-1 text-sm text-gold hover:text-primary-glow"
          >
            <Plus className="h-4 w-4" /> Add new
          </button>
        )}
      </div>

      {addresses.length === 0 && !adding && (
        <p className="text-muted-foreground text-sm py-8 text-center">
          No addresses saved yet.
        </p>
      )}

      <div className="space-y-3">
        {addresses.map((a) => (
          <div
            key={a.id}
            className="border border-gold/20 rounded p-4 flex justify-between gap-4"
          >
            <div className="text-sm">
              <p className="font-medium text-gold">{a.label}</p>
              <p className="text-foreground/85">{a.line1}</p>
              <p className="text-foreground/85">
                {a.city}, {a.state} - {a.pincode}
              </p>
              <p className="text-muted-foreground text-xs mt-1">{a.phone}</p>
            </div>
            <button
              onClick={() => removeAddress(a.id)}
              className="text-destructive hover:text-destructive-foreground"
              aria-label="Remove"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      {adding && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            addAddress(form);
            setAdding(false);
            setForm({
              label: "Home",
              line1: "",
              city: "",
              state: "",
              pincode: "",
              phone: "",
            });
            toast.success("Address added");
          }}
          className="mt-4 grid grid-cols-2 gap-3"
        >
          <Field
            label="Label"
            value={form.label}
            onChange={(v) => setForm({ ...form, label: v })}
          />
          <Field
            label="Phone"
            value={form.phone}
            onChange={(v) => setForm({ ...form, phone: v })}
          />
          <div className="col-span-2 relative">
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
              value={form.line1}
              onChange={(v) => setForm({ ...form, line1: v })}
            />
          </div>
          <Field
            label="City"
            value={form.city}
            onChange={(v) => setForm({ ...form, city: v })}
          />
          <Field
            label="State"
            value={form.state}
            onChange={(v) => setForm({ ...form, state: v })}
          />
          <Field
            label="Pincode"
            value={form.pincode}
            onChange={(v) => setForm({ ...form, pincode: v })}
          />
          <div className="col-span-2 flex gap-2">
            <button type="submit" className="btn-gold flex-1">
              Save
            </button>
            <button
              type="button"
              onClick={() => setAdding(false)}
              className="px-4 border border-gold/30 text-gold rounded"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

export function WishlistTab({
  items,
  onRemove,
}: {
  items: Product[];
  onRemove: (id: string) => void;
}) {
  return (
    <div>
      <h2 className="font-display text-2xl text-gold mb-4">Wishlist</h2>
      {items.length === 0 ? (
        <div className="text-center py-12">
          <Heart className="h-10 w-10 text-gold/50 mx-auto mb-3" />
          <p className="text-muted-foreground">Your wishlist is empty.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {items.map((p) => (
            <div key={p.id} className="group">
              <Link
                to={`/product/${p.id}`}
                className="block aspect-[3/4] overflow-hidden rounded bg-card"
              >
                <img
                  src={p.image}
                  alt={p.name}
                  className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </Link>
              <p className="mt-2 text-sm text-foreground line-clamp-1">
                {p.name}
              </p>
              <div className="flex justify-between items-center mt-1">
                <span className="text-gold text-sm">{formatINR(p.price)}</span>
                <button
                  onClick={() => onRemove(p.id)}
                  className="text-xs text-muted-foreground hover:text-destructive"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
