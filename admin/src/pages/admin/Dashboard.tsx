import { API_URL } from "@/api";
import { Wallet, ShoppingCart, Truck, Users as UsersIcon, Network, Package, ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import StatCard from "@/components/admin/StatCard";
import PageHeader from "@/components/admin/PageHeader";
import StatusBadge from "@/components/admin/StatusBadge";
import { apiFetch } from "@/lib/apiFetch";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar
} from "recharts";
import { Button } from "@/components/ui/button";

import { toast } from "sonner";

export default function Dashboard() {
  const [stats, setStats] = useState<any>(null);
  const [revenueSeries, setRevenueSeries] = useState<any[]>([]);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [range, setRange] = useState("7d");

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [statsRes, ordersRes] = await Promise.all([
          apiFetch(`${API_URL}/api/dashboard/stats`),
          apiFetch(`${API_URL}/api/orders`)
        ]);

        if (statsRes.ok) setStats(await statsRes.json());
        if (ordersRes.ok) {
          const allOrders = await ordersRes.json();
          setRecentOrders(allOrders.slice(0, 5));
        }
      } catch (err) {
        console.error("Failed to fetch dashboard data", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  useEffect(() => {
    const fetchRevenue = async () => {
      try {
        const revRes = await apiFetch(`${API_URL}/api/dashboard/revenue-report?range=${range}`);
        if (revRes.ok) {
          setRevenueSeries(await revRes.json());
        }
      } catch (err) {
        console.error("Failed to fetch revenue series", err);
      }
    };
    fetchRevenue();
  }, [range]);

  const handleExportCSV = () => {
    if (!revenueSeries || revenueSeries.length === 0) {
      toast.error("No data to export");
      return;
    }
    const headers = ["Day/Date", "Revenue (INR)", "Orders Count"];
    const rows = revenueSeries.map(r => [r.day, r.revenue, r.orders]);
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `revenue_report_${range}_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("CSV report exported successfully!");
  };

  if (isLoading || !stats) {
    return <div className="p-8 text-center text-muted-foreground">Loading dashboard...</div>;
  }

  // Generate some mini sparks based on the revenue series for visual consistency
  const sparkData = revenueSeries.length > 0 ? revenueSeries.map(r => r.revenue) : [0,0,0,0,0,0,0];
  const orderSparkData = revenueSeries.length > 0 ? revenueSeries.map(r => r.orders) : [0,0,0,0,0,0,0];
  const activity = recentOrders.map((o, i) => ({ id: i, text: `Order ${o.id} placed by ${o.customer_name || o.customer}`, time: "Recently" }));

  return (
    <div className="space-y-6 lg:space-y-8">
      <PageHeader
        title="Dashboard Overview"
        subtitle="Real-time analytics & KPI insights · Last updated: Just now"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleExportCSV}>Export CSV</Button>
            <Button variant="outline" size="sm" onClick={() => window.print()}>Export PDF</Button>
          </div>
        }
      />

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-5">
        <StatCard label="Total Revenue" value={`₹${stats.revenue}`} subtext="Today" icon={Wallet}
          tint="green" delta={12.4} spark={sparkData} />
        <StatCard label="Total Orders" value={stats.orders} subtext={`Pending: ${stats.pending}`} icon={ShoppingCart}
          tint="blue" delta={8.2} spark={orderSparkData} />
        <StatCard label="Delivered Orders" value={stats.delivered} subtext={`Shipped: ${stats.shipped}`} icon={Truck}
          tint="purple" delta={4.1} spark={sparkData} />
        <StatCard label="Total Users" value={stats.users} subtext={`New today: ${stats.newUsers || 0}`} icon={UsersIcon}
          tint="orange" delta={2.0} spark={sparkData} />
        <StatCard label="Total Resellers" value={stats.resellers} subtext="Network partners" icon={Network}
          tint="pink" delta={0} spark={sparkData} />
        <StatCard label="Total Products" value={stats.products} subtext={`Low stock: ${stats.lowStock}`} icon={Package}
          tint="yellow" delta={6.5} spark={sparkData} />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-card rounded-2xl shadow-card border border-border/50 p-5 lg:p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="font-semibold">Revenue overview</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Total ₹{revenueSeries.reduce((a, b) => a + b.revenue, 0)}</p>
            </div>
            <div className="flex gap-1.5">
              {[
                { label: "7D", val: "7d" },
                { label: "1M", val: "1m" },
                { label: "3M", val: "3m" },
              ].map((p) => (
                <button
                  key={p.val}
                  onClick={() => setRange(p.val)}
                  className={`text-xs px-2.5 py-1 rounded-md transition-smooth ${
                    range === p.val ? "bg-primary text-primary-foreground font-semibold" : "text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={revenueSeries}>
              <defs>
                <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12 }} />
              <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2.5} fill="url(#rev)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card rounded-2xl shadow-card border border-border/50 p-5 lg:p-6">
          <h3 className="font-semibold mb-4">Orders by day</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={revenueSeries}>
              <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12 }} />
              <Bar dataKey="orders" fill="hsl(var(--primary-glow))" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent orders + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-card rounded-2xl shadow-card border border-border/50 overflow-hidden">
          <div className="flex items-center justify-between p-5 lg:p-6 border-b border-border">
            <div>
              <h3 className="font-semibold">Recent orders</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Latest activity from your store</p>
            </div>
            <Link to="/orders" className="text-xs text-primary font-medium hover:underline inline-flex items-center gap-1">
              View all <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-muted-foreground text-xs uppercase tracking-wider">
                <tr>
                  <th className="text-left font-medium py-3 px-5">Order</th>
                  <th className="text-left font-medium py-3 px-5">Customer</th>
                  <th className="text-left font-medium py-3 px-5">Total</th>
                  <th className="text-left font-medium py-3 px-5">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((o) => (
                  <tr key={o.id} className="border-t border-border hover:bg-muted/30 transition-smooth">
                    <td className="py-3 px-5 font-medium">{o.id}</td>
                    <td className="py-3 px-5">
                      <p className="font-medium">{o.customer_name || o.customer}</p>
                      <p className="text-xs text-muted-foreground">{o.customer_email || o.email}</p>
                    </td>
                    <td className="py-3 px-5 font-semibold">₹{o.total}</td>
                    <td className="py-3 px-5"><StatusBadge status={o.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-card rounded-2xl shadow-card border border-border/50 p-5 lg:p-6">
          <h3 className="font-semibold mb-4">Activity feed</h3>
          <ul className="space-y-4">
            {activity.map((a) => (
              <li key={a.id} className="flex gap-3">
                <div className="relative">
                  <div className="w-2 h-2 rounded-full bg-primary mt-1.5" />
                  <div className="absolute top-3.5 left-1/2 -translate-x-1/2 w-px h-8 bg-border" />
                </div>
                <div className="flex-1 -mt-0.5">
                  <p className="text-sm">{a.text}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{a.time}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
