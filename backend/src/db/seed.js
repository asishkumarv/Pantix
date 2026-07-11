import pool from "../config/db.js";
import bcrypt from "bcryptjs";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const assetsDir = path.resolve(__dirname, "..", "..", "..", "Pantix Latest", "src", "assets");

async function uploadImageHelper(imageName, folder = "pantix") {
  if (!imageName || typeof imageName !== "string" || !imageName.includes(".")) {
    return imageName;
  }
  
  let finalImageName = imageName;
  let filePath = path.join(assetsDir, finalImageName);
  
  if (!fs.existsSync(filePath)) {
    // Check if adding "product-" prefix resolves it (e.g., casual-1.jpg -> product-casual-1.jpg)
    const alternateName = `product-${imageName}`;
    const altPath = path.join(assetsDir, alternateName);
    if (fs.existsSync(altPath)) {
      filePath = altPath;
      finalImageName = alternateName;
    } else {
      console.warn(`File not found: ${filePath}`);
      return imageName;
    }
  }
  
  try {
    const filename = `${folder}/${finalImageName}`;
    console.log(`Seeding image ${finalImageName} into database uploads table with key: ${filename}`);
    
    const fileBuffer = fs.readFileSync(filePath);
    let mimeType = "image/jpeg";
    if (filePath.endsWith(".png")) mimeType = "image/png";
    else if (filePath.endsWith(".webp")) mimeType = "image/webp";
    else if (filePath.endsWith(".gif")) mimeType = "image/gif";
    
    await pool.query(
      `INSERT INTO uploads (filename, mime_type, data)
       VALUES ($1, $2, $3)
       ON CONFLICT (filename) DO NOTHING`,
      [filename, mimeType, fileBuffer]
    );
    
    return `/uploads/${filename}`;
  } catch (err) {
    console.error(`Error uploading/seeding ${finalImageName}:`, err);
    return imageName;
  }
}

const categories = [
  { id: "two-piece", name: "2 Piece Sets", slug: "two-piece", image: "cat-2piece.jpg" },
  { id: "three-piece", name: "3 Piece Kurta Sets (M–XXL)", slug: "three-piece", image: "cat-3piece.jpg" },
  { id: "three-piece-plus", name: "3 Piece Kurta Sets (3XL–6XL)", slug: "three-piece-plus", image: "cat-plussize.jpg" },
  { id: "feeding", name: "Feeding Outfits", slug: "feeding", image: "casual-1.jpg" },
  { id: "frocks", name: "Frocks", slug: "frocks", image: "cat-frock.jpg" },
  { id: "party", name: "Party Wear", slug: "party", image: "party-1.jpg" },
  { id: "traditional", name: "Traditional Wear", slug: "traditional", image: "lehenga-1.jpg" },
  { id: "handlooms", name: "Handlooms", slug: "handlooms", image: "saree-1.jpg" },
  { id: "budget", name: "Budget Friendly", slug: "budget", image: "cat-budget.jpg" },
  { id: "plus-size", name: "Plus Size", slug: "plus-size", image: "cat-plussize.jpg" },
  { id: "casual", name: "Casual Wear", slug: "casual", image: "casual-1.jpg" }
];

const storeProducts = [
  {
    id: "emerald-zari-kurta",
    name: "Emerald Zari Kurta Set",
    price: 4499,
    mrp: 6999,
    category: "three-piece",
    category_label: "3 Piece Kurta Sets",
    image: "product-kurta-1.jpg",
    images: ["product-kurta-1.jpg", "product-casual-1.jpg", "product-anarkali-1.jpg", "product-party-1.jpg"],
    sizes: ["XS", "S", "M", "L", "XL"],
    description: "A regal emerald silk kurta with intricate gold zari embroidery on the yoke and hem. Tailored for the modern queen — pair with churidar or palazzo.",
    in_stock: true,
    stock: 12,
    badge: "Bestseller",
    colors: JSON.stringify([
      { name: "Emerald", hex: "#043927" },
      { name: "Ruby", hex: "#9b111e" },
      { name: "Midnight", hex: "#191970" },
    ]),
    sku: "SKU-EMERALD-ZARI",
    status: "Active"
  },
  {
    id: "scarlet-banarasi-saree",
    name: "Scarlet Banarasi Frock",
    price: 8999,
    mrp: 12999,
    category: "frocks",
    category_label: "Frocks",
    image: "product-saree-1.jpg",
    images: ["product-saree-1.jpg", "product-saree-2.jpg", "product-lehenga-1.jpg", "product-anarkali-1.jpg"],
    sizes: ["Free Size"],
    description: "Hand-woven Banarasi silk in deep scarlet, framed by a wide gold zari border. Includes blouse piece.",
    in_stock: true,
    stock: 3,
    badge: "New",
    colors: JSON.stringify([
      { name: "Scarlet", hex: "#ff2400" },
      { name: "Crimson", hex: "#dc143c" },
      { name: "Maroon", hex: "#800000" },
    ]),
    sku: "SKU-SCARLET-BANARASI",
    status: "Active"
  },
  {
    id: "midnight-sequin-gown",
    name: "Midnight Sequin Gown",
    price: 11999,
    mrp: 15999,
    category: "party",
    category_label: "Party Wear",
    image: "product-party-1.jpg",
    images: ["product-party-1.jpg", "product-lehenga-1.jpg", "product-kurta-1.jpg", "product-anarkali-1.jpg"],
    sizes: ["S", "M", "L", "XL"],
    description: "A floor-sweeping mermaid gown crafted in black velvet, hand-embellished with copper sequins and beads.",
    in_stock: true,
    stock: 7,
    badge: "Premium",
    colors: JSON.stringify([
      { name: "Midnight", hex: "#191970" },
      { name: "Charcoal", hex: "#36454f" },
      { name: "Onyx", hex: "#353839" },
    ]),
    sku: "SKU-MIDNIGHT-SEQUIN",
    status: "Active"
  },
  {
    id: "rose-anarkali",
    name: "Rose Petal Anarkali",
    price: 6499,
    mrp: 8999,
    category: "traditional",
    category_label: "Traditional",
    image: "product-anarkali-1.jpg",
    images: ["product-anarkali-1.jpg", "product-lehenga-1.jpg", "product-saree-2.jpg", "product-kurta-1.jpg"],
    sizes: ["XS", "S", "M", "L"],
    description: "Soft pink anarkali with delicate gold motifs, paired with a sheer dupatta. Effortlessly graceful.",
    in_stock: true,
    stock: 15,
    badge: null,
    colors: JSON.stringify([
      { name: "Rose", hex: "#ff007f" },
      { name: "Peach", hex: "#ffcba4" },
      { name: "Blush", hex: "#de5d83" },
    ]),
    sku: "SKU-ROSE-ANARKALI",
    status: "Active"
  },
  {
    id: "ivory-gold-lehenga",
    name: "Ivory & Gold Lehenga",
    price: 18999,
    mrp: 24999,
    category: "traditional",
    category_label: "Traditional",
    image: "product-lehenga-1.jpg",
    images: ["product-lehenga-1.jpg", "product-anarkali-1.jpg", "product-saree-2.jpg", "product-party-1.jpg"],
    sizes: ["S", "M", "L", "XL"],
    description: "Bridal-ready ivory lehenga with all-over gold damask embroidery. A statement of timeless royalty.",
    in_stock: true,
    stock: 2,
    badge: "Bridal",
    colors: JSON.stringify([
      { name: "Ivory", hex: "#fffff0" },
      { name: "Gold", hex: "#ffd700" },
      { name: "Cream", hex: "#fffdd0" },
    ]),
    sku: "SKU-IVORY-LEHENGA",
    status: "Active"
  },
  {
    id: "jade-cotton-kurti",
    name: "Jade Everyday Kurti",
    price: 1499,
    mrp: 2299,
    category: "budget",
    category_label: "Budget Friendly",
    image: "product-casual-1.jpg",
    images: ["product-casual-1.jpg", "product-kurta-1.jpg", "product-anarkali-1.jpg", "product-saree-1.jpg"],
    sizes: ["XS", "S", "M", "L", "XL", "XXL"],
    description: "Breathable cotton kurti in jade green with subtle embroidered motifs. Daily comfort, queenly grace.",
    in_stock: true,
    stock: 24,
    badge: "Budget",
    colors: JSON.stringify([
      { name: "Jade", hex: "#00a86b" },
      { name: "Teal", hex: "#008080" },
      { name: "Mint", hex: "#3eb489" },
    ]),
    sku: "SKU-JADE-KURTI",
    status: "Active"
  },
  {
    id: "royal-blue-saree",
    name: "Royal Blue 2-Piece Set",
    price: 7499,
    mrp: 10499,
    category: "two-piece",
    category_label: "2 Piece Sets",
    image: "product-saree-2.jpg",
    images: ["product-saree-2.jpg", "product-saree-1.jpg", "product-lehenga-1.jpg", "product-kurta-1.jpg"],
    sizes: ["Free Size"],
    description: "Lustrous royal blue silk saree with antique-gold zari pallu. A regal pick for weddings & soirées.",
    in_stock: true,
    stock: 9,
    badge: null,
    colors: JSON.stringify([
      { name: "Royal Blue", hex: "#4169e1" },
      { name: "Indigo", hex: "#4b0082" },
      { name: "Azure", hex: "#007fff" },
    ]),
    sku: "SKU-ROYAL-BLUE-2PC",
    status: "Active"
  },
  {
    id: "emerald-festive-kurta",
    name: "Festive Emerald Kurta",
    price: 3299,
    mrp: 4799,
    category: "two-piece",
    category_label: "2 Piece Sets",
    image: "product-kurta-1.jpg",
    images: ["product-kurta-1.jpg", "product-casual-1.jpg", "product-anarkali-1.jpg", "product-party-1.jpg"],
    sizes: ["S", "M", "L", "XL"],
    description: "Festive-ready emerald kurta with golden thread work — your go-to for celebrations.",
    in_stock: false,
    stock: 0,
    badge: null,
    colors: JSON.stringify([
      { name: "Emerald", hex: "#50c878" },
      { name: "Forest", hex: "#228b22" },
      { name: "Olive", hex: "#808000" },
    ]),
    sku: "SKU-EMERALD-FESTIVE",
    status: "Active"
  },
  {
    id: "emerald-flow-frock",
    name: "Emerald Flow Frock",
    price: 2999,
    mrp: 4499,
    category: "frocks",
    category_label: "Frocks",
    image: "product-anarkali-1.jpg",
    images: ["product-anarkali-1.jpg", "product-lehenga-1.jpg", "product-kurta-1.jpg", "product-saree-1.jpg"],
    sizes: ["XS", "S", "M", "L", "XL"],
    description: "Flowing A-line frock in emerald satin with a gold waist tie. Effortless royalty.",
    in_stock: true,
    stock: 18,
    badge: null,
    colors: JSON.stringify([
      { name: "Emerald", hex: "#50c878" },
      { name: "Seafoam", hex: "#93e9be" },
      { name: "Lime", hex: "#32cd32" },
    ]),
    sku: "SKU-EMERALD-FLOW-FROCK",
    status: "Active"
  },
  {
    id: "queen-plus-kurta",
    name: "Queen Plus Embroidered Kurta",
    price: 3999,
    mrp: 5999,
    category: "plus-size",
    category_label: "Plus Size (3XL–6XL)",
    image: "product-anarkali-1.jpg",
    images: ["product-anarkali-1.jpg", "product-kurta-1.jpg", "product-casual-1.jpg", "product-lehenga-1.jpg"],
    sizes: ["3XL", "4XL", "5XL", "6XL"],
    description: "Designed for every queen — flowing teal kurta with antique gold neckline. Sizes 3XL to 6XL.",
    in_stock: true,
    stock: 11,
    badge: "Plus Size",
    colors: JSON.stringify([
      { name: "Teal", hex: "#008080" },
      { name: "Plum", hex: "#8e4585" },
      { name: "Navy", hex: "#000080" },
    ]),
    sku: "SKU-QUEEN-PLUS-KURTA",
    status: "Active"
  },
  {
    id: "casual-jade-coord",
    name: "Jade Casual Co-ord",
    price: 1999,
    mrp: 2999,
    category: "casual",
    category_label: "Casual Wear",
    image: "product-casual-1.jpg",
    images: ["product-casual-1.jpg", "product-kurta-1.jpg", "product-anarkali-1.jpg", "product-saree-2.jpg"],
    sizes: ["XS", "S", "M", "L", "XL"],
    description: "Easy-breezy jade co-ord set for everyday elegance.",
    in_stock: true,
    stock: 30,
    badge: null,
    colors: JSON.stringify([
      { name: "Jade", hex: "#00a86b" },
      { name: "Khaki", hex: "#c3b091" },
      { name: "Stone", hex: "#87794e" },
    ]),
    sku: "SKU-JADE-CASUAL-COORD",
    status: "Active"
  }
];

const mockUsers = [
  { name: "Admin Test", email: "admin@pantix.com", password: "admin123", role: "admin", status: "Active" },
  { name: "Aarav Mehta", email: "aarav@example.com", password: "password123", role: "user", status: "Active" },
  { name: "Priya Sharma", email: "priya@example.com", password: "password123", role: "user", status: "Active" },
  { name: "Rohan Gupta", email: "rohan@example.com", password: "password123", role: "user", status: "Active" },
  { name: "Ishita Roy", email: "ishita@example.com", password: "password123", role: "user", status: "Active" },
  { name: "Kabir Singh", email: "kabir@example.com", password: "password123", role: "user", status: "Inactive" }
];

const mockOrders = [
  { id: "PNX-1042", customer: "Aarav Mehta", email: "aarav@example.com", date: "2026-05-04T12:00:00Z", total: 385, status: "Delivered", payment: "Paid", items: JSON.stringify([{ id: "P-1001", name: "Aurora Wireless Earbuds v1", qty: 3, price: 128 }]) },
  { id: "PNX-1041", customer: "Priya Sharma", email: "priya@example.com", date: "2026-05-03T14:30:00Z", total: 129, status: "Shipped", payment: "Paid", items: JSON.stringify([{ id: "P-1002", name: "Nimbus Smart Watch v1", qty: 1, price: 129 }]) },
  { id: "PNX-1040", customer: "Rohan Gupta", email: "rohan@example.com", date: "2026-05-03T09:15:00Z", total: 248, status: "Processing", payment: "COD", items: JSON.stringify([{ id: "P-1003", name: "Pulse Fitness Band v1", qty: 2, price: 124 }]) },
  { id: "PNX-1039", customer: "Ishita Roy", email: "ishita@example.com", date: "2026-05-02T16:45:00Z", total: 612, status: "Pending", payment: "Paid", items: JSON.stringify([{ id: "P-1004", name: "Echo Bluetooth Speaker v1", qty: 4, price: 153 }]) },
  { id: "PNX-1038", customer: "Kabir Singh", email: "kabir@example.com", date: "2026-05-02T11:00:00Z", total: 99, status: "Cancelled", payment: "Refunded", items: JSON.stringify([{ id: "P-1005", name: "Lumen Desk Lamp v1", qty: 1, price: 99 }]) },
  { id: "PNX-1037", customer: "Meera Nair", email: "meera@example.com", date: "2026-05-01T10:00:00Z", total: 220, status: "Delivered", payment: "Paid", items: JSON.stringify([{ id: "P-1006", name: "Drift Yoga Mat v1", qty: 2, price: 110 }]) },
  { id: "PNX-1036", customer: "Vivaan Patel", email: "vivaan@example.com", date: "2026-04-30T15:20:00Z", total: 780, status: "Delivered", payment: "Paid", items: JSON.stringify([{ id: "P-1007", name: "Ember Coffee Mug v1", qty: 5, price: 156 }]) },
  { id: "PNX-1035", customer: "Ananya Iyer", email: "ananya@example.com", date: "2026-04-29T18:10:00Z", total: 145, status: "Shipped", payment: "COD", items: JSON.stringify([{ id: "P-1008", name: "Sonic Mechanical Keyboard v1", qty: 1, price: 145 }]) }
];

const mockResellers = [
  { id: "R-01", name: "Northstar Retail", contact: "ops@northstar.co", region: "Mumbai", sales: 1240, tier: "Gold", status: "Active" }
];

async function seed() {
  try {
    console.log("Starting data seeding...");

    console.log("Cleaning up existing data...");
    await pool.query("TRUNCATE categories, products, uploads, users, orders, resellers, reviews CASCADE;");

    // 1. Seed Categories
    for (const c of categories) {
      const cloudinaryUrl = await uploadImageHelper(c.image, "categories");
      await pool.query(
        `INSERT INTO categories (id, name, slug, image)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, slug = EXCLUDED.slug, image = EXCLUDED.image`,
        [c.id, c.name, c.slug, cloudinaryUrl]
      );
    }
    console.log("Categories seeded.");

    // 2. Seed Store Products
    for (const p of storeProducts) {
      const mainCloudinaryUrl = await uploadImageHelper(p.image, "products");
      const mappedImages = [];
      if (Array.isArray(p.images)) {
        for (const img of p.images) {
          const url = await uploadImageHelper(img, "products");
          mappedImages.push(url);
        }
      }

      await pool.query(
        `INSERT INTO products (id, name, price, mrp, category, category_label, image, images, sizes, description, in_stock, stock, badge, colors, sku, status, is_budget, is_popular)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
         ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, price = EXCLUDED.price, mrp = EXCLUDED.mrp, category = EXCLUDED.category, image = EXCLUDED.image, images = EXCLUDED.images, sizes = EXCLUDED.sizes, is_budget = EXCLUDED.is_budget, is_popular = EXCLUDED.is_popular`,
        [p.id, p.name, p.price, p.mrp, p.category, p.category_label, mainCloudinaryUrl, mappedImages, p.sizes, p.description, p.in_stock, p.stock, p.badge, p.colors, p.sku, p.status, p.price <= 5000, p.badge === 'Bestseller']
      );
    }

    // Generate and seed admin mock products P-1000 to P-1029
    const palette = ["#4F46E5", "#10B981", "#F59E0B", "#EC4899", "#8B5CF6", "#06B6D4"];
    for (let i = 0; i < 30; i++) {
      const id = `P-${1000 + i}`;
      const name = [
        "Aurora Wireless Earbuds", "Nimbus Smart Watch", "Pulse Fitness Band",
        "Echo Bluetooth Speaker", "Lumen Desk Lamp", "Drift Yoga Mat",
        "Ember Coffee Mug", "Sonic Mechanical Keyboard", "Vista 4K Webcam",
        "Cloud Memory Pillow",
      ][i % 10] + ` v${Math.floor(i / 10) + 1}`;
      const categoryId = ["two-piece", "three-piece", "feeding", "frocks", "party"][i % 5];
      const categoryLabel = ["2 Piece Sets", "3 Piece Kurta Sets", "Feeding Outfits", "Frocks", "Party Wear"][i % 5];
      const price = 49 + i * 7;
      const stock = (i * 13) % 80 + 5;
      const sku = `SKU-${2000 + i}`;
      const status = i % 11 === 0 ? "Draft" : "Active";
      const image = palette[i % palette.length];

      await pool.query(
        `INSERT INTO products (id, name, price, mrp, category, category_label, image, images, sizes, description, in_stock, stock, badge, colors, sku, status, is_budget, is_popular)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
         ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, price = EXCLUDED.price, stock = EXCLUDED.stock, status = EXCLUDED.status, is_budget = EXCLUDED.is_budget, is_popular = EXCLUDED.is_popular`,
        [id, name, price, price * 1.5, categoryId, categoryLabel, image, [image], ["S", "M", "L"], "Lorem ipsum dolor sit amet.", stock > 0, stock, null, null, sku, status, price <= 5000, false]
      );
    }
    console.log("Products seeded.");

    // 3. Seed Users (with hashed passwords)
    for (const u of mockUsers) {
      const hashedPassword = await bcrypt.hash(u.password, 10);
      await pool.query(
        `INSERT INTO users (name, email, password_hash, role, status)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, role = EXCLUDED.role, status = EXCLUDED.status`,
        [u.name, u.email.toLowerCase(), hashedPassword, u.role, u.status]
      );
    }
    console.log("Users seeded.");

    // 4. Seed Orders
    for (const o of mockOrders) {
      await pool.query(
        `INSERT INTO orders (id, customer_name, customer_email, date, total, status, payment, items)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, payment = EXCLUDED.payment`,
        [o.id, o.customer, o.email, o.date, o.total, o.status, o.payment, o.items]
      );
    }
    console.log("Orders seeded.");

    // 5. Seed Resellers
    for (const r of mockResellers) {
      await pool.query(
        `INSERT INTO resellers (id, name, contact, region, sales, tier, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (id) DO UPDATE SET sales = EXCLUDED.sales, tier = EXCLUDED.tier, status = EXCLUDED.status`,
        [r.id, r.name, r.contact, r.region, r.sales, r.tier, r.status]
      );
    }
    console.log("Resellers seeded.");

    console.log("Data seeding completed successfully!");
    process.exit(0);
  } catch (err) {
    console.error("Error seeding database:", err);
    process.exit(1);
  }
}

seed();
