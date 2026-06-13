import { useState } from "react";
import PageHeader from "@/components/admin/PageHeader";
import StatusBadge from "@/components/admin/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, UserPlus, Mail, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/apiFetch";

export default function Users() {
  const [searchQuery, setSearchQuery] = useState("");

  const { data: users = [], isLoading, error } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const res = await apiFetch("https://pantix-final-3.onrender.com/api/users");
      if (!res.ok) throw new Error("Failed to fetch users");
      return res.json();
    },
  });

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
                  <th className="py-3 px-5"></th>
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
                    <td className="py-3 px-5 text-right">
                      <Button size="sm" variant="ghost" className="h-8"><Mail className="w-4 h-4" /></Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
