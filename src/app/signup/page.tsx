"use client"

import { useState } from "react";
import { createClient } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/components/LanguageProvider";
import { toast } from "sonner";
import { Loader2, Eye, EyeOff } from "lucide-react";
import AuthControls from "@/components/AuthControls";

export default function SignupPage() {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; confirm?: string }>({});
  const router = useRouter();
  const supabase = createClient();

  const validate = () => {
    const newErrors: typeof errors = {};
    if (!email.includes("@")) newErrors.email = t("auth.invalid_email");
    if (password.length < 8) newErrors.password = t("auth.password_min");
    else if (!/[A-Z]/.test(password)) newErrors.password = t("auth.password_uppercase");
    else if (!/[0-9]/.test(password)) newErrors.password = t("auth.password_number");
    if (password !== confirmPassword) newErrors.confirm = t("auth.passwords_mismatch");
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });
    if (error) {
      toast.error(error.message, { position: "top-center" });
    } else {
      toast.success(t("auth.check_email"), { duration: 5000 });
      router.push("/login");
    }
    setLoading(false);
  };

  return (
    <>
      <AuthControls />
      <div className="flex items-center justify-center min-h-screen p-4">
      <div className="w-full max-w-md p-8 space-y-6 bg-card rounded-xl border shadow-sm">
        <div className="text-center">
          <h1 className="text-2xl font-bold">{t("auth.signup_title")}</h1>
          <p className="text-muted-foreground">{t("auth.signup_subtitle")}</p>
        </div>
        <form onSubmit={handleSignup} className="space-y-4" noValidate>
          <div className="space-y-2">
            <label htmlFor="signup-email" className="text-sm font-medium">{t("auth.email")}</label>
            <Input
              id="signup-email"
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setErrors((prev) => ({ ...prev, email: undefined })); }}
              placeholder="email@example.com"
              autoComplete="email"
              required
              className={errors.email ? "border-destructive" : ""}
            />
            {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
          </div>
          <div className="space-y-2">
            <label htmlFor="signup-password" className="text-sm font-medium">{t("auth.password")}</label>
            <div className="relative">
              <Input
                id="signup-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => { setPassword(e.target.value); setErrors((prev) => ({ ...prev, password: undefined })); }}
                placeholder="••••••••"
                autoComplete="new-password"
                required
                className={`pr-10 ${errors.password ? "border-destructive" : ""}`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                aria-label={showPassword ? t("auth.hide_password") : t("auth.show_password")}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
          </div>
          <div className="space-y-2">
            <label htmlFor="signup-confirm" className="text-sm font-medium">{t("auth.confirm_password")}</label>
            <div className="relative">
              <Input
                id="signup-confirm"
                type={showConfirm ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => { setConfirmPassword(e.target.value); setErrors((prev) => ({ ...prev, confirm: undefined })); }}
                placeholder="••••••••"
                autoComplete="new-password"
                required
                className={`pr-10 ${errors.confirm ? "border-destructive" : ""}`}
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                aria-label={showConfirm ? t("auth.hide_password") : t("auth.show_password")}
              >
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.confirm && <p className="text-sm text-destructive">{errors.confirm}</p>}
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            {loading ? t("auth.creating_account") : t("auth.submit_signup")}
          </Button>
        </form>
        <div className="text-center text-sm">
          {t("common.back_to_login")} {" "}
          <Link href="/login" className="text-primary hover:underline">
            {t("common.login")}
          </Link>
        </div>
      </div>
    </div>
    </>
  );
}
