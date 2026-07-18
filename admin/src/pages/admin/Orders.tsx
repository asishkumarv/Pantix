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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
type OrderStatus = "Ordered" | "Shipped" | "Out for Delivery" | "Delivered" | "Cancelled";
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

const tabs: ("All" | OrderStatus)[] = ["All", "Ordered", "Shipped", "Out for Delivery", "Delivered", "Cancelled"];
const statusOptions: OrderStatus[] = ["Ordered", "Shipped", "Out for Delivery", "Delivered", "Cancelled"];

export default function Orders() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<(typeof tabs)[number]>("All");
  const [q, setQ] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<ApiOrder | null>(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

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
        (o) => {
          const matchTab = tab === "All" || o.status === tab;
          const matchQ = q === "" || `${o.id} ${o.customer_name} ${o.customer_email}`.toLowerCase().includes(q.toLowerCase());
          
          let matchDate = true;
          if (startDate) {
            const start = new Date(startDate);
            start.setHours(0, 0, 0, 0);
            matchDate = matchDate && new Date(o.date) >= start;
          }
          if (endDate) {
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            matchDate = matchDate && new Date(o.date) <= end;
          }
          
          return matchTab && matchQ && matchDate;
        }
      ),
    [orders, tab, q, startDate, endDate]
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Orders" subtitle={`${filtered.length} of ${orders.length} orders`} />

      <div className="bg-card rounded-2xl shadow-card border border-border/50 overflow-hidden">
        <div className="flex flex-col gap-4 p-5 border-b border-border">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
          
          <div className="flex flex-wrap items-center gap-3 border-t border-border/50 pt-3">
            <span className="text-xs font-medium text-muted-foreground">Filter by Date:</span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">From</span>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-8 text-xs w-36 bg-background/50"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">To</span>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="h-8 text-xs w-36 bg-background/50"
              />
            </div>
            {(startDate || endDate) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setStartDate("");
                  setEndDate("");
                }}
                className="h-8 px-2 text-xs text-destructive hover:bg-destructive/10"
              >
                Clear Dates
              </Button>
            )}
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
                  <tr
                    key={o.id}
                    className="border-t border-border hover:bg-muted/30 transition-smooth cursor-pointer"
                    onClick={() => setSelectedOrder(o)}
                  >
                    <td className="py-3 px-5 font-medium text-primary">{o.id}</td>
                    <td className="py-3 px-5">
                      <p className="font-medium">{o.customer_name}</p>
                      <p className="text-xs text-muted-foreground">{o.customer_email}</p>
                    </td>
                     <td className="py-3 px-5 text-muted-foreground">
                      {(() => {
                        const d = new Date(o.date);
                        const day = String(d.getDate()).padStart(2, '0');
                        const month = String(d.getMonth() + 1).padStart(2, '0');
                        const year = d.getFullYear();
                        return `${day}-${month}-${year}`;
                      })()}
                    </td>
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
                    <td className="py-3 px-5">
                      <div className="flex flex-col gap-1">
                        <StatusBadge status={o.payment} />
                        {(() => {
                          if (!o.address) return null;
                          const addr = typeof o.address === 'string' ? (() => {
                            try { return JSON.parse(o.address); } catch { return {}; }
                          })() : o.address;
                          return addr.transaction_id ? (
                            <span className="text-[10px] text-muted-foreground font-mono bg-muted/50 px-1 py-0.5 rounded select-all border border-border w-max max-w-[130px] truncate" title={addr.transaction_id}>
                              ID: {addr.transaction_id}
                            </span>
                          ) : null;
                        })()}
                      </div>
                    </td>
                    <td className="py-3 px-5">
                      <div className="flex items-center gap-2">
                        <StatusBadge status={o.status} />
                        <select
                          className="bg-background border border-border rounded-md h-8 px-2 text-xs"
                          value={o.status}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => {
                            e.stopPropagation();
                            statusMutation.mutate({ id: o.id, status: e.target.value as OrderStatus, payment: o.payment });
                          }}
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

      {/* Order Details Modal */}
      <Dialog open={selectedOrder !== null} onOpenChange={(open) => !open && setSelectedOrder(null)}>
        {selectedOrder && (
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold flex items-center justify-between">
                <span>Order Details</span>
                <span className="text-sm font-normal text-muted-foreground mr-6">#{selectedOrder.id}</span>
              </DialogTitle>
              <DialogDescription>
                Placed on {(() => {
                  const d = new Date(selectedOrder.date);
                  const day = String(d.getDate()).padStart(2, '0');
                  const month = String(d.getMonth() + 1).padStart(2, '0');
                  const year = d.getFullYear();
                  const time = d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
                  return `${day}-${month}-${year} ${time}`;
                })()}
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
              {/* Left Column: Customer & Shipping Details */}
              <div className="space-y-4">
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Customer</h4>
                  <p className="font-medium text-sm">{selectedOrder.customer_name}</p>
                  <p className="text-xs text-muted-foreground">{selectedOrder.customer_email}</p>
                </div>

                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Shipping Address</h4>
                  <div className="text-sm border border-border bg-muted/20 p-3 rounded-md whitespace-pre-wrap leading-relaxed">
                    {(() => {
                      const addr = selectedOrder.address;
                      if (!addr) return "No address provided";
                      if (typeof addr === 'string') {
                        try {
                          const parsed = JSON.parse(addr);
                          return `${parsed.line || parsed.line1 || ''}\n${parsed.city || ''}, ${parsed.state || ''} ${parsed.pin || parsed.pincode || ''}\nPhone: ${parsed.phone || ''}`;
                        } catch { return addr; }
                      }
                      return `${addr.line || addr.line1 || ''}\n${addr.city || ''}, ${addr.state || ''} ${addr.pin || addr.pincode || ''}\nPhone: ${addr.phone || ''}`;
                    })()}
                  </div>
                </div>
              </div>

              {/* Right Column: Status Controls & Summary */}
              <div className="space-y-4">
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Payment Method</h4>
                  <p className="text-sm font-medium flex items-center gap-2">
                    {selectedOrder.payment}
                    <StatusBadge status={selectedOrder.payment} />
                  </p>
                  {(() => {
                    if (!selectedOrder.address) return null;
                    const addr = typeof selectedOrder.address === 'string' ? (() => {
                      try { return JSON.parse(selectedOrder.address); } catch { return {}; }
                    })() : selectedOrder.address;
                    return addr.transaction_id ? (
                      <p className="text-xs text-muted-foreground font-mono mt-1 bg-muted/40 p-1.5 rounded border border-border/80 select-all w-max max-w-[220px] truncate" title={addr.transaction_id}>
                        Txn ID: {addr.transaction_id}
                      </p>
                    ) : null;
                  })()}
                </div>

                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Fulfillment Status</h4>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={selectedOrder.status} />
                    <select
                      className="bg-background border border-border rounded-md h-9 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                      value={selectedOrder.status}
                      onChange={(e) => {
                        statusMutation.mutate({ id: selectedOrder.id, status: e.target.value as OrderStatus, payment: selectedOrder.payment });
                        setSelectedOrder(prev => prev ? { ...prev, status: e.target.value as OrderStatus } : null);
                      }}
                      disabled={statusMutation.isPending}
                    >
                      {statusOptions.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Grand Total</h4>
                  <p className="text-lg font-bold text-primary">₹{Number(selectedOrder.total).toLocaleString()}</p>
                </div>
              </div>
            </div>

            <div className="border-t border-border pt-5 mt-4">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Ordered Products</h4>
              <div className="space-y-3">
                {(() => {
                  const items = typeof selectedOrder.items === 'string' ? (() => { try { return JSON.parse(selectedOrder.items); } catch { return []; } })() : selectedOrder.items || [];
                  if (!Array.isArray(items) || items.length === 0) return <p className="text-sm text-muted-foreground">No products found in this order.</p>;
                  return items.map((item: any, idx: number) => {
                    const imgUrl = item.image ? (item.image.startsWith("http") ? item.image : (item.image.startsWith("/uploads/") ? `${API_URL}${item.image}` : `${API_URL}/${item.image}`)) : "";
                    return (
                      <div key={idx} className="flex gap-4 p-3 border border-border bg-muted/10 rounded-md">
                        {imgUrl ? (
                          <img src={imgUrl} alt={item.name} className="h-16 w-12 object-cover rounded border border-border bg-white" />
                        ) : (
                          <div className="h-16 w-12 bg-muted rounded border border-border text-[9px] text-muted-foreground flex items-center justify-center">No Image</div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm text-foreground truncate">{item.name}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Size: <span className="font-medium text-foreground">{item.size || "M"}</span>
                            {item.color && (
                              <>
                                <span className="mx-1.5">•</span>
                                Color: <span className="font-medium text-foreground">{item.color}</span>
                              </>
                            )}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Qty: <span className="font-medium text-foreground">{item.qty || item.quantity || 1}</span>
                          </p>
                        </div>
                        <div className="text-right shrink-0 flex flex-col justify-center">
                          <p className="font-semibold text-sm text-foreground">₹{Number(item.price * (item.qty || item.quantity || 1)).toLocaleString()}</p>
                          <p className="text-[10px] text-muted-foreground">₹{Number(item.price).toLocaleString()} / unit</p>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
