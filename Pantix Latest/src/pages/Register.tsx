import { useState } from "react";
import { Link, useNavigate, useLocation } from "@/lib/router-compat";
import { Eye, EyeOff } from "lucide-react";
import { Layout } from "@/components/Layout";
import { useStore } from "@/lib/store";
import { toast } from "sonner";

const Register = () => {
  const { register } = useStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    setLoading(true);
    const res = await register(name.trim(), email.trim(), password, phone.trim());
    setLoading(false);
    if (!res.ok) {
      toast.error(res.error ?? "Registration failed");
      return;
    }
    toast.success("Welcome to Pantix 👑");
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
                Join the court
              </p>
              <h1 className="mt-2 font-display text-4xl gradient-text-gold inline-block">
                Create Account
              </h1>
            </div>
            <form onSubmit={onSubmit} className="space-y-4">
              <Field label="Name" value={name} onChange={setName} required />
              <Field
                label="Email"
                type="email"
                value={email}
                onChange={setEmail}
                required
              />
              <Field
                label="Phone Number"
                type="tel"
                value={phone}
                onChange={setPhone}
                required
              />
              <Field
                label="Password"
                type="password"
                value={password}
                onChange={setPassword}
                required
              />
              <Field
                label="Confirm Password"
                type="password"
                value={confirmPassword}
                onChange={setConfirmPassword}
                required
              />
              <button
                type="submit"
                disabled={loading}
                className="btn-gold w-full disabled:opacity-60"
              >
                {loading ? "Creating…" : "Create Account"}
              </button>
            </form>
            <p className="mt-5 text-sm text-center text-muted-foreground">
              Already a queen?{" "}
              <Link to={`/login${location.search}`} className="text-gold hover:text-primary-glow">
                Sign in
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
  type = "text",
  value,
  onChange,
  required,
}: {
  label: string;
  type?: string;
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

export default Register;
