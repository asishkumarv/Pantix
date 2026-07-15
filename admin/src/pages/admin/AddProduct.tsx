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
    sizes: { size: string; stock: number }[];
    images: { id: string; url: string; file: File | null }[];
  }
  const [colors, setColors] = useState<ColorItem[]>([{ name: "", hex: "#000000", sizes: [], images: [] }]);

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
      if (product.colors) {
        try {
          const parsed = typeof product.colors === "string" ? JSON.parse(product.colors) : product.colors;
          if (Array.isArray(parsed)) {
             setColors(parsed.map((c: any) => {
               const sizes = Array.isArray(c.sizes) ? c.sizes.map((s: any) => ({ size: s.size, stock: Number(s.stock) })) : [];
               
               let images: { id: string; url: string; file: File | null }[] = [];
               if (Array.isArray(c.images)) {
                 images = c.images.map((img: string) => ({
                   id: Math.random().toString(),
                   url: img,
                   file: null,
                 }));
               } else if (c.image) {
                 images = [{
                   id: Math.random().toString(),
                   url: c.image,
                   file: null,
                 }];
               }

               return {
                 name: c.name,
                 hex: c.hex,
                 sizes,
                 images
               };
             }));
          }
        } catch {
          // ignore parse errors
        }
      }
    }
  }, [product]);

  useEffect(() => {
    if (product && categories.length > 0) {
      const matchedCat = (categories as any[]).find((c: any) => c.id === product.category || c.slug === product.category);
      if (matchedCat) {
        setCategory(matchedCat.id);
      }
    }
  }, [product, categories]);

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
      // 1. Upload files for each color in parallel
      toast.info("Uploading color specific images...");
      const finalColors = await Promise.all(
        colors.filter((c) => c.name.trim()).map(async (c) => {
          const resolvedImages = await Promise.all(
            (c.images || []).map(async (imgItem) => {
              if (imgItem.file) {
                return await uploadSingleImage(imgItem.file);
              }
              return imgItem.url.trim();
            })
          );
          const validColorImages = resolvedImages.filter(Boolean);
          const validColorSizes = (c.sizes || [])
            .map((s: any) => ({ size: s.size, stock: Number(s.stock) }));
            
          return {
            name: c.name,
            hex: c.hex,
            images: validColorImages,
            image: validColorImages[0] || "",
            sizes: validColorSizes,
          };
        })
      );

      // 2. Upload product-level fallback images if no colors
      let finalImageUrl = imageUrl;
      if (imageFile) {
        toast.info("Uploading primary fallback image...");
        finalImageUrl = await uploadImage();
      }
      let uploadedExtras: string[] = [];
      if (extraImages.length) {
        toast.info("Uploading additional fallback images...");
        uploadedExtras = await Promise.all(
          extraImages.map(async (item) => {
            if (item.file) {
              return await uploadSingleImage(item.file);
            }
            return item.url.trim();
          })
        );
      }
      const fallbackImages = [finalImageUrl, ...uploadedExtras].filter(Boolean);

      // 3. Determine overall product images
      let productCoverImage = finalImageUrl;
      let productImages = fallbackImages;
      
      if (finalColors.length > 0) {
        // Set first image of first color as the primary product cover
        const firstColorCover = finalColors.find((c) => c.images && c.images.length > 0);
        if (firstColorCover) {
          productCoverImage = firstColorCover.images[0];
        }
        
        // Merged list of all colors' images
        const allColorImagesSet = new Set<string>();
        finalColors.forEach((c) => {
          c.images.forEach((img) => allColorImagesSet.add(img));
        });
        productImages = Array.from(allColorImagesSet);
      }

      // 4. Calculate total stock
      let totalStock = 0;
      if (finalColors.length > 0) {
        finalColors.forEach((c) => {
          c.sizes.forEach((s) => {
            totalStock += s.stock;
          });
        });
      } else {
        totalStock = Number(stock);
      }

      // 5. Calculate overall sizes (union of all sizes checked under colors)
      let finalSizes = selectedSizes;
      if (finalColors.length > 0) {
        const allSizesSet = new Set<string>();
        finalColors.forEach((c) => {
          c.sizes.forEach((s) => allSizesSet.add(s.size));
        });
        finalSizes = Array.from(allSizesSet);
      }

      const catObj = (categories as any[]).find((c: any) => c.id === category);
      saveMutation.mutate({
        id: isEdit ? id : `P-${Date.now()}`,
        name,
        description: desc,
        sku,
        price: Number(price),
        mrp: Number(mrp),
        stock: totalStock,
        in_stock: totalStock > 0,
        status: active ? "Active" : "Draft",
        category,
        category_label: categoryLabel || catObj?.name || "",
        image: productCoverImage,
        images: productImages,
        sizes: finalSizes,
        badge: badge || null,
        colors: finalColors.length ? finalColors : null,
        is_budget: isBudget,
        is_popular: isPopular,
        commission_rate: Number(commissionRate),
      });
    } catch (err: any) {
      toast.error("Upload failed", { description: err.message });
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

          {/* Images fallback for simple products */}
          {colors.length === 0 && (
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
                  className="bg-card hover:bg-muted"
                >
                  <Plus className="w-4 h-4 mr-1" /> Add image
                </Button>
              </div>
            </section>
          )}

          {/* Sizes fallback for simple products */}
          {colors.length === 0 && (
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
          )}

          {/* Colors */}
          <section className="bg-card rounded-2xl shadow-card border border-border/50 p-5 lg:p-6 space-y-4">
            <h3 className="font-semibold">Color variants</h3>
            {colors.map((c, i) => (
              <div key={i} className="p-5 border border-border/60 rounded-2xl bg-background/25 space-y-5 shadow-sm">
                <div className="flex gap-3 items-center flex-wrap sm:flex-nowrap">
                  <input
                    type="color"
                    value={c.hex}
                    onChange={(e) => {
                      const updated = [...colors];
                      updated[i] = { ...updated[i], hex: e.target.value };
                      setColors(updated);
                    }}
                    className="w-12 h-12 rounded-lg border border-border cursor-pointer shrink-0"
                  />
                  <Input
                    value={c.name}
                    onChange={(e) => {
                      const updated = [...colors];
                      updated[i] = { ...updated[i], name: e.target.value };
                      setColors(updated);
                    }}
                    placeholder="Color name (e.g. White)"
                    className="flex-1 min-w-[150px] h-11"
                  />
                  <Button
                    type="button" variant="ghost" size="icon"
                    onClick={() => {
                      const updatedColors = colors.filter((_, idx) => idx !== i);
                      setColors(updatedColors);
                      let totalStock = 0;
                      updatedColors.forEach(colorItem => {
                        if (Array.isArray(colorItem.sizes)) {
                          colorItem.sizes.forEach(sizeItem => {
                            totalStock += sizeItem.stock;
                          });
                        }
                      });
                      setStock(totalStock.toString());
                    }}
                    className="text-destructive hover:text-destructive/80 shrink-0 h-10 w-10"
                  >
                    <Trash2 className="w-5 h-5" />
                  </Button>
                </div>
                
                {/* 1. Size checklists & stocks for this color */}
                <div className="pl-6 border-l-2 border-primary/20 space-y-3">
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Select sizes & stock limits for this color</p>
                  <div className="flex flex-wrap gap-3">
                    {ALL_SIZES.map((sz) => {
                      const currentSizeObj = Array.isArray(c.sizes) ? c.sizes.find(s => s.size === sz) : null;
                      const isSelected = !!currentSizeObj;
                      const currentStock = currentSizeObj ? currentSizeObj.stock : 0;
                      return (
                        <div key={sz} className="flex flex-col items-center gap-1.5 p-2.5 border border-border/40 rounded-xl bg-card/60 w-[76px] shadow-sm">
                          <button
                            type="button"
                            onClick={() => {
                              const updated = [...colors];
                              let existingSizes = Array.isArray(updated[i].sizes) ? [...(updated[i].sizes || [])] : [];
                              const idx = existingSizes.findIndex(s => s.size === sz);
                              if (idx !== -1) {
                                existingSizes = existingSizes.filter(s => s.size !== sz);
                              } else {
                                existingSizes.push({ size: sz, stock: 0 });
                              }
                              updated[i] = { ...updated[i], sizes: existingSizes };
                              setColors(updated);
                            }}
                            className={`w-full py-1.5 rounded-lg text-xs font-bold border transition-all ${
                              isSelected
                                ? "bg-primary text-primary-foreground border-primary shadow-sm"
                                : "bg-background border-border text-muted-foreground hover:border-primary/50"
                            }`}
                          >
                            {sz}
                          </button>
                          
                          {isSelected && (
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
                                }
                                updated[i] = { ...updated[i], sizes: existingSizes };

                                // Calculate the sum of all size stocks across all colors
                                let totalStock = 0;
                                updated.forEach(colorItem => {
                                  if (Array.isArray(colorItem.sizes)) {
                                    colorItem.sizes.forEach(sizeItem => {
                                      totalStock += sizeItem.stock;
                                    });
                                  }
                                });
                                setStock(totalStock.toString());
                                setColors(updated);
                              }}
                              className="w-full h-7 bg-background/50 border border-border/80 text-xs text-center font-bold text-primary rounded-md"
                              placeholder="Stock"
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Images for this color */}
                <div className="pl-6 border-l-2 border-primary/20 space-y-3 pt-2">
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Color Specific Images (Images shown when selected)</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {(c.images || []).map((imgItem, imgIdx) => {
                      const src = imgItem.file ? URL.createObjectURL(imgItem.file) : getPreviewImage(imgItem.url);
                      return (
                        <div key={imgItem.id} className="p-3.5 border border-border/40 rounded-2xl bg-card/40 flex flex-col gap-2 relative shadow-inner">
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] uppercase font-bold text-muted-foreground">Image #{imgIdx + 1}</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                const updated = [...colors];
                                updated[i].images = (updated[i].images || []).filter((_, idx) => idx !== imgIdx);
                                setColors(updated);
                              }}
                              className="text-destructive hover:text-destructive/80 h-7 w-7"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                          
                          <div className="space-y-1.5 text-xs">
                            <div>
                              <Label className="text-[9px] text-muted-foreground uppercase tracking-wider">Filename or URL</Label>
                              <Input
                                value={imgItem.url}
                                onChange={(e) => {
                                  const updated = [...colors];
                                  const list = [...(updated[i].images || [])];
                                  list[imgIdx] = { ...list[imgIdx], url: e.target.value };
                                  updated[i].images = list;
                                  setColors(updated);
                                }}
                                placeholder="product-white-1.jpg"
                                className="h-8 text-xs mt-1"
                              />
                            </div>
                            <div>
                              <Label className="text-[9px] text-muted-foreground uppercase tracking-wider">Or Upload File</Label>
                              <Input
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                  const file = e.target.files?.[0] || null;
                                  const updated = [...colors];
                                  const list = [...(updated[i].images || [])];
                                  list[imgIdx] = { ...list[imgIdx], file };
                                  updated[i].images = list;
                                  setColors(updated);
                                }}
                                className="h-8 text-xs py-1 mt-1"
                              />
                            </div>
                          </div>

                          <div className="flex items-center justify-center border border-border/30 rounded-xl bg-background/50 p-1 h-24 overflow-hidden mt-1 shadow-inner">
                            {src ? (
                              <img src={src} alt="Preview" className="max-w-full max-h-full object-contain rounded-lg" />
                            ) : (
                              <span className="text-[10px] text-muted-foreground/80">No image</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const updated = [...colors];
                      updated[i].images = [...(updated[i].images || []), { id: Math.random().toString(), url: "", file: null }];
                      setColors(updated);
                    }}
                    className="h-8 text-xs"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" /> Add Image
                  </Button>
                </div>
              </div>
            ))}
            <Button
              type="button" variant="outline" size="sm"
              onClick={() => setColors([...colors, { name: "", hex: "#000000", sizes: [], images: [] }])}
            >
              <Plus className="w-4 h-4" /> Add color variant
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
                <Input
                  id="stock"
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  type="number"
                  min="0"
                  placeholder="12"
                  required
                  disabled={colors.length > 0}
                  className={colors.length > 0 ? "bg-muted cursor-not-allowed font-semibold text-primary" : ""}
                />
                {colors.length > 0 && (
                  <p className="text-[10px] text-muted-foreground mt-1 font-medium text-amber-500">Calculated from size stock limits.</p>
                )}
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
