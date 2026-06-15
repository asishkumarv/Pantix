import { API_URL } from "@/api";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import PageHeader from "@/components/admin/PageHeader";
import StatusBadge from "@/components/admin/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Network, MapPin, TrendingUp, X, Loader2, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/apiFetch";
import { ConfirmationModal } from "@/components/ui/ConfirmationModal";

type Reseller = {
  id: string;
  name: string;
  contact: string | null;
  region: string | null;
  sales: number;
  tier: string;
  status: string;
};

type ModalMode = "create" | "edit";

export default function Resellers() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"resellers" | "requests" | "withdrawals">("resellers");
  
  // Custom confirmation modal state
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTitle, setConfirmTitle] = useState("");
  const [confirmDesc, setConfirmDesc] = useState("");
  const [confirmText, setConfirmText] = useState("");
  const [confirmAction, setConfirmAction] = useState<() => void>(() => () => {});
  const [confirmIsDestructive, setConfirmIsDestructive] = useState(false);

  const triggerConfirm = (
    title: string,
    description: string,
    action: () => void,
    isDestructive: boolean = false,
    text: string = "Confirm"
  ) => {
    setConfirmTitle(title);
    setConfirmDesc(description);
    setConfirmAction(() => action);
    setConfirmIsDestructive(isDestructive);
    setConfirmText(text);
    setConfirmOpen(true);
  };

  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>("create");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [rName, setRName] = useState("");
  const [rContact, setRContact] = useState("");
  const [rRegion, setRRegion] = useState("");
  const [rSales, setRSales] = useState("0");
  const [rTier, setRTier] = useState("Bronze");
  const [rStatus, setRStatus] = useState("Active");

  const { data: resellers = [], isLoading, error } = useQuery({
    queryKey: ["resellers"],
    queryFn: async () => {
      const res = await apiFetch(`${API_URL}/api/resellers`);
      if (!res.ok) throw new Error("Failed to fetch resellers");
      return res.json();
    },
  });

  const { data: withdrawals = [], isLoading: isLoadingW } = useQuery({
    queryKey: ["withdrawals"],
    queryFn: async () => {
      const res = await apiFetch(`${API_URL}/api/resellers/admin/withdrawals`);
      if (!res.ok) throw new Error("Failed to fetch withdrawals");
      return res.json();
    },
  });

  const approveMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiFetch(`${API_URL}/api/resellers/admin/withdrawals/${id}/status`, {
        method: "PUT",
        body: JSON.stringify({ status: "Approved" }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to approve withdrawal");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["withdrawals"] });
      queryClient.invalidateQueries({ queryKey: ["resellers"] });
      toast.success("Withdrawal request approved & paid! 💰");
    },
    onError: (err: any) => {
      toast.error("Failed to approve withdrawal", { description: err.message });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiFetch(`${API_URL}/api/resellers/admin/withdrawals/${id}/status`, {
        method: "PUT",
        body: JSON.stringify({ status: "Rejected" }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to reject withdrawal");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["withdrawals"] });
      queryClient.invalidateQueries({ queryKey: ["resellers"] });
      toast.success("Withdrawal request rejected & refunded! ↩️");
    },
    onError: (err: any) => {
      toast.error("Failed to reject withdrawal", { description: err.message });
    },
  });

  const resetForm = () => {
    setRName("");
    setRContact("");
    setRRegion("");
    setRSales("0");
    setRTier("Bronze");
    setRStatus("Active");
    setEditingId(null);
    setModalMode("create");
  };

  const openCreateModal = () => {
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (reseller: Reseller) => {
    setModalMode("edit");
    setEditingId(reseller.id);
    setRName(reseller.name);
    setRContact(reseller.contact ?? "");
    setRRegion(reseller.region ?? "");
    setRSales(String(Number(reseller.sales || 0)));
    setRTier(reseller.tier || "Bronze");
    setRStatus(reseller.status || "Active");
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    resetForm();
  };

  const createMutation = useMutation({
    mutationFn: async (data: Omit<Reseller, "id"> & { id: string }) => {
      const res = await apiFetch(`${API_URL}/api/resellers`, {
        method: "POST",
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to add reseller");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resellers"] });
      toast.success("Reseller added!", { description: `${rName} is now part of your network.` });
      closeModal();
    },
    onError: (err: any) => {
      toast.error("Failed to add reseller", { description: err.message });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: { id: string; payload: Partial<Reseller> }) => {
      const res = await apiFetch(`${API_URL}/api/resellers/${data.id}`, {
        method: "PUT",
        body: JSON.stringify(data.payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to update reseller");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resellers"] });
      toast.success("Reseller updated successfully");
      closeModal();
    },
    onError: (err: any) => {
      toast.error("Failed to update reseller", { description: err.message });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiFetch(`${API_URL}/api/resellers/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to delete reseller");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resellers"] });
      toast.success("Reseller deleted successfully");
    },
    onError: (err: any) => {
      toast.error("Failed to delete reseller", { description: err.message });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const sales = Number(rSales) || 0;

    if (modalMode === "edit" && editingId) {
      updateMutation.mutate({
        id: editingId,
        payload: {
          name: rName,
          contact: rContact,
          region: rRegion,
          tier: rTier,
          sales,
          status: rStatus,
        },
      });
      return;
    }

    createMutation.mutate({
      id: `R-${Date.now()}`,
      name: rName,
      contact: rContact,
      region: rRegion,
      tier: rTier,
      sales,
      status: rStatus,
    });
  };

  const handleDelete = (id: string, name: string) => {
    triggerConfirm(
      "Delete Reseller",
      `Are you sure you want to delete the reseller "${name}"? This action is permanent and cannot be undone.`,
      () => deleteMutation.mutate(id),
      true,
      "Delete"
    );
  };

  const tierColors: Record<string, string> = {
    Gold: "#F59E0B",
    Silver: "#94A3B8",
    Bronze: "#B45309",
    Platinum: "#8B5CF6",
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Resellers"
        subtitle="Network of partners selling Pantix products"
        actions={
          <Button size="sm" className="bg-primary-gradient text-white shadow-glow" onClick={openCreateModal}>
            <Plus className="w-4 h-4" /> Add reseller
          </Button>
        }
      />

      {/* Tab Navigation */}
      <div className="flex gap-4 border-b border-border pb-px">
        <button
          onClick={() => setActiveTab("resellers")}
          className={`pb-3 text-sm font-semibold tracking-wide border-b-2 transition-all ${
            activeTab === "resellers"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Active Resellers
        </button>
        <button
          onClick={() => setActiveTab("requests")}
          className={`pb-3 text-sm font-semibold tracking-wide border-b-2 transition-all flex items-center gap-2 ${
            activeTab === "requests"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Reseller Requests
          {resellers.filter((r: any) => r.status === "Pending").length > 0 && (
            <span className="h-2 w-2 rounded-full bg-amber-500" />
          )}
        </button>
        <button
          onClick={() => setActiveTab("withdrawals")}
          className={`pb-3 text-sm font-semibold tracking-wide border-b-2 transition-all flex items-center gap-2 ${
            activeTab === "withdrawals"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Withdrawal Requests
          {withdrawals.filter((w: any) => w.status === "Pending").length > 0 && (
            <span className="h-2 w-2 rounded-full bg-destructive" />
          )}
        </button>
      </div>

      {activeTab === "resellers" ? (
        isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : error ? (
          <div className="text-center py-12 text-destructive">Failed to load resellers</div>
        ) : resellers.filter((r: any) => r.status === "Active").length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">No active resellers yet. Add your first partner!</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(resellers as Reseller[]).filter((r: any) => r.status === "Active").map((r) => {
              const tierColor = tierColors[r.tier] || "#94A3B8";
              return (
                <div key={r.id} className="card-lift bg-card rounded-2xl border border-border/50 shadow-card p-6">
                  <div className="flex items-start justify-between">
                    <div
                      className="w-12 h-12 rounded-xl grid place-items-center"
                      style={{ background: `${tierColor}22` }}
                    >
                      <Network className="w-6 h-6" style={{ color: tierColor }} />
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={() => openEditModal(r)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => handleDelete(r.id, r.name)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                      <StatusBadge status={r.tier} />
                    </div>
                  </div>
                  <h3 className="mt-4 text-lg font-semibold">{r.name}</h3>
                  <p className="text-sm text-muted-foreground">{r.contact}</p>
                  <div className="mt-3 flex items-center gap-1 text-sm text-muted-foreground">
                    <MapPin className="w-4 h-4 flex-shrink-0" /> {r.region}
                  </div>
                  <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">Total sales</p>
                      <p className="text-lg font-bold">₹{Number(r.sales).toLocaleString()}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className="inline-flex items-center gap-1 text-xs font-semibold" style={{ color: r.status === "Active" ? "#10B981" : r.status === "Pending" ? "#F59E0B" : "#EF4444" }}>
                        <TrendingUp className="w-3 h-3" />
                        {r.status || "Active"}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : activeTab === "requests" ? (
        isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : error ? (
          <div className="text-center py-12 text-destructive">Failed to load reseller requests</div>
        ) : resellers.filter((r: any) => r.status === "Pending").length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">No pending requests at the moment.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(resellers as Reseller[]).filter((r: any) => r.status === "Pending").map((r) => {
              const tierColor = tierColors[r.tier] || "#94A3B8";
              return (
                <div key={r.id} className="card-lift bg-card rounded-2xl border border-border/50 shadow-card p-6">
                  <div className="flex items-start justify-between">
                    <div
                      className="w-12 h-12 rounded-xl grid place-items-center"
                      style={{ background: `${tierColor}22` }}
                    >
                      <Network className="w-6 h-6" style={{ color: tierColor }} />
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => handleDelete(r.id, r.name)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <h3 className="mt-4 text-lg font-semibold">{r.name}</h3>
                  <p className="text-sm text-muted-foreground">{r.contact}</p>
                  <div className="mt-3 flex items-center gap-1 text-sm text-muted-foreground">
                    <MapPin className="w-4 h-4 flex-shrink-0" /> {r.region}
                  </div>
                  <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">Requested Status</p>
                      <p className="text-sm font-medium text-amber-500">Pending Approval</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="h-8 border-destructive text-destructive hover:bg-destructive/10"
                        onClick={() => {
                          updateMutation.mutate({
                            id: r.id,
                            payload: { status: "Rejected" }
                          });
                        }}
                        disabled={updateMutation.isPending}
                      >
                        Reject
                      </Button>
                      <Button 
                        size="sm" 
                        className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white"
                        onClick={() => {
                          updateMutation.mutate({
                            id: r.id,
                            payload: { status: "Active" }
                          });
                        }}
                        disabled={updateMutation.isPending}
                      >
                        Approve
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        isLoadingW ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : withdrawals.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">No bank withdrawal requests yet.</div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-border/50 bg-card shadow-card">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-muted/30 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  <th className="p-4">Reseller</th>
                  <th className="p-4">Bank Details</th>
                  <th className="p-4">Amount</th>
                  <th className="p-4">Requested On</th>
                  <th className="p-4 text-center">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-sm">
                {withdrawals.map((w: any) => (
                  <tr key={w.id} className="hover:bg-muted/10 transition-colors">
                    <td className="p-4">
                      <div className="font-semibold text-foreground">{w.user_name}</div>
                      <div className="text-xs text-muted-foreground">{w.user_email}</div>
                    </td>
                    <td className="p-4 space-y-0.5">
                      <div className="font-medium text-foreground">A/C Holder: {w.name}</div>
                      <div className="text-xs text-muted-foreground">A/C: {w.account_number} · Phone: {w.phone}</div>
                      <div className="text-xs text-muted-foreground">IFSC: {w.ifsc_code}</div>
                    </td>
                    <td className="p-4 font-bold text-foreground">₹{Number(w.amount).toLocaleString("en-IN")}</td>
                    <td className="p-4 text-xs text-muted-foreground">
                      {new Date(w.created_at).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit"
                      })}
                    </td>
                    <td className="p-4 text-center">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                        w.status === "Approved"
                          ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                          : w.status === "Rejected"
                            ? "bg-destructive/10 text-destructive border border-destructive/20"
                            : "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                      }`}>
                        {w.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      {w.status === "Pending" ? (
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs py-1.5 px-3 shadow"
                            onClick={() => {
                              triggerConfirm(
                                "Approve Payout",
                                `Are you sure you want to approve the payout of ₹${Number(w.amount).toLocaleString("en-IN")} to account ${w.account_number}? This will permanently mark the request as paid.`,
                                () => approveMutation.mutate(w.id),
                                false,
                                "Approve & Paid"
                              );
                            }}
                            disabled={approveMutation.isPending || rejectMutation.isPending}
                          >
                            Approve & Paid
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            className="font-medium text-xs py-1.5 px-3 shadow"
                            onClick={() => {
                              triggerConfirm(
                                "Reject Payout Request",
                                `Are you sure you want to reject the payout request of ₹${Number(w.amount).toLocaleString("en-IN")}? The funds will be automatically refunded back to the reseller's wallet balance.`,
                                () => rejectMutation.mutate(w.id),
                                true,
                                "Reject & Refund"
                              );
                            }}
                            disabled={approveMutation.isPending || rejectMutation.isPending}
                          >
                            Reject & Refund
                          </Button>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">Processed</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {/* ── Create/Edit Reseller Modal ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={closeModal}
          />

          {/* Dialog */}
          <div className="relative z-10 w-full max-w-md bg-card rounded-2xl border border-border/50 shadow-2xl p-6 space-y-5 animate-fade-in">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">{modalMode === "create" ? "Add reseller" : "Edit reseller"}</h2>
              <button
                onClick={closeModal}
                className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="rName">Business / Contact name *</Label>
                <Input
                  id="rName"
                  value={rName}
                  onChange={(e) => setRName(e.target.value)}
                  placeholder="Northstar Retail"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="rContact">Email / Phone</Label>
                <Input
                  id="rContact"
                  value={rContact}
                  onChange={(e) => setRContact(e.target.value)}
                  placeholder="ops@example.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="rRegion">Region / City</Label>
                <Input
                  id="rRegion"
                  value={rRegion}
                  onChange={(e) => setRRegion(e.target.value)}
                  placeholder="Mumbai"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="rSales">Total sales</Label>
                <Input
                  id="rSales"
                  type="number"
                  min="0"
                  value={rSales}
                  onChange={(e) => setRSales(e.target.value)}
                  placeholder="0"
                />
              </div>

              <div className="space-y-2">
                <Label>Tier</Label>
                <Select value={rTier} onValueChange={setRTier}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select tier" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Bronze">Bronze</SelectItem>
                    <SelectItem value="Silver">Silver</SelectItem>
                    <SelectItem value="Gold">Gold</SelectItem>
                    <SelectItem value="Platinum">Platinum</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={rStatus} onValueChange={setRStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={closeModal}
                >
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
                      {modalMode === "create" ? <Plus className="w-4 h-4" /> : <Pencil className="w-4 h-4" />} {modalMode === "create" ? "Add reseller" : "Save changes"}
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Confirmation Modal ── */}
      <ConfirmationModal
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={confirmTitle}
        description={confirmDesc}
        onConfirm={confirmAction}
        confirmText={confirmText}
        isDestructive={confirmIsDestructive}
      />
    </div>
  );
}
