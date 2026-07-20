import { Link } from "@/lib/router-compat";
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { Layout } from "@/components/Layout";
import { useStore, formatINR } from "@/lib/store";

const Cart = () => {
  const { cart, updateQty, removeFromCart, getProduct, user } = useStore();

  const items = cart
    .map((c) => {
      const product = getProduct(c.id);
      if (!product) return null;
      const margin = c.reseller_margin ? Number(c.reseller_margin) : 0;
      
      let displayImage = product.image;
      if (c.color && product.colors) {
        const colorObj = product.colors.find((col: any) => col.name === c.color);
        if (colorObj?.image) {
           displayImage = colorObj.image;
        }
      }

      return {
        ...c,
        product: {
          ...product,
          price: product.price + margin,
        },
        displayImage,
      };
    })
    .filter(
      (i): i is typeof i & { product: NonNullable<typeof i["product"]> } =>
        Boolean(i)
    );

  const subtotal = items.reduce((s, i) => s + i.product.price * i.qty, 0);
  const shipping = subtotal >= 1000 ? 0 : 49;
  const total = subtotal + shipping;

  if (items.length === 0) {
    return (
      <Layout>
        <div className="mx-auto max-w-2xl px-4 pt-6 pb-16 text-center">
          <ShoppingBag className="mx-auto h-12 w-12 text-gold mb-6" />
          <h1 className="font-display text-4xl gradient-text-gold">
            Your cart awaits royalty
          </h1>
          <p className="mt-3 text-muted-foreground">
            Discover pieces fit for the queen's world.
          </p>
          <Link
            to="/categories"
            className="mt-8 inline-block px-7 py-3.5 bg-gold text-primary-foreground uppercase tracking-wide text-sm font-medium hover:bg-primary-glow"
          >
            Start Shopping
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="w-full px-4 md:px-8 lg:px-14 pt-4 md:pt-6 pb-12">
        <h1 className="font-display text-4xl md:text-5xl gradient-text-gold">
          Your Cart
        </h1>
        <div className="gold-divider mt-3 w-24" />

        <div className="mt-8 grid lg:grid-cols-[1fr_380px] xl:grid-cols-[1fr_420px] gap-8 lg:gap-12">
          <div className="p-4 md:p-6 border border-gold/25 bg-card/60 rounded-lg shadow-royal">
            <ul className="divide-y divide-gold/15">
              {items.map((item) => (
                <li
                  key={`${item.id}-${item.size}`}
                  className="py-5 first:pt-0 last:pb-0 flex gap-4"
                >
                  <Link to={`/product/${item.id}`} className="shrink-0">
                    <img
                      src={item.displayImage}
                      alt={item.product.name}
                      className="h-28 w-24 object-cover rounded-md"
                    />
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link
                      to={`/product/${item.id}`}
                      className="font-display text-lg text-foreground hover:text-gold"
                    >
                      {item.product.name}
                    </Link>
                    <p className="text-[11px] uppercase tracking-wider text-gold/60 mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span>Size: <span className="text-white font-semibold">{item.size}</span></span>
                      {item.color && (
                        <>
                          <span className="text-gold/30">|</span>
                          <span>Color: <span className="text-white font-semibold">{item.color}</span></span>
                        </>
                      )}
                      {item.reseller_margin && Number(item.reseller_margin) > 0 && (
                        <>
                          <span className="text-gold/30">|</span>
                          <span className="text-gold font-semibold uppercase tracking-wider text-[9px] bg-gold/10 px-1.5 py-0.5 rounded">
                            ✨ Curated Choice
                          </span>
                        </>
                      )}
                    </p>
                    <p className="mt-1 text-gold">
                      {formatINR(item.product.price)}
                    </p>
                    <div className="mt-2 flex items-center gap-3">
                      <div className="inline-flex items-center border border-gold/30 rounded-md">
                        <button
                          onClick={() =>
                            updateQty(item.id, item.size, item.color ?? "", item.qty - 1)
                          }
                          className="p-1.5 text-gold hover:bg-gold/10"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="w-8 text-center text-sm">
                          {item.qty}
                        </span>
                        <button
                          onClick={() =>
                            updateQty(item.id, item.size, item.color ?? "", item.qty + 1)
                          }
                          className="p-1.5 text-gold hover:bg-gold/10"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.id, item.size, item.color ?? "")}
                        className="text-muted-foreground hover:text-destructive"
                        aria-label="Remove"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <p className="text-gold font-medium whitespace-nowrap">
                    {formatINR(item.product.price * item.qty)}
                  </p>
                </li>
              ))}
            </ul>
          </div>

          <aside className="h-fit p-6 md:p-7 border border-gold/25 bg-card/60 rounded-lg shadow-royal lg:sticky lg:top-24">
            <h2 className="font-display text-2xl text-foreground">
              Order Summary
            </h2>
            <div className="gold-divider mt-2 w-12" />

            {subtotal < 1000 && (
              <div className="mt-4 p-3 bg-gold/10 border border-gold/30 text-xs text-gold rounded text-center font-medium font-sans">
                Shop <span className="font-bold text-amber-500">{formatINR(1000 - subtotal)}</span> more to get <span className="font-bold text-emerald-500">Free Shipping</span>!
              </div>
            )}

            <dl className="mt-5 space-y-3 text-sm">
              <Row label="Subtotal" value={formatINR(subtotal)} />
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Shipping Charges</dt>
                <dd className={shipping === 0 ? "text-emerald-500 font-medium" : "text-foreground"}>
                  {shipping === 0 ? "Free" : formatINR(shipping)}
                </dd>
              </div>
              <div className="border-t border-gold/15 pt-3 flex justify-between">
                <dt className="text-foreground font-medium">Total</dt>
                <dd className="text-gold text-xl font-medium">
                  {formatINR(total)}
                </dd>
              </div>
            </dl>
            <Link
              to={user ? "/checkout" : "/login?redirect=/checkout"}
              className="mt-6 block text-center px-6 py-3.5 bg-gold text-primary-foreground uppercase tracking-wide text-sm font-medium hover:bg-primary-glow shadow-gold"
            >
              Checkout
            </Link>
            <Link
              to="/categories"
              className="mt-3 block text-center text-sm text-gold/80 hover:text-gold"
            >
              Continue shopping
            </Link>
          </aside>
        </div>
      </div>
    </Layout>
  );
};

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-foreground">{value}</dd>
    </div>
  );
}

export default Cart;
