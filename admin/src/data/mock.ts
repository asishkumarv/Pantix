// Centralized mock data for the Pantix admin dashboard
export const stats = {
  revenue: 385,
  orders: 1,
  pending: 0,
  delivered: 1,
  shipped: 0,
  users: 5,
  newUsers: 0,
  resellers: 1,
  products: 30,
  lowStock: 0,
};

export const revenueSeries = [
  { day: "Mon", revenue: 120, orders: 2 },
  { day: "Tue", revenue: 210, orders: 4 },
  { day: "Wed", revenue: 180, orders: 3 },
  { day: "Thu", revenue: 290, orders: 5 },
  { day: "Fri", revenue: 240, orders: 4 },
  { day: "Sat", revenue: 340, orders: 6 },
  { day: "Sun", revenue: 385, orders: 7 },
];

export const miniSparks = {
  revenue: [80, 120, 90, 160, 140, 220, 260, 240, 310, 290, 340, 385],
  orders: [1, 2, 1, 3, 2, 4, 3, 5, 4, 6, 5, 7],
  delivered: [0, 1, 0, 1, 1, 2, 1, 2, 2, 3, 2, 3],
  users: [1, 1, 2, 2, 3, 3, 4, 4, 4, 5, 5, 5],
  resellers: [0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  products: [10, 12, 14, 18, 20, 22, 24, 26, 28, 29, 30, 30],
};

export type OrderStatus = "Pending" | "Processing" | "Shipped" | "Delivered" | "Cancelled";
export type Order = {
  id: string;
  customer: string;
  email: string;
  date: string;
  items: number;
  total: number;
  status: OrderStatus;
  payment: "Paid" | "COD" | "Refunded";
};

export const orders: Order[] = [
  { id: "PNX-1042", customer: "Aarav Mehta", email: "aarav@example.com", date: "2026-05-04", items: 3, total: 385, status: "Delivered", payment: "Paid" },
  { id: "PNX-1041", customer: "Priya Sharma", email: "priya@example.com", date: "2026-05-03", items: 1, total: 129, status: "Shipped", payment: "Paid" },
  { id: "PNX-1040", customer: "Rohan Gupta", email: "rohan@example.com", date: "2026-05-03", items: 2, total: 248, status: "Processing", payment: "COD" },
  { id: "PNX-1039", customer: "Ishita Roy", email: "ishita@example.com", date: "2026-05-02", items: 4, total: 612, status: "Pending", payment: "Paid" },
  { id: "PNX-1038", customer: "Kabir Singh", email: "kabir@example.com", date: "2026-05-02", items: 1, total: 99, status: "Cancelled", payment: "Refunded" },
  { id: "PNX-1037", customer: "Meera Nair", email: "meera@example.com", date: "2026-05-01", items: 2, total: 220, status: "Delivered", payment: "Paid" },
  { id: "PNX-1036", customer: "Vivaan Patel", email: "vivaan@example.com", date: "2026-04-30", items: 5, total: 780, status: "Delivered", payment: "Paid" },
  { id: "PNX-1035", customer: "Ananya Iyer", email: "ananya@example.com", date: "2026-04-29", items: 1, total: 145, status: "Shipped", payment: "COD" },
];

export type Product = {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  sku: string;
  status: "Active" | "Draft" | "Out of Stock";
  image: string;
  is_budget?: boolean | string;
  is_popular?: boolean | string;
};

const palette = ["#4F46E5", "#10B981", "#F59E0B", "#EC4899", "#8B5CF6", "#06B6D4"];
export const products: Product[] = Array.from({ length: 30 }).map((_, i) => ({
  id: `P-${1000 + i}`,
  name: [
    "Aurora Wireless Earbuds", "Nimbus Smart Watch", "Pulse Fitness Band",
    "Echo Bluetooth Speaker", "Lumen Desk Lamp", "Drift Yoga Mat",
    "Ember Coffee Mug", "Sonic Mechanical Keyboard", "Vista 4K Webcam",
    "Cloud Memory Pillow",
  ][i % 10] + ` v${Math.floor(i / 10) + 1}`,
  category: ["Electronics", "Fitness", "Home", "Accessories", "Audio"][i % 5],
  price: 49 + i * 7,
  stock: (i * 13) % 80 + 5,
  sku: `SKU-${2000 + i}`,
  status: i % 11 === 0 ? "Draft" : "Active",
  image: palette[i % palette.length],
}));

export const categories = [
  { id: "C-01", name: "Electronics", products: 8, slug: "electronics" },
  { id: "C-02", name: "Fitness", products: 6, slug: "fitness" },
  { id: "C-03", name: "Home", products: 6, slug: "home" },
  { id: "C-04", name: "Accessories", products: 6, slug: "accessories" },
  { id: "C-05", name: "Audio", products: 4, slug: "audio" },
];

export const users = [
  { id: "U-01", name: "Aarav Mehta", email: "aarav@example.com", joined: "2026-01-12", orders: 4, status: "Active" },
  { id: "U-02", name: "Priya Sharma", email: "priya@example.com", joined: "2026-02-03", orders: 2, status: "Active" },
  { id: "U-03", name: "Rohan Gupta", email: "rohan@example.com", joined: "2026-02-19", orders: 1, status: "Active" },
  { id: "U-04", name: "Ishita Roy", email: "ishita@example.com", joined: "2026-03-05", orders: 1, status: "Active" },
  { id: "U-05", name: "Kabir Singh", email: "kabir@example.com", joined: "2026-04-22", orders: 0, status: "Inactive" },
];

export const resellers = [
  { id: "R-01", name: "Northstar Retail", contact: "ops@northstar.co", region: "Mumbai", sales: 1240, tier: "Gold", status: "Active" },
];

export const activity = [
  { id: 1, type: "order", text: "New order PNX-1042 placed by Aarav Mehta", time: "2m ago" },
  { id: 2, type: "user", text: "New user Kabir Singh signed up", time: "1h ago" },
  { id: 3, type: "product", text: "Product 'Aurora Wireless Earbuds v1' restocked", time: "3h ago" },
  { id: 4, type: "reseller", text: "Reseller 'Northstar Retail' upgraded to Gold tier", time: "Yesterday" },
  { id: 5, type: "order", text: "Order PNX-1038 was cancelled & refunded", time: "Yesterday" },
];
