import { useState, FormEvent, useEffect } from "react";
import { Navigate, useLocation, useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Sparkles, Mail, Lock, Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

export default function Login() {
  const { user, login, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: { pathname: string } } | null)?.from?.pathname ?? "/";

  const [email, setEmail] = useState("admin@pantix.in");
  const [password, setPassword] = useState("admin123");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  // Clear any stale/expired tokens when the login page loads
  useEffect(() => {
    logout();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (user) return <Navigate to={from} replace />;

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await login(email, password);
    setLoading(false);
    if (res.ok) {
      toast.success("Welcome back, Admin");
      navigate(from, { replace: true });
    } else {
      toast.error(res.error ?? "Login failed");
    }
  };

  return (
    <div className="min-h-screen w-full grid lg:grid-cols-2">
      {/* Left brand panel */}
      <div className="relative hidden lg:flex flex-col justify-between p-12 bg-auth-gradient text-white overflow-hidden">
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-primary-glow/30 blur-3xl" />

        <div className="relative flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-white/15 backdrop-blur grid place-items-center">
            <Sparkles className="w-6 h-6" />
          </div>
          <span className="text-2xl font-bold tracking-tight">Pantix</span>
        </div>

        <div className="relative space-y-6 max-w-md">
          <h1 className="text-4xl xl:text-5xl font-bold leading-tight tracking-tight">
            Run your store with clarity & speed.
          </h1>
          <p className="text-white/80 text-lg leading-relaxed">
            Real-time analytics, beautiful order management, and everything you need to grow your eCommerce business — in one elegant dashboard.
          </p>
          <div className="flex gap-6 pt-4">
            {[
              { k: "30+", v: "Products" },
              { k: "₹385", v: "Today" },
              { k: "99.9%", v: "Uptime" },
            ].map((s) => (
              <div key={s.v}>
                <p className="text-2xl font-bold">{s.k}</p>
                <p className="text-xs text-white/60 uppercase tracking-wider">{s.v}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-xs text-white/50">© 2026 Pantix Commerce. All rights reserved.</p>
      </div>

      {/* Right form */}
      <div className="flex items-center justify-center p-6 lg:p-12 bg-background">
        <div className="w-full max-w-md animate-fade-in">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-10 h-10 rounded-xl bg-primary-gradient grid place-items-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold">Pantix</span>
          </div>

          <h2 className="text-3xl font-bold tracking-tight">Welcome back 👋</h2>
          <p className="mt-2 text-muted-foreground">Sign in to your admin dashboard.</p>

          <div className="mt-6 p-3 rounded-lg bg-accent/60 border border-border text-xs">
            <span className="font-semibold text-accent-foreground">Demo credentials:</span>{" "}
            <code className="font-mono">admin@pantix.in</code> / <code className="font-mono">admin123</code>
          </div>

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  required className="pl-10 h-11" placeholder="you@pantix.in" />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link
                  to="/forgot-password"
                  className="text-xs text-primary hover:underline"
                >
                  Forgot?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input id="password" type={show ? "text" : "password"} value={password}
                  onChange={(e) => setPassword(e.target.value)} required className="pl-10 pr-10 h-11" placeholder="••••••••" />
                <button type="button" onClick={() => setShow((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox id="remember" defaultChecked />
              <Label htmlFor="remember" className="text-sm font-normal cursor-pointer">Remember me for 30 days</Label>
            </div>

            <Button type="submit" disabled={loading}
              className="w-full h-11 bg-primary-gradient hover:opacity-90 transition-smooth shadow-glow text-white font-semibold">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Sign in to dashboard"}
            </Button>
          </form>

          <p className="mt-8 text-center text-xs text-muted-foreground">
            Protected demo environment · UI-only authentication
          </p>
        </div>
      </div>

    </div>
  );
}
