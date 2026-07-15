import { API_URL } from "@/api";
import { useState } from "react";
import PageHeader from "@/components/admin/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Loader2, MessageSquare, Calendar, User, Mail, Info, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/apiFetch";

type Enquiry = {
  id: number;
  name: string;
  email: string;
  subject: string;
  message: string;
  created_at: string;
};

export default function Enquiries() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEnquiry, setSelectedEnquiry] = useState<Enquiry | null>(null);

  const { data: enquiries = [], isLoading, error } = useQuery<Enquiry[]>({
    queryKey: ["enquiries"],
    queryFn: async () => {
      const res = await apiFetch(`${API_URL}/api/enquiries`);
      if (!res.ok) throw new Error("Failed to fetch enquiries");
      return res.json();
    },
  });

  const filteredEnquiries = enquiries.filter((e) => {
    const term = searchQuery.toLowerCase();
    return (
      e.name.toLowerCase().includes(term) ||
      e.email.toLowerCase().includes(term) ||
      e.subject.toLowerCase().includes(term) ||
      e.message.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Enquiries"
        subtitle={`${enquiries.length} customer messages received`}
      />

      <div className="bg-card rounded-2xl shadow-card border border-border/50 overflow-hidden">
        <div className="p-5 border-b border-border">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search enquiries…"
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
          <div className="text-center py-12 text-destructive">Failed to load enquiries</div>
        ) : filteredEnquiries.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">No enquiries found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-muted-foreground text-xs uppercase tracking-wider">
                <tr>
                  <th className="text-left font-medium py-3 px-5">User</th>
                  <th className="text-left font-medium py-3 px-5">Subject</th>
                  <th className="text-left font-medium py-3 px-5">Message</th>
                  <th className="text-left font-medium py-3 px-5">Date</th>
                  <th className="py-3 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredEnquiries.map((e) => (
                  <tr key={e.id} className="border-t border-border hover:bg-muted/30 transition-smooth">
                    <td className="py-3 px-5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-primary-gradient grid place-items-center text-white text-sm font-semibold">
                          {e.name?.[0] || '?'}
                        </div>
                        <div>
                          <p className="font-medium">{e.name}</p>
                          <p className="text-xs text-muted-foreground">{e.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-5 font-medium max-w-[200px] truncate">
                      {e.subject}
                    </td>
                    <td className="py-3 px-5 text-muted-foreground max-w-[300px] truncate">
                      {e.message}
                    </td>
                    <td className="py-3 px-5 text-muted-foreground">
                      {new Date(e.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                    <td className="py-3 px-5 text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setSelectedEnquiry(e)}
                        className="h-8 text-primary hover:text-primary-glow"
                      >
                        <Info className="w-4 h-4 mr-1" /> View Details
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedEnquiry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedEnquiry(null)} />
          <div className="relative z-10 w-full max-w-lg bg-card rounded-2xl border border-border/50 shadow-2xl p-6 space-y-5 animate-fade-in">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-primary" /> Enquiry Details
              </h2>
              <button
                onClick={() => setSelectedEnquiry(null)}
                className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-sm">
              <div className="flex gap-3 items-start border-b border-border/40 pb-3">
                <User className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-semibold text-foreground">{selectedEnquiry.name}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                    <Mail className="w-3.5 h-3.5" /> {selectedEnquiry.email}
                  </p>
                </div>
              </div>

              <div className="flex gap-3 items-start border-b border-border/40 pb-3">
                <Calendar className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-semibold text-foreground">Submitted At</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {new Date(selectedEnquiry.created_at).toLocaleString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>

              <div className="space-y-1">
                <p className="font-semibold text-muted-foreground text-xs uppercase tracking-wider">Subject</p>
                <p className="font-medium text-foreground text-base bg-muted/40 p-2.5 rounded-lg border border-border/20">
                  {selectedEnquiry.subject}
                </p>
              </div>

              <div className="space-y-1">
                <p className="font-semibold text-muted-foreground text-xs uppercase tracking-wider">Message</p>
                <div className="text-foreground whitespace-pre-wrap bg-muted/50 p-4 rounded-xl border border-border max-h-60 overflow-y-auto leading-relaxed">
                  {selectedEnquiry.message}
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <Button onClick={() => setSelectedEnquiry(null)} className="w-24">
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
