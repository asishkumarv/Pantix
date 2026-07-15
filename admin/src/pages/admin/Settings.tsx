import { API_URL } from "@/api";
import { useState, useEffect } from "react";
import PageHeader from "@/components/admin/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { apiFetch } from "@/lib/apiFetch";

export default function Settings() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [admins, setAdmins] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
          <div className="space-y-2 sm:col-span-2">
            <Label>Password</Label>
            <Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Secure password" />
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
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {admins.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-muted-foreground">No admins found</td>
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
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
