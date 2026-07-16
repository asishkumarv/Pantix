import { API_URL } from "@/api";
import { useState } from "react";
import PageHeader from "@/components/admin/PageHeader";
import StatusBadge from "@/components/admin/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, UserPlus, Mail, Loader2, Edit, Trash2, X } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/apiFetch";
import { toast } from "sonner";

export default function Users() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");

  // Edit Modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [editUserId, setEditUserId] = useState<any>(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editRole, setEditRole] = useState("user");
  const [editStatus, setEditStatus] = useState("Active");

  const { data: users = [], isLoading, error } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const res = await apiFetch(`${API_URL}/api/users`);
      if (!res.ok) throw new Error("Failed to fetch users");
      return res.json();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await apiFetch(`${API_URL}/api/users/${payload.id}`, {
        method: "PUT",
        body: JSON.stringify(payload.data),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to update user");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("User updated successfully");
      setShowEditModal(false);
    },
    onError: (err: any) => {
      toast.error("Failed to update user", { description: err.message });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiFetch(`${API_URL}/api/users/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to delete user");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("User deleted successfully");
    },
    onError: (err: any) => {
      toast.error("Failed to delete user", { description: err.message });
    },
  });

  const handleOpenEditModal = (user: any) => {
    setEditUserId(user.id);
    setEditName(user.name || "");
    setEditEmail(user.email || "");
    setEditPhone(user.phone || "");
    setEditRole(user.role || "user");
    setEditStatus(user.status || "Active");
    setShowEditModal(true);
  };

  const handleUpdateUser = () => {
    if (!editName || !editEmail) {
      toast.error("Name and Email are required");
      return;
    }
    updateMutation.mutate({
      id: editUserId,
      data: {
        name: editName,
        email: editEmail,
        phone: editPhone,
        role: editRole,
        status: editStatus,
      },
    });
  };

  const handleDeleteUser = (id: string) => {
    if (!confirm("Are you sure you want to delete this user?")) return;
    deleteMutation.mutate(id);
  };

  const filteredUsers = users.filter((u: any) => {
    const term = searchQuery.toLowerCase();
    return (
      (u.name && u.name.toLowerCase().includes(term)) ||
      (u.email && u.email.toLowerCase().includes(term))
    );
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Users"
        subtitle={`${users.length} customers registered`}
        actions={<Button size="sm" className="bg-primary-gradient text-white shadow-glow"><UserPlus className="w-4 h-4" /> Invite user</Button>}
      />

      <div className="bg-card rounded-2xl shadow-card border border-border/50 overflow-hidden">
        <div className="p-5 border-b border-border">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search users…"
              className="pl-9 h-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : error ? (
          <div className="text-center py-12 text-destructive">Failed to load users</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-muted-foreground text-xs uppercase tracking-wider">
                <tr>
                  <th className="text-left font-medium py-3 px-5">User</th>
                  <th className="text-left font-medium py-3 px-5">Joined</th>
                  <th className="text-left font-medium py-3 px-5">Orders</th>
                  <th className="text-left font-medium py-3 px-5">Status</th>
                  <th className="py-3 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u: any) => (
                  <tr key={u.id} className="border-t border-border hover:bg-muted/30 transition-smooth">
                    <td className="py-3 px-5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-primary-gradient grid place-items-center text-white text-sm font-semibold">
                          {u.name?.[0] || '?'}
                        </div>
                        <div>
                          <p className="font-medium">{u.name}</p>
                          <p className="text-xs text-muted-foreground">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-5 text-muted-foreground">
                      {new Date(u.joined_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </td>
                    <td className="py-3 px-5 font-medium">0</td>
                    <td className="py-3 px-5"><StatusBadge status={u.status} /></td>
                    <td className="py-3 px-5 text-right space-x-1">
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0" title="Email user"><Mail className="w-4 h-4" /></Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0"
                        title="Edit user"
                        onClick={() => handleOpenEditModal(u)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                        title="Delete user"
                        onClick={() => handleDeleteUser(u.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowEditModal(false)}
          />

          <div className="relative z-10 w-full max-w-md bg-card rounded-2xl border border-border/50 shadow-2xl p-6 space-y-5 animate-fade-in text-card-foreground">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">Edit User</h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input value={editName} onChange={e => setEditName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" value={editEmail} onChange={e => setEditEmail(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Phone Number</Label>
                <Input value={editPhone} onChange={e => setEditPhone(e.target.value)} />
              </div>

              <div className="space-y-2">
                <Label>Role</Label>
                <select
                  value={editRole}
                  onChange={e => setEditRole(e.target.value)}
                  className="w-full bg-background border border-border rounded-md h-9 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="user">User / Customer</option>
                  <option value="admin">Admin</option>
                  <option value="admin-user">Admin User</option>
                  <option value="Super Admin">Super Admin</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <select
                  value={editStatus}
                  onChange={e => setEditStatus(e.target.value)}
                  className="w-full bg-background border border-border rounded-md h-9 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowEditModal(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleUpdateUser}
                disabled={updateMutation.isPending}
                className="bg-primary-gradient text-white"
              >
                {updateMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
