import PageHeader from "@/components/admin/PageHeader";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, Legend } from "recharts";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/apiFetch";

const channelData = [
  { name: "Direct", value: 45, color: "hsl(var(--primary))" },
  { name: "Resellers", value: 25, color: "hsl(var(--primary-glow))" },
  { name: "Marketplace", value: 20, color: "hsl(var(--tint-orange-fg))" },
  { name: "Social", value: 10, color: "hsl(var(--tint-pink-fg))" },
];

export default function Reports() {
  const [revenueSeries, setRevenueSeries] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const [revRes, ordersRes, productsRes] = await Promise.all([
          apiFetch("https://pantix-final-3.onrender.com/api/dashboard/revenue-report"),
          apiFetch("https://pantix-final-3.onrender.com/api/orders"),
          apiFetch("https://pantix-final-3.onrender.com/api/products")
        ]);

        if (revRes.ok) setRevenueSeries(await revRes.json());
        
        if (ordersRes.ok && productsRes.ok) {
          const orders = await ordersRes.json();
          const products = await productsRes.json();
          
          // Calculate top products
          const salesMap: Record<string, { name: string; sales: number; revenue: number }> = {};
          
          orders.forEach((order: any) => {
            if (order.status !== "Cancelled" && order.items) {
              try {
                const items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
                items.forEach((item: any) => {
                  const id = item.id;
                  if (!salesMap[id]) {
                    const product = products.find((p: any) => p.id === id);
                    salesMap[id] = { name: product ? product.name : item.name || id, sales: 0, revenue: 0 };
                  }
                  salesMap[id].sales += item.quantity || 1;
                  salesMap[id].revenue += (item.price || 0) * (item.quantity || 1);
                });
              } catch (e) {
                // ignore parsing error
              }
            }
          });

          const calculatedTop = Object.values(salesMap)
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 5);
            
          setTopProducts(calculatedTop);
        }
      } catch (err) {
        console.error("Failed to fetch reports data", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchReports();
  }, []);

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground">Loading reports...</div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        subtitle="Detailed analytics across revenue, channels and products"
        actions={<Button size="sm" variant="outline"><Download className="w-4 h-4" /> Download PDF</Button>}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-card rounded-2xl shadow-card border border-border/50 p-5 lg:p-6">
          <h3 className="font-semibold mb-4">Revenue trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={revenueSeries}>
              <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12 }} />
              <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={3} dot={{ r: 4, fill: "hsl(var(--primary))" }} />
              <Line type="monotone" dataKey="orders" stroke="hsl(var(--tint-orange-fg))" strokeWidth={2} strokeDasharray="5 5" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card rounded-2xl shadow-card border border-border/50 p-5 lg:p-6">
          <h3 className="font-semibold mb-4">Sales by channel</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={channelData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={3}>
                {channelData.map((c) => <Cell key={c.name} fill={c.color} />)}
              </Pie>
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12 }} />
              <Legend iconType="circle" />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-card rounded-2xl shadow-card border border-border/50 overflow-hidden">
        <div className="p-5 border-b border-border">
          <h3 className="font-semibold">Top performing products</h3>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-muted-foreground text-xs uppercase tracking-wider">
            <tr>
              <th className="text-left font-medium py-3 px-5">#</th>
              <th className="text-left font-medium py-3 px-5">Product</th>
              <th className="text-left font-medium py-3 px-5">Units sold</th>
              <th className="text-left font-medium py-3 px-5">Revenue</th>
              <th className="text-left font-medium py-3 px-5">Performance</th>
            </tr>
          </thead>
          <tbody>
            {topProducts.map((p, i) => {
              const max = Math.max(...topProducts.map((t) => t.sales)) || 1;
              return (
                <tr key={p.name} className="border-t border-border hover:bg-muted/30">
                  <td className="py-3 px-5 font-bold text-muted-foreground">#{i + 1}</td>
                  <td className="py-3 px-5 font-medium">{p.name}</td>
                  <td className="py-3 px-5">{p.sales}</td>
                  <td className="py-3 px-5 font-semibold">₹{p.revenue.toLocaleString()}</td>
                  <td className="py-3 px-5 w-[28%]">
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div className="h-full bg-primary-gradient" style={{ width: `${(p.sales / max) * 100}%` }} />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
