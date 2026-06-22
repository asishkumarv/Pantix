import kurta1 from "@/assets/product-kurta-1.jpg";
import saree1 from "@/assets/product-saree-1.jpg";
import party1 from "@/assets/product-party-1.jpg";
import anarkali1 from "@/assets/product-anarkali-1.jpg";
import lehenga1 from "@/assets/product-lehenga-1.jpg";
import casual1 from "@/assets/product-casual-1.jpg";
import saree2 from "@/assets/product-saree-2.jpg";
import cat2piece from "@/assets/cat-2piece.jpg";
import cat3piece from "@/assets/cat-3piece.jpg";
import catPlus from "@/assets/cat-plussize.jpg";
import catFrock from "@/assets/cat-frock.jpg";
import catBudget from "@/assets/cat-budget.jpg";

export type Category =
  | "two-piece"
  | "three-piece"
  | "three-piece-plus"
  | "plus-size"
  | "feeding"
  | "frocks"
  | "party"
  | "traditional"
  | "handlooms"
  | "casual"
  | "budget";

export type Product = {
  id: string;
  name: string;
  price: number;
  mrp: number;
  category: Category;
  categoryLabel: string;
  image: string;
  images: string[];
  sizes: string[];
  description: string;
  inStock: boolean;
  /** Optional unit count remaining. Used for "Only N left" UI. */
  stock?: number;
  badge?: string;
  colors?: {
    name: string;
    hex: string;
    image?: string;
  }[];
  isBudget?: boolean;
  isPopular?: boolean;
  commission_rate?: number;
};

export const categories: { id: Category; label: string; image: string }[] = [
  { id: "two-piece", label: "2 Piece Sets", image: cat2piece },
  { id: "three-piece", label: "3 Piece Kurta Sets (M–XXL)", image: cat3piece },
  { id: "three-piece-plus", label: "3 Piece Kurta Sets (3XL–6XL)", image: catPlus },
  { id: "feeding", label: "Feeding Outfits", image: casual1 },
  { id: "frocks", label: "Frocks", image: catFrock },
  { id: "party", label: "Party Wear", image: party1 },
  { id: "traditional", label: "Traditional Wear", image: lehenga1 },
  { id: "handlooms", label: "Handlooms", image: saree1 },
  { id: "budget", label: "Budget Friendly", image: catBudget },
];

export const products: Product[] = [
  {
    id: "emerald-zari-kurta",
    name: "Emerald Zari Kurta Set",
    price: 4499,
    mrp: 6999,
    category: "three-piece",
    categoryLabel: "3 Piece Kurta Sets",
    image: kurta1,
    images: [kurta1, casual1, anarkali1, party1],
    sizes: ["XS", "S", "M", "L", "XL"],
    description:
      "A regal emerald silk kurta with intricate gold zari embroidery on the yoke and hem. Tailored for the modern queen — pair with churidar or palazzo.",
    inStock: true,
    stock: 12,
    badge: "Bestseller",
    colors: [
      { name: "Emerald", hex: "#043927" },
      { name: "Ruby", hex: "#9b111e" },
      { name: "Midnight", hex: "#191970" },
    ],
  },
  {
    id: "scarlet-banarasi-saree",
    name: "Scarlet Banarasi Frock",
    price: 8999,
    mrp: 12999,
    category: "frocks",
    categoryLabel: "Frocks",
    image: saree1,
    images: [saree1, saree2, lehenga1, anarkali1],
    sizes: ["Free Size"],
    description:
      "Hand-woven Banarasi silk in deep scarlet, framed by a wide gold zari border. Includes blouse piece.",
    inStock: true,
    stock: 3,
    badge: "New",
    colors: [
      { name: "Scarlet", hex: "#ff2400" },
      { name: "Crimson", hex: "#dc143c" },
      { name: "Maroon", hex: "#800000" },
    ],
  },
  {
    id: "midnight-sequin-gown",
    name: "Midnight Sequin Gown",
    price: 11999,
    mrp: 15999,
    category: "party",
    categoryLabel: "Party Wear",
    image: party1,
    images: [party1, lehenga1, kurta1, anarkali1],
    sizes: ["S", "M", "L", "XL"],
    description:
      "A floor-sweeping mermaid gown crafted in black velvet, hand-embellished with copper sequins and beads.",
    inStock: true,
    stock: 7,
    badge: "Premium",
    colors: [
      { name: "Midnight", hex: "#191970" },
      { name: "Charcoal", hex: "#36454f" },
      { name: "Onyx", hex: "#353839" },
    ],
  },
  {
    id: "rose-anarkali",
    name: "Rose Petal Anarkali",
    price: 6499,
    mrp: 8999,
    category: "traditional",
    categoryLabel: "Traditional",
    image: anarkali1,
    images: [anarkali1, lehenga1, saree2, kurta1],
    sizes: ["XS", "S", "M", "L"],
    description:
      "Soft pink anarkali with delicate gold motifs, paired with a sheer dupatta. Effortlessly graceful.",
    inStock: true,
    stock: 15,
    colors: [
      { name: "Rose", hex: "#ff007f" },
      { name: "Peach", hex: "#ffcba4" },
      { name: "Blush", hex: "#de5d83" },
    ],
  },
  {
    id: "ivory-gold-lehenga",
    name: "Ivory & Gold Lehenga",
    price: 18999,
    mrp: 24999,
    category: "traditional",
    categoryLabel: "Traditional",
    image: lehenga1,
    images: [lehenga1, anarkali1, saree2, party1],
    sizes: ["S", "M", "L", "XL"],
    description:
      "Bridal-ready ivory lehenga with all-over gold damask embroidery. A statement of timeless royalty.",
    inStock: true,
    stock: 2,
    badge: "Bridal",
    colors: [
      { name: "Ivory", hex: "#fffff0" },
      { name: "Gold", hex: "#ffd700" },
      { name: "Cream", hex: "#fffdd0" },
    ],
  },
  {
    id: "jade-cotton-kurti",
    name: "Jade Everyday Kurti",
    price: 1499,
    mrp: 2299,
    category: "budget",
    categoryLabel: "Budget Friendly",
    image: casual1,
    images: [casual1, kurta1, anarkali1, saree1],
    sizes: ["XS", "S", "M", "L", "XL", "XXL"],
    description:
      "Breathable cotton kurti in jade green with subtle embroidered motifs. Daily comfort, queenly grace.",
    inStock: true,
    stock: 24,
    badge: "Budget",
    colors: [
      { name: "Jade", hex: "#00a86b" },
      { name: "Teal", hex: "#008080" },
      { name: "Mint", hex: "#3eb489" },
    ],
  },
  {
    id: "royal-blue-saree",
    name: "Royal Blue 2-Piece Set",
    price: 7499,
    mrp: 10499,
    category: "two-piece",
    categoryLabel: "2 Piece Sets",
    image: saree2,
    images: [saree2, saree1, lehenga1, kurta1],
    sizes: ["Free Size"],
    description:
      "Lustrous royal blue silk saree with antique-gold zari pallu. A regal pick for weddings & soirées.",
    inStock: true,
    stock: 9,
    colors: [
      { name: "Royal Blue", hex: "#4169e1" },
      { name: "Indigo", hex: "#4b0082" },
      { name: "Azure", hex: "#007fff" },
    ],
  },
  {
    id: "emerald-festive-kurta",
    name: "Festive Emerald Kurta",
    price: 3299,
    mrp: 4799,
    category: "two-piece",
    categoryLabel: "2 Piece Sets",
    image: kurta1,
    images: [kurta1, casual1, anarkali1, party1],
    sizes: ["S", "M", "L", "XL"],
    description:
      "Festive-ready emerald kurta with golden thread work — your go-to for celebrations.",
    inStock: false,
    stock: 0,
    colors: [
      { name: "Emerald", hex: "#50c878" },
      { name: "Forest", hex: "#228b22" },
      { name: "Olive", hex: "#808000" },
    ],
  },
  {
    id: "emerald-flow-frock",
    name: "Emerald Flow Frock",
    price: 2999,
    mrp: 4499,
    category: "frocks",
    categoryLabel: "Frocks",
    image: anarkali1,
    images: [anarkali1, lehenga1, kurta1, saree1],
    sizes: ["XS", "S", "M", "L", "XL"],
    description:
      "Flowing A-line frock in emerald satin with a gold waist tie. Effortless royalty.",
    inStock: true,
    stock: 18,
    colors: [
      { name: "Emerald", hex: "#50c878" },
      { name: "Seafoam", hex: "#93e9be" },
      { name: "Lime", hex: "#32cd32" },
    ],
  },
  {
    id: "queen-plus-kurta",
    name: "Queen Plus Embroidered Kurta",
    price: 3999,
    mrp: 5999,
    category: "plus-size",
    categoryLabel: "Plus Size (3XL–6XL)",
    image: anarkali1,
    images: [anarkali1, kurta1, casual1, lehenga1],
    sizes: ["3XL", "4XL", "5XL", "6XL"],
    description:
      "Designed for every queen — flowing teal kurta with antique gold neckline. Sizes 3XL to 6XL.",
    inStock: true,
    stock: 11,
    badge: "Plus Size",
    colors: [
      { name: "Teal", hex: "#008080" },
      { name: "Plum", hex: "#8e4585" },
      { name: "Navy", hex: "#000080" },
    ],
  },
  {
    id: "casual-jade-coord",
    name: "Jade Casual Co-ord",
    price: 1999,
    mrp: 2999,
    category: "casual",
    categoryLabel: "Casual Wear",
    image: casual1,
    images: [casual1, kurta1, anarkali1, saree2],
    sizes: ["XS", "S", "M", "L", "XL"],
    description: "Easy-breezy jade co-ord set for everyday elegance.",
    inStock: true,
    stock: 30,
    colors: [
      { name: "Jade", hex: "#00a86b" },
      { name: "Khaki", hex: "#c3b091" },
      { name: "Stone", hex: "#87794e" },
    ],
  },
];

export const getProduct = (id: string) => products.find((p) => p.id === id);
export const getByCategory = (cat: Category) =>
  products.filter((p) => p.category === cat);

// Map known source filenames (as stored in backend) to the imported asset paths.
export const imageByName: Record<string, string> = {
  "cat-2piece.jpg": cat2piece,
  "cat-3piece.jpg": cat3piece,
  "cat-plussize.jpg": catPlus,
  "cat-frock.jpg": catFrock,
  "cat-budget.jpg": catBudget,
  "casual-1.jpg": casual1,
  "party-1.jpg": party1,
  "lehenga-1.jpg": lehenga1,
  "saree-1.jpg": saree1,
  "product-kurta-1.jpg": kurta1,
  "product-saree-1.jpg": saree1,
  "product-saree-2.jpg": saree2,
  "product-party-1.jpg": party1,
  "product-anarkali-1.jpg": anarkali1,
  "product-lehenga-1.jpg": lehenga1,
  "product-casual-1.jpg": casual1,
};
