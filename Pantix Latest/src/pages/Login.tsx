import { useState } from "react";
import { Link, useNavigate, useLocation } from "@/lib/router-compat";
import { Eye, EyeOff } from "lucide-react";
import { Layout } from "@/components/Layout";
import { useStore } from "@/lib/store";
import { toast } from "sonner";

const Login = () => {
  const { login } = useStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await login(email.trim(), password);
    setLoading(false);
    if (!res.ok) {
      toast.error(res.error ?? "Login failed");
      return;
    }
    toast.success("Welcome back, queen ✨");
    const redirectUrl = new URLSearchParams(location.search).get("redirect") || "/account";
    navigate(redirectUrl);
  };

  return (
    <Layout>
      <section className="pt-6 pb-16 md:pt-10 md:pb-20">
        <div className="mx-auto max-w-md px-4">
          <div className="bg-card border border-gold/25 rounded-lg p-8 shadow-card">
            <div className="text-center mb-6">
              <p className="text-xs uppercase tracking-[0.4em] text-gold/80">
                Welcome back
              </p>
              <h1 className="mt-2 font-display text-4xl gradient-text-gold inline-block">
                Sign In
              </h1>
            </div>
            <form onSubmit={onSubmit} className="space-y-4">
              <Field
                label="Email"
                type="email"
                value={email}
                onChange={setEmail}
                required
              />
              <div>
                <Field
                  label="Password"
                  type="password"
                  value={password}
                  onChange={setPassword}
                  required
                />
                <div className="flex justify-end mt-1">
                  <Link to={`/forgot-password${location.search}`} className="text-xs text-gold/80 hover:text-primary-glow">
                    Forgot password?
                  </Link>
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="btn-gold w-full disabled:opacity-60 mt-4"
              >
                {loading ? "Signing in…" : "Sign In"}
              </button>
            </form>
            <p className="mt-5 text-sm text-center text-muted-foreground">
              New to Pantix?{" "}
              <Link to={`/register${location.search}`} className="text-gold hover:text-primary-glow">
                Create an account
              </Link>
            </p>
          </div>
        </div>
      </section>
    </Layout>
  );
};

function Field({
  label,
  type,
  value,
  onChange,
  required,
}: {
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
}) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";
  const inputType = isPassword ? (showPassword ? "text" : "password") : type;

  return (
    <label className="block">
      <span className="text-xs uppercase tracking-[0.2em] text-gold/80">
        {label}
      </span>
      <div className="relative mt-1">
        <input
          type={inputType}
          required={required}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-background/50 border border-gold/30 px-3 py-2.5 rounded text-foreground focus:outline-none focus:border-gold pr-10"
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-gold"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}
      </div>
    </label>
  );
}

export default Login;
