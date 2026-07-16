import { API_URL } from "@/api";
import { useState, useEffect } from "react";
import PageHeader from "@/components/admin/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { apiFetch } from "@/lib/apiFetch";
import { Eye, EyeOff, Edit, Trash2, X } from "lucide-react";

export default function Settings() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [admins, setAdmins] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  // Edit modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [editAdminId, setEditAdminId] = useState<any>(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [editRole, setEditRole] = useState("admin");
  const [editStatus, setEditStatus] = useState("Active");
  const [showEditPassword, setShowEditPassword] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchAdmins = async () => {
    try {
      const res = await apiFetch(`${API_URL}/api/users`);
      if (res.ok) {
        const users = await res.json();
        setAdmins(users.filter((u: any) => u.role === "admin" || u.role === "Super Admin" || u.role === "admin-user"));
      }
    } catch (err) {
      console.error("Failed to fetch admins", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenEditModal = (admin: any) => {
    setEditAdminId(admin.id);
    setEditName(admin.name || "");
    setEditEmail(admin.email || "");
    setEditPassword("");
    setEditRole(admin.role || "admin");
    setEditStatus(admin.status || "Active");
    setShowEditPassword(false);
    setShowEditModal(true);
  };

  const handleUpdateAdmin = async () => {
    if (!editName || !editEmail) {
      toast.error("Name and Email are required");
      return;
    }
    setIsUpdating(true);
    try {
      const res = await apiFetch(`${API_URL}/api/users/${editAdminId}`, {
        method: "PUT",
        body: JSON.stringify({
          name: editName,
          email: editEmail,
          password: editPassword,
          role: editRole,
          status: editStatus
        }),
      });
      const data = await res.json();

      if (res.ok) {
        toast.success("Admin updated successfully");
        setShowEditModal(false);
        fetchAdmins();
      } else {
        toast.error(data.error || "Failed to update admin");
      }
    } catch (err) {
      toast.error("An error occurred");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteAdmin = async (id: any) => {
    if (!confirm("Are you sure you want to delete this admin?")) return;
    try {
      const res = await apiFetch(`${API_URL}/api/users/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();

      if (res.ok) {
        toast.success("Admin deleted successfully");
        fetchAdmins();
      } else {
        toast.error(data.error || "Failed to delete admin");
      }
    } catch (err) {
      toast.error("An error occurred");
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  const handleCreateAdmin = async () => {
    if (!name || !email || !password) {
      toast.error("Please fill all fields");
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await apiFetch(`${API_URL}/api/auth/create-admin`, {
        method: "POST",
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();

      if (res.ok) {
        toast.success(data.message || "Admin created successfully");
        setName("");
        setEmail("");
        setPassword("");
        fetchAdmins(); // Refresh the list
      } else {
        toast.error(data.error || "Failed to create admin");
      }
    } catch (err) {
      toast.error("An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 lg:space-y-8">
      <PageHeader title="Settings" subtitle="Manage your store, account and preferences" />

      <section className="bg-card rounded-2xl shadow-card border border-border/50 p-5 lg:p-6 space-y-4">
        <h3 className="font-semibold text-lg">Create New Admin</h3>
        <p className="text-sm text-muted-foreground mb-4">Add a new admin account to manage the dashboard.</p>
        <div className="grid sm:grid-cols-2 gap-4 max-w-2xl">
          <div className="space-y-2">
            <Label>Full Name</Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="Jane Doe" />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="admin@pantix.in" />
          </div>
          <div className="space-y-2 sm:col-span-2 relative">
            <Label>Password</Label>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Secure password"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
        <div className="pt-2">
          <Button onClick={handleCreateAdmin} disabled={isSubmitting} className="bg-primary-gradient text-white">
            {isSubmitting ? "Creating..." : "Create Admin Account"}
          </Button>
        </div>
      </section>

      <section className="bg-card rounded-2xl shadow-card border border-border/50 overflow-hidden">
        <div className="p-5 lg:p-6 border-b border-border">
          <h3 className="font-semibold text-lg">Current Admins</h3>
          <p className="text-sm text-muted-foreground">List of all active admin accounts with access to the dashboard.</p>
        </div>
        
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground">Loading admins...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-muted-foreground text-xs uppercase tracking-wider">
                <tr>
                  <th className="text-left font-medium py-3 px-5 lg:px-6">Name</th>
                  <th className="text-left font-medium py-3 px-5 lg:px-6">Email</th>
                  <th className="text-left font-medium py-3 px-5 lg:px-6">Role</th>
                  <th className="text-left font-medium py-3 px-5 lg:px-6">Status</th>
                  <th className="text-right font-medium py-3 px-5 lg:px-6">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {admins.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-muted-foreground">No admins found</td>
                  </tr>
                ) : (
                  admins.map(admin => (
                    <tr key={admin.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-5 lg:px-6 font-medium">{admin.name}</td>
                      <td className="py-3 px-5 lg:px-6">{admin.email}</td>
                      <td className="py-3 px-5 lg:px-6 capitalize">{admin.role}</td>
                      <td className="py-3 px-5 lg:px-6">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          admin.status === 'Active' ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-muted text-muted-foreground'
                        }`}>
                          {admin.status}
                        </span>
                      </td>
                      <td className="py-3 px-5 lg:px-6 text-right space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => handleOpenEditModal(admin)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => handleDeleteAdmin(admin.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowEditModal(false)}
          />

          <div className="relative z-10 w-full max-w-md bg-card rounded-2xl border border-border/50 shadow-2xl p-6 space-y-5 animate-fade-in text-card-foreground">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">Edit Admin</h2>
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
              <div className="space-y-2 relative">
                <Label>Password (Leave blank to keep current)</Label>
                <div className="relative">
                  <Input
                    type={showEditPassword ? "text" : "password"}
                    value={editPassword}
                    onChange={e => setEditPassword(e.target.value)}
                    placeholder="New password"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowEditPassword(!showEditPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showEditPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <select
                  value={editRole}
                  onChange={e => setEditRole(e.target.value)}
                  className="w-full bg-background border border-border rounded-md h-9 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                >
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
              <Button onClick={handleUpdateAdmin} disabled={isUpdating} className="bg-primary-gradient text-white">
                {isUpdating ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
