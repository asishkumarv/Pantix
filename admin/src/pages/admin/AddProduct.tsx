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
  const [commissionRate, setCommissionRate] = useState("0");
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
  interface ColorItem {
    name: string;
    hex: string;
    imageIndex?: string;
    sizes?: { size: string; stock: number }[];
  }
  const [colors, setColors] = useState<ColorItem[]>([{ name: "", hex: "#000000", imageIndex: "-1", sizes: [] }]);

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
      setCommissionRate(product.commission_rate?.toString() || "0");
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
          const extras = parsedImages[0] === product.image 
            ? parsedImages.slice(1) 
            : parsedImages.filter((img: string) => img !== product.image);
            
          setExtraImages(
            extras.map((img: string) => ({
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
          if (Array.isArray(parsed)) {
             setColors(parsed.map((c: any) => {
               let imageIndex = "-1";
               if (c.image && product.images) {
                 let imagesArray = product.images;
                 if (typeof imagesArray === "string") {
                   try { imagesArray = JSON.parse(imagesArray); } catch {}
                 }
                 if (Array.isArray(imagesArray)) {
                   const idx = imagesArray.indexOf(c.image);
                   if (idx !== -1) imageIndex = idx.toString();
                 }
               }
               const sizes = Array.isArray(c.sizes) ? c.sizes.map((s: any) => ({ size: s.size, stock: Number(s.stock) })) : [];
               return { ...c, imageIndex, sizes };
             }));
          }
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

      const validImages = [finalImageUrl, ...uploadedExtras].filter(Boolean);
      let totalStock = 0;
      const validColors = colors.filter((c) => c.name.trim()).map((c) => {
        const cObj: any = { name: c.name, hex: c.hex };
        if (c.imageIndex !== "-1" && c.imageIndex !== undefined) {
          const idx = parseInt(c.imageIndex, 10);
          if (validImages[idx]) cObj.image = validImages[idx];
        }
        
        // Filter sizes list to only include sizes that are currently selected in selectedSizes
        const validColorSizes = (c.sizes || [])
          .filter((s: any) => selectedSizes.includes(s.size))
          .map((s: any) => ({ size: s.size, stock: Number(s.stock) }));
          
        cObj.sizes = validColorSizes;
        validColorSizes.forEach((s: any) => {
          totalStock += s.stock;
        });
        
        return cObj;
      });

      // Auto-set category label from selected category name
      const catObj = (categories as any[]).find((c: any) => c.id === category);
      saveMutation.mutate({
        id: isEdit ? id : `P-${Date.now()}`,
        name,
        description: desc,
        sku,
        price: Number(price),
        mrp: Number(mrp),
        stock: validColors.length ? totalStock : Number(stock),
        in_stock: (validColors.length ? totalStock : Number(stock)) > 0,
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
        commission_rate: Number(commissionRate),
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
              <div key={i} className="p-4 border border-border/60 rounded-xl bg-background/25 space-y-4 shadow-sm">
                <div className="flex gap-2 items-center flex-wrap sm:flex-nowrap">
                  <input
                    type="color"
                    value={c.hex}
                    onChange={(e) => {
                      const updated = [...colors];
                      updated[i] = { ...updated[i], hex: e.target.value };
                      setColors(updated);
                    }}
                    className="w-10 h-10 rounded-lg border border-border cursor-pointer shrink-0"
                  />
                  <Input
                    value={c.name}
                    onChange={(e) => {
                      const updated = [...colors];
                      updated[i] = { ...updated[i], name: e.target.value };
                      setColors(updated);
                    }}
                    placeholder="Color name (e.g. Emerald)"
                    className="flex-1 min-w-[120px]"
                  />
                  <Select
                    value={c.imageIndex}
                    onValueChange={(val) => {
                      const updated = [...colors];
                      updated[i] = { ...updated[i], imageIndex: val };
                      setColors(updated);
                    }}
                  >
                    <SelectTrigger className="w-full sm:w-[180px] shrink-0 h-10">
                      <SelectValue placeholder="Link image" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="-1">No image</SelectItem>
                      <SelectItem value="0">
                        <div className="flex items-center gap-2">
                          {previewSrc ? (
                            <img src={previewSrc} alt="Primary" className="w-5 h-5 object-cover rounded-sm border border-border" />
                          ) : (
                            <div className="w-5 h-5 bg-muted rounded-sm border border-border" />
                          )}
                          <span>Primary Image</span>
                        </div>
                      </SelectItem>
                      {extraImages.map((item, idx) => {
                        const src = item.file ? URL.createObjectURL(item.file) : getPreviewImage(item.url);
                        return (
                          <SelectItem key={idx} value={(idx + 1).toString()}>
                            <div className="flex items-center gap-2">
                              {src ? (
                                <img src={src} alt={`Extra ${idx + 1}`} className="w-5 h-5 object-cover rounded-sm border border-border" />
                              ) : (
                                <div className="w-5 h-5 bg-muted rounded-sm border border-border" />
                              )}
                              <span>Extra Image {idx + 1}</span>
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button" variant="ghost" size="icon"
                    onClick={() => setColors(colors.filter((_, idx) => idx !== i))}
                    className="text-destructive hover:text-destructive/80 shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                
                {/* Size stock settings for this color */}
                {selectedSizes.length > 0 && (
                  <div className="pl-12 space-y-2 border-l border-border/80 ml-5">
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Size Stock Limits</p>
                    <div className="flex flex-wrap gap-2.5">
                      {selectedSizes.map((sz) => {
                        const currentSizeObj = Array.isArray(c.sizes) ? c.sizes.find(s => s.size === sz) : null;
                        const currentStock = currentSizeObj ? currentSizeObj.stock : 0;
                        return (
                          <div key={sz} className="flex items-center gap-1.5 bg-background/60 border border-border/70 rounded-lg px-2.5 py-1">
                            <span className="text-xs font-bold text-foreground/80">{sz}:</span>
                            <input
                              type="number"
                              min="0"
                              value={currentStock}
                              onChange={(e) => {
                                const stockVal = parseInt(e.target.value, 10) || 0;
                                const updated = [...colors];
                                const existingSizes = Array.isArray(updated[i].sizes) ? [...(updated[i].sizes || [])] : [];
                                const idx = existingSizes.findIndex(s => s.size === sz);
                                if (idx !== -1) {
                                  existingSizes[idx] = { size: sz, stock: stockVal };
                                } else {
                                  existingSizes.push({ size: sz, stock: stockVal });
                                }
                                updated[i] = { ...updated[i], sizes: existingSizes };

                                // Calculate the sum of all size stocks across all colors
                                let totalStock = 0;
                                updated.forEach(colorItem => {
                                  if (Array.isArray(colorItem.sizes)) {
                                    colorItem.sizes.forEach(sizeItem => {
                                      if (selectedSizes.includes(sizeItem.size)) {
                                        totalStock += sizeItem.stock;
                                      }
                                    });
                                  }
                                });
                                setStock(totalStock.toString());
                                setColors(updated);
                              }}
                              className="w-12 h-6 bg-transparent border-0 text-xs focus:ring-0 p-0 text-center font-bold text-primary"
                              placeholder="0"
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ))}
            <Button
              type="button" variant="outline" size="sm"
              onClick={() => setColors([...colors, { name: "", hex: "#000000", imageIndex: "-1", sizes: [] }])}
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
              <div className="space-y-2">
                <Label htmlFor="commissionRate">Commission Rate (%)</Label>
                <Input id="commissionRate" value={commissionRate} onChange={(e) => setCommissionRate(e.target.value)} type="number" min="0" max="100" step="0.01" placeholder="10" />
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
