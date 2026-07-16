import { cn } from "@/lib/utils";
import { OrderStatus } from "@/data/mock";

const map: Record<string, string> = {
  Pending:    "bg-tint-yellow text-tint-yellow-fg",
  Ordered:    "bg-tint-yellow text-tint-yellow-fg",
  Processing: "bg-tint-blue text-tint-blue-fg",
  "Out for Delivery": "bg-tint-blue text-tint-blue-fg",
  Shipped:    "bg-tint-purple text-tint-purple-fg",
  Delivered:  "bg-tint-green text-tint-green-fg",
  Cancelled:  "bg-destructive/10 text-destructive",
  Active:     "bg-tint-green text-tint-green-fg",
  Inactive:   "bg-muted text-muted-foreground",
  Draft:      "bg-tint-yellow text-tint-yellow-fg",
  "Out of Stock": "bg-destructive/10 text-destructive",
  Paid:       "bg-tint-green text-tint-green-fg",
  COD:        "bg-tint-orange text-tint-orange-fg",
  Refunded:   "bg-muted text-muted-foreground",
  Gold:       "bg-tint-yellow text-tint-yellow-fg",
};

export default function StatusBadge({ status, className }: { status: OrderStatus | string; className?: string }) {
  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium",
      map[status] ?? "bg-muted text-muted-foreground",
      className
    )}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {status}
    </span>
  );
}
