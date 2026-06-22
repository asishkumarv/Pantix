import { useState } from "react";
import { Link, useNavigate } from "@/lib/router-compat";
import { Eye, EyeOff } from "lucide-react";
import { Layout } from "@/components/Layout";
import { toast } from "sonner";
import { API_URL } from "@/api";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const requestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to request reset");
      toast.success("OTP sent to your email");
      setStep(2);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), otp: otp.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Invalid OTP");
      toast.success("OTP verified");
      setStep(3);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          otp: otp.trim(),
          newPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to reset password");
      toast.success("Password reset successfully. You can now log in.");
      navigate("/login");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <section className="pt-6 pb-16 md:pt-10 md:pb-20">
        <div className="mx-auto max-w-md px-4">
          <div className="bg-card border border-gold/25 rounded-lg p-8 shadow-card">
            <div className="text-center mb-6">
              <p className="text-xs uppercase tracking-[0.4em] text-gold/80">
                Recovery
              </p>
              <h1 className="mt-2 font-display text-4xl gradient-text-gold inline-block">
                Reset Password
              </h1>
            </div>

            {step === 1 && (
              <form onSubmit={requestOtp} className="space-y-4">
                <p className="text-sm text-muted-foreground mb-4">
                  Enter your email address and we'll send you a 6-digit code to reset your password.
                </p>
                <Field
                  label="Email"
                  type="email"
                  value={email}
                  onChange={setEmail}
                  required
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-gold w-full disabled:opacity-60"
                >
                  {loading ? "Sending…" : "Send Reset Code"}
                </button>
              </form>
            )}

            {step === 2 && (
              <form onSubmit={verifyOtp} className="space-y-4">
                <p className="text-sm text-muted-foreground mb-4">
                  Enter the 6-digit code sent to <strong>{email}</strong>
                </p>
                <Field
                  label="6-Digit OTP"
                  type="text"
                  value={otp}
                  onChange={setOtp}
                  required
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-gold w-full disabled:opacity-60"
                >
                  {loading ? "Verifying…" : "Verify Code"}
                </button>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-xs text-gold mt-2 block w-full text-center hover:text-primary-glow"
                >
                  Back to Email
                </button>
              </form>
            )}

            {step === 3 && (
              <form onSubmit={resetPassword} className="space-y-4">
                <p className="text-sm text-muted-foreground mb-4">
                  Enter your new password.
                </p>
                <Field
                  label="New Password"
                  type="password"
                  value={newPassword}
                  onChange={setNewPassword}
                  required
                />
                <Field
                  label="Confirm New Password"
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
                  {loading ? "Resetting…" : "Reset Password"}
                </button>
              </form>
            )}

            <p className="mt-5 text-sm text-center text-muted-foreground">
              Remember your password?{" "}
              <Link to="/login" className="text-gold hover:text-primary-glow">
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

export default ForgotPassword;
