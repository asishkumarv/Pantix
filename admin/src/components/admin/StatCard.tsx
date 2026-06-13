import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";

type Tint = "green" | "blue" | "purple" | "orange" | "pink" | "yellow";

interface Props {
  label: string;
  value: ReactNode;
  subtext?: string;
  icon: LucideIcon;
  tint: Tint;
  delta?: number;
  spark?: number[];
}

const tintMap: Record<Tint, { bg: string; fg: string; spark: string }> = {
  green:  { bg: "bg-tint-green",  fg: "text-tint-green-fg",  spark: "stroke-tint-green-fg" },
  blue:   { bg: "bg-tint-blue",   fg: "text-tint-blue-fg",   spark: "stroke-tint-blue-fg" },
  purple: { bg: "bg-tint-purple", fg: "text-tint-purple-fg", spark: "stroke-tint-purple-fg" },
  orange: { bg: "bg-tint-orange", fg: "text-tint-orange-fg", spark: "stroke-tint-orange-fg" },
  pink:   { bg: "bg-tint-pink",   fg: "text-tint-pink-fg",   spark: "stroke-tint-pink-fg" },
  yellow: { bg: "bg-tint-yellow", fg: "text-tint-yellow-fg", spark: "stroke-tint-yellow-fg" },
};

function Sparkline({ data, className }: { data: number[]; className?: string }) {
  const w = 100, h = 32;
  const min = Math.min(...data), max = Math.max(...data);
  const range = max - min || 1;
  const step = w / (data.length - 1);
  const points = data.map((v, i) => `${i * step},${h - ((v - min) / range) * h}`).join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className={cn("w-full h-8", className)} preserveAspectRatio="none">
      <polyline fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" points={points} />
    </svg>
  );
}

export default function StatCard({ label, value, subtext, icon: Icon, tint, delta, spark }: Props) {
  const t = tintMap[tint];
  return (
    <div className="card-lift bg-card rounded-2xl p-5 lg:p-6 shadow-card border border-border/50 animate-scale-in">
      <div className="flex items-start justify-between mb-4">
        <div className={cn("w-11 h-11 rounded-xl grid place-items-center", t.bg)}>
          <Icon className={cn("w-5 h-5", t.fg)} />
        </div>
        {typeof delta === "number" && (
          <span className={cn(
            "inline-flex items-center gap-0.5 text-xs font-semibold px-2 py-1 rounded-md",
            delta >= 0 ? "bg-tint-green text-tint-green-fg" : "bg-destructive/10 text-destructive"
          )}>
            {delta >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {Math.abs(delta)}%
          </span>
        )}
      </div>
      <p className="text-sm text-muted-foreground font-medium">{label}</p>
      <p className="mt-1 text-2xl lg:text-3xl font-bold tracking-tight">{value}</p>
      {subtext && <p className="mt-1 text-xs text-muted-foreground">{subtext}</p>}
      {spark && <div className="mt-3"><Sparkline data={spark} className={t.spark} /></div>}
    </div>
  );
}
