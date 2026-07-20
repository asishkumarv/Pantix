import { API_URL } from "@/api";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import PageHeader from "@/components/admin/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Tag, Loader2, Pencil, Trash2, X, Upload } from "lucide-react";
import { toast } from "sonner";
import { TOKEN_KEY, apiFetch } from "@/lib/apiFetch";
import { ConfirmationModal } from "@/components/ui/ConfirmationModal";

type Category = {
  id: string;
  name: string;
  slug: string;
  image: string | null;
};

const accentColors = ["#4F46E5", "#10B981", "#F59E0B", "#EC4899", "#06B6D4", "#8B5CF6", "#F97316", "#14B8A6"];
const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, "") ||
  `${API_URL}`;

const getValidImage = (img: string) => {
  if (!img) return "";
  if (img.startsWith("http")) return img;
  if (img.startsWith("/uploads/")) return `${API_BASE_URL}${img}`;
  if (img.startsWith("uploads/")) return `${API_BASE_URL}/${img}`;
  if (img.startsWith("/images/")) return img;
  if (img.startsWith("/")) return img;

  const map: Record<string, string> = {
    "cat-2piece.jpg": "/images/cat-2piece.jpg",
    "cat-3piece.jpg": "/images/cat-3piece.jpg",
    "cat-plussize.jpg": "/images/cat-plussize.jpg",
    "cat-frock.jpg": "/images/cat-frock.jpg",
    "cat-budget.jpg": "/images/cat-budget.jpg",
    "casual-1.jpg": "/images/product-casual-1.jpg",
    "party-1.jpg": "/images/product-party-1.jpg",
    "lehenga-1.jpg": "/images/product-lehenga-1.jpg",
    "saree-1.jpg": "/images/product-saree-1.jpg",
  };
  return map[img] || `/images/${img.replace(/^\/+/, "")}`;
};

const normalizeSlug = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

export default function Categories() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [imagePath, setImagePath] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);

  // Custom confirmation modal state
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteCategoryId, setDeleteCategoryId] = useState<string | null>(null);
  const [deleteCategoryName, setDeleteCategoryName] = useState("");

  const triggerDelete = (id: string, name: string) => {
    setDeleteCategoryId(id);
    setDeleteCategoryName(name);
    setConfirmOpen(true);
  };

  const handleConfirmDelete = () => {
    if (deleteCategoryId) {
      deleteMutation.mutate(deleteCategoryId);
      setConfirmOpen(false);
    }
  };

  const { data: categories = [], isLoading, error } = useQuery<Category[]>({
    queryKey: ["categories"],
    queryFn: async () => {
      const res = await apiFetch(`${API_URL}/api/categories`);
      if (!res.ok) throw new Error("Failed to fetch categories");
      return res.json();
    },
  });

  const { data: products = [] } = useQuery({
    queryKey: ["admin-products"],
    queryFn: async () => {
      const res = await apiFetch(`${API_URL}/api/products`);
      if (!res.ok) return [];
      return res.json();
    },
  });

  const uploadImage = async () => {
    if (!imageFile) return imagePath.trim();

    const formData = new FormData();
    formData.append("image", imageFile);
    const token = localStorage.getItem(TOKEN_KEY);

    const res = await fetch(`${API_URL}/api/uploads/category-image`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Failed to upload image");
    }

    const uploaded = await res.json();
    return uploaded.path as string;
  };

  const createMutation = useMutation({
    mutationFn: async (payload: Category) => {
      const res = await apiFetch(`${API_URL}/api/categories`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to create category");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast.success("Category created");
      closeModal();
    },
    onError: (err: any) => {
      toast.error("Failed to create category", { description: err.message });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (payload: { id: string; data: Partial<Category> }) => {
      const res = await apiFetch(`${API_URL}/api/categories/${payload.id}`, {
        method: "PUT",
        body: JSON.stringify(payload.data),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to update category");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast.success("Category updated");
      closeModal();
    },
    onError: (err: any) => {
      toast.error("Failed to update category", { description: err.message });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiFetch(`${API_URL}/api/categories/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to delete category");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast.success("Category deleted");
    },
    onError: (err: any) => {
      toast.error("Failed to delete category", { description: err.message });
    },
  });

  const resetForm = () => {
    setName("");
    setSlug("");
    setImagePath("");
    setImageFile(null);
    setEditingId(null);
  };

  const openCreate = () => {
    resetForm();
    setShowModal(true);
  };

  const openEdit = (category: Category) => {
    setEditingId(category.id);
    setName(category.name);
    setSlug(category.slug);
    setImagePath(category.image || "");
    setImageFile(null);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    resetForm();
  };

  const submitCategory = async (e: React.FormEvent) => {
    e.preventDefault();

    const finalSlug = normalizeSlug(slug || name);
    if (!name.trim() || !finalSlug) {
      toast.error("Name and slug are required");
      return;
    }

    try {
      const image = await uploadImage();

      if (editingId) {
        updateMutation.mutate({
          id: editingId,
          data: {
            name: name.trim(),
            slug: finalSlug,
            image: image || null,
          },
        });
        return;
      }

      createMutation.mutate({
        id: `C-${Date.now()}`,
        name: name.trim(),
        slug: finalSlug,
        image: image || null,
      });
    } catch (err: any) {
      toast.error("Image upload failed", { description: err.message });
    }
  };

  const productCountByCategory = (category: Category) =>
    (products as any[]).filter((p: any) => p.category === category.id || p.category === category.slug).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Categories"
        subtitle={`${categories.length} categories organising your catalogue`}
        actions={<Button size="sm" className="bg-primary-gradient text-white shadow-glow" onClick={openCreate}><Plus className="w-4 h-4" /> New category</Button>}
      />

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      ) : error ? (
        <div className="text-center py-12 text-destructive">Failed to load categories</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((c, i) => {
            const accent = accentColors[i % accentColors.length];
            const imgSrc = getValidImage(c.image || "");
            const count = productCountByCategory(c);

            return (
              <div key={c.id} className="card-lift bg-card rounded-2xl border border-border/50 shadow-card overflow-hidden group">
                <div
                  className="h-28 relative flex items-center justify-center overflow-hidden"
                  style={{ background: `linear-gradient(135deg, ${accent}33, ${accent}11)` }}
                >
                  {imgSrc ? (
                    <img
                      src={imgSrc}
                      alt={c.name}
                      className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  ) : null}
                  <div className="relative z-10 w-11 h-11 rounded-xl grid place-items-center" style={{ background: `${accent}33`, backdropFilter: "blur(4px)" }}>
                    <Tag className="w-5 h-5" style={{ color: accent }} />
                  </div>
                </div>

                <div className="p-5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-base font-semibold">{c.name}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">/{c.slug}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(c)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => triggerDelete(c.id, c.name)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">{count} product{count !== 1 ? "s" : ""}</span>
                    <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => openEdit(c)}>Manage</Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeModal} />
          <div className="relative z-10 w-full max-w-md bg-card rounded-2xl border border-border/50 shadow-2xl p-6 space-y-5 animate-fade-in">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">{editingId ? "Edit category" : "Add category"}</h2>
              <button onClick={closeModal} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={submitCategory} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="catName">Category name *</Label>
                <Input
                  id="catName"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (!editingId) {
                      setSlug(normalizeSlug(e.target.value));
                    }
                  }}
                  placeholder="Casual Wear"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="catSlug">Slug *</Label>
                <Input
                  id="catSlug"
                  value={slug}
                  onChange={(e) => setSlug(normalizeSlug(e.target.value))}
                  placeholder="casual"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="catImagePath">Image path or URL</Label>
                <Input
                  id="catImagePath"
                  value={imagePath}
                  onChange={(e) => setImagePath(e.target.value)}
                  placeholder="/images/cat-casual.jpg"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="catImageFile">Or upload from computer</Label>
                <Input
                  id="catImageFile"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                />
                <p className="text-xs text-muted-foreground">If both are provided, uploaded file is used.</p>
              </div>

              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" className="flex-1" onClick={closeModal}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-primary-gradient text-white shadow-glow"
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {createMutation.isPending || updateMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      {imageFile ? <Upload className="w-4 h-4" /> : <Plus className="w-4 h-4" />} {editingId ? "Save changes" : "Create category"}
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmationModal
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Delete Category"
        description={`Are you sure you want to delete category "${deleteCategoryName}"? This action cannot be undone.`}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
