import { API_URL } from "@/api";
import { FormEvent, useEffect, useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import PageHeader from "@/components/admin/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Save, X, Loader2, Plus, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { TOKEN_KEY, apiFetch } from "@/lib/apiFetch";

const ALL_SIZES = ["XS", "S", "M", "L", "XL", "XXL", "3XL", "4XL", "5XL", "6XL", "Free Size"];

export default function AddProduct() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;
  const queryClient = useQueryClient();

  // Basic fields
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [sku, setSku] = useState("");
  const [price, setPrice] = useState("");
  const [mrp, setMrp] = useState("");
  const [stock, setStock] = useState("");
  const [active, setActive] = useState(true);
  const [isBudget, setIsBudget] = useState(false);
  const [isPopular, setIsPopular] = useState(false);
  const [category, setCategory] = useState("");
  const [categoryLabel, setCategoryLabel] = useState("");
  const [badge, setBadge] = useState("");

  // Image fields
  const [imageUrl, setImageUrl] = useState("");
  interface ExtraImageItem {
    id: string;
    url: string;
    file: File | null;
  }
  const [extraImages, setExtraImages] = useState<ExtraImageItem[]>([]);
  const [imageFile, setImageFile] = useState<File | null>(null);

  const API_BASE_URL = `${API_URL}`;
  
  const getPreviewImage = (img: string) => {
    if (!img) return "";
    if (img.startsWith("http")) return img;
    if (img.startsWith("/uploads/")) return `${API_BASE_URL}${img}`;
    if (img.startsWith("uploads/")) return `${API_BASE_URL}/${img}`;
    return `/images/${img}`;
  };

  const localPreviewUrl = useMemo(() => {
    if (imageFile) return URL.createObjectURL(imageFile);
    return "";
  }, [imageFile]);

  const previewSrc = localPreviewUrl || getPreviewImage(imageUrl);

  // Sizes
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);

  // Colors
  const [colors, setColors] = useState<{ name: string; hex: string }[]>([{ name: "", hex: "#000000" }]);

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const res = await apiFetch(`${API_URL}/api/categories`);
      if (!res.ok) throw new Error("Failed to fetch categories");
      return res.json();
    },
  });

  const { data: product, isLoading: isFetching } = useQuery({
    queryKey: ["product", id],
    queryFn: async () => {
      const res = await apiFetch(`${API_URL}/api/products/${id}`);
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    enabled: isEdit,
  });

  useEffect(() => {
    if (product) {
      setName(product.name || "");
      setDesc(product.description || "");
      setSku(product.sku || "");
      setPrice(product.price?.toString() || "");
      setMrp(product.mrp?.toString() || "");
      setStock(product.stock?.toString() || "");
      setActive(product.status === "Active");
      setIsBudget(product.is_budget === true || product.is_budget === "true");
      setIsPopular(product.is_popular === true || product.is_popular === "true");
      setCategory(product.category || "");
      setCategoryLabel(product.category_label || "");
      setImageUrl(product.image || "");
      setBadge(product.badge || "");
      if (product.images?.length) {
        const parsedImages = typeof product.images === "string" ? JSON.parse(product.images) : product.images;
        if (Array.isArray(parsedImages)) {
          setExtraImages(
            parsedImages.map((img: string) => ({
              id: Math.random().toString(),
              url: img,
              file: null,
            }))
          );
        }
      } else {
        setExtraImages([]);
      }
      if (product.sizes?.length) setSelectedSizes(product.sizes);
      if (product.colors) {
        try {
          const parsed = typeof product.colors === "string" ? JSON.parse(product.colors) : product.colors;
          if (Array.isArray(parsed)) setColors(parsed);
        } catch {
          // ignore parse errors
        }
      }
    }
  }, [product]);

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      const url = isEdit ? `${API_URL}/api/products/${id}` : `${API_URL}/api/products`;
      const method = isEdit ? "PUT" : "POST";
      const res = await apiFetch(url, {
        method,
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to save product");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success(isEdit ? "Product updated!" : "Product created!", {
        description: "Your product is now live in the catalogue.",
      });
      navigate("/products");
    },
    onError: (err: any) => {
      toast.error("Failed to save product", { description: err.message });
    },
  });

  const toggleSize = (size: string) => {
    setSelectedSizes((prev) =>
      prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]
    );
  };

  const uploadSingleImage = async (file: File) => {
    const formData = new FormData();
    formData.append("image", file);
    const token = localStorage.getItem(TOKEN_KEY);

    const res = await fetch(`${API_URL}/api/uploads/product-image`, {
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

  const uploadImage = async () => {
    if (!imageFile) return imageUrl.trim();
    return uploadSingleImage(imageFile);
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      let finalImageUrl = imageUrl;
      if (imageFile) {
        toast.info("Uploading primary image...");
        finalImageUrl = await uploadImage();
      }

      let uploadedExtras: string[] = [];
      if (extraImages.length) {
        toast.info("Uploading additional images...");
        uploadedExtras = await Promise.all(
          extraImages.map(async (item) => {
            if (item.file) {
              return await uploadSingleImage(item.file);
            }
            return item.url.trim();
          })
        );
      }

      const validColors = colors.filter((c) => c.name.trim());
      const validImages = [finalImageUrl, ...uploadedExtras].filter(Boolean);
      // Auto-set category label from selected category name
      const catObj = (categories as any[]).find((c: any) => c.id === category);
      saveMutation.mutate({
        id: isEdit ? id : `P-${Date.now()}`,
        name,
        description: desc,
        sku,
        price: Number(price),
        mrp: Number(mrp),
        stock: Number(stock),
        in_stock: Number(stock) > 0,
        status: active ? "Active" : "Draft",
        category,
        category_label: categoryLabel || catObj?.name || "",
        image: finalImageUrl,
        images: validImages,
        sizes: selectedSizes,
        badge: badge || null,
        colors: validColors.length ? validColors : null,
        is_budget: isBudget,
        is_popular: isPopular,
      });
    } catch (err: any) {
      toast.error("Image upload failed", { description: err.message });
    }
  };

  if (isEdit && isFetching) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6 animate-fade-in">
      <PageHeader
        title={isEdit ? "Edit product" : "Add new product"}
        subtitle="Fill in the details below to save the product to your catalogue."
        actions={
          <>
            <Button type="button" variant="outline" size="sm" onClick={() => navigate(-1)}>
              <X className="w-4 h-4" /> Cancel
            </Button>
            <Button type="submit" size="sm" disabled={saveMutation.isPending} className="bg-primary-gradient text-white shadow-glow">
              {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save product
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* ── Left column ── */}
        <div className="lg:col-span-2 space-y-5">

          {/* Basic info */}
          <section className="bg-card rounded-2xl shadow-card border border-border/50 p-5 lg:p-6 space-y-4">
            <h3 className="font-semibold">Basic information</h3>
            <div className="space-y-2">
              <Label htmlFor="name">Product name *</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Emerald Zari Kurta Set" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="desc">Description</Label>
              <Textarea id="desc" value={desc} onChange={(e) => setDesc(e.target.value)} rows={4} placeholder="Describe the product, materials, features…" />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sku">SKU *</Label>
                <Input id="sku" value={sku} onChange={(e) => setSku(e.target.value)} placeholder="SKU-EMERALD-ZARI" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="badge">Badge</Label>
                <Input id="badge" value={badge} onChange={(e) => setBadge(e.target.value)} placeholder="Bestseller / New / Bridal" />
              </div>
            </div>
          </section>

          {/* Images */}
          <section className="bg-card rounded-2xl shadow-card border border-border/50 p-5 lg:p-6 space-y-4">
            <h3 className="font-semibold">Images</h3>
            <div className="space-y-2">
              <Label htmlFor="imageUrl">Primary image filename</Label>
              <Input id="imageUrl" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="product-kurta-1.jpg" />
              <p className="text-xs text-muted-foreground">Use filenames from <code>/images/</code> folder (e.g. <code>product-kurta-1.jpg</code>) or a full URL.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="productImageFile">Or upload from computer</Label>
              <Input
                id="productImageFile"
                type="file"
                accept="image/*"
                onChange={(e) => setImageFile(e.target.files?.[0] || null)}
              />
              <p className="text-xs text-muted-foreground font-medium text-amber-500">If both are provided, uploaded file will be used.</p>
            </div>
            <div className="space-y-3">
              <Label>Additional images</Label>
              {extraImages.map((item, i) => (
                <div key={item.id} className="p-4 border border-border/50 rounded-xl bg-background/30 space-y-3 relative group">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-semibold text-muted-foreground">Additional Image #{i + 1}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setExtraImages(extraImages.filter((_, idx) => idx !== i))}
                      className="text-destructive hover:text-destructive/80 h-8 w-8"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-[1fr_120px] gap-3">
                    <div className="space-y-2">
                      <div>
                        <Label className="text-[10px] text-muted-foreground uppercase tracking-wider">Image filename or URL</Label>
                        <Input
                          value={item.url}
                          onChange={(e) => {
                            const updated = [...extraImages];
                            updated[i] = { ...updated[i], url: e.target.value };
                            setExtraImages(updated);
                          }}
                          placeholder="product-saree-1.jpg"
                          className="h-9 mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-[10px] text-muted-foreground uppercase tracking-wider">Or upload from computer</Label>
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0] || null;
                            const updated = [...extraImages];
                            updated[i] = { ...updated[i], file };
                            setExtraImages(updated);
                          }}
                          className="h-9 py-1 mt-1 text-xs"
                        />
                      </div>
                    </div>
                    
                    {/* Preview box */}
                    <div className="flex items-center justify-center border border-border/60 rounded-lg bg-card/60 p-1 w-full h-[88px] overflow-hidden shrink-0">
                      {item.file || item.url ? (
                        <img
                          src={item.file ? URL.createObjectURL(item.file) : getPreviewImage(item.url)}
                          alt={`Preview #${i + 1}`}
                          className="max-w-full max-h-full object-contain rounded"
                        />
                      ) : (
                        <span className="text-[10px] text-muted-foreground/80 text-center">No image</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setExtraImages([...extraImages, { id: Math.random().toString(), url: "", file: null }])}
                className="mt-2"
              >
                <Plus className="w-4 h-4 mr-1" /> Add image
              </Button>
            </div>
          </section>

          {/* Sizes */}
          <section className="bg-card rounded-2xl shadow-card border border-border/50 p-5 lg:p-6 space-y-4">
            <h3 className="font-semibold">Available sizes</h3>
            <div className="flex flex-wrap gap-2">
              {ALL_SIZES.map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => toggleSize(size)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                    selectedSizes.includes(size)
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-card border-border text-muted-foreground hover:border-primary/50"
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </section>

          {/* Colors */}
          <section className="bg-card rounded-2xl shadow-card border border-border/50 p-5 lg:p-6 space-y-4">
            <h3 className="font-semibold">Color variants</h3>
            {colors.map((c, i) => (
              <div key={i} className="flex gap-2 items-center">
                <input
                  type="color"
                  value={c.hex}
                  onChange={(e) => {
                    const updated = [...colors];
                    updated[i] = { ...updated[i], hex: e.target.value };
                    setColors(updated);
                  }}
                  className="w-10 h-10 rounded-lg border border-border cursor-pointer"
                />
                <Input
                  value={c.name}
                  onChange={(e) => {
                    const updated = [...colors];
                    updated[i] = { ...updated[i], name: e.target.value };
                    setColors(updated);
                  }}
                  placeholder="Color name (e.g. Emerald)"
                  className="flex-1"
                />
                <Button
                  type="button" variant="ghost" size="icon"
                  onClick={() => setColors(colors.filter((_, idx) => idx !== i))}
                  className="text-destructive hover:text-destructive/80"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
            <Button
              type="button" variant="outline" size="sm"
              onClick={() => setColors([...colors, { name: "", hex: "#000000" }])}
            >
              <Plus className="w-4 h-4" /> Add color
            </Button>
          </section>

          {/* Pricing */}
          <section className="bg-card rounded-2xl shadow-card border border-border/50 p-5 lg:p-6 space-y-4">
            <h3 className="font-semibold">Pricing & inventory</h3>
            <div className="grid sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Price (₹) *</Label>
                <Input id="price" value={price} onChange={(e) => setPrice(e.target.value)} type="number" min="0" placeholder="4499" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mrp">MRP (₹) *</Label>
                <Input id="mrp" value={mrp} onChange={(e) => setMrp(e.target.value)} type="number" min="0" placeholder="6999" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="stock">Stock qty *</Label>
                <Input id="stock" value={stock} onChange={(e) => setStock(e.target.value)} type="number" min="0" placeholder="12" required />
              </div>
            </div>
          </section>
        </div>

        {/* ── Right column ── */}
        <div className="space-y-5">
          <section className="bg-card rounded-2xl shadow-card border border-border/50 p-5 lg:p-6 space-y-4">
            <h3 className="font-semibold">Status</h3>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Active</p>
                <p className="text-xs text-muted-foreground">Visible in your store</p>
              </div>
              <Switch checked={active} onCheckedChange={setActive} />
            </div>
          </section>

          <section className="bg-card rounded-2xl shadow-card border border-border/50 p-5 lg:p-6 space-y-4">
            <h3 className="font-semibold">Collections</h3>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Budget Collection</p>
                <p className="text-xs text-muted-foreground">Include in budget friendly section</p>
              </div>
              <Switch checked={isBudget} onCheckedChange={setIsBudget} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Popular Collection</p>
                <p className="text-xs text-muted-foreground">Include in bestseller/popular section</p>
              </div>
              <Switch checked={isPopular} onCheckedChange={setIsPopular} />
            </div>
          </section>

          <section className="bg-card rounded-2xl shadow-card border border-border/50 p-5 lg:p-6 space-y-4">
            <h3 className="font-semibold">Organisation</h3>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={category} onValueChange={(val) => {
                setCategory(val);
                const catObj = (categories as any[]).find((c: any) => c.id === val);
                if (catObj) setCategoryLabel(catObj.name);
              }}>
                <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>
                  {(categories as any[]).map((c: any) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="catLabel">Category label (display name)</Label>
              <Input
                id="catLabel"
                value={categoryLabel}
                onChange={(e) => setCategoryLabel(e.target.value)}
                placeholder="3 Piece Kurta Sets"
              />
            </div>
          </section>

          {/* Image preview */}
          {previewSrc && (
            <section className="bg-card rounded-2xl shadow-card border border-border/50 p-5 lg:p-6 space-y-3">
              <h3 className="font-semibold">Image preview</h3>
              <div className="aspect-square rounded-xl overflow-hidden bg-muted">
                <img
                  src={previewSrc}
                  alt="Preview"
                  className="w-full h-full object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).src = ""; }}
                />
              </div>
            </section>
          )}
        </div>
      </div>
    </form>
  );
}
