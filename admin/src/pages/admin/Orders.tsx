import { API_URL } from "@/api";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import PageHeader from "@/components/admin/PageHeader";
import StatusBadge from "@/components/admin/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/apiFetch";

type OrderStatus = "Pending" | "Processing" | "Shipped" | "Delivered" | "Cancelled";
type PaymentStatus = "Paid" | "COD" | "Refunded";

type ApiOrder = {
  id: string;
  customer_name: string;
  customer_email: string;
  date: string;
  items: unknown[];
  total: number;
  payment: PaymentStatus;
  status: OrderStatus;
  address?: any;
};

const tabs: ("All" | OrderStatus)[] = ["All", "Pending", "Processing", "Shipped", "Delivered", "Cancelled"];
const statusOptions: OrderStatus[] = ["Pending", "Processing", "Shipped", "Delivered", "Cancelled"];

export default function Orders() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<(typeof tabs)[number]>("All");
  const [q, setQ] = useState("");

  const { data: orders = [], isLoading, error } = useQuery<ApiOrder[]>({
    queryKey: ["orders"],
    queryFn: async () => {
      const res = await apiFetch(`${API_URL}/api/orders`);
      if (!res.ok) throw new Error("Failed to fetch orders");
      return res.json();
    },
  });

  const statusMutation = useMutation({
    mutationFn: async (payload: { id: string; status: OrderStatus; payment: PaymentStatus }) => {
      const res = await apiFetch(`${API_URL}/api/orders/${payload.id}/status`, {
        method: "PUT",
        body: JSON.stringify({ status: payload.status, payment: payload.payment }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to update order status");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      toast.success("Order status updated");
    },
    onError: (err: any) => {
      toast.error("Status update failed", { description: err.message });
    },
  });

  const filtered = useMemo(
    () =>
      orders.filter(
        (o) =>
          (tab === "All" || o.status === tab) &&
          (q === "" || `${o.id} ${o.customer_name} ${o.customer_email}`.toLowerCase().includes(q.toLowerCase()))
      ),
    [orders, tab, q]
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Orders" subtitle={`${filtered.length} of ${orders.length} orders`} />

      <div className="bg-card rounded-2xl shadow-card border border-border/50 overflow-hidden">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between p-5 border-b border-border">
          <div className="flex flex-wrap gap-1.5">
            {tabs.map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`text-xs px-3 py-1.5 rounded-md font-medium transition-smooth ${
                  tab === t ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          <div className="relative sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search orders..." className="pl-9 h-9" />
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : error ? (
          <div className="text-center py-12 text-destructive">Failed to load orders</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-muted-foreground text-xs uppercase tracking-wider">
                <tr>
                  <th className="text-left font-medium py-3 px-5">Order ID</th>
                  <th className="text-left font-medium py-3 px-5">Customer</th>
                  <th className="text-left font-medium py-3 px-5">Date</th>
                  <th className="text-left font-medium py-3 px-5">Items</th>
                  <th className="text-left font-medium py-3 px-5">Shipping Address</th>
                  <th className="text-left font-medium py-3 px-5">Total</th>
                  <th className="text-left font-medium py-3 px-5">Payment</th>
                  <th className="text-left font-medium py-3 px-5">Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((o) => (
                  <tr key={o.id} className="border-t border-border hover:bg-muted/30 transition-smooth">
                    <td className="py-3 px-5 font-medium text-primary">{o.id}</td>
                    <td className="py-3 px-5">
                      <p className="font-medium">{o.customer_name}</p>
                      <p className="text-xs text-muted-foreground">{o.customer_email}</p>
                    </td>
                    <td className="py-3 px-5 text-muted-foreground">{new Date(o.date).toLocaleDateString()}</td>
                    <td className="py-3 px-5">{Array.isArray(o.items) ? o.items.length : 0}</td>
                    <td className="py-3 px-5">
                      {o.address ? (
                        <div className="text-xs text-muted-foreground whitespace-pre-wrap max-w-xs">
                          {typeof o.address === 'string' ? (() => {
                            try {
                              const parsed = JSON.parse(o.address);
                              return `${parsed.line || parsed.line1 || ''}, ${parsed.city || ''}, ${parsed.state || ''} ${parsed.pin || parsed.pincode || ''}\nPhone: ${parsed.phone || ''}`;
                            } catch { return o.address; }
                          })() : `${o.address.line || o.address.line1 || ''}, ${o.address.city || ''}, ${o.address.state || ''} ${o.address.pin || o.address.pincode || ''}\nPhone: ${o.address.phone || ''}`}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground/50">No address</span>
                      )}
                    </td>
                    <td className="py-3 px-5 font-semibold">₹{Number(o.total).toLocaleString()}</td>
                    <td className="py-3 px-5"><StatusBadge status={o.payment} /></td>
                    <td className="py-3 px-5">
                      <div className="flex items-center gap-2">
                        <StatusBadge status={o.status} />
                        <select
                          className="bg-background border border-border rounded-md h-8 px-2 text-xs"
                          value={o.status}
                          onChange={(e) => statusMutation.mutate({ id: o.id, status: e.target.value as OrderStatus, payment: o.payment })}
                          disabled={statusMutation.isPending}
                        >
                          {statusOptions.map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={8} className="py-12 text-center text-muted-foreground">No orders found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
