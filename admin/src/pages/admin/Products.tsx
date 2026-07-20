import { API_URL } from "@/api";
import { Link, useNavigate } from "react-router-dom";
import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import PageHeader from "@/components/admin/PageHeader";
import StatusBadge from "@/components/admin/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Product } from "@/data/mock";
import { Plus, Search, Package, LayoutGrid, List, Loader2, Edit2, Trash2 } from "lucide-react";
import { apiFetch } from "@/lib/apiFetch";
import { ConfirmationModal } from "@/components/ui/ConfirmationModal";

// Helper to map DB image paths to the actual images we have in public/images
const getValidImage = (img: string) => {
  if (!img) return "";
  if (img.startsWith("#")) return img; // Keep colors
  if (img.startsWith("http")) return img;
  if (img.startsWith("/uploads/")) return `${API_URL}${img}`;
  if (img.startsWith("uploads/")) return `${API_URL}/${img}`;
  if (img.startsWith("/images/")) return img;
  if (img.startsWith("/")) return img;
  
  if (img.includes("frock")) return "/images/cat-frock.jpg";
  if (img.includes("plus-size")) return "/images/cat-plussize.jpg";
  if (img.includes("2piece")) return "/images/cat-2piece.jpg";
  if (img.includes("saree")) return "/images/product-saree-1.jpg";
  if (img.includes("lehenga")) return "/images/product-lehenga-1.jpg";
  if (img.includes("kurta")) return "/images/product-kurta-1.jpg";
  if (img.includes("party")) return "/images/product-party-1.jpg";
  if (img.includes("anarkali")) return "/images/product-anarkali-1.jpg";
  if (img.includes("casual")) return "/images/product-casual-1.jpg";
  
  return "/images/cat-budget.jpg"; // Default fallback image
};

export default function Products({ collection }: { collection?: "budget" | "popular" }) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [view, setView] = useState<"grid" | "list">("grid");

  // Custom confirmation modal state
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteProductId, setDeleteProductId] = useState<string | null>(null);
  const [deleteProductName, setDeleteProductName] = useState("");

  const { data: products = [], isLoading, error } = useQuery<Product[]>({
    queryKey: ["products"],
    queryFn: async () => {
      const res = await apiFetch(`${API_URL}/api/products`);
      if (!res.ok) throw new Error("Failed to fetch products");
      return res.json();
    },
  });

  const { data: categories = [] } = useQuery<any[]>({
    queryKey: ["categories"],
    queryFn: async () => {
      const res = await apiFetch(`${API_URL}/api/categories`);
      if (!res.ok) return [];
      return res.json();
    },
  });

  const getCategoryName = (catId: string) => {
    if (!catId) return "";
    const cat = categories.find((c: any) => c.id === catId || c.slug === catId);
    return cat ? cat.name : catId;
  };

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiFetch(`${API_URL}/api/products/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete product");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    }
  });

  const handleDelete = (id: string, name: string) => {
    setDeleteProductId(id);
    setDeleteProductName(name);
    setConfirmOpen(true);
  };

  const handleConfirmDelete = () => {
    if (deleteProductId) {
      deleteMutation.mutate(deleteProductId);
      setConfirmOpen(false);
    }
  };

  const filtered = useMemo(() => {
    let list = products;
    if (collection === "budget") {
      list = list.filter((p) => p.is_budget === true || p.is_budget === "true");
    } else if (collection === "popular") {
      list = list.filter((p) => p.is_popular === true || p.is_popular === "true");
    }
    return list.filter((p) => `${p.name} ${p.sku} ${p.category}`.toLowerCase().includes(q.toLowerCase()));
  }, [q, products, collection]);

  const pageTitle = collection === "budget" ? "Budget Collection" : collection === "popular" ? "Popular Collection" : "Products";
  const pageSubtitle = `${filtered.length} products in ${collection ? collection + " collection" : "catalogue"}`;

  return (
    <div className="space-y-6">
      <PageHeader
        title={pageTitle}
        subtitle={pageSubtitle}
        actions={
          <Link to="/products/new">
            <Button size="sm" className="bg-primary-gradient text-white shadow-glow">
              <Plus className="w-4 h-4" /> Add product
            </Button>
          </Link>
        }
      />

      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name, SKU, category…" className="pl-9 h-10 bg-card" />
        </div>
        <div className="flex bg-card rounded-lg border border-border p-1">
          <button onClick={() => setView("grid")} className={`p-2 rounded-md transition-smooth ${view === "grid" ? "bg-muted" : ""}`}>
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button onClick={() => setView("list")} className={`p-2 rounded-md transition-smooth ${view === "list" ? "bg-muted" : ""}`}>
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      ) : error ? (
        <div className="text-center py-12 text-destructive">Failed to load products</div>
      ) : view === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((p) => {
            const validImg = getValidImage(p.image);
            const isColor = validImg?.startsWith("#");
            const bgColor = isColor ? validImg : "#4F46E5";
            
            return (
            <div key={p.id} className="card-lift bg-card rounded-2xl border border-border/50 shadow-card overflow-hidden group relative">
              <div className="aspect-[4/3] grid place-items-center relative" style={{ background: `linear-gradient(135deg, ${bgColor}22, ${bgColor}11)` }}>
                {validImg && !isColor ? (
                  <img 
                    src={validImg} 
                    alt={p.name} 
                    className="absolute inset-0 w-full h-full object-cover" 
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                      (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                    }}
                  />
                ) : null}
                <div className={`w-16 h-16 rounded-2xl grid place-items-center ${validImg && !isColor ? 'hidden' : ''}`} style={{ background: bgColor }}>
                  <Package className="w-8 h-8 text-white" />
                </div>
                {/* Hover Overlay for Edit/Delete */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button onClick={() => navigate(`/products/edit/${p.id}`)} className="p-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-full transition-colors">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(p.id, p.name)} className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold truncate">{p.name}</p>
                    <p className="text-xs text-muted-foreground">{getCategoryName(p.category)} · {p.sku}</p>
                  </div>
                  <StatusBadge status={p.status} />
                </div>
                <div className="mt-3 flex items-end justify-between">
                  <p className="text-lg font-bold">₹{p.price}</p>
                  <p className="text-xs text-muted-foreground">{p.stock} in stock</p>
                </div>
              </div>
            </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-card rounded-2xl shadow-card border border-border/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-muted-foreground text-xs uppercase tracking-wider">
                <tr>
                  <th className="text-left font-medium py-3 px-5">Product</th>
                  <th className="text-left font-medium py-3 px-5">Category</th>
                  <th className="text-left font-medium py-3 px-5">SKU</th>
                  <th className="text-left font-medium py-3 px-5">Price</th>
                  <th className="text-left font-medium py-3 px-5">Stock</th>
                  <th className="text-left font-medium py-3 px-5">Status</th>
                  <th className="text-right font-medium py-3 px-5">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => {
                  const validImg = getValidImage(p.image);
                  const isColor = validImg?.startsWith("#");
                  const bgColor = isColor ? validImg : "#4F46E5";

                  return (
                  <tr key={p.id} className="border-t border-border hover:bg-muted/30 transition-smooth">
                    <td className="py-3 px-5">
                      <div className="flex items-center gap-3">
                        <div className="relative w-9 h-9 rounded-lg overflow-hidden flex-shrink-0 grid place-items-center" style={{ background: bgColor }}>
                          {validImg && !isColor ? (
                            <>
                              <img 
                                src={validImg} 
                                alt={p.name} 
                                className="absolute inset-0 w-full h-full object-cover" 
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = 'none';
                                  (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                                }}
                              />
                              <Package className="w-4 h-4 text-white hidden" />
                            </>
                          ) : (
                            <Package className="w-4 h-4 text-white" />
                          )}
                        </div>
                        <span className="font-medium">{p.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-5 text-muted-foreground">{getCategoryName(p.category)}</td>
                    <td className="py-3 px-5 text-muted-foreground font-mono text-xs">{p.sku}</td>
                    <td className="py-3 px-5 font-semibold">₹{p.price}</td>
                    <td className="py-3 px-5">{p.stock}</td>
                    <td className="py-3 px-5"><StatusBadge status={p.status} /></td>
                    <td className="py-3 px-5 text-right flex justify-end gap-2">
                      <Button size="icon" variant="ghost" onClick={() => navigate(`/products/edit/${p.id}`)} className="h-8 w-8 text-muted-foreground hover:text-foreground">
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => handleDelete(p.id, p.name)} className="h-8 w-8 text-destructive hover:text-destructive/80">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <ConfirmationModal
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Delete Product"
        description={`Are you sure you want to delete product "${deleteProductName}"? This action cannot be undone.`}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
